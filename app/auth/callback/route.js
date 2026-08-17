import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackMarketingEvent } from "@/lib/marketingman-attribution";

export function safeNextUrl(value, origin) {
  try {
    const target = new URL(value || "/dashboard", origin);
    return target.origin === origin ? target : new URL("/dashboard", origin);
  } catch {
    return new URL("/dashboard", origin);
  }
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextUrl(searchParams.get("next"), origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const createdAt = new Date(user.created_at).getTime();
          const isNewUser = Number.isFinite(createdAt) && Date.now() - createdAt < 15 * 60 * 1000;
          if (isNewUser) {
            await trackMarketingEvent({
              eventType: "signup",
              sessionId: request.cookies.get("rc_attribution_session")?.value,
              externalUserId: user.id,
              metadata: { source: "supabase_magic_link" },
            });
          }
        }
      } catch (attributionError) {
        console.warn("Signup attribution failed", attributionError instanceof Error ? attributionError.message : attributionError);
      }
      return NextResponse.redirect(next);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
