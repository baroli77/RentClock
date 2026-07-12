// Subscription gate helper. If Stripe isn't configured yet (no STRIPE_SECRET_KEY),
// everything is treated as active so you can develop before wiring billing.
export function billingEnabled() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

export function hasAccess(profile) {
  if (!billingEnabled()) return true;
  return ["active", "trialing"].includes(profile?.subscription_status);
}
