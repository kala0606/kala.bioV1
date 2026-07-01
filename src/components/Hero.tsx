"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-reveal] > *", { yPercent: 110 });
      gsap
        .timeline({ delay: 1.4 })
        .to("[data-reveal] > *", {
          yPercent: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
        })
        .from(
          "[data-fade]",
          { opacity: 0, y: 14, duration: 1, ease: "power2.out", stagger: 0.1 },
          "-=0.8"
        );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        paddingTop: "clamp(7rem, 15vh, 10rem)",
        paddingBottom: "clamp(2rem, 6vh, 5rem)",
      }}
      className="wrap"
    >
      <div
        data-fade
        className="mono"
        style={{
          color: "var(--black)",
          marginBottom: "2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 1.5rem",
        }}
      >
        <span>Generative Artist</span>
        <span style={{ color: "var(--ash)" }}>/</span>
        <span>Creative Technologist</span>
        <span style={{ color: "var(--ash)" }}>/</span>
        <span>Educator</span>
      </div>

      <h1
        style={{
          fontSize: "var(--step-5)",
          letterSpacing: "-0.03em",
        }}
      >
        <span className="reveal-line" data-reveal>
          <span>Ujjwal</span>
        </span>
        <span
          className="reveal-line"
          data-reveal
          style={{ fontStyle: "italic", color: "var(--bone)" }}
        >
          <span>Agarwal</span>
        </span>
      </h1>

      <p
        data-fade
        style={{
          maxWidth: "42ch",
          marginTop: "2.5rem",
          color: "var(--bone-dim)",
          fontSize: "var(--step-1)",
          lineHeight: 1.35,
        }}
      >
        Generative art, real-time installations and sound — a practice where
        algorithm, chance and the present moment become something you can feel.
      </p>

      <div
        data-fade
        className="mono"
        style={{
          marginTop: "3.5rem",
          display: "flex",
          gap: "1.2rem",
          color: "var(--bone-dim)",
        }}
      >
        <a className="link" href="https://www.instagram.com/kala.cast" target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a className="link" href="https://x.com/kalatalk" target="_blank" rel="noreferrer">
          Twitter
        </a>
        <a className="link" href="https://soundcloud.com/kalabmusic" target="_blank" rel="noreferrer">
          SoundCloud
        </a>
      </div>

      <div
        data-fade
        className="mono"
        style={{
          marginTop: "3rem",
          color: "var(--ash)",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <span>Scroll</span>
        <span style={{ width: "3rem", height: "1px", background: "var(--ash)", display: "inline-block" }} />
      </div>
    </section>
  );
}
