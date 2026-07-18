import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin, seoErrorStatus } from "@/lib/seo";
import { decryptToken, googleAccessToken } from "@/lib/search-console";

export const dynamic = "force-dynamic";

function isoDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function priorityFor(row) {
  const impressions = Number(row.impressions || 0);
  const position = Number(row.position || 100);
  const nearPageOne = position >= 4 && position <= 20 ? 24 : position <= 35 ? 10 : 0;
  return Math.max(1, Math.min(100, Math.round(30 + Math.log10(impressions + 1) * 14 + nearPageOne)));
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { user, admin } = await requireSeoAdmin(supabase);
    const email = user.email.toLowerCase();

    const { data: connection, error: connectionError } = await admin
      .from("search_console_connections")
      .select("*")
      .eq("owner_email", email)
      .single();
    if (connectionError || !connection?.selected_property) {
      return NextResponse.json({ error: "Connect Google Search Console first." }, { status: 400 });
    }

    const accessToken = await googleAccessToken(decryptToken(connection.refresh_token_encrypted));
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(connection.selected_property)}/searchAnalytics/query`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: isoDaysAgo(91),
        endDate: isoDaysAgo(3),
        dimensions: ["query"],
        rowLimit: 250,
        type: "web",
      }),
    });
    const report = await response.json();
    if (!response.ok) throw new Error(report?.error?.message || "Google could not retrieve search performance.");

    const rows = (report.rows || [])
      .map((row) => ({ keyword: String(row.keys?.[0] || "").trim(), ...row }))
      .filter((row) => row.keyword.length >= 3 && row.impressions >= 10)
      .sort((a, b) => priorityFor(b) - priorityFor(a))
      .slice(0, 40);

    const { data: existing, error: existingError } = await admin
      .from("seo_opportunities")
      .select("primary_keyword");
    if (existingError) throw new Error(existingError.message);
    const known = new Set((existing || []).map((item) => item.primary_keyword.toLowerCase()));

    const insertions = rows
      .filter((row) => !known.has(row.keyword.toLowerCase()))
      .map((row) => ({
        title: `Guide: ${row.keyword}`,
        primary_keyword: row.keyword,
        search_intent: "informational",
        page_type: "guide",
        priority: priorityFor(row),
        notes: "Imported from Google Search Console. Review the intent before drafting.",
        search_metrics: {
          period: `${isoDaysAgo(91)} to ${isoDaysAgo(3)}`,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        },
        created_by: email,
      }));

    if (insertions.length) {
      const { error: insertError } = await admin.from("seo_opportunities").insert(insertions);
      if (insertError) throw new Error(insertError.message);
    }

    const { error: importStampError } = await admin
      .from("search_console_connections")
      .update({ last_imported_at: new Date().toISOString() })
      .eq("owner_email", email);
    if (importStampError) throw new Error(importStampError.message);

    return NextResponse.json({ imported: insertions.length, scanned: rows.length });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to import Search Console queries." }, { status: seoErrorStatus(error, 500) });
  }
}
