import type { MetadataRoute } from "next";
import { MANGA_SERIES } from "./manga/data";
import { WORK_DETAILS } from "./works/data";
import { TERMS, GLOSSARY_UPDATED } from "./glossary/data";
import { RECIPES, PROMPTS_UPDATED } from "./prompts/data";
import { FAQ_UPDATED } from "./faq/data";
import { EVENTS_UPDATED } from "./calendar/events";
import { GUIDES, GUIDES_UPDATED } from "./guide/data";

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
    {
      url: `${base}/works`,
      lastModified: new Date(
        WORK_DETAILS.map((w) => w.lastUpdated).sort().at(-1)!
      ),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...WORK_DETAILS.map((w) => ({
      url: `${base}/works/${w.slug}`,
      lastModified: new Date(w.lastUpdated),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${base}/glossary`,
      lastModified: new Date(GLOSSARY_UPDATED),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...TERMS.map((t) => ({
      url: `${base}/glossary/${t.slug}`,
      lastModified: new Date(t.lastUpdated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${base}/prompts`,
      lastModified: new Date(PROMPTS_UPDATED),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...RECIPES.map((r) => ({
      url: `${base}/prompts/${r.slug}`,
      lastModified: new Date(r.lastUpdated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${base}/quiz`,
      lastModified: new Date(GLOSSARY_UPDATED),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tokenizer`,
      lastModified: new Date(GLOSSARY_UPDATED),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/uso`,
      lastModified: new Date(GLOSSARY_UPDATED),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/calendar`,
      lastModified: new Date(EVENTS_UPDATED),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/faq`,
      lastModified: new Date(FAQ_UPDATED),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...["start", "compare"].map((slug) => ({
      url: `${base}/${slug}`,
      lastModified: new Date(GUIDES_UPDATED),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${base}/guide`,
      lastModified: new Date(GUIDES_UPDATED),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...GUIDES.map((g) => ({
      url: `${base}/guide/${g.slug}`,
      lastModified: new Date(GUIDES_UPDATED),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${base}/uketsuke`,
      lastModified: new Date("2026-07-10"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/history`,
      lastModified: new Date("2026-07-08"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...["vibe", "agent", "shinjin", "sodate", "slop", "keibi", "shacho", "tsukue", "nou", "gakuya", "shitsuke", "majin", "diet", "otehon", "undokai", "gohobi", "claude-app"].map((slug) => ({
      url: `${base}/${slug}`,
      lastModified: new Date(GLOSSARY_UPDATED),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
