"use client";

import { useRef } from "react";

/* Runs the original Art Blocks sketch (public/work/karma/sketch.js) verbatim in
   an isolated iframe — global-mode p5 WEBGL, untouched. A fresh hash is computed
   on every load, so each mount reseeds to a new unique output. */
export default function KarmaSketch() {
  // unique cache-busting key so re-mounts always reload → new seed
  const seed = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Math.random())
  );

  return (
    <iframe
      title="Karma — live generative sketch"
      src={`/work/karma/sketch.html?s=${seed.current}`}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
        background: "var(--paper)",
      }}
    />
  );
}
