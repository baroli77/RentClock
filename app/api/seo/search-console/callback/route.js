import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken, exchangeCode, googleAccessToken, listSearchConsoleProperties, siteUrl } from "@/lib/search-console";
import { encryptGrowthToken, exchangeGoogleAdsCode, listGoogleAdsCustomers } from "@/lib/growth-ads";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const denied = url.searchParams.get("error");
  const seoFinish = (message) => NextResponse.redirect(new URL(`/seo?searchConsoleError=${encodeURIComponent(message)}`, siteUrl()));
  const growthFinish = (message) => NextResponse.redirect(new URL(`/growth?connectionError=${encodeURIComponent(message)}`, siteUrl()));
  let growthFlow = false;

  if (!state) return seoFinish("Google did not return a valid connection response.");

  try {
    const admin = createAdminClient();
    const { data: growthState } = await admin.from("growth_oauth_states").select("*").eq("state", state).eq("provider", "google").maybeSingle();
    growthFlow = Boolean(growthState);

    if (growthState) {
      await admin.from("growth_oauth_states").delete().eq("state", state);
      if (denied) return growthFinish("Google Ads connection was cancelled.");
      if (!code) return growthFinish("Google did not return a valid connection response.");
      if (new Date(growthState.expires_at) < new Date()) throw new Error("This Google Ads connection link has expired. Please try again.");

      const tokens = await exchangeGoogleAdsCode(code);
      const result = await listGoogleAdsCustomers(tokens.access_token);
      const customerId = result.customers[0] || process.env.GOOGLE_ADS_CUSTOMER_ID || null;
      const { error: saveError } = await admin.from("growth_ad_connections").upsert({
        provider: "google",
        refresh_token_encrypted: encryptGrowthToken(tokens.refresh_token),
        customer_id: customerId,
        account_id: customerId,
        metadata: { verified: result.verified, accessible_customers: result.customers, verification_reason: result.reason },
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
      return NextResponse.redirect(new URL("/growth?googleAds=connected", siteUrl()));
    }

    if (denied) return seoFinish("Google connection was cancelled.");
    if (!code) return seoFinish("Google did not return a valid connection response.");

    const { data: savedState, error: stateError } = await admin.from("search_console_oauth_states").select("*").eq("state", state).maybeSingle();
    await admin.from("search_console_oauth_states").delete().eq("state", state);
    if (stateError || !savedState || new Date(savedState.expires_at) < new Date()) throw new Error("This Google connection link has expired. Please try again.");

    const tokens = await exchangeCode(code);
    const accessToken = tokens.access_token || (await googleAccessToken(tokens.refresh_token));
    const properties = await listSearchConsoleProperties(accessToken);
    const preferred = properties.find((item) => item.siteUrl.includes("rentclock.com"))?.siteUrl || properties[0]?.siteUrl || null;
    const { error: saveError } = await admin.from("search_console_connections").upsert({
      owner_email: savedState.owner_email,
      refresh_token_encrypted: encryptToken(tokens.refresh_token),
      properties,
      selected_property: preferred,
      connected_at: new Date().toISOString(),
    });
    if (saveError) throw new Error(saveError.message);
    return NextResponse.redirect(new URL("/seo?searchConsole=connected", siteUrl()));
  } catch (error) {
    return growthFlow ? growthFinish(error.message || "Google Ads could not be connected.") : seoFinish(error.message || "Google Search Console could not be connected.");
  }
}
