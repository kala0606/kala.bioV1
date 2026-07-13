"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PortraitMark from "./PortraitMark";

function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date());
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="mono" suppressHydrationWarning>
      BLR {now} <span style={{ color: "var(--mond-red)" }}>●</span>
    </span>
  );
}

const LINKS = [
  { href: "/#work", label: "Work", n: "01" },
  { href: "/studio", label: "Studio", n: "02" },
  // { href: "/writing", label: "Writing", n: "03" }, // hidden — un-comment to restore
  { href: "/#about", label: "About", n: "03" },
  { href: "/#kala", label: "Order of Kala", n: "04" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock body scroll while menu open
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: scrolled
            ? "0.9rem clamp(1.2rem, 4vw, 3rem)"
            : "1.6rem clamp(1.2rem, 4vw, 3rem)",
          color: "var(--black)",
          background:
            scrolled && !open ? "rgba(242, 238, 226, 0.82)" : "transparent",
          backdropFilter: scrolled && !open ? "blur(10px)" : "none",
          WebkitBackdropFilter: scrolled && !open ? "blur(10px)" : "none",
          borderBottom:
            scrolled && !open ? "1px solid var(--line)" : "1px solid transparent",
          transition:
            "padding 0.5s var(--ease-out-expo), background 0.5s var(--ease-out-expo), border-color 0.5s var(--ease-out-expo)",
        }}
      >
        {/* left — live clock */}
        <span className="hide-sm" style={{ justifySelf: "start", gridColumn: 1 }}>
          <Clock />
        </span>

        {/* centre — portrait logo */}
        <Link
          href="/"
          aria-label="Home"
          id="nav-logo"
          style={{ justifySelf: "center", gridColumn: 2 }}
        >
          <PortraitMark size={scrolled ? 66 : 100} />
        </Link>

        {/* right — hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="mono"
          style={{
            justifySelf: "end",
            gridColumn: 3,
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--black)",
            padding: 0,
          }}
        >
          <span className="hide-sm">{open ? "Close" : "Menu"}</span>
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: "5px",
              width: "26px",
            }}
          >
            <span style={burger(open, 1)} />
            <span style={burger(open, 2)} />
          </span>
        </button>
      </header>

      {/* overlay menu */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 49,
          background: "var(--paper)",
          padding: "clamp(1.5rem, 5vw, 3rem)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          clipPath: open ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition:
            "clip-path 0.7s var(--ease-out-expo), opacity 0.4s ease",
        }}
      >
        <nav style={{ display: "grid", gap: "0.4rem" }}>
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1.2rem",
                width: "100%",
                padding: "0.4rem 0",
                fontFamily: "var(--font-display)",
                fontSize: "var(--step-3)",
                lineHeight: 1.1,
                color: "var(--black)",
                transform: open ? "none" : "translateY(40px)",
                opacity: open ? 1 : 0,
                transition: `transform 0.7s var(--ease-out-expo) ${0.12 + i * 0.07}s, opacity 0.7s ease ${0.12 + i * 0.07}s`,
              }}
            >
              <span className="mono" style={{ fontSize: "var(--step--1)" }}>
                {l.n}
              </span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div
          className="mono"
          style={{
            marginTop: "clamp(2.5rem, 6vh, 5rem)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            color: "var(--black)",
          }}
        >
          <a className="link" href="mailto:agarwal.ujjwal@gmail.com">
            agarwal.ujjwal@gmail.com
          </a>
          <a className="link" href="https://www.instagram.com/kala.cast" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className="link" href="https://x.com/kalatalk" target="_blank" rel="noreferrer">
            Twitter
          </a>
          <a className="link" href="https://soundcloud.com/kalabmusic" target="_blank" rel="noreferrer">
            SoundCloud
          </a>
          <a className="link" href="https://www.orderofkala.org" target="_blank" rel="noreferrer">
            Order of Kala
          </a>
        </div>
      </div>
    </>
  );
}

function burger(open: boolean, line: 1 | 2): React.CSSProperties {
  return {
    height: "1.5px",
    width: "100%",
    background: "var(--black)",
    transition: "transform 0.4s var(--ease-out-expo)",
    transform: open
      ? line === 1
        ? "translateY(3.25px) rotate(45deg)"
        : "translateY(-3.25px) rotate(-45deg)"
      : "none",
  };
}
