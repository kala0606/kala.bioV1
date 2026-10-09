# Archived portfolio (not routed)

This folder starts with `_`, so Next.js treats it as private: nothing in here builds
into a page. It holds the full portfolio site as it was before the site became a single
ID card (Oct 2026):

- `page.tsx` ... the old home (Hero, WorkIndex, About, Order of Kala, Footer)
- `work/[slug]/` ... SSG case studies from `src/lib/projects.ts`
- `prints/`, `writing/`, `studio/`, `feed.xml/` ... the sections that were being built

Components (`Nav`, `SmoothScroll`, `Hero`, `WorkIndex`, `LiveHero`, ...), data
(`src/lib/projects.ts`, `src/lib/writing.ts`) and public assets are untouched.

To restore a section: move its folder back up into `src/app/`, re-add `<Nav />` and
`<SmoothScroll>` in `src/app/layout.tsx`, list it again in `src/app/sitemap.ts`, and
drop the `html, body { overflow: hidden }` rule in `globals.css`.
