import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { trackMarketingEvent } from "@/lib/marketingman-attribution";

const COOKIE = "rc_attribution_session";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const existing = request.cookies.get(COOKIE)?.value;
  const sessionId = existing || randomUUID();
  const source = String(body.source || "direct").slice(0, 120);
  const medium = String(body.medium || (source === "direct" ? "direct" : "referral")).slice(0, 120);

  await trackMarketingEvent({
    eventType: "visit",
    sessionId,
    source,
    medium,
    campaign: body.campaign ? String(body.campaign).slice(0, 180) : undefined,
    content: body.content ? String(body.content).slice(0, 180) : undefined,
    term: body.term ? String(body.term).slice(0, 180) : undefined,
    metadata: {
      landingPath: String(body.landingPath || "/").slice(0, 500),
      referrerHost: String(body.referrerHost || "").slice(0, 200),
    },
  });

  const response = NextResponse.json({ ok: true });
  if (!existing) {
    response.cookies.set(COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return response;
}
