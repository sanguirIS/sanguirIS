import { theme as T } from './theme.mjs';
import { icon } from './icons.mjs';

/* ------------------------------------------------------------------ utils */

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const r = (n, p = 2) => Number.parseFloat(Number(n).toFixed(p));

// Rough advance-width table good enough for truncation on a sans stack.
const NARROW = new Set('ijltfIr .,:;\'"|!()[]{}-'.split(''));
const WIDE = new Set('mwMW@%'.split(''));
export function textWidth(str, size, mono = false) {
  if (mono) return String(str).length * size * 0.6;
  let units = 0;
  for (const ch of String(str)) {
    if (NARROW.has(ch)) units += 0.34;
    else if (WIDE.has(ch)) units += 0.87;
    else if (ch >= 'A' && ch <= 'Z') units += 0.68;
    else if (ch >= '0' && ch <= '9') units += 0.57;
    else units += 0.53;
  }
  return units * size;
}

export function truncate(str, maxWidth, size, mono = false) {
  const s = String(str ?? '');
  if (textWidth(s, size, mono) <= maxWidth) return s;
  let out = '';
  for (const ch of s) {
    if (textWidth(`${out}${ch}…`, size, mono) > maxWidth) break;
    out += ch;
  }
  return `${out.trimEnd()}…`;
}

export function pctLabel(share) {
  const v = share * 100;
  if (v > 0 && v < 0.1) return '<0.1%';
  return `${v.toFixed(1)}%`;
}

