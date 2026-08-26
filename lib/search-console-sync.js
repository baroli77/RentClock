import { decryptToken, googleAccessToken } from "@/lib/search-console";

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

function isBrandQuery(keyword) {
  return /(^|\s)rent\s*clock(\s|$)|rentclock\.com/i.test(keyword);
}

export async function syncSearchConsole(admin, connection) {
  if (!connection?.owner_email || !connection?.selected_property) throw new Error("Search Console connection is incomplete.");
  const periodStart = isoDaysAgo(91);
  const periodEnd = isoDaysAgo(3);
  const accessToken = await googleAccessToken(decryptToken(connection.refresh_token_encrypted));
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(connection.selected_property)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: periodStart, endDate: periodEnd, dimensions: ["query", "page"], rowLimit: 500, type: "web" }),
  });
  const report = await response.json();
  if (!response.ok) throw new Error(report?.error?.message || "Google could not retrieve search performance.");

  const rows = (report.rows || []).map((row) => ({
    owner_email: connection.owner_email.toLowerCase(),
    query: String(row.keys?.[0] || "").trim(),
    page: String(row.keys?.[1] || "").trim(),
    clicks: Number(row.clicks || 0), impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0), position: Number(row.position || 0),
    period_start: periodStart, period_end: periodEnd, updated_at: new Date().toISOString(),
  })).filter((row) => row.query.length >= 3 && row.page && row.impressions >= 3);

  if (rows.length) {
    const { error } = await admin.from("seo_search_metrics").upsert(rows, { onConflict: "owner_email,query,page" });
    if (error) throw new Error(error.message);
  }

  const aggregates = new Map();
  for (const row of rows) {
    const key = row.query.toLowerCase();
    const current = aggregates.get(key) || { keyword: row.query, clicks: 0, impressions: 0, weightedPosition: 0, pages: new Set() };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.weightedPosition += row.position * row.impressions;
    current.pages.add(row.page);
    aggregates.set(key, current);
  }

  const { data: existing, error: existingError } = await admin.from("seo_opportunities").select("id,primary_keyword");
  if (existingError) throw new Error(existingError.message);
  const known = new Map((existing || []).map((item) => [item.primary_keyword.toLowerCase(), item]));
  let updated = 0;
  const insertions = [];
  for (const [key, row] of aggregates) {
    const position = row.impressions ? row.weightedPosition / row.impressions : 0;
    const metrics = { period: `${periodStart} to ${periodEnd}`, clicks: row.clicks, impressions: row.impressions, ctr: row.impressions ? row.clicks / row.impressions : 0, position, pages: [...row.pages].slice(0, 10) };
    const match = known.get(key);
    if (match) {
      const { error } = await admin.from("seo_opportunities").update({ search_metrics: metrics, priority: priorityFor(metrics), updated_at: new Date().toISOString() }).eq("id", match.id);
      if (error) throw new Error(error.message);
      updated += 1;
    } else if (!isBrandQuery(row.keyword)) {
      insertions.push({ title: `Guide: ${row.keyword}`, primary_keyword: row.keyword, search_intent: "informational", page_type: "guide", priority: priorityFor(metrics), notes: "Imported from Google Search Console. Review the intent before drafting.", search_metrics: metrics, created_by: connection.owner_email.toLowerCase() });
    }
  }
  if (insertions.length) {
    const { error } = await admin.from("seo_opportunities").insert(insertions);
    if (error) throw new Error(error.message);
  }
  const importedAt = new Date().toISOString();
  const { error: stampError } = await admin.from("search_console_connections").update({ last_imported_at: importedAt }).eq("owner_email", connection.owner_email.toLowerCase());
  if (stampError) throw new Error(stampError.message);
  return { imported: insertions.length, updated, scanned: rows.length, queries: aggregates.size, importedAt };
}
