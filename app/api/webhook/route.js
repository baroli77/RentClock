import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook: keeps profiles.subscription_status in sync.
// Events to enable on the endpoint: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted
export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  async function setStatusByCustomer(customerId, status) {
    await admin
      .from("profiles")
      .update({ subscription_status: status })
      .eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Trial subscriptions start as 'trialing'; paid-immediately as 'active'.
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      await setStatusByCustomer(session.customer, sub.status);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      await setStatusByCustomer(sub.customer, sub.status);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await setStatusByCustomer(sub.customer, "canceled");
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
