import type { MetadataRoute } from "next";

/**
 * 検索エンジンにindexしてほしい良質なページだけを列挙する。
 * Prism（/news）は noindex なので意図的に含めない。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://comixai.dev";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/profile`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/game`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
