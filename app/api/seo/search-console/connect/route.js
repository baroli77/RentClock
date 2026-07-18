import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import { authorizationUrl } from "@/lib/search-console";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { user, admin } = await requireSeoAdmin(supabase);
    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await admin
      .from("search_console_oauth_states")
      .insert({ state, owner_email: user.email.toLowerCase(), expires_at: expiresAt });
    if (error) throw new Error(error.message);
    return NextResponse.redirect(authorizationUrl(state));
  } catch (error) {
    return NextResponse.redirect(new URL(`/seo?searchConsoleError=${encodeURIComponent(error.message)}`, process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com"));
  }
}
