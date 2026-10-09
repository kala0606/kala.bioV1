"use client";

import { useEffect, useSyncExternalStore } from "react";
import PortraitMark from "./PortraitMark";

/* One identity card over the Mondrian fluid. Says the least needed: who, what,
   where (with the live Bangalore clock ... time is the medium), what is active,
   and how to reach. Laid out as a small De Stijl composition: paper cells
   separated by black rules, with the three primaries as blocks. */

/* Live Bangalore time as an external store: ticks once a second, snapshot is
   cached per second so React sees a stable value within a render, and the
   server snapshot is empty so there is nothing to mismatch on hydration. */
const clockFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Kolkata",
});
let clockSec = -1;
let clockStr = "";
const getClock = () => {
  const t = Date.now();
  const s = Math.floor(t / 1000);
  if (s !== clockSec) {
    clockSec = s;
    clockStr = clockFmt.format(new Date(t));
  }
  return clockStr;
};
const getClockServer = () => "";
const subscribeClock = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};

function Clock() {
  const now = useSyncExternalStore(subscribeClock, getClock, getClockServer);
  return (
    <span className="id-clock">
      BLR {now} <span style={{ color: "var(--mond-red)" }}>●</span>
    </span>
  );
}

export default function IdCard() {
  // The Preloader adds html.is-loaded when its flying portrait lands in the
  // card, which fades this card's own portrait in. If it never reports in
  // (e.g. GSAP failed), reveal the portrait anyway.
  useEffect(() => {
    const t = setTimeout(
      () => document.documentElement.classList.add("is-loaded"),
      8000
    );
    return () => clearTimeout(t);
  }, []);

  return (
    <article className="id-card">
      <div className="id-cell id-photo">
        <PortraitMark
          id="id-portrait"
          className="id-portrait"
          size={0}
          style={{ width: "100%", height: "auto", aspectRatio: "1 / 1" }}
        />
      </div>

      <div className="id-cell id-name">
        <h1>
          Ujjwal <em>Agarwal</em>
        </h1>
        <p className="id-roles">
          Generative artist · Creative technologist · Educator
        </p>
      </div>

      <div className="id-cell id-base">
        <span className="id-label">Base</span>
        <span>Bangalore, India</span>
        <Clock />
      </div>

      <div className="id-cell id-active">
        <span className="id-label">Active</span>
        <a
          className="link"
          href="https://www.orderofkala.org"
          target="_blank"
          rel="noreferrer"
        >
          orderofkala.org <span className="id-arrow">↗</span>
        </a>
        <a className="link" href="https://raga.fm" target="_blank" rel="noreferrer">
          raga.fm <span className="id-arrow">↗</span>
        </a>
      </div>

      <div className="id-cell id-mail">
        <a className="link" href="mailto:agarwal.ujjwal@gmail.com">
          agarwal.ujjwal@gmail.com
        </a>
      </div>

      {/* the primaries */}
      <div className="id-cell id-red" aria-hidden />
      <div className="id-cell id-yellow" aria-hidden />
      <div className="id-cell id-blue" aria-hidden />
    </article>
  );
}
