import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES } from "@/lib/guides";
import { getPublishedGuides } from "@/lib/published-guides";
import { cache } from "react";
import PublicChrome from "@/components/PublicChrome";
import Breadcrumbs from "@/components/Breadcrumbs";
import { socialImage } from "@/lib/site";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
export const revalidate = 3600;
export const dynamicParams = true;

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

const getGuideCatalog = cache(async function getGuideCatalog() {
  const published = await getPublishedGuides();
  const seen = new Set();
  return [...GUIDES, ...published]
    .map(normaliseGuide)
    .filter((guide) => {
      if (!guide || seen.has(guide.slug)) return false;
      seen.add(guide.slug);
      return true;
    });
});

async function findGuide(slug) {
  const catalog = await getGuideCatalog();
  return catalog.find((guide) => guide.slug === String(slug || "").toLowerCase()) || null;
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
      images: [{ url: socialImage(guide.title, "Landlord compliance guide · England"), width: 1200, height: 630, alt: guide.title }],
    },
    twitter: { card: "summary_large_image", images: [socialImage(guide.title, "Landlord compliance guide · England")] },
  };
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const catalog = await getGuideCatalog();
  const guide = catalog.find((item) => item.slug === String(slug || "").toLowerCase());
  if (!guide) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published || guide.updated,
    dateModified: guide.updated || guide.published,
    image: `${SITE}${socialImage(guide.title, "Landlord compliance guide · England")}`,
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
    <PublicChrome>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {guide.faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <article className="article">
        <Breadcrumbs items={[{ label: "Guides", href: "/guides" }, { label: guide.title, href: `/guides/${guide.slug}` }]} />
        <div className="eyebrow">{guide.readMins} min read</div>
        <h1 className="article-h1">{guide.title}</h1>
        <p className="article-intro">{guide.intro}</p>
        <p className="article-byline">Reviewed by Oliver Barton, RentClock operator · Updated <time dateTime={String(guide.updated).slice(0, 10)}>{new Date(guide.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time></p>

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

        {(guide.sources?.length > 0 || guide.sourcesToVerify?.length > 0) && (
          <section className="article-section article-sources" aria-labelledby="official-sources">
            <h2 id="official-sources">Official sources</h2>
            <ul>
              {(guide.sources || guide.sourcesToVerify).map((source, index) => {
                const href = typeof source === "string" ? source : source.url;
                const label = typeof source === "string" ? new URL(source).hostname.replace(/^www\./, "") : source.label;
                return <li key={index}><a href={href} rel="noreferrer">{label}</a></li>;
              })}
            </ul>
          </section>
        )}

        {guide.internalLinks?.length > 0 && (
          <section className="article-section" aria-labelledby="further-reading">
            <h2 id="further-reading">Further reading</h2>
            <ul>{guide.internalLinks.map((item, index) => {
              const href = typeof item === "string" ? item : item.url || item.href;
              const label = typeof item === "string" ? item.replace(/^\/guides\//, "").replaceAll("-", " ") : item.label || item.title;
              return href?.startsWith("/") ? <li key={index}><Link href={href}>{label}</Link></li> : null;
            })}</ul>
          </section>
        )}

        <aside className="article-cta card">
          <h3>RentClock tracks all of this for you</h3>
          <p>Add your properties and RentClock builds the checklist, counts down every renewal, and emails you before anything lapses.</p>
          <Link href="/login?trial=1" className="btn brass">Start your free trial</Link>
        </aside>
        <p className="article-disclaimer">This guide is general information, not legal advice. We review time-sensitive claims against official sources; see our <Link href="/about">editorial policy</Link>. Always check GOV.UK or a professional for your situation.</p>
      </article>

    </PublicChrome>
  );
}
