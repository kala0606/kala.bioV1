"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { projects } from "@/lib/projects";

export default function WorkIndex() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="work" className="wrap" style={{ paddingBlock: "clamp(6rem, 14vh, 12rem)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderBottom: "1px solid var(--line)",
          paddingBottom: "1.2rem",
          marginBottom: "0.5rem",
        }}
      >
        <span className="mono" style={{ color: "var(--saffron)" }}>
          Selected Work
        </span>
        <span className="mono" style={{ color: "var(--ash)" }}>
          ({String(projects.length).padStart(2, "0")})
        </span>
      </header>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {projects.map((p, i) => (
          <li key={p.slug} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <Row project={p} dim={active !== null && active !== i} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({
  project,
  dim,
}: {
  project: (typeof projects)[number];
  dim: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={ref}
      href={`/work/${project.slug}`}
      className="work-row"
      style={{
        padding: "clamp(1.4rem, 3vw, 2.4rem) 0",
        borderBottom: "1px solid var(--line)",
        opacity: dim ? 0.32 : 1,
        transition: "opacity 0.5s var(--ease-out-expo), padding-left 0.5s var(--ease-out-expo)",
        paddingLeft: dim ? 0 : "0.4rem",
      }}
    >
      <span className="mono" style={{ color: "var(--ash)" }}>
        {project.index}
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
          {project.title}
        </span>
        <span style={{ color: "var(--bone-dim)", maxWidth: "48ch" }}>
          {project.tagline}
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
        <span>{project.kind}</span>
        <span style={{ color: "var(--ash)" }}>{project.venue} · {project.year}</span>
      </span>
    </Link>
  );
}
