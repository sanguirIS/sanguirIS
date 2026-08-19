#!/usr/bin/env node
/**
 * github-metrics.svg generator
 * ---------------------------------------------------------------------------
 * Renders a modern, animated, self-contained SVG card from live data:
 *   • GitHub GraphQL API  (profile, contributions, languages, activity)
 *   • WakaTime API        (projects / languages / editors — no Operating System)
 *
 * Usage:  GITHUB_TOKEN=xxx node scripts/generate-metrics.mjs
 * Env:
 *   GITHUB_TOKEN | GH_PAT     required — any token with read:user
 *   METRICS_USER              GitHub login            (default: sanguirIS)
 *   WAKATIME_API_KEY          optional WakaTime key   (enables the WakaTime card)
 *   WAKATIME_API_URL          optional self-hosted wakapi/hakatime base URL
 *   WAKATIME_RANGE            last_7_days | last_30_days | last_year (default last_7_days)
 *   METRICS_TZ                IANA timezone           (default: Asia/Manila)
 *   METRICS_OUT               output path             (default: github-metrics.svg)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { theme as T } from './lib/theme.mjs';
import { fetchGitHub, fetchWakaTime } from './lib/data.mjs';
import {
  activityPanel,
  bar,
  codingActivity,
  compact,
  contributions,
  defs,
  esc,
  header,
  languagesPanel,
  panel,
  pctLabel,
  round as r,
  statTiles,
  styles,
  text,
} from './lib/render.mjs';

const env = process.env;
const TOKEN = env.GH_PAT || env.GITHUB_TOKEN || env.METRICS_TOKEN;
const LOGIN = env.METRICS_USER || 'sanguirIS';
const TZ = env.METRICS_TZ || 'Asia/Manila';
const OUT = env.METRICS_OUT || 'github-metrics.svg';
const IGNORED_LANGUAGES = (env.METRICS_IGNORED_LANGUAGES || 'Markdown,Text,JSON,YAML,XML')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!TOKEN) {
  console.error('✖ Missing GITHUB_TOKEN / GH_PAT');
  process.exit(1);
}

/* ------------------------------------------------------------------ helpers */

const humanTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

