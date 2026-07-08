import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Fragment } from "react";
import { stories, getStory } from "@/lib/writing";
import Reveal from "@/components/Reveal";

// Chapter markers rotate through the Mondrian primaries; a chapter can
// override its accent (e.g. "(0,255,0)" is, of course, pure green).
const MONDRIAN = ["var(--mond-red)", "var(--mond-yellow)", "var(--mond-blue)"];

// Prose strings use *asterisks* for italics.
function Prose({ text }: { text: string }) {
  const parts = text.split("*");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? <em key={i}>{p}</em> : <Fragment key={i}>{p}</Fragment>
      )}
    </>
  );
}

// Fraunces at text optical size — book type, not display type.
const serif: React.CSSProperties = {
  fontFamily: "var(--font-display), Georgia, serif",
  fontVariationSettings: '"opsz" 15, "SOFT" 0, "WONK" 0',
};

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getStory(slug);
  if (!s) return {};
  return {
    title: s.title,
    description: s.summary,
    openGraph: { title: s.title, description: s.summary, type: "article" },
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getStory(slug);
  if (!s) notFound();

  return (
    <article className="wrap" style={{ paddingTop: "clamp(9rem, 18vh, 13rem)" }}>
      {/* title block */}
      <header style={{ maxWidth: "46rem", marginInline: "auto" }}>
        <Reveal>
          <div
            className="mono"
            style={{
              color: "var(--saffron)",
              display: "flex",
              gap: "1.2rem",
              flexWrap: "wrap",
              marginBottom: "1.6rem",
            }}
          >
            <span>A story</span>
            {s.part && (
              <>
                <span style={{ color: "var(--ash)" }}>/</span>
                <span>{s.part}</span>
              </>
            )}
            <span style={{ color: "var(--ash)" }}>/</span>
            <span>{s.date}</span>
            <span style={{ color: "var(--ash)" }}>/</span>
            <span>{s.minutes} min</span>
          </div>
          <h1 style={{ fontSize: "var(--step-4)" }}>{s.title}</h1>
          {s.epigraph && (
            <p
              style={{
                ...serif,
                fontStyle: "italic",
                color: "var(--bone-dim)",
                marginTop: "2rem",
                maxWidth: "46ch",
                fontSize: "var(--step-0)",
                lineHeight: 1.6,
              }}
            >
              {s.epigraph}
            </p>
          )}
        </Reveal>
      </header>

      {/* chapters */}
      <div style={{ maxWidth: "40rem", marginInline: "auto" }}>
        {s.chapters.map((ch, i) => {
          const accent = ch.accent ?? MONDRIAN[i % MONDRIAN.length];
          return (
            <section key={ch.title} style={{ marginTop: "clamp(4.5rem, 10vh, 7rem)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.9rem",
                  marginBottom: "1.6rem",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: "0.7rem", height: "0.7rem", background: accent, flexShrink: 0 }}
                />
                <span className="mono" style={{ color: "var(--ash)", whiteSpace: "nowrap" }}>
                  Ch. {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ flex: 1, height: "1px", background: "var(--line)" }} />
              </div>
              <h2 style={{ fontSize: "var(--step-2)", marginBottom: "2rem" }}>{ch.title}</h2>
              {ch.paragraphs.map((para, pi) => (
                <p
                  key={pi}
                  style={{
                    ...serif,
                    fontSize: "clamp(1.05rem, 0.98rem + 0.35vw, 1.28rem)",
                    lineHeight: 1.75,
                    color: "var(--bone)",
                    margin: "0 0 1.5em",
                  }}
                >
                  <Prose text={para} />
                </p>
              ))}
            </section>
          );
        })}

        {/* colophon */}
        <footer
          style={{
            textAlign: "center",
            paddingBlock: "clamp(4rem, 10vh, 7rem)",
          }}
        >
          <div
            aria-hidden
            style={{
              display: "inline-flex",
              gap: "0.45rem",
              marginBottom: "2rem",
            }}
          >
            {MONDRIAN.map((c) => (
              <span key={c} style={{ width: "0.55rem", height: "0.55rem", background: c }} />
            ))}
          </div>
          {s.sign && (
            <p style={{ ...serif, fontSize: "var(--step-1)", margin: 0 }}>{s.sign}</p>
          )}
          {s.endnote && (
            <p className="mono" style={{ color: "var(--ash)", marginTop: "1rem" }}>
              {s.endnote}
            </p>
          )}
        </footer>
      </div>

      {/* back to index */}
      <Link
        href="/writing"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingBlock: "clamp(3rem, 8vh, 6rem)",
          borderTop: "1px solid var(--line)",
        }}
      >
        <span className="mono" style={{ color: "var(--ash)" }}>Index</span>
        <span
          className="link"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-2)", color: "var(--bone)" }}
        >
          All writing →
        </span>
      </Link>
    </article>
  );
}
