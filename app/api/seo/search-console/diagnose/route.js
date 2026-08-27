import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inspectSearchConsoleIndexing } from "@/lib/search-console-indexing";

export const dynamic = "force-dynamic";

const EXPECTED_HASH = "6519da24d39cf884eebc9eb498b3c0073368c429e4bdcb01d82a554882455bcc";

export async function POST(request) {
  const supplied = request.headers.get("x-rentclock-diagnostic") || "";
  const suppliedHash = crypto.createHash("sha256").update(supplied).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(suppliedHash), Buffer.from(EXPECTED_HASH))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: connection, error } = await admin
    .from("search_console_connections")
    .select("*")
    .not("selected_property", "is", null)
    .limit(1)
    .single();
  if (error || !connection) return NextResponse.json({ error: error?.message || "No Search Console connection." }, { status: 404 });

  try {
    return NextResponse.json(await inspectSearchConsoleIndexing(admin, connection));
  } catch (inspectionError) {
    return NextResponse.json({ error: inspectionError.message || "Inspection failed." }, { status: 500 });
  }
}
