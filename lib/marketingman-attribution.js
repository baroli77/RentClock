const ENDPOINT = "https://marketingman.vercel.app/api/attribution/ingest";
const PRODUCT_ID = "840a2212-4e2d-40e5-b306-8adba4267028";

export async function trackMarketingEvent({
  eventType,
  sessionId,
  externalUserId,
  source,
  medium,
  campaign,
  content,
  term,
  revenuePence = 0,
  metadata = {},
}) {
  const key = process.env.MARKETINGMAN_ATTRIBUTION_KEY;
  if (!key) return { skipped: true, reason: "MARKETINGMAN_ATTRIBUTION_KEY not configured" };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        eventType,
        sessionId: sessionId || undefined,
        externalUserId: externalUserId || undefined,
        source: source || undefined,
        medium: medium || undefined,
        campaign: campaign || undefined,
        content: content || undefined,
        term: term || undefined,
        revenuePence,
        metadata,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn("MarketingMan attribution rejected event", response.status, text.slice(0, 300));
      return { ok: false, status: response.status };
    }
    return { ok: true };
  } catch (error) {
    console.warn("MarketingMan attribution unavailable", error instanceof Error ? error.message : error);
    return { ok: false };
  }
}
