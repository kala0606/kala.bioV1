import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// The site is a single page. The portfolio routes (work, prints, writing,
// studio, feed) are archived under src/app/_portfolio/ and not built.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.ujjwalagarwal.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
