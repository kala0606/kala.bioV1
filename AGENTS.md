<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ujjwalagarwal.com — KALA

Portfolio for Ujjwal Agarwal — generative artist, creative technologist, educator.
Concept: **"Time as the medium."** The site behaves like a timepiece (live clock,
shader atmosphere that warms/cools with the actual time of day).

## Stack

- **Next.js 16** (App Router, Turbopack) · React 19 · TypeScript
- **React Three Fiber 9** + drei + three — all WebGL
- **GSAP** (ScrollTrigger) + **Lenis** — smooth scroll & motion
- **p5** — available for sketch ports (not yet wired)
- **Tailwind v4** — only tokens via `@theme`; most styling is the design system in `globals.css`

## Design system (`src/app/globals.css`)

- **Mondrian / De Stijl paper scheme**: beige paper `--paper` background, black `--black`
  text & logo, primaries `--mond-red` `--mond-yellow` `--mond-blue`. Semantic vars are kept:
  `--ink` = surface (→paper), `--bone` = text (→black), `--saffron` = primary accent (→red).
- Type: Fraunces (display, variable opsz/SOFT/WONK), Hanken Grotesk (body), JetBrains Mono
  (`.mono` labels). Fluid scale `--step--1 … --step-5`. Easing `--ease-out-expo`.

## Architecture

- `src/app/layout.tsx` — fonts, Preloader, SmoothScroll, Nav. (No global background canvas;
  the page is flat paper. `canvas/Background.tsx` is the old dark time-shader, now unused.)
- `src/components/canvas/MondrianFluid.tsx` — **home hero only**. Raw-WebGL De Stijl fluid
  ported from CODEPRESSED's HeaderShader. `u_opacity` carries the scroll factor (1→0); the
  colormap collapses to paper as you scroll, so the field dissolves into the page. Mouse ripple.
- `src/components/PortraitMark.tsx` + `public/portrait.svg` — the hatch-plot portrait used as
  an alpha mask over colour. Flat black = nav logo; `mondrian` = flowing colour (the Preloader
  reveal). Mask needs `mask-mode: alpha` (black strokes on transparent).
- `src/components/canvas/ProjectScene.tsx` — per-project GPU points cloud, **pen-plot look**
  (NormalBlending: ~70% black ink + 30% Mondrian accent snapped from `hue`). `formation(scene)`
  returns a distinct point geometry per project (karma=coiled torus, yoni=rhodonea rose,
  timelines=rows, silent-night=rings, more-than-human=lissajous, pushpak=flock sphere).
- `src/lib/projects.ts` — single source of truth for the 6 projects (+ scene key + hue).
- `src/app/work/[slug]/page.tsx` — SSG case-study pages from that data.
- `src/components/Reveal.tsx` — IntersectionObserver fade-up wrapper.

## Commands

- `npm run dev` · `npm run build` · `npm start`
- Deploy target: Vercel (was GitHub Pages on the old template repo).

## Adding / updating a project (the per-page recipe)

Everything funnels through `src/lib/projects.ts` — edit data there and the home index
+ the SSG case-study page both update. Do ONE project per session to keep it cheap.

Source material the user prepared lives in the repo-root `projects/<Name>/` folders
(NOT served — they're raw sources): e.g. `projects/Karma/*.png`, `projects/Pushpak Vimaan/
PVdemo.mp4`, and p5 sketches `sketch.js` / `main.js`. There are more projects there than
the 6 currently live (Chiral, Riddle, Portraits, Sensitive, Control).

Per project:
1. Copy chosen assets into `public/work/<slug>/` (create the folder). Keep files web-sized.
2. In `projects.ts` fill the entry: real `summary`, `body`, `meta`, `link`, and optionally
   `cover` (image hero, replaces the generative scene), `video`, `gallery[]`.
   Paths are public-relative, e.g. `cover: "/work/karma/MC2.png"`.
3. `npm run build` to confirm green; spot-check the page in the preview.

Two tiers, pick per project:
- **Media tier (cheap):** real images/video + copy via the fields above. Best ROI.
- **Live tier (richer):** run the artist's ORIGINAL sketch verbatim in an isolated iframe —
  do NOT re-implement it (a past session "ported" Karma to 2D and broke it). Copy the source
  into `public/work/<slug>/`, host it with a small HTML page, and point `LiveHero` (set
  `liveHero: true`) at it. Add only minimal embed hooks (URL params for hiding UI, reseeding,
  and a cheap `lite` mode). Examples: Karma (`sketch.html` runs global-mode p5 WEBGL, reseeds
  per load) and Silent Night (`index.html` runs the Three.js/Tone FFT app; `?preset=N` loads a
  saved preset, `?lite=1` drops bloom for the preset-thumbnail grid via `ProjectPresets`).

This content work is well within Sonnet's range; the architecture is already built.

## Roadmap / TODO

- Replace placeholder social URLs + Art Blocks / fx(hash) links in `projects.ts` & `Hero.tsx`.
- Add real project imagery/video (no assets yet — scenes stand in).
- Make each ProjectScene genuinely bespoke (port the real p5 sketches per piece).
- Page transitions through the shared canvas (currently per-page Canvas).
- Per-project OG images, sitemap, analytics, reduced-motion fallbacks for scenes.
