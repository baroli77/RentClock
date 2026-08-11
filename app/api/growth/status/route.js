import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import { getGrowthState } from "@/lib/growth";

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
  const [{ data: actions }, { data: runs }, { data: experiments }] = await Promise.all([
    admin.from("growth_actions").select("*").order("created_at", { ascending: false }).limit(30),
    admin.from("growth_runs").select("id,mode,summary,created_at").order("created_at", { ascending: false }).limit(10),
    admin.from("growth_experiments").select("*").order("created_at", { ascending: false }).limit(20),
  ]);
  return NextResponse.json({ state, actions: actions || [], runs: runs || [], experiments: experiments || [] });
}
