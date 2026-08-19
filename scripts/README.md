# `github-metrics.svg` generator

A dependency-free Node script that renders the profile card at the repo root.
No third-party GitHub Action is involved, so the card cannot break when an
upstream project stops being maintained.

```
scripts/
├── generate-metrics.mjs   # entry point: fetch → layout → write SVG
└── lib/
    ├── data.mjs           # GitHub GraphQL/REST + WakaTime API clients
    ├── render.mjs         # SVG primitives & the individual card sections
    ├── theme.mjs          # colors, fonts, spacing (single source of truth)
    └── icons.mjs          # modern stroke icon set (Lucide-style)
```

## ⚠️ One manual step: swap the workflow

The Arena bot is not allowed to modify files under `.github/workflows/`, so the
ready-to-use workflow ships as **[`scripts/metrics.workflow.yml`](metrics.workflow.yml)**.
Copy its contents over `.github/workflows/metrics.yml` (GitHub web UI → edit →
paste → commit) — that is the only step left. Until you do, the old
`lowlighter/metrics` action keeps running every 3 hours and will overwrite the
new card with the old broken one.

```bash
# or locally
cp scripts/metrics.workflow.yml .github/workflows/metrics.yml
git commit -am "ci: render metrics with the local generator"
```

## What the card shows

| Section | Source | Notes |
| --- | --- | --- |
| Header | GitHub GraphQL | avatar, name, join date, location, bio, live timestamp |
| Headline tiles | GitHub GraphQL | all-time commits, stars earned, public repos, followers |
| Contribution graph | GitHub GraphQL | 53-week heatmap, longest/current streak, best day |
| Most used languages | GitHub GraphQL | real byte counts across all non-fork public repos |
| **WakaTime** | WakaTime API | **Projects · Languages · Editors** (Operating System intentionally omitted) |
| Activity / Community | GitHub GraphQL | commits, PRs, reviews, issues, followers, stars, watching… |

If no WakaTime key is configured the third card degrades gracefully to
GitHub-derived data (top projects by commits, languages by code size,
contribution mix) instead of rendering an error box.

## Run it locally

```bash
GITHUB_TOKEN=ghp_xxx node scripts/generate-metrics.mjs
# with WakaTime
GITHUB_TOKEN=ghp_xxx WAKATIME_API_KEY=waka_xxx node scripts/generate-metrics.mjs
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` / `GH_PAT` | – (required) | any token with `read:user`; add `repo` to include private contributions |
| `METRICS_USER` | `sanguirIS` | GitHub login to render |
| `METRICS_TZ` | `Asia/Manila` | timezone used for the "updated" stamp |
| `METRICS_OUT` | `github-metrics.svg` | output path |
| `METRICS_IGNORED_LANGUAGES` | `Markdown,Text,JSON,YAML,XML` | languages excluded from the language stats |
| `METRICS_AVATAR_CACHE` | `assets/avatar.png` | offline fallback if avatar download fails |
| `WAKATIME_API_KEY` / `WAKATIME_TOKEN` | – | enables the WakaTime card |
| `WAKATIME_API_URL` | `https://wakatime.com/api/v1` | point at wakapi / hakatime if self-hosted |
| `WAKATIME_RANGE` | `last_7_days` | `last_7_days`, `last_30_days`, `last_6_months`, `last_year` |

## Enabling the WakaTime card

1. Install the WakaTime plugin in your editor (VS Code, Visual Studio, …).
2. Copy your key from <https://wakatime.com/settings/api-key>.
3. Repo → **Settings → Secrets and variables → Actions → New repository secret**
   → name `WAKATIME_API_KEY`, value = the key.
4. Run the **Metrics** workflow (Actions tab → *Metrics* → *Run workflow*).

Until then the card shows real GitHub activity instead — never an error.

## Design notes

* Pure SVG primitives (no `foreignObject`), so it renders identically in the
  GitHub README, in social previews and in any SVG viewer.
* Animations use SMIL + CSS with `animation-fill-mode: both`, so the card is
  still fully visible in renderers that ignore animation, and it honours
  `prefers-reduced-motion`.
* The avatar and every color are embedded — the SVG makes zero external
  requests, which is required because GitHub proxies README images through camo.
