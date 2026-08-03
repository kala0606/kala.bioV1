import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
// import { stories } from "@/lib/writing"; // writing section hidden

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.ujjwalagarwal.com";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${base}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // studio page hidden — omitted from sitemap
    // writing section hidden — omitted from sitemap
  ];
}
