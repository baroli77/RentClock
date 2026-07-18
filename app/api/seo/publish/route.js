import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin, seoErrorStatus } from "@/lib/seo";

export const dynamic = "force-dynamic";

function normaliseSlug(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "").replace(/^guides\//, "").toLowerCase();
}

export async function POST(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Opportunity ID is required." }, { status: 400 });

    const supabase = await createClient();
    const { admin } = await requireSeoAdmin(supabase);
    const { data: opportunity, error: findError } = await admin
      .from("seo_opportunities")
      .select("id, title, draft, first_published_at")
      .eq("id", id)
      .single();

    if (findError || !opportunity?.draft) {
      return NextResponse.json({ error: "Create and review an AI draft before publishing." }, { status: 400 });
    }

    const slug = normaliseSlug(opportunity.draft.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({ error: "This draft needs a clean guide URL before it can be published." }, { status: 400 });
    }

    const { data: published } = await admin
      .from("seo_opportunities")
      .select("id, draft, published_draft")
      .eq("status", "published");
    const collision = (published || []).find(
      (item) =>
        item.id !== opportunity.id &&
        normaliseSlug((item.published_draft || item.draft)?.slug) === slug
    );
    if (collision) {
      return NextResponse.json({ error: `/guides/${slug} is already published.` }, { status: 409 });
    }

    const draft = { ...opportunity.draft, slug };
    const now = new Date().toISOString();
    const { data: saved, error: saveError } = await admin
      .from("seo_opportunities")
      .update({
        draft,
        published_draft: draft,
        status: "published",
        first_published_at: opportunity.first_published_at || now,
        published_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();
    if (saveError) throw new Error(saveError.message);

    return NextResponse.json({ opportunity: saved, url: `/guides/${slug}` });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to publish guide." }, { status: seoErrorStatus(error, 500) });
  }
}
