"use client";

import { useEffect, useRef, useState } from "react";

/* A grid of saved presets, each a lightweight live instance of the project's
   sketch (?lite=1 — no bloom, dpr 1). Iframes mount only once scrolled into
   view, so we don't spin up every WebGL context at once. */
export default function ProjectPresets({
  slug,
  count,
}: {
  slug: string;
  count: number;
}) {
  return (
    <div className="preset-grid">
      {Array.from({ length: count }).map((_, i) => (
        <PresetCell key={i} slug={slug} index={i} />
      ))}
    </div>
  );
}

function PresetCell({ slug, index }: { slug: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="preset-cell" ref={ref}>
      {show ? (
        <iframe
          title={`${slug} preset ${index}`}
          src={`/work/${slug}/live.html?ui=0&lite=1&preset=${index}`}
          loading="lazy"
        />
      ) : null}
      <span className="mono preset-cell__n">{String(index).padStart(2, "0")}</span>
    </div>
  );
}
