import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin, seoErrorStatus } from "@/lib/seo";
import { syncSearchConsole } from "@/lib/search-console-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { user, admin } = await requireSeoAdmin(supabase);
    const { data: connection, error } = await admin.from("search_console_connections")
      .select("*").eq("owner_email", user.email.toLowerCase()).single();
    if (error || !connection?.selected_property) return NextResponse.json({ error: "Connect Google Search Console first." }, { status: 400 });
    return NextResponse.json(await syncSearchConsole(admin, connection));
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to import Search Console queries." }, { status: seoErrorStatus(error, 500) });
  }
}
