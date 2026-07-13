import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billingEnabled } from "@/lib/billing";

export async function POST() {
  if (!billingEnabled() || !process.env.STRIPE_PRICE_ID_ANNUAL) {
    return NextResponse.json({ error: "Annual billing is not configured yet" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "all",
    limit: 100,
  });
  const subscription = subscriptions.data.find((item) =>
    ["active", "trialing"].includes(item.status)
  );
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }
  if (subscription.cancel_at_period_end) {
    return NextResponse.json(
      { error: "Your subscription is set to cancel. Resume it in Manage billing before changing plan." },
      { status: 400 }
    );
  }

  const subscriptionItem = subscription.items.data[0];
  if (!subscriptionItem) {
    return NextResponse.json({ error: "Subscription has no billable item" }, { status: 400 });
  }
  if (subscriptionItem.price.id === process.env.STRIPE_PRICE_ID_ANNUAL) {
    return NextResponse.json({ ok: true, alreadyAnnual: true });
  }

  try {
    await stripe.subscriptions.update(subscription.id, {
      items: [{ id: subscriptionItem.id, price: process.env.STRIPE_PRICE_ID_ANNUAL }],
      proration_behavior: "always_invoice",
      payment_behavior: "error_if_incomplete",
    });
  } catch (error) {
    console.error("Annual plan change failed:", error);
    return NextResponse.json(
      { error: "Stripe could not complete the plan change. Check your payment method in Manage billing and try again." },
      { status: 402 }
    );
  }

  return NextResponse.json({ ok: true, alreadyAnnual: false });
}
