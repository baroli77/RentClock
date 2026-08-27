import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
const FEATURES = [
  ["Landlord compliance software", "/landlord-compliance-software"],
  ["Gas safety reminders", "/gas-safety-certificate-reminders"],
  ["EICR reminders", "/eicr-reminders"],
  ["Compliance document storage", "/landlord-document-storage"],
];

export default function FeatureLanding({ page }) {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
  };
  const productLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: "RentClock",
    applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE,
    description: page.description,
    offers: { "@type": "Offer", price: "5.99", priceCurrency: "GBP", url: `${SITE}/pricing` },
  };
  return <PublicChrome>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    <section className="marketing-hero">
      <div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="marketing-lead">{page.lead}</p><div className="home-v2-hero-actions"><Link href="/login" className="btn brass">Start your 14-day free trial</Link><Link href="/pricing" className="home-v2-sign-in">See pricing</Link></div><p className="home-v2-note">£5.99/month or £59.90/year · unlimited properties · cancel any time</p></div>
      <aside className="home-v2-ledger" aria-label="Example RentClock compliance ledger"><div className="home-v2-ledger-top"><span>Compliance ledger</span><span>saved</span></div><div className="home-v2-property">12 Mill Road</div><div className="home-v2-deadline"><div>Gas safety<small>Certificate attached</small></div><span>DUE SOON</span></div><div className="home-v2-deadline"><div>Electrical report<small>Next inspection recorded</small></div><span className="ok">ON TRACK</span></div><div className="home-v2-deadline"><div>EPC<small>Band and expiry recorded</small></div><span className="ok">ON TRACK</span></div></aside>
    </section>
    <section className="marketing-grid">{page.points.map(([title, copy]) => <article className="card" key={title}><h2>{title}</h2><p>{copy}</p></article>)}</section>
    <div className="marketing-copy">
      {page.sections.map(([heading, paragraphs]) => <section className="article-section" key={heading}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <section className="marketing-workflow card"><p className="eyebrow">The working process</p><h2>From missing date to controlled deadline</h2><ol>{page.workflow.map((item) => <li key={item}>{item}</li>)}</ol></section>
    </div>
    <section className="marketing-proof"><div><p className="eyebrow">Built for small landlords</p><h2>Enough structure to stay ahead. None of the agent-suite clutter.</h2><p>RentClock tracks dates and evidence. It does not pretend to replace official guidance, professional advice or council licensing checks.</p></div><div className="card"><b>Continue with something useful</b><p><Link href={page.guide}>Read the related landlord guide →</Link></p>{page.tool && <p><Link href={page.tool}>Use the free deadline calculator →</Link></p>}</div></section>
    <section className="marketing-faq" aria-labelledby="feature-faq"><p className="eyebrow">Questions before you sign up</p><h2 id="feature-faq">Frequently asked questions</h2>{page.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <section className="marketing-more" aria-labelledby="more-features"><p className="eyebrow">Explore RentClock</p><h2 id="more-features">Other landlord compliance features</h2><div>{FEATURES.map(([label, href]) => <Link href={href} key={href}>{label} →</Link>)}</div></section>
    <section className="home-v2-cta"><p className="eyebrow">Set it up once</p><h2>Know what is due before it becomes expensive.</h2><p>Start with a 14-day free trial. Card required; cancel before day 14 to pay nothing.</p><Link href="/login" className="btn brass">Start free trial</Link></section>
  </PublicChrome>;
}
