# 百冊 · One Hundred — site

Astro + React island rebuild of the 百冊 reading-list site. Deploys to GitHub Pages.

## Stack

- **Astro 5** (static output) + **React island** for the interactive grid/search/modal
- **Content collection** `src/content/books/` — one Markdown file per book, frontmatter = metadata, body = reading note. This is the single source of truth.
- Self-hosted, subset fonts (`@fontsource`), Astro image optimization, sitemap, RSS, per-page OG images.

## Develop

```bash
cd site
npm install
npm run dev        # prebuild regenerates covers from ../book-png, then astro dev
```

## Build

```bash
npm run build      # regenerates covers, then astro build → dist/
npm run preview
```

`base` is `/book-reader` and `site` is the GitHub Pages URL. Override per-environment:

```bash
SITE_URL=https://example.com BASE_PATH=/ npm run build
```

## Data model

| Source | Role |
|--------|------|
| `src/content/books/*.md` | **Source of truth** — edit these to add/change books or notes |
| `../book-png/NNN_*.jpg` | Raw covers; `scripts/covers.mjs` renames them to `src/assets/covers/NNN.jpg` at build (gitignored) |
| `scripts/migrate.mjs` | **One-time** importer that generated the collection from the old prototype. Not part of the build. |

- A book "has a note" when its Markdown body is non-empty (empty → 「整理中」).
- Cover matched by rank; missing cover → typographic placeholder.
- Slug = `rank`-`english-slug` (e.g. `055-atomic-habits`); no English title → bare rank (e.g. `103`).

## OG images

Generated per book/home under `/og/<id>.png`. Latin titles render with the bundled font.
To render **Chinese** titles in OG cards, drop a full CJK font at
`src/assets/fonts/NotoSerifTC.otf` (OTF/TTF) — the route picks it up automatically.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds `site/` and publishes to Pages
on push to `main`. **One-time setup:** repo Settings → Pages → Source = "GitHub Actions".
