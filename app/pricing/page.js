import Link from "next/link";

export const metadata = {
  title: "Pricing — £5.99/month, unlimited properties",
  description:
    "RentClock is £5.99/month or £59.90/year for unlimited properties. Full compliance checklist, email reminders, document vault, and a 14-day free trial.",
  alternates: { canonical: "/pricing" },
};

export default function Pricing() {
  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <Link href="/" className="brand-link">
            <svg className="brand-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> RentClock
          </Link>
        </div>
      </header>

      <section className="card pricing-card">
        <div className="eyebrow">One plan, no nonsense</div>
        <div className="price mono">
          £5.99<span className="per">/month</span>
        </div>
        <div className="price-alt mono">or £59.90/year — two months free</div>
        <ul className="price-list">
          <li>Unlimited properties — no per-tenancy pricing</li>
          <li>Full statutory checklist per property</li>
          <li>Email reminders at 60/30/14/7/0 days & overdue</li>
          <li>Weekly alert for anything not yet recorded</li>
          <li>Certificate document vault</li>
          <li>Renters&rsquo; Rights Act updates as phases go live</li>
        </ul>
        <Link href="/login" className="btn brass">
          Start 14-day free trial
        </Link>
        <p className="price-fine">
          Tax deductible as a letting business expense. Cancel in two clicks — you keep access
          until your period ends and your ledger is kept if you return.
        </p>
      </section>

      <footer className="foot">
        <p>RentClock is a deadline ledger, not legal advice.</p>
      </footer>
    </div>
  );
}
