"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import PortraitMark from "./PortraitMark";

/* Marks the document once the flying portrait is landing, so the page can
   crossfade its own portrait in as this one dissolves (.id-portrait in globals.css). */
const markLoaded = () => document.documentElement.classList.add("is-loaded");

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  // counter
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(100, n + Math.ceil(Math.random() * 7));
      setCount(n);
      if (n >= 100) clearInterval(id);
    }, 95);
    return () => clearInterval(id);
  }, []);

  // when it hits 100, fly the portrait into its slot on the page and recolor to black
  useEffect(() => {
    if (count < 100 || finished.current) return;
    finished.current = true;

    const run = () => {
      const w = wrap.current;
      // the ID card's photo slot; falls back to the nav logo if the portfolio is restored
      const target =
        document.getElementById("id-portrait") ??
        document.getElementById("nav-logo");
      if (!w) {
        markLoaded();
        return setDone(true);
      }

      const from = w.getBoundingClientRect();
      let dx = 0,
        dy = -from.top + 24,
        scale = 0.12;
      if (target) {
        const to = target.getBoundingClientRect();
        dx = to.left + to.width / 2 - (from.left + from.width / 2);
        dy = to.top + to.height / 2 - (from.top + from.height / 2);
        scale = to.width / from.width;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          markLoaded();
          setDone(true);
        },
      });
      tl.to(w, {
        x: dx,
        y: dy,
        scale,
        filter: "brightness(0)",
        duration: 1.05,
        ease: "power3.inOut",
      })
        // the page's portrait starts fading in as the overlay starts fading out
        .call(markLoaded, undefined, 0.6)
        .to(root.current, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.6);
    };

    const t = setTimeout(run, 500);
    return () => clearTimeout(t);
  }, [count]);

  if (done) return null;

  const reveal = 100 - count;

  return (
    <div
      ref={root}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
      }}
    >
      <div
        ref={wrap}
        style={{
          width: "min(62vw, 380px)",
          aspectRatio: "1 / 1",
          position: "relative",
          willChange: "transform, filter",
        }}
      >
        <PortraitMark
          size={0}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}
        />
        <PortraitMark
          mondrian
          size={0}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            clipPath: `inset(${reveal}% 0 0 0)`,
            transition: "clip-path 0.25s linear",
          }}
        />
      </div>
    </div>
  );
}