async function avatarDataUri(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/png';
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Offline fallbacks so a flaky network never blanks out the avatar. */
async function cachedAvatar(path) {
  try {
    const buf = await readFile(path);
    const type = path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

async function previousAvatar(path) {
  try {
    const svg = await readFile(path, 'utf8');
    return svg.match(/href="(data:image\/[a-z+]+;base64,[^"]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------------- main */

const gh = await fetchGitHub({ token: TOKEN, login: LOGIN, ignoredLanguages: IGNORED_LANGUAGES });
const waka = await fetchWakaTime({
  apiKey: env.WAKATIME_API_KEY || env.WAKATIME_TOKEN,
  apiUrl: env.WAKATIME_API_URL,
  range: env.WAKATIME_RANGE || 'last_7_days',
  ignoredLanguages: IGNORED_LANGUAGES,
});
if (!waka.ok) console.warn(`ℹ WakaTime card falls back to GitHub data (${waka.reason})`);

gh.profile.avatarData =
  (await avatarDataUri(gh.profile.avatarUrl)) ||
  (await cachedAvatar(env.METRICS_AVATAR_CACHE || 'assets/avatar.png')) ||
  (await previousAvatar(OUT));
if (!gh.profile.avatarData) console.warn('ℹ avatar unavailable — falling back to initials');

const now = new Date();
const updated = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TZ,
}).format(now);

const X = T.pad;
const W = T.width - T.pad * 2;
let y = T.pad;
const layers = [];
let fxIndex = 0;
const push = (markup, height, extraGap = T.gap) => {
  fxIndex += 1;
  layers.push(`<g class="fx fx-${Math.min(fxIndex, 6)}">${markup}</g>`);
  y += height + extraGap;
};

/* 1 — header ---------------------------------------------------------------- */
{
  const { markup, height } = header({
    profile: gh.profile,
    x: X,
    y,
    w: W,
    updated,
    timezone: TZ,
  });
  push(markup, height, 20);
}

/* 2 — headline stats -------------------------------------------------------- */
{
  const { markup, height } = statTiles({
    x: X,
    y,
    w: W,
    items: [
      {
        icon: 'commit',
        color: T.pink,
        label: 'Commits (all time)',
        value: compact(gh.totals.allTimeCommits),
      },
      {
        icon: 'star',
        color: T.violet,
        label: 'Stars earned',
        value: compact(gh.totals.starsEarned),
      },
      {
        icon: 'repo',
        color: T.cyan,
        label: 'Public repos',
        value: compact(gh.profile.publicRepos),
      },
      {
        icon: 'users',
        color: T.green,
        label: 'Followers',
        value: compact(gh.profile.followers),
        hint: `· ${compact(gh.profile.following)} following`,
      },
    ],
  });
  push(markup, height);
}

/* 3 — contribution graph ----------------------------------------------------- */
{
  const { markup, height } = contributions({
    x: X,
    y,
    w: W,
    calendar: { ...gh.calendar, total: gh.totals.yearContributions },
  });
  push(markup, height);
}

/* 4 — languages -------------------------------------------------------------- */
if (gh.languages.length) {
  const { markup, height } = languagesPanel({ x: X, y, w: W, languages: gh.languages });
  push(markup, height);
}

/* 5 — coding activity: Projects / Languages / Editors ------------------------ */
{
  let columns;
  let title;
  let subtitle;

  if (waka.ok) {
    title = 'WakaTime';
    subtitle = `${waka.range}${waka.total ? `  ·  ${waka.total}` : ''}`;
    columns = [
      {
        title: 'Projects',
        icon: 'folder',
        color: T.pink,
        items: waka.projects.map((p) => ({
          name: p.name,
          value: p.seconds,
          detail: p.text || humanTime(p.seconds),
        })),
      },
      {
        title: 'Languages',
        icon: 'code',
        color: T.violet,
        items: waka.languages.map((l) => ({
          name: l.name,
          value: l.seconds,
          detail: l.text || humanTime(l.seconds),
        })),
      },
      {
        title: 'Editors',
        icon: 'edit',
        color: T.cyan,
        items: waka.editors.map((e) => ({
          name: e.name,
          value: e.seconds,
          detail: e.text || humanTime(e.seconds),
        })),
      },
    ];
  } else {
    title = 'Coding activity';
    subtitle = 'last 12 months  ·  github';
    columns = [
      {
        title: 'Projects',
        icon: 'folder',
        color: T.pink,
        items: gh.topRepos.map((repo) => ({
          name: repo.name,
          value: repo.count,
          detail: `${repo.count} commits`,
        })),
        empty: 'No public commits yet',
      },
      {
        title: 'Languages',
        icon: 'code',
        color: T.violet,
        items: gh.languages.map((l) => ({
          name: l.name,
          value: l.share,
          detail: pctLabel(l.share),
          color: l.color,
        })),
        empty: 'No languages detected',
      },
      {
        title: 'Contributions',
        icon: 'branch',
        color: T.cyan,
        items: [
          { name: 'Commits', value: gh.activity.commits, detail: String(gh.activity.commits) },
          { name: 'Pull requests', value: gh.activity.pullRequests, detail: String(gh.activity.pullRequests) },
          { name: 'Issues', value: gh.activity.issues, detail: String(gh.activity.issues) },
          { name: 'Reviews', value: gh.activity.reviews, detail: String(gh.activity.reviews) },
        ],
      },
    ];
  }

  const { markup, height } = codingActivity({ x: X, y, w: W, columns, title, subtitle, rows: 4 });
  push(markup, height);
}

/* 6 — activity + community --------------------------------------------------- */
{
  const { markup, height } = activityPanel({
    x: X,
    y,
    w: W,
    activity: [
      { icon: 'commit', color: T.pink, label: 'Commits (12 mo)', value: compact(gh.activity.commits) },
      { icon: 'pr', color: T.violet, label: 'Pull requests', value: compact(gh.activity.pullRequests) },
      { icon: 'review', color: T.cyan, label: 'Reviews', value: compact(gh.activity.reviews) },
      { icon: 'issue', color: T.green, label: 'Issues opened', value: compact(gh.activity.issues) },
      { icon: 'repo', color: T.blue, label: 'Repos created', value: compact(gh.activity.createdRepos) },
    ],
    community: [
      { icon: 'users', color: T.pink, label: 'Followers · following', value: `${compact(gh.profile.followers)} · ${compact(gh.profile.following)}` },
      { icon: 'star', color: T.violet, label: 'Stars given', value: compact(gh.profile.starred) },
      { icon: 'eye', color: T.cyan, label: 'Watching', value: compact(gh.profile.watching) },
      { icon: 'layers', color: T.green, label: 'Organizations', value: compact(gh.profile.organizations) },
      { icon: 'branch', color: T.blue, label: 'Forks earned', value: compact(gh.totals.forksEarned) },
    ],
  });
  push(markup, height, 10);
}

/* 7 — footer ------------------------------------------------------------------ */
const footerY = y + 14;
const footerNote = waka.ok
  ? 'Live data · GitHub GraphQL + WakaTime'
  : 'Live data · GitHub GraphQL API';
layers.push(
  `<g class="fx fx-6">` +
    text(footerNote, { x: X, y: footerY, size: 10.5, fill: T.textFaint, mono: true }) +
    text(`${gh.profile.login}/${gh.profile.login} · refreshed every 6h`, {
      x: X + W,
      y: footerY,
      size: 10.5,
      fill: T.textFaint,
      anchor: 'end',
      mono: true,
    }) +
    `</g>`,
);

const HEIGHT = Math.round(footerY + 18);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${T.width}" height="${HEIGHT}" viewBox="0 0 ${T.width} ${HEIGHT}" fill="none" role="img" aria-label="GitHub metrics for ${esc(gh.profile.login)}">
<title>${esc(gh.profile.name)} — GitHub metrics</title>
${defs()}
${styles()}
<rect width="${T.width}" height="${HEIGHT}" rx="${T.radius}" fill="url(#bgGrad)"/>
<clipPath id="cardClip"><rect width="${T.width}" height="${HEIGHT}" rx="${T.radius}"/></clipPath>
<g clip-path="url(#cardClip)">
  <circle cx="70" cy="20" r="240" fill="url(#blobPink)"/>
  <circle cx="${T.width - 40}" cy="${Math.round(HEIGHT * 0.18)}" r="260" fill="url(#blobViolet)"/>
  <circle cx="${Math.round(T.width * 0.6)}" cy="${HEIGHT}" r="300" fill="url(#blobCyan)"/>
  <rect x="0" y="0" width="${T.width}" height="3" fill="url(#accent)"/>
${layers.join('\n')}
</g>
<rect x="0.5" y="0.5" width="${T.width - 1}" height="${HEIGHT - 1}" rx="${T.radius}" fill="none" stroke="rgba(240,246,252,0.10)"/>
</svg>
`;

await writeFile(OUT, svg, 'utf8');
console.log(
  `✔ ${OUT} — ${T.width}×${HEIGHT}px, ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB` +
    `\n  ${gh.totals.yearContributions} contributions (12 mo) · ${gh.languages.length} languages · WakaTime: ${waka.ok ? 'live' : 'fallback'}`,
);
