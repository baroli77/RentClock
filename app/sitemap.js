import { GUIDES } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export default function sitemap() {
  const staticPages = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/guides`, changeFrequency: "weekly", priority: 0.7 },
  ];
  const guidePages = GUIDES.map((g) => ({
    url: `${SITE}/guides/${g.slug}`,
    lastModified: g.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticPages, ...guidePages];
}
