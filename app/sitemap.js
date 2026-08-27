import { GUIDES } from "@/lib/guides";
import { getPublishedGuides } from "@/lib/published-guides";
import { TOOLS } from "@/lib/tools";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
export const revalidate = 3600;
const STATIC_LAST_MODIFIED = "2026-08-27";

export default async function sitemap() {
  const lastModified = STATIC_LAST_MODIFIED;
  const staticPages = [
    { url: `${SITE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/pricing`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/guides`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/tools`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/about`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    ...["landlord-compliance-software", "gas-safety-certificate-reminders", "eicr-reminders", "landlord-document-storage"].map((slug) => ({ url: `${SITE}/${slug}`, lastModified, changeFrequency: "monthly", priority: 0.8 })),
    ...Object.keys(TOOLS).map((slug) => ({ url: `${SITE}/tools/${slug}`, lastModified, changeFrequency: "monthly", priority: 0.7 })),
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
  const guidesByUrl = new Map();
  for (const guide of [...staticGuides, ...publishedGuides]) guidesByUrl.set(guide.url, guide);
  return [...staticPages, ...guidesByUrl.values()];
}
