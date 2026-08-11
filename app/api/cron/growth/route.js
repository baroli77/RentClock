import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { askGrowthPlanner, getGrowthState, validateAction } from "@/lib/growth";

export const dynamic = "force-dynamic";

function authorised(request) {
  const auth = request.headers.get("authorization");
  return Boolean(process.env.CRON_SECRET) && auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const state = await getGrowthState();
  if (state.stop_requested) return NextResponse.json({ ok: true, skipped: "stopped" });

  const [{ data: metrics }, { data: experiments }] = await Promise.all([
    admin.from("growth_daily_metrics").select("*").order("metric_date", { ascending: false }).limit(60),
    admin.from("growth_experiments").select("*").order("created_at", { ascending: false }).limit(30),
  ]);

  const plan = await askGrowthPlanner({ state, metrics: metrics || [], experiments: experiments || [] });
  const { data: run, error: runError } = await admin.from("growth_runs").insert({ mode: state.mode, summary: String(plan.summary || ""), state, raw_plan: plan }).select("id").single();
  if (runError) throw runError;

  const rows = (Array.isArray(plan.actions) ? plan.actions : []).map((action) => {
    const validation = validateAction(action, state);
    return {
      run_id: run.id,
      action_type: String(action.type || "observe"),
      channel: String(action.channel || ""),
      target: String(action.target || ""),
      reason: String(action.reason || ""),
      budget_pence: Math.max(0, Math.round(Number(action.budget_pence || 0))),
      payload: action.payload && typeof action.payload === "object" ? action.payload : {},
      status: !validation.allowed ? "blocked" : validation.requiresApproval ? "approval_required" : "approved",
      validation_reason: validation.reason || null,
    };
  });
  if (rows.length) {
    const { error } = await admin.from("growth_actions").insert(rows);
    if (error) throw error;
  }

  return NextResponse.json({ ok: true, run_id: run.id, action_count: rows.length, mode: state.mode });
}
