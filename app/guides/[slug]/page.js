import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES } from "@/lib/guides";
import { getPublishedGuides } from "@/lib/published-guides";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

function normaliseGuide(guide) {
  if (!guide) return null;
  return {
    ...guide,
    sections: (guide.sections || []).map((section) => ({
      heading: section.h || section.heading,
      paragraphs: section.p || section.paragraphs || section.points || [],
    })),
    faqs: (guide.faqs || []).map((faq) => ({
      question: faq.q || faq.question,
      answer: faq.a || faq.answer,
    })),
  };
}

async function getGuideCatalog() {
  const published = await getPublishedGuides();
  const seen = new Set();
  return [...GUIDES, ...published]
    .map(normaliseGuide)
    .filter((guide) => {
      if (!guide || seen.has(guide.slug)) return false;
      seen.add(guide.slug);
      return true;
    });
}

async function findGuide(slug) {
  const catalog = await getGuideCatalog();
  return catalog.find((guide) => guide.slug === String(slug || "").toLowerCase()) || null;
}

function getRelatedGuides(catalog, current) {
  const words = new Set(
    (current.title.toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length > 3)
  );
  return catalog
    .filter((guide) => guide.slug !== current.slug)
    .map((guide, index) => ({
      guide,
      index,
      score: (guide.title.toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => words.has(word)).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(({ guide }) => guide);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = await findGuide(slug);
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
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "RentClock — compliance deadlines for small landlords" }],
    },
    twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
  };
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const catalog = await getGuideCatalog();
  const guide = catalog.find((item) => item.slug === String(slug || "").toLowerCase());
  if (!guide) notFound();
  const relatedGuides = getRelatedGuides(catalog, guide);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published || guide.updated,
    dateModified: guide.updated || guide.published,
    image: `${SITE}/opengraph-image`,
    author: { "@type": "Organization", name: "RentClock", url: SITE },
    publisher: { "@type": "Organization", name: "RentClock", url: SITE },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/guides/${guide.slug}` },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="app">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {guide.faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <header className="masthead">
        <div className="brand"><Link href="/" className="brand-link">⌑ <b>RentClock</b></Link></div>
        <nav className="nav"><Link href="/guides">Guides</Link><Link href="/login" className="btn primary sm">Sign in</Link></nav>
      </header>

      <article className="article">
        <div className="eyebrow"><Link href="/guides" className="crumb">Guides</Link> · {guide.readMins} min read</div>
        <h1 className="article-h1">{guide.title}</h1>
        <p className="article-intro">{guide.intro}</p>

        {guide.sections.map((section, index) => (
          <section key={index} className="article-section">
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, item) => <p key={item}>{paragraph}</p>)}
          </section>
        ))}

        {guide.faqs.length > 0 && <section className="article-section">
          <h2>Frequently asked questions</h2>
          {guide.faqs.map((faq, index) => <div key={index} className="faq-item"><b>{faq.question}</b><p>{faq.answer}</p></div>)}
        </section>}

        {relatedGuides.length > 0 && (
          <section className="article-section" aria-labelledby="related-guides">
            <h2 id="related-guides">Related landlord guides</h2>
            <ul>
              {relatedGuides.map((related) => (
                <li key={related.slug}>
                  <Link href={`/guides/${related.slug}`}>{related.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <aside className="article-cta card">
          <h3>RentClock tracks all of this for you</h3>
          <p>Add your properties and RentClock builds the checklist, counts down every renewal, and emails you before anything lapses.</p>
          <Link href="/login" className="btn brass">Start your free trial</Link>
        </aside>
        <p className="article-disclaimer">This guide is general information, not legal advice. Always check GOV.UK or a professional for your specific situation.</p>
      </article>

      <footer className="foot"><p>RentClock is a deadline ledger, not legal advice. Made in the UK.</p></footer>
    </div>
  );
}
