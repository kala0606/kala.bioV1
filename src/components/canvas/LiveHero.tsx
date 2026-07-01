"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const KarmaSketch = dynamic(() => import("@/components/canvas/KarmaSketch"), {
  ssr: false,
});

/* Mounts a project's original sketch verbatim as the hero, in an isolated iframe. */
export default function LiveHero({ slug }: { slug: string }) {
  const rand = useRef(Math.floor(Math.random() * 10));

  if (slug === "karma") return <KarmaSketch />;

  if (slug === "raga-fm") {
    return (
      <iframe
        title="raga.fm — live generative raga"
        src={`/work/raga-fm/live.html?s=${rand.current}`}
        allow="autoplay"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "#000",
        }}
      />
    );
  }

  if (slug === "riddle") {
    return (
      <iframe
        title="Riddle — live nested WFC"
        src={`/work/riddle/live.html?s=${rand.current}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "#0e0e0e",
        }}
      />
    );
  }

  if (slug === "control") {
    return (
      <iframe
        title="Control — live generative field"
        src={`/work/control/live.html?s=${rand.current}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "#0a0c12",
        }}
      />
    );
  }

  if (slug === "the-yoni-project") {
    return (
      <iframe
        title="The Yoni Project — live generative sketch"
        src={`/work/the-yoni-project/live.html?s=${rand.current}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "#000",
        }}
      />
    );
  }

  if (slug === "timelines") {
    return (
      <iframe
        title="Timelines — live generative timepiece"
        src={`/work/timelines/live.html?s=${rand.current}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "#000",
        }}
      />
    );
  }

  if (slug === "silent-night") {
    return (
      <iframe
        title="Silent Night — live audio-reactive sketch"
        src={`/work/silent-night/live.html?ui=0&sound=1&preset=${rand.current}`}
        allow="microphone"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "#121212",
        }}
      />
    );
  }

  return null;
}
