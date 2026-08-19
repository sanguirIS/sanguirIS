/**
 * Data collection: GitHub GraphQL/REST + WakaTime.
 * Everything returned here is real, live data — nothing is hard-coded.
 */

const GH_GRAPHQL = 'https://api.github.com/graphql';
const GH_REST = 'https://api.github.com';

async function gql(token, query, variables = {}) {
  const res = await fetch(GH_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'sanguirIS-metrics',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors?.length) {
    const msg = json.errors.map((e) => `${(e.path ?? []).join('.')}: ${e.message}`).join(' | ');
    // Partial responses are common with scoped tokens — keep whatever came back.
    if (!json.data?.user) throw new Error(`GitHub GraphQL: ${msg}`);
    console.warn(`⚠ GitHub GraphQL partial response — ${msg}`);
  }
  return json.data;
}

async function rest(token, path) {
  const res = await fetch(`${GH_REST}${path}`, {
    headers: {
      Authorization: `bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'sanguirIS-metrics',
    },
  });
  if (!res.ok) throw new Error(`GitHub REST HTTP ${res.status} on ${path}`);
  return res.json();
}

const PROFILE_QUERY = `
query Profile($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    name
    login
    bio
    location
    avatarUrl(size: 160)
    createdAt
    followers { totalCount }
    following { totalCount }
    organizations { totalCount }
    starredRepositories { totalCount }
    watching(ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) { totalCount }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoryContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
      commitContributionsByRepository(maxRepositories: 25) {
        repository { nameWithOwner name isPrivate }
        contributions { totalCount }
      }
    }
  }
}`;

const REPOS_QUERY = `
query Repos($login: String!, $cursor: String) {
  user(login: $login) {
    repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        stargazerCount
        forkCount
        isArchived
        primaryLanguage { name color }
        languages(first: 12, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

const YEAR_QUERY = `
query Year($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar { totalContributions }
    }
  }
}`;

export async function fetchGitHub({ token, login, ignoredLanguages = [] }) {
  const to = new Date();
  const from = new Date(to.getTime());
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  from.setUTCDate(from.getUTCDate() + 1);

  const { user } = await gql(token, PROFILE_QUERY, {
    login,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  if (!user) throw new Error(`GitHub user "${login}" not found`);

  // ---- repositories / languages -------------------------------------------
  const repos = [];
  let cursor = null;
  for (let page = 0; page < 10; page++) {
    const data = await gql(token, REPOS_QUERY, { login, cursor });
    const conn = data.user.repositories;
    repos.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }

  const ignore = new Set(ignoredLanguages.map((l) => l.trim().toLowerCase()).filter(Boolean));
  const langBytes = new Map();
  for (const repo of repos) {
    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node.name;
      if (ignore.has(name.toLowerCase())) continue;
      const prev = langBytes.get(name) ?? { name, color: edge.node.color || '#8b949e', size: 0 };
      prev.size += edge.size;
      langBytes.set(name, prev);
    }
  }
  const totalBytes = [...langBytes.values()].reduce((a, l) => a + l.size, 0) || 1;
  const languages = [...langBytes.values()]
    .sort((a, b) => b.size - a.size)
    .map((l) => ({ ...l, share: l.size / totalBytes }));

  const starsEarned = repos.reduce((a, r) => a + r.stargazerCount, 0);
  const forksEarned = repos.reduce((a, r) => a + r.forkCount, 0);

  // ---- calendar ------------------------------------------------------------
  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap(
    (w) => w.contributionDays,
  );
  const weeks = user.contributionsCollection.contributionCalendar.weeks;
  const streaks = computeStreaks(days);

  // ---- all-time commits (per contribution year) ---------------------------
  const created = new Date(user.createdAt);
  let allTimeCommits = 0;
  let allTimeContributions = 0;
  for (let y = created.getUTCFullYear(); y <= to.getUTCFullYear(); y++) {
    const yFrom = new Date(Date.UTC(y, 0, 1));
    const yTo = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    const data = await gql(token, YEAR_QUERY, {
      login,
      from: (yFrom < created ? created : yFrom).toISOString(),
      to: (yTo > to ? to : yTo).toISOString(),
    });
    const c = data.user.contributionsCollection;
    allTimeCommits += c.totalCommitContributions + c.restrictedContributionsCount;
    allTimeContributions += c.contributionCalendar.totalContributions;
  }

  // ---- traffic (best effort; needs push access) ---------------------------
  let views = 0;
  let clones = 0;
  try {
    const top = repos.slice(0, 12);
    for (const repo of top) {
      const [v, c] = await Promise.all([
        rest(token, `/repos/${login}/${repo.name}/traffic/views`).catch(() => null),
        rest(token, `/repos/${login}/${repo.name}/traffic/clones`).catch(() => null),
      ]);
      views += v?.count ?? 0;
      clones += c?.count ?? 0;
    }
  } catch {
    /* traffic is optional */
  }

  const cc = user.contributionsCollection;
  const topRepos = cc.commitContributionsByRepository
    .filter((r) => !r.repository.isPrivate)
    .map((r) => ({ name: r.repository.name, count: r.contributions.totalCount }))
    .sort((a, b) => b.count - a.count);

  return {
    profile: {
      name: user.name || user.login,
      login: user.login,
      bio: user.bio,
      location: user.location,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
      organizations: user.organizations.totalCount,
      starred: user.starredRepositories.totalCount,
      watching: user.watching.totalCount,
      publicRepos: user.repositories.totalCount,
    },
    activity: {
      commits: cc.totalCommitContributions,
      issues: cc.totalIssueContributions,
      pullRequests: cc.totalPullRequestContributions,
      reviews: cc.totalPullRequestReviewContributions,
      createdRepos: cc.totalRepositoryContributions,
      restricted: cc.restrictedContributionsCount,
    },
    totals: {
      allTimeCommits,
      allTimeContributions,
      yearContributions: cc.contributionCalendar.totalContributions,
      starsEarned,
      forksEarned,
      views,
      clones,
    },
    calendar: { weeks, days, ...streaks },
    languages,
    topRepos,
  };
}

function computeStreaks(days) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let run = 0;
  let bestEnd = null;
  for (const d of sorted) {
    if (d.contributionCount > 0) {
      run += 1;
      if (run > best) {
        best = run;
        bestEnd = d.date;
      }
    } else {
      run = 0;
    }
  }
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i];
    if (d.contributionCount > 0) current += 1;
    else if (i === sorted.length - 1) continue; // today may still be empty
    else break;
  }
  const active = sorted.filter((d) => d.contributionCount > 0).length;
  const total = sorted.reduce((a, d) => a + d.contributionCount, 0);
  const max = sorted.reduce((a, d) => Math.max(a, d.contributionCount), 0);
  return {
    bestStreak: best,
    bestStreakEnd: bestEnd,
    currentStreak: current,
    activeDays: active,
    totalDays: sorted.length,
    maxDay: max,
    average: total / (sorted.length || 1),
  };
}

/**
 * WakaTime stats. Works with wakatime.com or any compatible API (wakapi, hakatime)
 * through WAKATIME_API_URL.
 */
export async function fetchWakaTime({ apiKey, apiUrl, range = 'last_7_days', ignoredLanguages = [] }) {
  if (!apiKey) return { ok: false, reason: 'no-key' };
  const base = (apiUrl || 'https://wakatime.com/api/v1').replace(/\/$/, '');
  const url = `${base}/users/current/stats/${range}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}`,
        'User-Agent': 'sanguirIS-metrics',
      },
    });
  } catch (error) {
    return { ok: false, reason: `network: ${error.message}` };
  }
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
  const body = await res.json();
  const data = body?.data;
  if (!data) return { ok: false, reason: 'empty payload' };

  const ignore = new Set(ignoredLanguages.map((l) => l.trim().toLowerCase()).filter(Boolean));
  const pick = (list, filter = false) =>
    (list ?? [])
      .filter((e) => (filter ? !ignore.has(String(e.name).toLowerCase()) : true))
      .filter((e) => (e.total_seconds ?? 0) > 0)
      .sort((a, b) => b.total_seconds - a.total_seconds)
      .map((e) => ({ name: e.name, seconds: e.total_seconds, text: e.text, percent: e.percent }));

  return {
    ok: true,
    range: data.human_readable_range || range.replace(/_/g, ' '),
    total: data.human_readable_total || null,
    dailyAverage: data.human_readable_daily_average || null,
    projects: pick(data.projects),
    languages: pick(data.languages, true),
    editors: pick(data.editors),
  };
}
