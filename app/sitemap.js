import { GUIDES } from "@/lib/guides";
import { getPublishedGuides } from "@/lib/published-guides";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export default async function sitemap() {
  const staticPages = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/guides`, changeFrequency: "weekly", priority: 0.7 },
  ];
  const staticGuides = GUIDES.map((guide) => ({
    url: `${SITE}/guides/${guide.slug}`,
    lastModified: guide.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const publishedGuides = (await getPublishedGuides()).map((guide) => ({
    url: `${SITE}/guides/${guide.slug}`,
    lastModified: guide.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticPages, ...staticGuides, ...publishedGuides];
}
