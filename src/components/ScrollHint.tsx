"use client";

import { useEffect, useState } from "react";

/* Subtle "scroll" cue over a full-height hero — the live sketches can otherwise
   feel like a dead end. Fades out once the visitor starts scrolling. */
export default function ScrollHint() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        bottom: "22px",
        transform: "translateX(-50%)",
        zIndex: 3,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "7px",
        color: "#fff",
        mixBlendMode: "difference",
        opacity: hidden ? 0 : 0.85,
        transition: "opacity 0.5s ease",
      }}
    >
      <span className="mono" style={{ fontSize: "0.66rem", letterSpacing: "0.22em" }}>
        SCROLL
      </span>
      <span className="scroll-bob" style={{ fontSize: "1rem", lineHeight: 1 }}>
        ↓
      </span>
    </div>
  );
}
