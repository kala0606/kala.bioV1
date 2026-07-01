"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/* Official Instagram embed — injects the blockquote and loads embed.js once. */
export default function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    const id = "instagram-embed-js";
    const process = () => window.instgrm?.Embeds?.process();
    const existing = document.getElementById(id);
    if (existing) {
      process();
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    s.onload = process;
    document.body.appendChild(s);
  }, [url]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={`${url}?utm_source=ig_embed&utm_campaign=loading`}
      data-instgrm-version="14"
      style={{
        background: "#FFF",
        border: 0,
        borderRadius: 3,
        margin: "0 auto",
        maxWidth: 540,
        width: "100%",
        padding: 0,
      }}
    />
  );
}
