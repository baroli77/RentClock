// Subscription gate helper. Local development can run without Stripe, but a
// production configuration mistake must never silently make the paid app free.
export function billingEnabled() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

export function hasAccess(profile) {
  if (!billingEnabled()) return process.env.NODE_ENV !== "production";
  return ["active", "trialing"].includes(profile?.subscription_status);
}
