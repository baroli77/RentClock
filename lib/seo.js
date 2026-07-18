import { createAdminClient } from "@/lib/supabase/admin";

export class SeoAccessError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SeoAccessError";
    this.status = status;
  }
}

export function seoErrorStatus(error, fallback = 500) {
  return error instanceof SeoAccessError ? error.status : fallback;
}

export async function requireSeoAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new SeoAccessError("Not signed in", 401);
  }

  const admin = createAdminClient();
  const { data: allowed, error } = await admin
    .from("seo_admins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!allowed) throw new SeoAccessError("SEO workspace access is restricted", 403);

  return { user, admin };
}

export function cleanDraft(raw) {
  const draft =
    raw && typeof raw === "object"
      ? raw
      : JSON.parse(String(raw || "").trim().replace(/^\`\`\`json\s*/i, "").replace(/\`\`\`$/i, ""));
  if (!draft.title || !draft.metaDescription || !Array.isArray(draft.sections)) {
    throw new Error("The AI returned an incomplete draft");
  }
  return {
    title: String(draft.title).slice(0, 120),
    metaDescription: String(draft.metaDescription).slice(0, 170),
    slug: String(draft.slug || "").replace(/^\/+|\/+$/g, "").slice(0, 100),
    intro: String(draft.intro || ""),
    sections: draft.sections.slice(0, 8).map((section) => ({
      heading: String(section.heading || ""),
      paragraphs: Array.isArray(section.paragraphs)
        ? section.paragraphs.slice(0, 5).map(String)
        : Array.isArray(section.points)
        ? section.points.slice(0, 6).map(String)
        : [],
    })),
    faqs: Array.isArray(draft.faqs)
      ? draft.faqs.slice(0, 5).map((faq) => ({ question: String(faq.question || ""), answer: String(faq.answer || "") }))
      : [],
    internalLinks: Array.isArray(draft.internalLinks)
      ? draft.internalLinks.slice(0, 5).map((link) => ({ anchor: String(link.anchor || ""), target: String(link.target || "") }))
      : [],
    sourcesToVerify: Array.isArray(draft.sourcesToVerify) ? draft.sourcesToVerify.slice(0, 6).map(String) : [],
  };
}
