import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cleanDraft, requireSeoAdmin, seoErrorStatus } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { admin } = await requireSeoAdmin(supabase);
    const { data, error } = await admin
      .from("seo_opportunities")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ opportunities: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to load SEO opportunities" }, { status: seoErrorStatus(error, 500) });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const primaryKeyword = String(body.primaryKeyword || "").trim();
    if (!title || !primaryKeyword) {
      return NextResponse.json({ error: "A title and primary keyword are required." }, { status: 400 });
    }
    const sourceUrl = String(body.sourceUrl || "").trim();
    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        return NextResponse.json({ error: "Existing page must be a valid public http(s) URL." }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const { user, admin } = await requireSeoAdmin(supabase);
    const { data, error } = await admin
      .from("seo_opportunities")
      .insert({
        title,
        primary_keyword: primaryKeyword,
        search_intent: ["informational", "commercial", "transactional"].includes(body.searchIntent)
          ? body.searchIntent
          : "informational",
        page_type: ["guide", "checklist", "tool", "landing-page", "update"].includes(body.pageType)
          ? body.pageType
          : "guide",
        priority: Math.max(1, Math.min(100, Number(body.priority) || 50)),
        source_url: sourceUrl || null,
        notes: String(body.notes || "").trim() || null,
        created_by: user.email.toLowerCase(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save opportunity" }, { status: seoErrorStatus(error, 400) });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body?.id || !body?.draft) {
      return NextResponse.json({ error: "Opportunity ID and draft are required." }, { status: 400 });
    }
    const draft = cleanDraft(body.draft);
    const supabase = await createClient();
    const { admin } = await requireSeoAdmin(supabase);
    const { data, error } = await admin
      .from("seo_opportunities")
      .update({ draft, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ opportunity: data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to save draft" },
      { status: seoErrorStatus(error, 400) }
    );
  }
}
