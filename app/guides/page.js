import Link from "next/link";
import { GUIDES } from "@/lib/guides";

export const metadata = {
  title: "Landlord Compliance Guides",
  description:
    "Plain-English guides to landlord compliance in England: gas safety, EICR, EPC, deposit rules and the Renters' Rights Act.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <Link href="/" className="brand-link">
            <svg className="brand-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> RentClock
          </Link>
        </div>
        <nav className="nav">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login" className="btn primary sm">Sign in</Link>
        </nav>
      </header>

      <section className="guide-head">
        <div className="eyebrow">Guides</div>
        <h1 className="landing-h1 dark">Landlord compliance, explained</h1>
        <p className="guide-lede">
          Plain-English guides to the rules private landlords in England actually
          have to follow — and the deadlines that catch people out.
        </p>
      </section>

      <div className="guide-list">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="card guide-card">
            <h2>{g.title}</h2>
            <p>{g.description}</p>
            <span className="guide-meta mono">{g.readMins} min read →</span>
          </Link>
        ))}
      </div>

      <section className="final-cta hero">
        <h2 className="final-h2">Stop tracking this in your head.</h2>
        <p className="landing-sub">
          RentClock turns every rule above into a countdown and emails you before
          anything lapses. £5.99/month, unlimited properties.
        </p>
        <Link href="/login" className="btn brass">Start your free trial</Link>
      </section>

      <footer className="foot">
        <p>RentClock is a deadline ledger, not legal advice. Made in the UK.</p>
      </footer>
    </div>
  );
}
