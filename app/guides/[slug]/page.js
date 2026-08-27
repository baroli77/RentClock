import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES } from "@/lib/guides";
import { getPublishedGuides } from "@/lib/published-guides";
import { cache } from "react";
import PublicChrome from "@/components/PublicChrome";
import Breadcrumbs from "@/components/Breadcrumbs";
import { socialImage } from "@/lib/site";
import DeadlineTool from "@/components/DeadlineTool";
import { GUIDE_ENHANCEMENTS } from "@/lib/guide-enhancements";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
export const revalidate = 3600;
export const dynamicParams = true;

const CLUSTERS = [
  { guides: ["prs-database-registration", "landlord-compliance-checklist-2026", "landlord-compliance-documents-checklist"], tool: "/tools/landlord-compliance-calendar-2026", feature: "/landlord-compliance-software" },
  { guides: ["landlord-compliance-checklist-2026", "landlord-compliance-documents-checklist", "smoke-carbon-monoxide-alarm-rules-landlords"], tool: "/tools/landlord-compliance-calendar-2026", feature: "/landlord-compliance-software" },
  { guides: ["gas-safety-certificate-renewal-rules", "gas-safety-record-copy-to-tenants", "landlord-compliance-checklist-2026"], tool: "/tools/gas-safety-renewal-calculator", feature: "/gas-safety-certificate-reminders" },
  { guides: ["eicr-landlord-remedial-deadlines", "eicr-copy-deadlines-landlords", "landlord-compliance-documents-checklist"], tool: "/tools/eicr-next-inspection-calculator", feature: "/eicr-reminders" },
  { guides: ["tenancy-deposit-protection-30-day-deadline", "landlord-compliance-documents-checklist", "landlord-compliance-checklist-2026"], tool: "/tools/deposit-protection-deadline-calculator", feature: "/landlord-compliance-software" },
  { guides: ["section-8-notice-landlords-2026", "renters-rights-act-2026-landlord-timeline", "tenancy-deposit-protection-30-day-deadline"], tool: "/tools/landlord-compliance-calendar-2026", feature: "/landlord-compliance-software" },
  { guides: ["how-to-carry-out-uk-right-to-rent-checks", "tenant-pet-request-landlord-28-days"], tool: "/tools/right-to-rent-follow-up-calculator", feature: "/landlord-compliance-software" },
  { guides: ["epc-rules-landlords-2030", "epc-exemptions-landlords", "landlord-compliance-documents-checklist"], tool: "/tools/landlord-compliance-calendar-2026", feature: "/landlord-document-storage" },
  { guides: ["smoke-carbon-monoxide-alarm-rules-landlords", "landlord-compliance-checklist-2026", "landlord-compliance-documents-checklist"], tool: "/tools/landlord-compliance-calendar-2026", feature: "/landlord-compliance-software" },
  { guides: ["renters-rights-act-2026-landlord-timeline", "landlord-rent-increase-rules-2026", "rent-bidding-ban-landlords-2026", "tenant-pet-request-landlord-28-days"], tool: "/tools/landlord-compliance-calendar-2026", feature: "/landlord-compliance-software" },
];

const CALCULATOR_TYPES = {
  "gas-safety-certificate-renewal-rules": "gas",
  "eicr-landlord-remedial-deadlines": "eicr",
  "tenancy-deposit-protection-30-day-deadline": "deposit",
  "how-to-carry-out-uk-right-to-rent-checks": "rightToRent",
};

const CALCULATOR_AFTER = {
  "gas-safety-certificate-renewal-rules": "You can usually arrange the check up to two months early",
  "eicr-landlord-remedial-deadlines": "Inspection at least every five years — or sooner",
  "tenancy-deposit-protection-30-day-deadline": "Count from the date the deposit is received",
  "how-to-carry-out-uk-right-to-rent-checks": "Time-limited follow-up checks",
};

function insertCalculatorAfter(guide, section, index) {
  const target = CALCULATOR_AFTER[guide.slug];
  if (!target) return index === 0;
  const matchIndex = guide.sections.findIndex((item) => item.heading === target);
  return index === (matchIndex === -1 ? 0 : matchIndex);
}

function GuideCalculator({ type }) {
  return (
    <aside className="article-calculator card" aria-labelledby="deadline-calculator">
      <h2 id="deadline-calculator">Calculate the date from the source document</h2>
      <p>Enter the date on the certificate, report or official check. This is a planning aid, not a decision about whether the rule applies.</p>
      <DeadlineTool type={type} />
    </aside>
  );
}

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

function normaliseGuide(guide) {
  if (!guide) return null;
  const extra = GUIDE_ENHANCEMENTS[guide.slug] || {};
  const merged = { ...guide, ...extra };
  return {
    ...merged,
    sections: (merged.sections || []).map((section) => ({
      heading: section.h || section.heading,
      paragraphs: section.p || section.paragraphs || section.points || [],
      steps: section.steps || [],
    })),
    faqs: (merged.faqs || []).map((faq) => ({
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

function clusterLinks(catalog, guide) {
  const cluster = CLUSTERS.find((item) => item.guides.includes(guide.slug));
  if (!cluster) return [];
  const guides = cluster.guides
    .filter((slug) => slug !== guide.slug)
    .map((slug) => catalog.find((item) => item.slug === slug))
    .filter(Boolean)
    .map((item) => ({ href: `/guides/${item.slug}`, label: item.title }))
    .slice(0, 2);
  const featureLabels = {
    "/gas-safety-certificate-reminders": "Gas safety reminder software",
    "/eicr-reminders": "EICR reminder software",
    "/landlord-compliance-software": "Landlord compliance software",
    "/landlord-document-storage": "Landlord document storage",
  };
  return [...guides, { href: cluster.tool, label: "Use the free deadline calculator" }, { href: cluster.feature, label: featureLabels[cluster.feature] }];
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
  const related = clusterLinks(catalog, guide);
  const calculatorType = CALCULATOR_TYPES[guide.slug];

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

        {guide.statusBoard && (
          <section className="status-board card" aria-labelledby="current-status">
            <p className="eyebrow">Status board</p>
            <h2 id="current-status">{guide.statusBoard.heading || "Current status"}</h2>
            <p className="status-asof">Checked against official sources on {guide.statusBoard.asAt}.</p>
            <dl className="status-grid">
              {guide.statusBoard.items.map((item) => (
                <div key={item.label} className={`status-item is-${item.state || "unknown"}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            {guide.statusBoard.note && <p className="status-note">{guide.statusBoard.note}</p>}
          </section>
        )}

        {guide.sections.map((section, index) => (
          <section key={index} className="article-section">
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, item) => <p key={item}>{paragraph}</p>)}
            {section.steps?.length > 0 && (
              <ol className="article-steps">
                {section.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            )}
            {calculatorType && insertCalculatorAfter(guide, section, index) && <GuideCalculator type={calculatorType} />}
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

        {related.length > 0 && <section className="article-section" aria-labelledby="related-resources">
          <h2 id="related-resources">Related tools and guides</h2>
          <ul>{related.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul>
        </section>}

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
