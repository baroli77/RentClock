import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({ title: "Pricing — £5.99/month, unlimited properties", description: "One simple plan for small landlords: compliance deadlines, email reminders and document storage for unlimited properties.", path: "/pricing", eyebrow: "Simple pricing · unlimited properties" });

export default function Pricing() {
  const productLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RentClock",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", price: "5.99", priceCurrency: "GBP", billingDuration: "P1M", url: "https://rentclock.com/pricing" },
      { "@type": "Offer", price: "59.90", priceCurrency: "GBP", billingDuration: "P1Y", url: "https://rentclock.com/pricing" },
    ],
  };
  return (
    <div className="app">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <PublicHeader />

      <section className="card pricing-card">
        <div className="eyebrow">One plan, no nonsense</div>
        <h1>RentClock pricing</h1>
        <div className="price mono">
          £5.99<span className="per">/month</span>
        </div>
        <div className="price-alt mono">or £59.90/year — two months free</div>
        <ul className="price-list">
          <li>Unlimited properties — no per-tenancy pricing</li>
          <li>Core national compliance deadlines per property</li>
          <li>Email reminders at 60/30/14/7/0 days & overdue</li>
          <li>Weekly alert for anything not yet recorded</li>
          <li>Certificate document vault</li>
          <li>Renters&rsquo; Rights Act updates as phases go live</li>
        </ul>
        <p className="price-fine">Local licensing, repairs and event-based duties can vary. RentClock does not replace council checks or legal advice.</p>
        <Link href="/login?trial=1" className="btn brass">
          Start 14-day free trial
        </Link>
        <p className="price-fine">
          RentClock may be an allowable property-business expense depending on your circumstances.{" "}
          <a href="https://www.gov.uk/renting-out-a-property/paying-tax" target="_blank" rel="noreferrer">
            Check HMRC guidance
          </a>{" "}
          or ask your adviser. Cancel in two clicks — you keep access until your period ends and
          your ledger is kept if you return.
        </p>
      </section>

      <footer className="foot">
        <p>RentClock is a deadline ledger, not legal advice.</p>
        <nav className="foot-links" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}
