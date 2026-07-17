import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";

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
    return NextResponse.json({ error: error.message || "Unable to load SEO opportunities" }, { status: 403 });
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
        source_url: String(body.sourceUrl || "").trim() || null,
        notes: String(body.notes || "").trim() || null,
        created_by: user.email.toLowerCase(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save opportunity" }, { status: 400 });
  }
}
