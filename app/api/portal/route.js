import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billingEnabled } from "@/lib/billing";

export async function POST() {
  if (!billingEnabled()) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 400 });
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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Billing portal could not load profile:", profileError.message);
    return NextResponse.json({ error: "Could not load your billing account" }, { status: 500 });
  }

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account yet" }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${site}/dashboard`,
  });
  return NextResponse.json({ url: session.url });
}
