import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import { googleAdsAuthorizationUrl } from "@/lib/growth-ads";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { user, admin } = await requireSeoAdmin(supabase);
    const state = crypto.randomUUID();
    const { error } = await admin.from("growth_oauth_states").insert({ state, provider: "google", owner_email: user.email.toLowerCase(), expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
    if (error) throw error;
    return NextResponse.redirect(googleAdsAuthorizationUrl(state));
  } catch (error) {
    return NextResponse.redirect(new URL(`/growth?connectionError=${encodeURIComponent(error.message)}`, process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com"));
  }
}
