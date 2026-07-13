import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }) {
  const guide = getGuide(params.slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `${SITE}/guides/${guide.slug}`,
    },
  };
}

export default function GuidePage({ params }) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  // JSON-LD: Article + FAQ structured data for rich results
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    dateModified: guide.updated,
    author: { "@type": "Organization", name: "RentClock" },
    publisher: { "@type": "Organization", name: "RentClock" },
    mainEntityOfPage: `${SITE}/guides/${guide.slug}`,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="app">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <header className="masthead">
        <div className="brand">
          <Link href="/" className="brand-link">
            <svg className="brand-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> RentClock
          </Link>
        </div>
        <nav className="nav">
          <Link href="/guides">Guides</Link>
          <Link href="/login" className="btn primary sm">Sign in</Link>
        </nav>
      </header>

      <article className="article">
        <div className="eyebrow">
          <Link href="/guides" className="crumb">Guides</Link> · {guide.readMins} min read
        </div>
        <h1 className="article-h1">{guide.title}</h1>
        <p className="article-intro">{guide.intro}</p>

        {guide.sections.map((s, i) => (
          <section key={i} className="article-section">
            <h2>{s.h}</h2>
            {s.p.map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </section>
        ))}

        <section className="article-section">
          <h2>Frequently asked questions</h2>
          {guide.faqs.map((f, i) => (
            <div key={i} className="faq-item">
              <b>{f.q}</b>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <aside className="article-cta card">
          <h3>RentClock tracks all of this for you</h3>
          <p>
            Add your properties and RentClock builds the checklist, counts down every
            renewal, and emails you before anything lapses. £5.99/month, unlimited
            properties, 14-day free trial.
          </p>
          <Link href="/login" className="btn brass">Start your free trial</Link>
        </aside>

        <p className="article-disclaimer">
          This guide is general information, not legal advice, and reflects the rules
          as they stood when last updated ({guide.updated}). Always check GOV.UK or a
          professional for your specific situation.
        </p>
      </article>

      <footer className="foot">
        <p>RentClock is a deadline ledger, not legal advice. Made in the UK.</p>
      </footer>
    </div>
  );
}
