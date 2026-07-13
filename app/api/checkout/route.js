import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billingEnabled } from "@/lib/billing";

export async function POST(request) {
  if (!billingEnabled()) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 400 });
  }
  // Optional { plan: "annual" } body selects the annual price if configured.
  let plan = "monthly";
  try {
    const body = await request.json();
    if (body?.plan === "annual") plan = "annual";
  } catch {
    // no body = monthly
  }
  const priceId =
    plan === "annual" && process.env.STRIPE_PRICE_ID_ANNUAL
      ? process.env.STRIPE_PRICE_ID_ANNUAL
      : process.env.STRIPE_PRICE_ID;
  if (plan === "annual" && !process.env.STRIPE_PRICE_ID_ANNUAL) {
    return NextResponse.json({ error: "Annual billing is not configured yet" }, { status: 400 });
  }
  if (!priceId) {
    return NextResponse.json({ error: "Billing is not configured yet" }, { status: 400 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .single();

  // Guard against double-subscribing (two tabs, back button, etc.)
  if (["active", "trialing"].includes(profile?.subscription_status)) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_collection: "always",
    subscription_data: { trial_period_days: 14 },
    success_url: `${site}/dashboard?welcome=1`,
    cancel_url: `${site}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
