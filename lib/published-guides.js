import { createAdminClient } from "@/lib/supabase/admin";

function normaliseSlug(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "").replace(/^guides\//, "").toLowerCase();
}

function toGuide(row) {
  const draft = row.published_draft || row.draft || {};
  const slug = normaliseSlug(draft.slug);
  if (!slug || !draft.title) return null;
  const words = [draft.intro, ...(draft.sections || []).flatMap((section) => section.paragraphs || section.points || [])]
    .join(" ")
    .trim()
    .split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: draft.title,
    description: draft.metaDescription,
    intro: draft.intro,
    sections: draft.sections || [],
    faqs: draft.faqs || [],
    internalLinks: draft.internalLinks || [],
    sourcesToVerify: draft.sourcesToVerify || [],
    published: row.first_published_at || row.published_at || row.created_at,
    updated: row.published_at || row.updated_at || row.created_at,
    readMins: Math.max(2, Math.ceil(words / 220)),
  };
}

export async function getPublishedGuides() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("seo_opportunities")
    .select("draft, published_draft, first_published_at, published_at, updated_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("Could not load published SEO guides:", error.message);
    return [];
  }
  return (data || []).map(toGuide).filter(Boolean);
}

export async function getPublishedGuide(slug) {
  const guides = await getPublishedGuides();
  return guides.find((guide) => guide.slug === normaliseSlug(slug)) || null;
}
