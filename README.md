# Tarunkumar Sivakumar · Portfolio

Personal developer portfolio. Built with React, TypeScript, Vite and GSAP.

## Highlights

- **Preloader → hero intro**: a single GSAP timeline runs the loader, a conic wipe, and a block-reveal headline.
- **ASCII hero scene**: the background "compiles" from coloured ASCII into the photo, then a cursor-driven code lens decodes whatever it passes over (canvas-rendered, paused off-screen).
- **Rotating headline** that scrambles between phrases, plus scroll and mouse parallax.
- **Interactive sections**: animated project filters (GSAP Flip), a stack explorer that maps tools to projects, a scroll-driven experience timeline, and a playable terminal in the contact section.
- Respects `prefers-reduced-motion`, keyboard accessible, responsive down to small phones.

## Getting started

```bash
npm install
npm run dev
```

| Script            | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Type-check and build for production  |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Lint with oxlint                     |

## Editing content

All copy (hero, about, projects, stack, experience, contact) lives in [`src/content.ts`](src/content.ts), so text can be changed without touching components.

## Project structure

```
src/
  components/   UI sections (Hero, About, Work, Stack, Experience, Contact, Nav, Terminal, …)
  hooks/        Intro timeline, scroll reveals, site-wide interactions, local time
  lib/          ASCII field renderer, block reveal, text scramble, font loading
  assets/       Hero background image
  content.ts    Site copy and data
```
