import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // static export → can be served by GitHub Pages (no Node server / Vercel needed)
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
