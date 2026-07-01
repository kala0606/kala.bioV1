export type SceneKey =
  | "karma"
  | "yoni"
  | "timelines"
  | "silent-night"
  | "more-than-human"
  | "pushpak"
  | "control"
  | "riddle";

export interface Project {
  slug: string;
  index: string;
  title: string;
  year: string;
  kind: string;
  venue: string;
  tagline: string;
  /** id of the bespoke WebGL/p5 scene rendered into the shared canvas */
  scene: SceneKey;
  /** accent hue (deg) used to tint the project's hero atmosphere */
  hue: number;
  summary: string;
  body: string[];
  meta: { label: string; value: string }[];
  link?: { label: string; href: string };
  /** if true, mount the project's bespoke live sketch as the hero */
  liveHero?: boolean;
  /** optional media — drop files in /public/work/<slug>/ and reference them here.
      If `cover` is set it replaces the generative scene as the hero background. */
  cover?: string;
  /** a looping video used as the full-bleed hero (replaces the generative scene) */
  heroVideo?: string;
  video?: string;
  /** extra looping videos shown in the body (e.g. plotter process clips) */
  videos?: string[];
  /** gallery layout: "rows" = 2·3·4 mosaic (default); "full" = each full-width;
      "triptych" = three framed works on a gallery wall */
  galleryLayout?: "rows" | "full" | "triptych";
  /** YouTube video id (or full url) → responsive 16:9 embed */
  youtube?: string;
  /** Instagram post permalink → official embed */
  instagram?: { url: string; label?: string };
  gallery?: { src: string; alt?: string; caption?: string }[];
  /** show a grid of N live "lite" preset instances of the project's sketch */
  presets?: { count: number };
}

