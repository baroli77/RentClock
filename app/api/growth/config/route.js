import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import { ALLOWED_MODES } from "@/lib/growth";

export async function POST(request) {
  const supabase = await createClient();
  let context;
  try {
    context = await requireSeoAdmin(supabase);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const body = await request.json().catch(() => ({}));
  const patch = { updated_at: new Date().toISOString() };
  if (typeof body.stop_requested === "boolean") patch.stop_requested = body.stop_requested;
  if (body.mode !== undefined) {
    if (!ALLOWED_MODES.has(body.mode)) return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    patch.mode = body.mode;
  }

  const { data, error } = await context.admin
    .from("growth_config")
    .upsert({ id: 1, ...patch }, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return NextResponse.json({ ok: true, config: data });
}
