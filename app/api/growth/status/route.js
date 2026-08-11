import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import { getGrowthState } from "@/lib/growth";
import { advertisingSetupStatus } from "@/lib/growth-ads";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  let context;
  try {
    context = await requireSeoAdmin(supabase);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }
  const { admin } = context;
  const state = await getGrowthState();
  const [{ data: actions }, { data: runs }, { data: experiments }, { data: connections, error: connectionsError }] = await Promise.all([
    admin.from("growth_actions").select("*").order("created_at", { ascending: false }).limit(30),
    admin.from("growth_runs").select("id,mode,summary,created_at").order("created_at", { ascending: false }).limit(10),
    admin.from("growth_experiments").select("*").order("created_at", { ascending: false }).limit(20),
    admin.from("growth_ad_connections").select("provider,account_id,customer_id,account_name,metadata,connected_at,updated_at"),
  ]);
  if (connectionsError && connectionsError.code !== "42P01") throw connectionsError;
  return NextResponse.json({ state, actions: actions || [], runs: runs || [], experiments: experiments || [], adConnections: advertisingSetupStatus(connections || []) });
}
