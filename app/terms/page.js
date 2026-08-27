import PublicChrome from "@/components/PublicChrome";

export const metadata = {
  title: "Terms of Use",
  description: "The terms that apply when you use RentClock.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <PublicChrome>
      <section className="legal-page">
        <div className="eyebrow">Legal</div>
        <h1>Terms of Use</h1>
        <p className="legal-updated">Last updated: 13 July 2026</p>
        <p>These terms apply when you use RentClock, operated by Oliver Barton. By creating an account or using the service, you agree to them.</p>

        <h2>What RentClock provides</h2>
        <p>RentClock is a compliance deadline ledger for small landlords in England. It helps you record property information, track renewal dates and receive reminders. It is not legal, financial, tax or property-management advice, and it does not guarantee compliance or prevent penalties.</p>

        <h2>Your responsibilities</h2>
        <p>You are responsible for checking that the information you enter is accurate, keeping it up to date, reviewing reminders, obtaining appropriate professional advice and meeting every legal obligation that applies to you and your properties. You must not use RentClock for unlawful purposes or upload material you do not have the right to use.</p>

        <h2>Trial, payments and cancellation</h2>
        <p>RentClock offers a 14-day free trial when available. You provide payment details when starting the trial. Unless you cancel before the trial ends, your chosen subscription will begin and your card will be charged. Current prices are £5.99 per month or £59.90 per year, unless shown otherwise at checkout. Payments and subscription changes are handled through Stripe.</p>
        <p>You can cancel through the billing area. Cancellation stops future renewal charges, while access normally continues until the end of the paid period.</p>

        <h2>Availability and changes</h2>
        <p>We aim to keep RentClock available and accurate, but the service may occasionally be unavailable, changed or withdrawn. We may update the service, pricing or these terms; material changes will be reflected on this page or communicated through the service where appropriate.</p>

        <h2>Liability</h2>
        <p>To the extent permitted by law, RentClock is provided without guarantees that it will be uninterrupted, error-free or suitable for a particular purpose. Nothing in these terms limits liability that cannot legally be limited or excluded.</p>

        <h2>Contact</h2>
        <p>Questions about these terms can be sent to <a href="mailto:support@rentclock.com">support@rentclock.com</a>.</p>
      </section>
    </PublicChrome>
  );
}
