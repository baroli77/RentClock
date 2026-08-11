import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import { askGrowthPlanner, getGrowthState, validateAction } from "@/lib/growth";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  let context;
  try {
    context = await requireSeoAdmin(supabase);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const { admin } = context;
  const state = await getGrowthState();
  if (state.stop_requested) return NextResponse.json({ error: "Growth autopilot is stopped" }, { status: 409 });

  const [{ data: metrics, error: metricsError }, { data: experiments, error: experimentsError }] = await Promise.all([
    admin.from("growth_daily_metrics").select("*").order("metric_date", { ascending: false }).limit(60),
    admin.from("growth_experiments").select("*").order("created_at", { ascending: false }).limit(30),
  ]);
  if (metricsError) throw metricsError;
  if (experimentsError) throw experimentsError;

  const plan = await askGrowthPlanner({ state, metrics: metrics || [], experiments: experiments || [] });
  const { data: run, error: runError } = await admin
    .from("growth_runs")
    .insert({ mode: state.mode, summary: String(plan.summary || ""), state, raw_plan: plan })
    .select("id")
    .single();
  if (runError) throw runError;

  const actions = Array.isArray(plan.actions) ? plan.actions : [];
  const rows = actions.map((action) => {
    const validation = validateAction(action, state);
    const status = !validation.allowed ? "blocked" : validation.requiresApproval ? "approval_required" : "approved";
    return {
      run_id: run.id,
      action_type: String(action.type || "observe"),
      channel: String(action.channel || ""),
      target: String(action.target || ""),
      reason: String(action.reason || ""),
      budget_pence: Math.max(0, Math.round(Number(action.budget_pence || 0))),
      payload: action.payload && typeof action.payload === "object" ? action.payload : {},
      status,
      validation_reason: validation.reason || null,
    };
  });
  if (rows.length) {
    const { error } = await admin.from("growth_actions").insert(rows);
    if (error) throw error;
  }

  return NextResponse.json({ ok: true, run_id: run.id, state, plan, actions: rows });
}
