import { decryptToken, googleAccessToken, siteUrl } from "./search-console.js";

const INSPECTION_ENDPOINT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const MAX_URLS = 100;
const BATCH_SIZE = 5;

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function sitemapUrls(xml, origin = siteUrl()) {
  const expectedOrigin = new URL(origin).origin;
  return [...String(xml || "").matchAll(/<loc>([^<]+)<\/loc>/gi)]
    .map((match) => decodeXml(match[1].trim()))
    .filter((value) => {
      try { return new URL(value).origin === expectedOrigin; }
      catch { return false; }
    })
    .slice(0, MAX_URLS);
}

export function indexingSummary(rows) {
  const summary = { total: rows.length, indexed: 0, notIndexed: 0, discovered: 0, crawled: 0, errors: 0 };
  for (const row of rows) {
    const coverage = String(row.coverage_state || "").toLowerCase();
    if (row.inspection_error) summary.errors += 1;
    else if (row.verdict === "PASS") summary.indexed += 1;
    else summary.notIndexed += 1;
    if (coverage.includes("discovered") && coverage.includes("not indexed")) summary.discovered += 1;
    if (coverage.includes("crawled") && coverage.includes("not indexed")) summary.crawled += 1;
  }
  return summary;
}

async function inspectUrl(accessToken, property, ownerEmail, url) {
  const inspectedAt = new Date().toISOString();
  try {
    const response = await fetch(INSPECTION_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: property, languageCode: "en-GB" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || `Google inspection failed (${response.status}).`);
    const status = payload.inspectionResult?.indexStatusResult || {};
    return {
      owner_email: ownerEmail,
      url,
      verdict: status.verdict || "VERDICT_UNSPECIFIED",
      coverage_state: status.coverageState || null,
      robots_txt_state: status.robotsTxtState || null,
      indexing_state: status.indexingState || null,
      page_fetch_state: status.pageFetchState || null,
      last_crawl_time: status.lastCrawlTime || null,
      google_canonical: status.googleCanonical || null,
      user_canonical: status.userCanonical || null,
      referring_urls: status.referringUrls || [],
      sitemaps: status.sitemap || [],
      inspected_at: inspectedAt,
      inspection_error: null,
    };
  } catch (error) {
    return {
      owner_email: ownerEmail,
      url,
      verdict: "VERDICT_UNSPECIFIED",
      coverage_state: null,
      robots_txt_state: null,
      indexing_state: null,
      page_fetch_state: null,
      last_crawl_time: null,
      google_canonical: null,
      user_canonical: null,
      referring_urls: [],
      sitemaps: [],
      inspected_at: inspectedAt,
      inspection_error: error.message || "Google inspection failed.",
    };
  }
}

export async function inspectSearchConsoleIndexing(admin, connection) {
  if (!connection?.owner_email || !connection?.selected_property) throw new Error("Search Console connection is incomplete.");
  const ownerEmail = connection.owner_email.toLowerCase();
  const sitemapResponse = await fetch(`${siteUrl()}/sitemap.xml`, { cache: "no-store" });
  if (!sitemapResponse.ok) throw new Error("Could not load RentClock's sitemap for indexing inspection.");
  const urls = sitemapUrls(await sitemapResponse.text());
  if (!urls.length) throw new Error("RentClock's sitemap did not contain any inspectable URLs.");

  const accessToken = await googleAccessToken(decryptToken(connection.refresh_token_encrypted));
  const rows = [];
  for (let index = 0; index < urls.length; index += BATCH_SIZE) {
    rows.push(...await Promise.all(
      urls.slice(index, index + BATCH_SIZE).map((url) => inspectUrl(accessToken, connection.selected_property, ownerEmail, url))
    ));
  }

  const { error } = await admin.from("seo_index_status").upsert(rows, { onConflict: "owner_email,url" });
  if (error) throw new Error(error.message);
  return { inspectedAt: new Date().toISOString(), ...indexingSummary(rows) };
}
