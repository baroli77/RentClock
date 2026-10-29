import { NextResponse } from "next/server";

// Compatibility for older open tabs: stop collecting attribution and expire
// their old cookie without repeatedly retrying a retired integration.
export async function POST() {
  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  response.cookies.set("rc_attribution_session", "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 0,
  });
  return response;
}
