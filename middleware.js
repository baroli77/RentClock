import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const protectedPath =
    path.startsWith("/dashboard") ||
    path.startsWith("/seo") ||
    path.startsWith("/growth") ||
    path.startsWith("/api/data") ||
    path.startsWith("/api/docs");

  // Public pages do not need a Supabase session check.
  if (!protectedPath && path !== "/login") {
    return NextResponse.next({ request });
  }

  // Keep public entry points usable in environments that intentionally do not
  // carry production credentials, while failing closed for protected data.
  if (!supabaseUrl || !supabaseKey) {
    if (protectedPath && path.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication is unavailable" }, { status: 503 });
    }
    if (protectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedPath && !user) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already signed in? Skip the login page entirely.
  if (path === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/seo/:path*", "/growth/:path*", "/login", "/api/data/:path*", "/api/docs/:path*"],
};