export const projects: Project[] = [
  {
    slug: "karma",
    index: "01",
    title: "Karma",
    year: "2022",
    kind: "Long-form generative",
    venue: "Art Blocks",
    tagline: "Action, consequence, and pattern as algorithm.",
    scene: "karma",
    hue: 5,
    /** if true, the project page renders the live p5 sketch as hero */
    liveHero: true,
    summary:
      "Karma, the original algorithm of Indian thought. Action, inaction, randomness, will — all are ground in its maw to determine the manifest shape of the next moment.",
    body: [
      "The past makes the present, and shall do so in the future. But what one sees is the eternal present, and from there, the past is only the fading imprint on memory, an imprint that leaves us with the perception of pattern, as gratifying as it is mystical. The past's fading, thus, is a necessity.",
      "A long-form generative series on Art Blocks, Karma encodes this philosophy into a deterministic flocking system. Each mint seeds a unique constellation of boids — agents that align, cohere, and separate according to forces drawn from a hash. Lines web between neighbours, rotating cubes mark each body, and colour interpolates across the field. The system runs its course and the trails accumulate into a single, unrepeatable composition.",
    ],
    meta: [
      { label: "Medium", value: "p5.js / WEBGL" },
      { label: "Platform", value: "Art Blocks" },
      { label: "Edition", value: "Long-form generative" },
      { label: "Year", value: "2022" },
    ],
    link: { label: "View on Art Blocks", href: "https://www.artblocks.io/collection/karma-by-kala" },
    gallery: Array.from({ length: 12 }, (_, i) => ({
      src: `/work/karma/k-${i + 1}.jpg`,
      alt: `Karma — output ${i + 1}`,
    })),
  },
  {
    slug: "the-yoni-project",
    index: "02",
    title: "The Yoni Project",
    year: "2023",
    kind: "Long-form generative",
    venue: "fx(hash)",
    tagline: "An homage to Shakti — the divine feminine, grown by code.",
    scene: "yoni",
    hue: 340,
    liveHero: true,
    summary:
      "A long-form generative work paying homage to the Yoni — sacred icon of the Hindu Shaktism tradition and a symbol of Shakti: energy, power, creativity. The hero above is the live sketch, blooming a new form on every load.",
    body: [
      "'Yoni', a Sanskrit word, has long been a symbol of the goddess and the source of life across Indic religions and ancient cultures. The Yoni Project grows petalled, radial geometries from a controlled palette — each token unique, each rooted in the same underlying grammar of the feminine divine.",
      "Premiered as part of the live outdoor installation 'Computational Convergence' at the India Art Fair, New Delhi (February 2023), and minted as a long-form series on fx(hash). All artist royalties were donated to the Rangeen Khidki Foundation.",
    ],
    meta: [
      { label: "Medium", value: "p5.js / generative" },
      { label: "Platform", value: "fx(hash)" },
      { label: "Shown", value: "India Art Fair 2023" },
      { label: "Year", value: "2023" },
    ],
    link: { label: "View on fx(hash)", href: "https://www.fxhash.xyz/generative/24749" },
    gallery: Array.from({ length: 10 }, (_, i) => ({
      src: `/work/the-yoni-project/y-${i + 1}.webp`,
      alt: `The Yoni Project — output ${i + 1}`,
    })),
  },
  {
    slug: "timelines",
    index: "03",
    title: "Timelines",
    year: "2022",
    kind: "Real-time installation",
    venue: "Method · Jodhpur Clock Tower",
    tagline: "A real-time generative timepiece — the hero above is the live clock.",
    scene: "timelines",
    hue: 45,
    liveHero: true,
    summary:
      "A real-time generative clock that refuses to read like one: the hour sets the number of rows, the minute and second drive the motion within them, and the background flips with AM and PM. What you see above is the piece running on your clock, right now.",
    body: [
      "Timelines treats the present moment as the only material. A flocking system fills a row for every hour; as the minutes and seconds pass, the lines articulate and shift, and on the turn of each hour the field resolves and re-forms. Day and night invert the palette, so the work carries the colour of the time you meet it.",
      "Shown as a large-format outdoor installation at Method, and as a solo projection on the Jodhpur Clock Tower — a generative timepiece set against a centuries-old one.",
    ],
    meta: [
      { label: "Medium", value: "p5.js / real-time" },
      { label: "Venues", value: "Method · Jodhpur Clock Tower" },
      { label: "Mode", value: "Outdoor projection" },
      { label: "Year", value: "2022" },
    ],
    youtube: "b84ZK8O1E2I",
    instagram: {
      url: "https://www.instagram.com/p/DBREEUFoNUS/",
      label: "Solo projection — Jodhpur Clock Tower (SITE Jodhpur)",
    },
    gallery: [
      { src: "/work/timelines/1200am.png", caption: "12:00 AM" },
      { src: "/work/timelines/100am.png", caption: "1:00 AM" },
      { src: "/work/timelines/200am.png", caption: "2:00 AM" },
      { src: "/work/timelines/400am.png", caption: "4:00 AM" },
      { src: "/work/timelines/600am.png", caption: "6:00 AM" },
      { src: "/work/timelines/700am.png", caption: "7:00 AM" },
      { src: "/work/timelines/930am.png", caption: "9:30 AM" },
      { src: "/work/timelines/1111am.png", caption: "11:11 AM" },
      { src: "/work/timelines/1200pm.png", caption: "12:00 PM" },
      { src: "/work/timelines/215pm.png", caption: "2:15 PM" },
      { src: "/work/timelines/300pm.png", caption: "3:00 PM" },
      { src: "/work/timelines/345pm.png", caption: "3:45 PM" },
      { src: "/work/timelines/500pm.png", caption: "5:00 PM" },
      { src: "/work/timelines/600pm.png", caption: "6:00 PM" },
      { src: "/work/timelines/715pm.png", caption: "7:15 PM" },
      { src: "/work/timelines/800pm.png", caption: "8:00 PM" },
      { src: "/work/timelines/845pm.png", caption: "8:45 PM" },
      { src: "/work/timelines/900pm.png", caption: "9:00 PM" },
      { src: "/work/timelines/1015pm.png", caption: "10:15 PM" },
    ],
  },
  {
    slug: "silent-night",
    index: "04",
    title: "Silent Night",
    year: "2023",
    kind: "Audio-reactive visuals",
    venue: "Live / club",
    tagline: "Sound made visible — a field of grain that breathes with the music.",
    scene: "silent-night",
    hue: 210,
    liveHero: true,
    summary:
      "A real-time, FFT-driven shader instrument: a field of particles that warps, ridges and glows in response to live audio — built to be played over a crowd in the dark.",
    body: [
      "Silent Night listens. A Tone.js engine and FFT analysis split incoming sound into low, mid and high bands; those energies drive a GPU particle field through a custom noise-warp shader, with bloom, grain and glow layered on top. The result reads less like a visualiser and more like a living surface — terrain that rises and dissolves with the music.",
      "It is parametric to its core. Dozens of controls — warp, ridge, flow, the FFT response and the bloom stack — are saved as presets, each a distinct mood. Drag the hero to move the camera; the thumbnails below are those presets, each running live. (Even with no audio loaded, the field keeps breathing.)",
    ],
    meta: [
      { label: "Medium", value: "Three.js / GLSL / Tone.js" },
      { label: "System", value: "FFT audio-reactive" },
      { label: "Context", value: "Nightclub / live" },
      { label: "Year", value: "2023" },
    ],
    presets: { count: 6 },
  },
  {
    slug: "raga-fm",
    index: "05",
    title: "Raga.fm",
    year: "2024",
    kind: "Generative music · Art Blocks",
    venue: "raga.fm",
    tagline: "Endless Indian classical raga, generated — a different one each load.",
    scene: "more-than-human",
    hue: 50,
    liveHero: true,
    summary:
      "A generative raga engine: each token draws one of 45 ragas from its hash and performs it live in the browser — correct to tradition, yet never the same twice. Tap the hero to hear the raga it has chosen for you.",
    body: [
      "Raga.fm encodes the grammar of raga — its permitted notes, its ascending and descending paths, its characteristic phrases — alongside mood, time of day, tempo and density, all seeded from the token hash. A sampled ensemble (rhodes, strings, cello, tabla) renders it through Tone.js and the Web Audio API, while a p5 visual field moves with the music.",
      "It is rigorously within tradition and yet authored by no single hand — a collaboration between centuries of structure and the moment you press play. Built as a long-form generative work; the full project lives at raga.fm.",
    ],
    meta: [
      { label: "Medium", value: "p5.js / Tone.js / Web Audio" },
      { label: "System", value: "45 ragas, hash-seeded" },
      { label: "Platform", value: "Art Blocks" },
      { label: "Year", value: "2024" },
    ],
    link: { label: "Listen at raga.fm", href: "https://raga.fm" },
  },
  {
    slug: "pushpak-vimaan",
    index: "06",
    title: "Pushpak Vimaan",
    year: "2024",
    kind: "Audio-visual installation",
    venue: "Real-time / sensor",
    tagline: "Bird flight, traced in light, body and sound.",
    scene: "pushpak",
    hue: 215,
    summary:
      "A real-time, body-sensitive audio-visual installation exploring the patterns of bird flight through light and sound.",
    body: [
      "Pushpak Vimaan takes the murmuration — the emergent choreography of birds in flight — as its subject and its method. A flocking system responds to the presence and movement of bodies in the space, the boids reorganising around the visitor.",
      "Light and sound are sensitive to the same field, so the piece becomes a duet between the simulated flock and the people who enter it.",
    ],
    meta: [
      { label: "Medium", value: "Audio-visual / sensor" },
      { label: "System", value: "Flocking / boids" },
      { label: "Mode", value: "Body-sensitive" },
      { label: "Year", value: "2024" },
    ],
    heroVideo: "/work/pushpak-vimaan/PVdemo.mp4",
    galleryLayout: "full",
    gallery: [
      { src: "/work/pushpak-vimaan/a-1.jpg", alt: "Pushpak Vimaan — installation view 1" },
      { src: "/work/pushpak-vimaan/a-2.jpg", alt: "Pushpak Vimaan — installation view 2" },
      { src: "/work/pushpak-vimaan/a-3.jpg", alt: "Pushpak Vimaan — installation view 3" },
    ],
  },
  {
    slug: "control",
    index: "07",
    title: "Control",
    year: "2024",
    kind: "Generative system",
    venue: "Real-time",
    tagline: "Order and agency emerging in a generative field.",
    scene: "control",
    hue: 210,
    liveHero: true,
    summary:
      "A study in control and its limits. A Voronoi field is seeded anew on every load, and thousands of agents are released to follow it — each obeying only local rules, together resolving into a structure no hand could have drawn. Use the ↻ in the hero to seed a new field.",
    body: [
      "Control partitions the plane into Voronoi cells and assigns each a flow direction; agents then drift through this field, accumulating into long trails that braid order and chaos. The same gesture — a few simple constraints, released — produces a different world every time, none of them designed and all of them coherent. The title is a quiet provocation: the artist sets the conditions, but the image belongs to the system.",
      "The engine doubles as an instrument for the pen plotter, where the same trails are drawn in physical ink, layered by depth — the digital field made permanent on paper, one continuous line at a time.",
    ],
    meta: [
      { label: "Medium", value: "p5.js / pen plotter" },
      { label: "System", value: "Voronoi flow field" },
      { label: "Mode", value: "Real-time" },
      { label: "Year", value: "2024" },
    ],
    videos: ["/work/control/plot-1.mp4", "/work/control/plot-2.mp4"],
    galleryLayout: "full",
    gallery: [{ src: "/work/control/c-1.png", alt: "Control — plotted output" }],
  },
  {
    slug: "riddle",
    index: "08",
    title: "Riddle",
    year: "2024",
    kind: "Generative · pen plotter",
    venue: "Real-time",
    tagline: "Nested Wave Function Collapse, drawn for the pen.",
    scene: "riddle",
    hue: 28,
    liveHero: true,
    summary:
      "An invented script that almost means something. A nested Wave Function Collapse engine grows calligraphic line-work depth within depth — each tile collapsing into the next — producing glyph-like marks that read like a language just out of reach. The hero runs live; use the ↻ to pose a new riddle.",
    body: [
      "Riddle treats Wave Function Collapse as a recursive grammar. A coarse grid collapses first into a consistent set of connected tiles; then each cell collapses again at a finer depth, and again, accreting strokes that inherit their neighbours' logic. The eye keeps trying to read it — corners, junctions, terminals — but the meaning never quite resolves. That suspension is the work.",
      "It is built for the hand of a pen plotter: fine and flat-nib calligraphic tips, strokes layered by depth, and a clean vector export so the same collapse can be drawn in ink on paper — a generated text, written by a machine, for no one to read.",
    ],
    meta: [
      { label: "Medium", value: "Canvas / WFC / pen plotter" },
      { label: "Format", value: "A4 vector" },
      { label: "Year", value: "2024" },
    ],
    videos: ["/work/riddle/plot.mp4"],
    galleryLayout: "full",
    gallery: [
      { src: "/work/riddle/triptych_gallery_mockup.png", alt: "Riddle — framed triptych" },
    ],
  },
];

export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);
