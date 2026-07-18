import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export function safeNextUrl(value, origin) {
  try {
    const target = new URL(value || "/dashboard", origin);
    return target.origin === origin ? target : new URL("/dashboard", origin);
  } catch {
    return new URL("/dashboard", origin);
  }
}

// Magic-link landing point: exchanges the code for a session cookie.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextUrl(searchParams.get("next"), origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(next);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
