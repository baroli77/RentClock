import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { pageMetadata } from "@/lib/site";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
export const metadata = pageMetadata({ title: "RentClock — compliance deadlines for small landlords", description: "Track gas safety, EICR, EPC and Renters' Rights Act deadlines across your properties. Never miss a renewal, never risk a fine. £5.99/month, unlimited properties.", path: "/", eyebrow: "For small landlords in England" });

export default function Landing() {
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RentClock",
    url: SITE,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Landlord compliance software",
    operatingSystem: "Web",
    description:
      "Compliance deadline tracker for small landlords in England. Tracks gas safety, EICR, EPC, deposit and Renters' Rights Act deadlines with email reminders.",
    image: `${SITE}/opengraph-image`,
    offers: {
      "@type": "Offer",
      url: `${SITE}/pricing`,
      price: "5.99",
      priceCurrency: "GBP",
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ["Is RentClock legal advice?", "No. RentClock is a deadline ledger designed to help small landlords in England stay organised. For disputes or edge cases, speak to a professional."],
      ["Can other users see my properties?", "No. Your data is isolated per account and documents are stored privately so only you can access them."],
      ["What happens if I cancel?", "Cancel from the billing page and keep access until your period ends. Your ledger remains intact if you return."],
    ].map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  };

  return (
    <div className="app home-v2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <PublicHeader home />

      <main>
        <section className="home-v2-hero">
          <div>
            <p className="eyebrow">For landlords with 1–10 properties · England</p>
            <h1>Landlord compliance deadlines.<br />Know what&rsquo;s due before it becomes expensive.</h1>
            <p className="home-v2-lead">RentClock puts core gas safety, EICR, EPC, deposit and selected Renters&rsquo; Rights deadlines in one simple ledger — then emails you before tracked dates lapse.</p>
            <div className="home-v2-hero-actions">
              <Link href="/login?trial=1" className="btn brass">Start your 14-day free trial</Link>
              <Link href="/login" className="home-v2-sign-in">Already have an account? Sign in</Link>
            </div>
            <p className="home-v2-stakes">Up to £40,000 at stake for some landlord offences.</p>
            <p className="home-v2-note">Card required · £5.99/month or £59.90/year · cancel before day 14 to pay nothing</p>
          </div>
          <aside className="home-v2-ledger" aria-label="Example RentClock deadline ledger">
            <div className="home-v2-ledger-top"><span>Your deadline ledger</span><span>saved</span></div>
            <div className="home-v2-property">12 Mill Road</div>
            <Deadline name="Gas safety certificate" detail="Renewal date recorded" status="DUE SOON" />
            <Deadline name="Electrical safety report" detail="Earlier report date supported" status="ON TRACK" ok />
            <Deadline name="EPC" detail="Band and expiry recorded" status="ON TRACK" ok />
          </aside>
        </section>

        <div className="home-v2-trust" aria-label="RentClock benefits">
          <span><b>One place</b> for core property deadlines</span>
          <span><b>Email reminders</b> before anything lapses</span>
          <span><b>Unlimited properties</b> on one simple plan</span>
        </div>

        <section id="why-rentclock" className="home-v2-why">
          <p className="eyebrow">Why RentClock</p>
          <h2>More reliable than a spreadsheet.<br />Simpler than full property software.</h2>
          <p className="home-v2-lead">Built specifically for small landlords who need compliance under control — not a complicated, agent-focused accounting suite.</p>
          <div className="home-v2-comparison">
            <div className="home-v2-contrast"><b>Not a spreadsheet.</b>You should not have to remember every date, chase every document or keep up with every rule change yourself.</div>
            <article className="home-v2-rentclock-card">
              <span className="home-v2-badge">Best for small landlords</span>
              <h3>RentClock</h3>
              <p>Your compliance system, without the complexity.</p>
              <ul>
                <li>✓ Reminders before every tracked deadline</li>
                <li>✓ Certificates beside each property</li>
                <li>✓ England-specific core compliance checklist</li>
                <li>✓ £5.99/month, unlimited properties</li>
              </ul>
            </article>
            <div className="home-v2-contrast"><b>Not a full management suite.</b>Get the compliance certainty you need, without agent tools, rent accounts or per-tenancy pricing.</div>
          </div>
        </section>

        <section id="how-it-works" className="home-v2-steps-section">
          <p className="eyebrow">Three simple steps</p>
          <h2>Set it up once. Stay ahead all year.</h2>
          <div className="home-v2-steps">
            <Step number="01" title="Add each property">RentClock creates its core England compliance checklist automatically.</Step>
            <Step number="02" title="Add the last renewal date">Attach the certificate while it is in front of you.</Step>
            <Step number="03" title="Get the reminder first">We email you at 60, 30, 14 and 7 days, on the day and when overdue.</Step>
          </div>
        </section>

        <section className="home-feature-links" aria-labelledby="rentclock-features">
          <p className="eyebrow">Explore the software</p>
          <h2 id="rentclock-features">The useful bits, without the property-suite bloat.</h2>
          <div className="home-v2-steps">
            <Link href="/landlord-compliance-software" className="home-v2-step"><h3>Compliance software</h3><span>One portfolio-wide view of tracked obligations and missing records.</span></Link>
            <Link href="/gas-safety-certificate-reminders" className="home-v2-step"><h3>Gas safety reminders</h3><span>Annual deadlines, the early-check window and persistent overdue alerts.</span></Link>
            <Link href="/eicr-reminders" className="home-v2-step"><h3>EICR reminders</h3><span>Report-specific inspection dates and electrical evidence per property.</span></Link>
            <Link href="/landlord-document-storage" className="home-v2-step"><h3>Document storage</h3><span>Certificates kept beside the property and deadline they support.</span></Link>
          </div>
        </section>

        <section className="home-v2-two-col">
          <div>
            <p className="eyebrow">Built for England</p>
            <h2>Rules change.<br />Your checklist keeps up.</h2>
            <p>RentClock covers core recurring safety dates and selected Renters&rsquo; Rights Act duties. Local licensing and event-based obligations still need property-specific checks.</p>
          </div>
          <div>
            <Faq question="Can other people see my properties?">No. Your data and documents are private to your account.</Faq>
            <Faq question="Is this legal advice?">No. It is a deadline ledger designed to help you stay organised.</Faq>
            <Faq question="What happens if I cancel?">You keep access until your paid period ends and your ledger remains intact if you return.</Faq>
          </div>
        </section>

        <section className="home-v2-cta">
          <p className="eyebrow">Ready when you are</p>
          <h2>Spend ten minutes now.<br />Avoid a very expensive reminder later.</h2>
          <p>14-day free trial · card required · cancel before day 14 to pay nothing</p>
          <div className="home-v2-hero-actions">
            <Link href="/login?trial=1" className="btn brass">Start your free trial</Link>
            <Link href="/login" className="home-v2-sign-in">Already have an account? Sign in</Link>
          </div>
        </section>
      </main>

      <footer className="foot home-v2-foot">
        <p>RentClock is a deadline ledger, not legal advice. Made in the UK.</p>
        <nav className="foot-links" aria-label="Legal">
          <Link href="/landlord-compliance-software">Software</Link><Link href="/gas-safety-certificate-reminders">Gas reminders</Link><Link href="/eicr-reminders">EICR reminders</Link><Link href="/landlord-document-storage">Documents</Link><Link href="/tools">Tools</Link><Link href="/guides">Guides</Link><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}

function Deadline({ name, detail, status, ok = false }) {
  return <div className="home-v2-deadline"><div>{name}<small>{detail}</small></div><span className={ok ? "ok" : ""}>{status}</span></div>;
}

function Step({ number, title, children }) {
  return <article className="home-v2-step"><p>{number}</p><h3>{title}</h3><span>{children}</span></article>;
}

function Faq({ question, children }) {
  return <div className="home-v2-faq"><b>{question}</b><span>{children}</span></div>;
}
