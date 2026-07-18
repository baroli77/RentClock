import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { newMemberEmail } from "@/lib/email";

// Stripe webhook: keeps profiles.subscription_status in sync.
// Events to enable on the endpoint: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted,
// invoice.paid, invoice.payment_failed
export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
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

  async function setStatusByCustomer(customerId, status, userId = null) {
    if (!customerId) throw new Error("Stripe event has no customer");
    let { data, error } = await admin
      .from("profiles")
      .update({ subscription_status: status })
      .eq("stripe_customer_id", customerId)
      .select("id, email, owner_notification_sent_at")
      .maybeSingle();
    if (error) throw error;
    // Heal a checkout-time profile linking failure using Stripe's immutable
    // client_reference_id/metadata rather than leaving a paying user locked out.
    if (!data && userId) {
      ({ data, error } = await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId, subscription_status: status })
        .eq("id", userId)
        .select("id, email, owner_notification_sent_at")
        .maybeSingle());
      if (error) throw error;
    }
    if (!data) throw new Error("No RentClock profile matched the Stripe customer");
    return data;
  }

  try {
    switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Trial subscriptions start as 'trialing'; paid-immediately as 'active'.
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      const profile = await setStatusByCustomer(
        session.customer,
        sub.status,
        session.client_reference_id || session.metadata?.supabase_user_id || sub.metadata?.supabase_user_id
      );

      // The checkout event can be retried by Stripe. Claim the notification in
      // the database first so the owner only receives one email per member.
      if (profile && !profile.owner_notification_sent_at && process.env.RESEND_API_KEY) {
        const { data: claimed, error: claimError } = await admin
          .from("profiles")
          .update({ owner_notification_sent_at: new Date().toISOString() })
          .eq("id", profile.id)
          .is("owner_notification_sent_at", null)
          .select("id, email")
          .maybeSingle();
        if (claimError) throw claimError;

        if (claimed) {
          const owner = process.env.OWNER_NOTIFICATION_EMAIL || "obarton77@gmail.com";
          const from = process.env.REMINDER_FROM || "RentClock <onboarding@resend.dev>";
          const interval = sub.items.data[0]?.price?.recurring?.interval;
          const plan = interval === "year" ? "Annual (£59.90/year)" : "Monthly (£5.99/month)";
          const { html, text } = newMemberEmail({
            memberEmail: claimed.email || "Email unavailable",
            plan,
            site: process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com",
          });
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { error: emailError } = await resend.emails.send({
            from,
            to: owner,
            subject: `New RentClock member — ${claimed.email || "email unavailable"}`,
            html,
            text,
          });
          if (emailError) {
            await admin
              .from("profiles")
              .update({ owner_notification_sent_at: null })
              .eq("id", claimed.id);
            throw new Error(emailError.message);
          }
        }
      }
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
    case "invoice.paid": {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        await setStatusByCustomer(invoice.customer, sub.status, sub.metadata?.supabase_user_id);
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await setStatusByCustomer(invoice.customer, "past_due");
      break;
    }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook processing failed:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
