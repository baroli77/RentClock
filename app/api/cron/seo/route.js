import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSearchConsole } from "@/lib/search-console-sync";
import { inspectSearchConsoleIndexing } from "@/lib/search-console-indexing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const admin = createAdminClient();
  const { data: connections, error } = await admin.from("search_console_connections").select("*").not("selected_property", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const connection of connections || []) {
    try {
      const [performance, indexing] = await Promise.all([
        syncSearchConsole(admin, connection),
        inspectSearchConsoleIndexing(admin, connection),
      ]);
      results.push({ owner: connection.owner_email, ok: true, ...performance, indexing });
    }
    catch (syncError) { console.error(`Search Console sync failed for ${connection.owner_email}:`, syncError.message); results.push({ owner: connection.owner_email, ok: false, error: syncError.message }); }
  }
  const failures = results.filter((result) => !result.ok).length;
  return NextResponse.json({ ok: failures === 0, connections: results.length, failures, results }, { status: failures ? 500 : 200 });
}
