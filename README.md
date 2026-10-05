# Tarunkumar Sivakumar · Portfolio

Personal developer portfolio. Built with React, TypeScript, Vite and GSAP.

## Highlights

- **Preloader → hero intro**: a single GSAP timeline runs the loader, a conic wipe, and a block-reveal headline.
- **ASCII hero scene**: the background "compiles" from coloured ASCII into the photo, then a cursor-driven code lens decodes whatever it passes over (canvas-rendered, paused off-screen).
- **Rotating headline** that scrambles between phrases, plus scroll and mouse parallax.
- **Interactive sections**: animated project filters (GSAP Flip), a stack explorer that maps tools to projects, a scroll-driven experience timeline, and a playable terminal in the contact section.
- **Command palette** (`⌘K` / `Ctrl+K`) to jump to sections, open projects or copy the email, plus **Lenis** smooth scrolling synced with GSAP ScrollTrigger.
- **GitHub activity**: contribution heatmap and latest repos, fetched at build time (no token, no runtime API calls).
- **Pre-rendered + SEO/AEO ready**: the page is rendered to static HTML at build time so search engines, AI answer engines and link-preview bots read the full content without JavaScript. Ships canonical/Open Graph/Twitter tags, schema.org JSON-LD (Person, ProfilePage, projects), `sitemap.xml`, `robots.txt`, `llms.txt` and a web manifest.
- Respects `prefers-reduced-motion`, keyboard accessible, responsive down to small phones. Lighthouse: 100 across the board on desktop; 96 / 100 / 100 / 100 on mobile.

## Getting started

```bash
npm install
npm run dev
```

| Script                | What it does                                                                      |
| --------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`         | Start the Vite dev server                                                         |
| `npm run build`       | Fetch GitHub data, type-check, build, then pre-render HTML + SEO files into `dist` |
| `npm run preview`     | Preview the production build locally                                              |
| `npm run lint`        | Lint with oxlint                                                                  |
| `npm run github:sync` | Refresh `src/data/github.json` without a full build                               |

## Editing content

All copy (hero, about, projects, stack, experience, contact) lives in [`src/content.ts`](src/content.ts), so text can be changed without touching components. SEO tags, structured data, `llms.txt` and the sitemap are generated from the same file by [`src/seo.ts`](src/seo.ts).

Set `site.url` in `content.ts` to the live domain (or pass `SITE_URL=https://… npm run build`) so canonical links and the sitemap point to the right place.

## Project structure

```
src/
  components/   UI sections (Hero, About, Work, Stack, Experience, Contact, Nav, Terminal, …)
  hooks/        Intro timeline, scroll reveals, site-wide interactions, local time
  lib/          ASCII field renderer, block reveal, text scramble, smooth-scroll handle, font loading
  data/         Build-time GitHub snapshot
  assets/       Hero background images
  content.ts    Site copy and data
  seo.ts        Head tags, JSON-LD, sitemap, robots, llms.txt
  entry-server.tsx  Build-time render used for pre-rendering
scripts/
  fetch-github.mjs  Pulls repos + contribution calendar before each build
  prerender.mjs     Injects rendered HTML + SEO tags and writes the SEO files
```