export function compact(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${r(v / 1_000_000, v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${r(v / 1_000, v >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(v));
}

export function text(str, { x, y, size = 13, fill = T.text, weight = 400, anchor = 'start', mono = false, opacity = 1, spacing = 0, cls = '' }) {
  const attrs = [
    `x="${r(x)}"`,
    `y="${r(y)}"`,
    `font-size="${size}"`,
    `fill="${fill}"`,
    weight !== 400 ? `font-weight="${weight}"` : '',
    anchor !== 'start' ? `text-anchor="${anchor}"` : '',
    mono ? `font-family="${T.fontMono}"` : '',
    opacity !== 1 ? `opacity="${opacity}"` : '',
    spacing ? `letter-spacing="${spacing}"` : '',
    cls ? `class="${cls}"` : '',
  ].filter(Boolean);
  return `<text ${attrs.join(' ')}>${esc(str)}</text>`;
}

/** Rounded progress bar with a grow-in animation (SMIL works inside <img>). */
export function bar({ x, y, w, h, value, fill, track = 'rgba(240,246,252,0.07)', delay = 0 }) {
  const filled = Math.max(h, r(w * Math.min(Math.max(value, 0), 1)));
  return (
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${h}" rx="${h / 2}" fill="${track}"/>` +
    `<rect x="${r(x)}" y="${r(y)}" width="${filled}" height="${h}" rx="${h / 2}" fill="${fill}">` +
    `<animate attributeName="width" from="0" to="${filled}" dur="1.1s" begin="${r(delay, 2)}s" ` +
    `fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.16 0.9 0.24 1"/></rect>`
  );
}

export function panel(x, y, w, h) {
  return (
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${T.panelRadius}" ` +
    `fill="${T.panel}" stroke="${T.panelStroke}" stroke-width="1"/>`
  );
}

export function sectionTitle(label, { x, y, w, right = null, iconName = null }) {
  let out = `<rect x="${r(x)}" y="${r(y - 11)}" width="3.5" height="14" rx="1.75" fill="url(#accent)"/>`;
  let tx = x + 12;
  if (iconName) {
    out += icon(iconName, { x: tx, y: y - 12, size: 14, color: T.violet, width: 1.8 });
    tx += 20;
  }
  out += text(label, { x: tx, y, size: 14.5, weight: 600, fill: T.text, spacing: 0.2 });
  if (right) {
    out += text(right, { x: x + w, y, size: 11.5, fill: T.textFaint, anchor: 'end', mono: true });
  }
  return out;
}

/* --------------------------------------------------------------- sections */

export function header({ profile, y, x, w, updated, timezone }) {
  const size = 60;
  const cx = x + size / 2;
  const cy = y + size / 2;
  let out = '';

  out += `<circle cx="${r(cx)}" cy="${r(cy)}" r="${size / 2 + 3}" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.95"/>`;
  out += `<clipPath id="avatarClip"><circle cx="${r(cx)}" cy="${r(cy)}" r="${size / 2}"/></clipPath>`;
  if (profile.avatarData) {
    out += `<image href="${profile.avatarData}" xlink:href="${profile.avatarData}" x="${r(x)}" y="${r(y)}" width="${size}" height="${size}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`;
  } else {
    const initials = String(profile.name || profile.login)
      .split(/[\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    out += `<circle cx="${r(cx)}" cy="${r(cy)}" r="${size / 2}" fill="url(#accent)" opacity="0.22"/>`;
    out += text(initials, { x: cx, y: cy + 8, size: 22, weight: 700, fill: T.text, anchor: 'middle' });
  }

  const tx = x + size + 20;
  out += text(profile.name, { x: tx, y: y + 22, size: 23, weight: 700, fill: T.text, spacing: -0.2 });

  const joined = new Date(profile.createdAt).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const metaBits = [`@${profile.login}`, `joined ${joined}`];
  if (profile.location) metaBits.push(profile.location);
  out += text(metaBits.join('  ·  '), { x: tx, y: y + 41, size: 12.5, fill: T.textDim });

  if (profile.bio) {
    out += text(truncate(profile.bio, 400, 12), { x: tx, y: y + 58, size: 12, fill: T.textFaint });
  }

  // right side status
  const rx = x + w;
  out += text('GITHUB METRICS', { x: rx, y: y + 18, size: 10.5, fill: T.textFaint, anchor: 'end', weight: 600, spacing: 2.2 });
  const stamp = `updated ${updated}`;
  const stampW = textWidth(stamp, 11.5, true);
  out += `<circle cx="${r(rx - stampW - 11)}" cy="${r(y + 34)}" r="3.2" fill="${T.green}">` +
    `<animate attributeName="opacity" values="1;0.25;1" dur="2.4s" repeatCount="indefinite"/></circle>`;
  out += text(stamp, { x: rx, y: y + 38, size: 11.5, fill: T.textDim, anchor: 'end', mono: true });
  out += text(timezone, { x: rx, y: y + 55, size: 11, fill: T.textFaint, anchor: 'end', mono: true });

  return { markup: out, height: Math.max(size, profile.bio ? 62 : 48) };
}

export function statTiles({ items, x, y, w }) {
  const gap = 14;
  const tw = (w - gap * (items.length - 1)) / items.length;
  const th = 78;
  let out = '';
  items.forEach((item, i) => {
    const tx = x + i * (tw + gap);
    out += `<rect x="${r(tx)}" y="${r(y)}" width="${r(tw)}" height="${th}" rx="${T.panelRadius}" fill="${T.panel}" stroke="${T.panelStroke}"/>`;
    out += `<rect x="${r(tx)}" y="${r(y)}" width="${r(tw)}" height="2.5" rx="1.25" fill="${item.color}" opacity="0.85"/>`;
    out += icon(item.icon, { x: tx + tw - 34, y: y + 16, size: 18, color: item.color, width: 1.7, opacity: 0.9 });
    out += text(item.label.toUpperCase(), { x: tx + 18, y: y + 30, size: 10, fill: T.textFaint, weight: 600, spacing: 1.3 });
    out += text(item.value, { x: tx + 18, y: y + 58, size: 24, weight: 700, fill: T.text, spacing: -0.4 });
    if (item.hint) {
      out += text(item.hint, { x: tx + 18 + textWidth(item.value, 24) + 8, y: y + 58, size: 11, fill: T.textFaint });
    }
  });
  return { markup: out, height: th };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function contributions({ calendar, x, y, w }) {
  const pad = 20;
  const cell = 12;
  const gapc = 3;
  const pitch = cell + gapc;
  const weeks = calendar.weeks.slice(-53);
  const gridX = x + pad + 26;
  const gridY = y + 62;

  // GitHub-style quartiles over the *non-empty* days, so a 1-commit day is
  // always visible instead of being crushed by a single 30-commit outlier.
  const nonZero = calendar.days
    .map((d) => d.contributionCount)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const pct = (q) => (nonZero.length ? nonZero[Math.min(nonZero.length - 1, Math.floor(q * nonZero.length))] : 1);
  const t1 = pct(0.25);
  const t2 = pct(0.5);
  const t3 = pct(0.75);
  const level = (n) => {
    if (!n) return 0;
    if (n <= t1) return 1;
    if (n <= t2) return 2;
    if (n <= t3) return 3;
    return 4;
  };

  let out = panel(x, y, w, 0); // placeholder, replaced below
  let body = '';

  body += sectionTitle('Contribution graph', {
    x: x + pad,
    y: y + 32,
    w: w - pad * 2,
    iconName: 'calendar',
    right: `${calendar.totalDays} days  ·  ${calendar.activeDays} active`,
  });

  // month labels
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const first = week.contributionDays[0];
    if (!first) return;
    const d = new Date(`${first.date}T00:00:00Z`);
    const m = d.getUTCMonth();
    if (m !== lastMonth && d.getUTCDate() <= 7 && i < weeks.length - 2) {
      body += text(MONTHS[m], { x: gridX + i * pitch, y: y + 56, size: 10.5, fill: T.textFaint, weight: 500 });
      lastMonth = m;
    }
  });

  // weekday labels
  [['Mon', 1], ['Wed', 3], ['Fri', 5]].forEach(([label, row]) => {
    body += text(label, { x: gridX - 8, y: gridY + row * pitch + 9.5, size: 9.5, fill: T.textFaint, anchor: 'end' });
  });

  // cells
  weeks.forEach((week, wi) => {
    week.contributionDays.forEach((day) => {
      const lv = level(day.contributionCount);
      const cx = gridX + wi * pitch;
      const cy = gridY + day.weekday * pitch;
      const fill = T.heat[lv];
      body +=
        `<rect x="${r(cx)}" y="${r(cy)}" width="${cell}" height="${cell}" rx="3" fill="${fill}"` +
        (lv === 0 ? ` stroke="rgba(240,246,252,0.04)"` : '') +
        (lv === 4 ? ` filter="url(#glowSoft)"` : '') +
        `><title>${esc(day.date)}: ${day.contributionCount} contributions</title></rect>`;
    });
  });

  const gridBottom = gridY + 7 * pitch;

  // legend
  const legendX = x + w - pad - 4;
  let lx = legendX - T.heat.length * 15 - 34;
  body += text('less', { x: lx - 6, y: gridBottom + 14, size: 10, fill: T.textFaint, anchor: 'end' });
  T.heat.forEach((c, i) => {
    body += `<rect x="${r(lx + i * 15)}" y="${r(gridBottom + 4)}" width="11" height="11" rx="3" fill="${c}"${i === 0 ? ' stroke="rgba(240,246,252,0.04)"' : ''}/>`;
  });
  body += text('more', { x: lx + T.heat.length * 15 + 6, y: gridBottom + 14, size: 10, fill: T.textFaint });

  // divider + streak stats
  const divY = gridBottom + 30;
  body += `<path d="M${r(x + pad)} ${r(divY)} H ${r(x + w - pad)}" stroke="rgba(240,246,252,0.07)" stroke-width="1"/>`;

  const stats = [
    { icon: 'pulse', color: T.cyan, value: String(calendar.total), label: 'contributions this year' },
    { icon: 'flame', color: T.pink, value: `${calendar.bestStreak} days`, label: 'longest streak' },
    { icon: 'zap', color: T.violet, value: `${calendar.currentStreak} days`, label: 'current streak' },
    { icon: 'sparkle', color: T.green, value: `${calendar.maxDay}`, label: 'best single day' },
  ];
  const sw = (w - pad * 2) / stats.length;
  stats.forEach((s, i) => {
    const sx = x + pad + i * sw;
    out += '';
    body += icon(s.icon, { x: sx, y: divY + 16, size: 15, color: s.color, width: 1.8 });
    body += text(s.value, { x: sx + 22, y: divY + 28, size: 14.5, weight: 700, fill: T.text });
    body += text(s.label, { x: sx + 22, y: divY + 44, size: 10.5, fill: T.textFaint });
  });

  const height = divY + 54 - y;
  out = panel(x, y, w, height) + body;
  return { markup: out, height };
}

export function languagesPanel({ languages, x, y, w, limit = 8 }) {
  const pad = 20;
  const top = languages.slice(0, limit);
  const shown = top.reduce((a, l) => a + l.share, 0) || 1;
  const barX = x + pad;
  const barW = w - pad * 2;
  const barY = y + 48;
  const barH = 12;

  let body = sectionTitle('Most used languages', {
    x: x + pad,
    y: y + 32,
    w: barW,
    iconName: 'code',
    right: `${languages.length} languages  ·  by code size`,
  });

  // stacked bar
  body += `<clipPath id="langClip"><rect x="${r(barX)}" y="${r(barY)}" width="${r(barW)}" height="${barH}" rx="${barH / 2}"/></clipPath>`;
  body += `<g clip-path="url(#langClip)">`;
  body += `<rect x="${r(barX)}" y="${r(barY)}" width="${r(barW)}" height="${barH}" fill="rgba(240,246,252,0.07)"/>`;
  let cursor = barX;
  top.forEach((l, i) => {
    const segW = (l.share / shown) * barW;
    body +=
      `<rect x="${r(cursor)}" y="${r(barY)}" width="${r(segW)}" height="${barH}" fill="${l.color}">` +
      `<animate attributeName="height" from="0" to="${barH}" dur="0.7s" begin="${r(i * 0.06, 2)}s" fill="freeze"/>` +
      `<title>${esc(l.name)} ${r(l.share * 100, 1)}%</title></rect>`;
    cursor += segW;
  });
  body += `</g>`;

  // chips
  const cols = 4;
  const colW = barW / cols;
  const rowH = 26;
  top.forEach((l, i) => {
    const cxp = barX + (i % cols) * colW;
    const cyp = barY + 40 + Math.floor(i / cols) * rowH;
    body += `<circle cx="${r(cxp + 5)}" cy="${r(cyp - 4)}" r="5" fill="${l.color}"/>`;
    body += text(truncate(l.name, colW - 74, 12.5), { x: cxp + 17, y: cyp, size: 12.5, fill: T.text });
    body += text(pctLabel(l.share), { x: cxp + colW - 16, y: cyp, size: 12, fill: T.textDim, anchor: 'end', mono: true });
  });

  const rows = Math.ceil(top.length / cols);
  const height = barY + 40 + rows * rowH - y + 4;
  return { markup: panel(x, y, w, height) + body, height };
}

/**
 * Three-column coding activity card (Projects / Languages / Editors).
 * Uses WakaTime when a token is configured, GitHub-derived data otherwise.
 */
export function codingActivity({ columns, title, subtitle, x, y, w, rows = 4 }) {
  const pad = 20;
  const innerW = w - pad * 2;
  const gapc = 26;
  const colW = (innerW - gapc * (columns.length - 1)) / columns.length;

  let body = sectionTitle(title, { x: x + pad, y: y + 32, w: innerW, iconName: 'clock', right: subtitle });

  const rowPitch = 34;
  columns.forEach((col, ci) => {
    const cx = x + pad + ci * (colW + gapc);
    body += icon(col.icon, { x: cx, y: y + 48, size: 13, color: col.color, width: 1.8 });
    body += text(col.title.toUpperCase(), { x: cx + 19, y: y + 59, size: 10, fill: T.textFaint, weight: 600, spacing: 1.4 });
    if (ci < columns.length - 1) {
      body += `<path d="M${r(cx + colW + gapc / 2)} ${r(y + 48)} V ${r(y + 62 + rows * rowPitch - 8)}" stroke="rgba(240,246,252,0.06)"/>`;
    }

    const items = col.items.slice(0, rows);
    if (!items.length) {
      body += text(col.empty ?? 'No data yet', { x: cx, y: y + 88, size: 11.5, fill: T.textFaint });
      return;
    }
    const maxVal = Math.max(...items.map((i) => i.value)) || 1;
    items.forEach((item, ri) => {
      const ry = y + 86 + ri * rowPitch;
      const detailW = textWidth(item.detail, 11, true);
      body += text(truncate(item.name, colW - detailW - 14, 12.5), { x: cx, y: ry, size: 12.5, fill: T.text });
      body += text(item.detail, { x: cx + colW, y: ry, size: 11, fill: T.textDim, anchor: 'end', mono: true });
      body += bar({
        x: cx,
        y: ry + 7,
        w: colW,
        h: 5,
        value: item.value / maxVal,
        fill: item.color ?? col.color,
        delay: 0.12 * ri + 0.06 * ci,
      });
    });
  });

  const height = 86 + rows * rowPitch + 4;
  return { markup: panel(x, y, w, height) + body, height };
}

export function activityPanel({ activity, community, x, y, w }) {
  const pad = 20;
  const innerW = w - pad * 2;
  const colW = innerW / 2 - 13;

  let body = sectionTitle('Activity', { x: x + pad, y: y + 32, w: colW, iconName: 'pulse' });
  body += sectionTitle('Community', { x: x + pad + colW + 26, y: y + 32, w: colW, iconName: 'users' });

  const rowsL = activity;
  const rowsR = community;
  const put = (rows, cx) => {
    let s = '';
    rows.forEach((row, i) => {
      const ry = y + 58 + i * 24;
      s += icon(row.icon, { x: cx, y: ry - 11, size: 14, color: row.color, width: 1.7, opacity: 0.95 });
      s += text(row.label, { x: cx + 22, y: ry, size: 12.5, fill: T.textDim });
      s += text(row.value, { x: cx + colW, y: ry, size: 12.5, fill: T.text, anchor: 'end', weight: 600, mono: true });
    });
    return s;
  };
  body += put(rowsL, x + pad);
  body += put(rowsR, x + pad + colW + 26);

  const height = 58 + Math.max(rowsL.length, rowsR.length) * 24 + 6;
  return { markup: panel(x, y, w, height) + body, height };
}

export function defs() {
  return `<defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${T.pink}"/>
      <stop offset="52%" stop-color="${T.violet}"/>
      <stop offset="100%" stop-color="${T.cyan}"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#111826"/>
      <stop offset="55%" stop-color="${T.bg}"/>
      <stop offset="100%" stop-color="#0a0e14"/>
    </linearGradient>
    <radialGradient id="blobPink" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${T.pink}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${T.pink}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blobCyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${T.cyan}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${T.cyan}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blobViolet" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${T.violet}" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="${T.violet}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glowSoft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

export function styles() {
  return `<style>
    svg { font-family: ${T.fontSans}; }
    text { dominant-baseline: auto; }
    .fx { animation: rise .7s cubic-bezier(.16,.9,.24,1) both; }
    .fx-1 { animation-delay: .05s } .fx-2 { animation-delay: .12s }
    .fx-3 { animation-delay: .19s } .fx-4 { animation-delay: .26s }
    .fx-5 { animation-delay: .33s } .fx-6 { animation-delay: .40s }
    @keyframes rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
    @media (prefers-reduced-motion: reduce) { .fx { animation: none; opacity: 1 } }
  </style>`;
}

export { r as round };
