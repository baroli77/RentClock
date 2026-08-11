import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptGrowthToken, exchangeMicrosoftAdsCode, verifyMicrosoftAds } from "@/lib/growth-ads";
import { siteUrl } from "@/lib/search-console";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const denied = url.searchParams.get("error");
  const finish = (path) => NextResponse.redirect(new URL(path, siteUrl()));
  if (denied) return finish(`/growth?connectionError=${encodeURIComponent("Microsoft Advertising connection was cancelled.")}`);
  if (!code || !state) return finish(`/growth?connectionError=${encodeURIComponent("Microsoft did not return a valid connection response.")}`);
  try {
    const admin = createAdminClient();
    const { data: savedState } = await admin.from("growth_oauth_states").select("*").eq("state", state).eq("provider", "microsoft").maybeSingle();
    await admin.from("growth_oauth_states").delete().eq("state", state);
    if (!savedState || new Date(savedState.expires_at) < new Date()) throw new Error("This Microsoft connection link has expired. Please try again.");
    const tokens = await exchangeMicrosoftAdsCode(code);
    const verification = await verifyMicrosoftAds(tokens.access_token);
    const { error } = await admin.from("growth_ad_connections").upsert({
      provider: "microsoft",
      refresh_token_encrypted: encryptGrowthToken(tokens.refresh_token),
      account_id: process.env.MICROSOFT_ADS_ACCOUNT_ID || null,
      customer_id: process.env.MICROSOFT_ADS_CUSTOMER_ID || null,
      account_name: verification.userName || null,
      metadata: { verified: verification.verified, verification_reason: verification.reason },
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return finish("/growth?microsoftAds=connected");
  } catch (error) {
    return finish(`/growth?connectionError=${encodeURIComponent(error.message || "Microsoft Advertising could not be connected.")}`);
  }
}
