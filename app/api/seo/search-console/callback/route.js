import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken, exchangeCode, googleAccessToken, listSearchConsoleProperties, siteUrl } from "@/lib/search-console";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const denied = url.searchParams.get("error");
  const finish = (message) => NextResponse.redirect(new URL(`/seo?searchConsoleError=${encodeURIComponent(message)}`, siteUrl()));

  if (denied) return finish("Google connection was cancelled.");
  if (!code || !state) return finish("Google did not return a valid connection response.");

  try {
    const admin = createAdminClient();
    const { data: savedState, error: stateError } = await admin
      .from("search_console_oauth_states")
      .select("*")
      .eq("state", state)
      .maybeSingle();
    await admin.from("search_console_oauth_states").delete().eq("state", state);
    if (stateError || !savedState || new Date(savedState.expires_at) < new Date()) {
      throw new Error("This Google connection link has expired. Please try again.");
    }

    const tokens = await exchangeCode(code);
    const accessToken = tokens.access_token || (await googleAccessToken(tokens.refresh_token));
    const properties = await listSearchConsoleProperties(accessToken);
    const preferred = properties.find((item) => item.siteUrl.includes("rentclock.com"))?.siteUrl || properties[0]?.siteUrl || null;

    const { error: saveError } = await admin
      .from("search_console_connections")
      .upsert({
        owner_email: savedState.owner_email,
        refresh_token_encrypted: encryptToken(tokens.refresh_token),
        properties,
        selected_property: preferred,
        connected_at: new Date().toISOString(),
      });
    if (saveError) throw new Error(saveError.message);

    return NextResponse.redirect(new URL("/seo?searchConsole=connected", siteUrl()));
  } catch (error) {
    return finish(error.message || "Google Search Console could not be connected.");
  }
}
