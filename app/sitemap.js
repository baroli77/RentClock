import { GUIDES } from "@/lib/guides";
import { getPublishedGuides } from "@/lib/published-guides";
import { TOOLS } from "@/lib/tools";
import { enhanceGuide } from "@/lib/enhance-guide";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
export const revalidate = 3600;

function dateOnly(value) {
  if (!value) return undefined;
  return String(value).slice(0, 10);
}

export default async function sitemap() {
  const staticPages = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/guides`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/tools`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...["landlord-compliance-software", "gas-safety-certificate-reminders", "eicr-reminders", "landlord-document-storage"].map((slug) => ({ url: `${SITE}/${slug}`, changeFrequency: "monthly", priority: 0.8 })),
    ...Object.keys(TOOLS).map((slug) => ({ url: `${SITE}/tools/${slug}`, changeFrequency: "monthly", priority: 0.7 })),
  ];
  const staticGuides = GUIDES.map(enhanceGuide).map((guide) => ({
    url: `${SITE}/guides/${guide.slug}`,
    lastModified: dateOnly(guide.updated),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const publishedGuides = (await getPublishedGuides()).map(enhanceGuide).map((guide) => ({
    url: `${SITE}/guides/${guide.slug}`,
    lastModified: dateOnly(guide.updated),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const guidesByUrl = new Map();
  for (const guide of [...staticGuides, ...publishedGuides]) guidesByUrl.set(guide.url, guide);
  return [...staticPages, ...guidesByUrl.values()];
}
