import { createAdminClient } from "@/lib/supabase/admin";

export const MONTHLY_BUDGET_PENCE = 10000;
export const DEFAULT_MODE = "dry_run";
export const ALLOWED_MODES = new Set(["dry_run", "approval", "autonomous"]);

export const AUTONOMOUS_ACTIONS = new Set([
  "pause_keyword",
  "pause_campaign",
  "add_negative_keyword",
  "adjust_bid",
  "adjust_daily_budget",
  "create_ad_variant",
]);

export const APPROVAL_ACTIONS = new Set([
  "create_campaign",
  "create_landing_page",
  "publish_seo_page",
  "switch_channel",
]);

export function clampMoneyPence(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export function currentMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function validateAction(action, state) {
  if (!action || typeof action !== "object") return { allowed: false, reason: "Invalid action" };
  const type = String(action.type || "");
  const requestedPence = clampMoneyPence(action.max_spend_pence || action.budget_pence || 0);
  const remainingPence = Math.max(0, MONTHLY_BUDGET_PENCE - clampMoneyPence(state?.spent_pence));

  if (requestedPence > remainingPence) {
    return { allowed: false, reason: `Action could exceed remaining monthly budget (£${(remainingPence / 100).toFixed(2)})` };
  }
  if (state?.mode === "dry_run") return { allowed: false, reason: "Dry-run mode never executes external actions" };
  if (AUTONOMOUS_ACTIONS.has(type)) return { allowed: true, requiresApproval: state?.mode !== "autonomous" };
  if (APPROVAL_ACTIONS.has(type)) return { allowed: true, requiresApproval: true };
  return { allowed: false, reason: `Action type '${type}' is not allow-listed` };
}

export async function getGrowthState() {
  const admin = createAdminClient();
  const month = currentMonthKey();
  const [{ data: config, error: configError }, { data: spend, error: spendError }] = await Promise.all([
    admin.from("growth_config").select("*").eq("id", 1).maybeSingle(),
    admin.from("growth_daily_metrics").select("spend_pence,trials,paid_customers,revenue_pence").gte("metric_date", `${month}-01`),
  ]);
  if (configError) throw configError;
  if (spendError) throw spendError;
  const totals = (spend || []).reduce(
    (acc, row) => ({
      spent_pence: acc.spent_pence + clampMoneyPence(row.spend_pence),
      trials: acc.trials + Number(row.trials || 0),
      paid_customers: acc.paid_customers + Number(row.paid_customers || 0),
      revenue_pence: acc.revenue_pence + clampMoneyPence(row.revenue_pence),
    }),
    { spent_pence: 0, trials: 0, paid_customers: 0, revenue_pence: 0 }
  );
  return {
    mode: ALLOWED_MODES.has(config?.mode) ? config.mode : DEFAULT_MODE,
    monthly_budget_pence: MONTHLY_BUDGET_PENCE,
    ...totals,
    remaining_pence: Math.max(0, MONTHLY_BUDGET_PENCE - totals.spent_pence),
    stop_requested: Boolean(config?.stop_requested),
  };
}

export async function askGrowthPlanner({ state, metrics = [], experiments = [] }) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const model = process.env.GROWTH_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const prompt = `You are the growth planner for RentClock, a UK landlord compliance reminder SaaS.\n\nPrimary objective: maximise paid subscriptions while risking no more than £100 per calendar month. Preserve budget when evidence is weak. Never propose spam, unsolicited bulk outreach, fake reviews, impersonation, policy evasion, or misleading claims. Prefer high-intent search advertising and measurable landing-page/SEO experiments.\n\nCurrent state:\n${JSON.stringify(state, null, 2)}\n\nRecent metrics:\n${JSON.stringify(metrics, null, 2)}\n\nExperiment memory:\n${JSON.stringify(experiments, null, 2)}\n\nReturn ONLY valid JSON with this shape: {"summary":"...","actions":[{"type":"pause_keyword|pause_campaign|add_negative_keyword|adjust_bid|adjust_daily_budget|create_ad_variant|create_campaign|create_landing_page|publish_seo_page|switch_channel|observe","channel":"google|microsoft|seo|site","target":"...","reason":"...","budget_pence":0,"max_spend_pence":0,"payload":{}}],"learnings":["..."]}. Keep individual new experiments at or below £10 unless there is strong existing conversion evidence.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, input: prompt, temperature: 0.2, max_output_tokens: 1800 }),
  });
  if (!response.ok) throw new Error(`OpenAI planner failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  const text = body.output_text || (body.output || []).flatMap((item) => item.content || []).map((c) => c.text || "").join("");
  const cleaned = String(text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  return JSON.parse(cleaned);
}
