import type { MetadataRoute } from "next";
import { MANGA_SERIES } from "./manga/data";

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
    {
      url: `${base}/manga`,
      lastModified: new Date(
        // シリーズ側の最終更新日のうち最新をインデックスページの更新日とする
        MANGA_SERIES.map((s) => s.lastUpdated).sort().at(-1)!
      ),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...MANGA_SERIES.map((s) => ({
      url: `${base}/manga/${s.slug}`,
      lastModified: new Date(s.lastUpdated),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
