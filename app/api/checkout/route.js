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
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .single();
  if (profileError) {
    console.error("Checkout could not load profile:", profileError.message);
    return NextResponse.json({ error: "Could not load your billing account" }, { status: 500 });
  }

  // Guard against double-subscribing (two tabs, back button, etc.)
  if (["active", "trialing"].includes(profile?.subscription_status)) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    }, { idempotencyKey: `rentclock-customer-${user.id}` });
    customerId = customer.id;
    const { data: linked, error: linkError } = await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();
    if (linkError || !linked) {
      console.error("Checkout could not link Stripe customer:", linkError?.message || "profile missing");
      return NextResponse.json({ error: "Could not link your billing account" }, { status: 500 });
    }
  }

  // The database is eventually updated by webhooks, so also ask Stripe before
  // creating anything. This closes the double-tab/webhook-delay window.
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  const existingSubscription = subscriptions.data.find((item) =>
    ["active", "trialing", "incomplete", "past_due", "unpaid", "paused"].includes(item.status)
  );
  if (existingSubscription) {
    return NextResponse.json(
      { error: "A subscription already exists. Use Manage billing to review it." },
      { status: 409 }
    );
  }

  const openSessions = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 10 });
  const reusableSession = openSessions.data.find(
    (item) => item.mode === "subscription" && item.metadata?.plan === plan && item.url
  );
  if (reusableSession) return NextResponse.json({ url: reusableSession.url, reused: true });

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      client_reference_id: user.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: "always",
      metadata: { supabase_user_id: user.id, plan },
      subscription_data: {
        trial_period_days: 14,
        metadata: { supabase_user_id: user.id, plan },
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
      success_url: `${site}/dashboard?welcome=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/pricing`,
    },
    { idempotencyKey: `rentclock-checkout-${user.id}-${plan}-${Math.floor(Date.now() / 60000)}` }
  );

  return NextResponse.json({ url: session.url });
}
