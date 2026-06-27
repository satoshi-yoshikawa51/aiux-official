import type { MetadataRoute } from "next";

/**
 * 全ページのクロールを許可し、sitemapの場所を伝える。
 * /news は noindex メタで除外しているため、ここでは disallow しない
 * （robots.txtでブロックするとGoogleがnoindexを読めなくなるため）。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://comixai.dev/sitemap.xml",
  };
}
