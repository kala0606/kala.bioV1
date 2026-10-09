import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { projects, getProject } from "@/lib/projects";
import ProjectScene from "@/components/canvas/ProjectScene";
import LiveHero from "@/components/canvas/LiveHero";
import ProjectPresets from "@/components/canvas/ProjectPresets";
import InstagramEmbed from "@/components/InstagramEmbed";
import ScrollHint from "@/components/ScrollHint";
import Reveal from "@/components/Reveal";

// pull the 11-char id out of a youtube id or any youtube url
function ytId(v: string): string {
  const m = v.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : v;
}

type Shot = { src: string; alt?: string; caption?: string };

// split images into rows of 2, 3, 4 (repeating). Merge a trailing single
// into the previous row so we never get an orphan full-width image.
function galleryRows(items: Shot[]): Shot[][] {
  const pattern = [2, 3, 4];
  const rows: Shot[][] = [];
  let i = 0;
  let p = 0;
  while (i < items.length) {
    const c = Math.min(pattern[p % pattern.length], items.length - i);
    rows.push(items.slice(i, i + c));
    i += c;
    p++;
  }
  if (rows.length > 1 && rows[rows.length - 1].length === 1) {
    rows[rows.length - 2].push(rows.pop()![0]);
  }
  return rows;
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return { title: p.title, description: p.summary };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const idx = projects.findIndex((x) => x.slug === slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <article>
      {/* hero — the artwork, full bleed, nothing layered over it */}
      <section
        style={{
          position: "relative",
          height: "100svh",
          overflow: "hidden",
          background: "var(--paper)",
        }}
      >
        {p.heroVideo ? (
          <video
            src={p.heroVideo}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : p.liveHero ? (
          <LiveHero slug={p.slug} />
        ) : p.cover ? (
          <img
            src={p.cover}
            alt={p.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <ProjectScene scene={p.scene} hue={p.hue} />
        )}
        <ScrollHint />
      </section>

      {/* title — below the artwork, on paper */}
      <header className="wrap" style={{ paddingTop: "clamp(2.5rem, 7vh, 5.5rem)" }}>
        <div
          className="mono"
          style={{
            color: "var(--saffron)",
            display: "flex",
            gap: "1.2rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <span>{p.index}</span>
          <span style={{ color: "var(--ash)" }}>/</span>
          <span>{p.kind}</span>
          <span style={{ color: "var(--ash)" }}>/</span>
          <span>{p.year}</span>
        </div>
        <h1 style={{ fontSize: "var(--step-5)" }}>{p.title}</h1>
        <p style={{ maxWidth: "40ch", marginTop: "1.5rem", color: "var(--bone-dim)", fontSize: "var(--step-1)", lineHeight: 1.35 }}>
          {p.tagline}
        </p>
      </header>

      {/* body */}
      <section className="wrap" style={{ paddingBlock: "clamp(5rem, 12vh, 10rem)" }}>
        <div className="proj-body">
          <div>
            <Reveal>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-2)", lineHeight: 1.2, color: "var(--bone)", marginBottom: "3rem" }}>
                {p.summary}
              </p>
            </Reveal>
            {p.body.map((para, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <p style={{ color: "var(--bone-dim)", marginBottom: "1.6rem", maxWidth: "60ch", fontSize: "var(--step-1)", lineHeight: 1.5 }}>
                  {para}
                </p>
              </Reveal>
            ))}
            {p.link && (
              <a className="cta" href={p.link.href} target="_blank" rel="noreferrer" style={{ marginTop: "1.5rem" }}>
                {p.link.label} <span className="arrow">↗</span>
              </a>
            )}
          </div>

          <aside>
            <dl style={{ display: "grid", gap: "1.2rem", margin: 0 }}>
              {p.meta.map((m) => (
                <div key={m.label} style={{ display: "grid", gap: "0.3rem", borderBottom: "1px solid var(--line)", paddingBottom: "1.2rem" }}>
                  <dt className="mono" style={{ color: "var(--ash)" }}>{m.label}</dt>
                  <dd style={{ margin: 0, color: "var(--bone)" }}>{m.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      {/* media — video + variable-size gallery (optional) */}
      {(p.youtube || p.video || p.videos?.length || p.gallery?.length) && (
        <section className="wrap" style={{ paddingBottom: "clamp(3rem, 8vh, 7rem)" }}>
          {p.youtube && (
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                marginBottom: "1.2rem",
                background: "#000",
              }}
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId(p.youtube)}`}
                title={`${p.title} — video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                  display: "block",
                }}
              />
            </div>
          )}
          {p.video && (
            <video
              src={p.video}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", display: "block", marginBottom: "1.2rem" }}
            />
          )}
          {p.videos?.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                gap: "clamp(0.8rem, 2vw, 1.6rem)",
                marginBottom: "1.6rem",
                alignItems: "center",
                justifyItems: "center",
              }}
            >
              {p.videos.map((v) => (
                <video
                  key={v}
                  src={v}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: "100%", maxHeight: "78vh", objectFit: "contain", display: "block", background: "#0a0c12" }}
                />
              ))}
            </div>
          ) : null}
          {p.gallery?.length && p.galleryLayout === "triptych" ? (
            <div className="gallery-wall">
              <div className="triptych">
                {p.gallery.map((g) => (
                  <Reveal key={g.src}>
                    <figure className="tri-frame">
                      <span className="tri-mat">
                        <img src={g.src} alt={g.alt ?? p.title} loading="lazy" />
                      </span>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          ) : p.gallery?.length && p.galleryLayout === "full" ? (
            <div style={{ display: "grid", gap: "clamp(0.8rem, 2.5vw, 2rem)" }}>
              {p.gallery.map((g) => (
                <Reveal key={g.src}>
                  <figure style={{ margin: 0, textAlign: "center" }}>
                    <img
                      src={g.src}
                      alt={g.alt ?? p.title}
                      loading="lazy"
                      style={{ maxWidth: "100%", maxHeight: "88vh", width: "auto", height: "auto", display: "inline-block" }}
                    />
                    {g.caption && (
                      <figcaption className="mono" style={{ marginTop: "0.5rem", color: "var(--bone-dim)" }}>
                        {g.caption}
                      </figcaption>
                    )}
                  </figure>
                </Reveal>
              ))}
            </div>
          ) : p.gallery?.length ? (
            <div className="gallery">
              {galleryRows(p.gallery).map((row, ri) => (
                <div className="gal-row" key={ri}>
                  {row.map((g) => (
                    <figure key={g.src} className="gal-cell">
                      <img src={g.src} alt={g.alt ?? p.title} loading="lazy" />
                      {g.caption && (
                        <figcaption className="mono">{g.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* instagram embed (optional) */}
      {p.instagram && (
        <section className="wrap" style={{ paddingBottom: "clamp(3rem, 8vh, 7rem)" }}>
          {p.instagram.label && (
            <div
              className="mono"
              style={{
                color: "var(--saffron)",
                borderBottom: "1px solid var(--line)",
                paddingBottom: "1.1rem",
                marginBottom: "1.5rem",
              }}
            >
              {p.instagram.label}
            </div>
          )}
          <InstagramEmbed url={p.instagram.url} />
        </section>
      )}

      {/* presets — live lite instances (optional) */}
      {p.presets && (
        <section className="wrap" style={{ paddingBottom: "clamp(3rem, 8vh, 7rem)" }}>
          <div
            className="mono"
            style={{
              color: "var(--saffron)",
              borderBottom: "1px solid var(--line)",
              paddingBottom: "1.1rem",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Presets — live</span>
            <span style={{ color: "var(--ash)" }}>
              ({String(p.presets.count).padStart(2, "0")})
            </span>
          </div>
          <ProjectPresets slug={p.slug} count={p.presets.count} />
        </section>
      )}

      {/* next */}
      <Link
        href={`/work/${next.slug}`}
        className="wrap"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingBlock: "clamp(4rem, 10vh, 8rem)",
          borderTop: "1px solid var(--line)",
        }}
      >
        <span className="mono" style={{ color: "var(--ash)" }}>Next</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-3)", color: "var(--bone)" }} className="link">
          {next.title} →
        </span>
      </Link>
    </article>
  );
}
