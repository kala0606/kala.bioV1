import Link from "next/link";
import type { Metadata } from "next";
import { stories } from "@/lib/writing";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Writing",
  description: "Stories and essays by Ujjwal Agarwal.",
};

export default function WritingIndex() {
  return (
    <section className="wrap" style={{ paddingTop: "clamp(9rem, 18vh, 13rem)", paddingBottom: "clamp(6rem, 14vh, 12rem)" }}>
      <Reveal>
        <header style={{ marginBottom: "clamp(3rem, 7vh, 5rem)" }}>
          <span className="mono" style={{ color: "var(--saffron)" }}>
            Stories &amp; essays
          </span>
          <h1 style={{ fontSize: "var(--step-4)", marginTop: "1.2rem" }}>Writing</h1>
        </header>
      </Reveal>

      <div
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: "1.2rem",
          marginBottom: "0.5rem",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <span className="mono" style={{ color: "var(--ash)" }}>
          ({String(stories.length).padStart(2, "0")})
        </span>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {stories.map((s, i) => (
          <li key={s.slug}>
            <Link
              href={`/writing/${s.slug}`}
              className="work-row"
              style={{
                padding: "clamp(1.4rem, 3vw, 2.4rem) 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span className="mono" style={{ color: "var(--ash)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--step-3)",
                    lineHeight: 0.95,
                    color: "var(--bone)",
                  }}
                >
                  {s.title}
                </span>
                <span style={{ color: "var(--bone-dim)", maxWidth: "48ch" }}>
                  {s.summary}
                </span>
              </span>
              <span
                className="mono work-row__meta"
                style={{
                  color: "var(--bone-dim)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                }}
              >
                <span>{s.part ? `Story · ${s.part}` : "Story"}</span>
                <span style={{ color: "var(--ash)" }}>
                  {s.date} · {s.minutes} min
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
