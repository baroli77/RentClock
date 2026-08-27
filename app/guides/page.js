import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { getPublishedGuides } from "@/lib/published-guides";
import PublicChrome from "@/components/PublicChrome";
import { pageMetadata } from "@/lib/site";

export const revalidate = 3600;

export const metadata = pageMetadata({ title: "Landlord Compliance Guides", description: "Plain-English landlord compliance guides for England, covering safety certificates, deposits, EPCs and the Renters' Rights Act.", path: "/guides", eyebrow: "Landlord compliance guides · England" });

const GROUPS = [
  ["Start here", ["landlord-compliance-checklist-2026", "landlord-compliance-documents-checklist", "renters-rights-act-2026-landlord-timeline"]],
  ["Gas, electrical and alarms", ["gas-safety-certificate-renewal-rules", "gas-safety-record-copy-to-tenants", "eicr-landlord-remedial-deadlines", "eicr-copy-deadlines-landlords", "smoke-carbon-monoxide-alarm-rules-landlords"]],
  ["Tenancies and occupiers", ["tenancy-deposit-protection-30-day-deadline", "landlord-rent-increase-rules-2026", "tenant-pet-request-landlord-28-days", "rent-bidding-ban-landlords-2026", "section-8-notice-landlords-2026", "how-to-carry-out-uk-right-to-rent-checks"]],
  ["Energy, registration and licensing", ["epc-rules-landlords-2030", "epc-exemptions-landlords", "prs-database-registration"]],
];

export default async function GuidesIndex() {
  const published = await getPublishedGuides();
  const guides = [
    ...GUIDES,
    ...published.map((guide) => ({
      slug: guide.slug,
      title: guide.title,
      description: guide.description,
      readMins: guide.readMins,
    })),
  ];
  const used = new Set(GROUPS.flatMap(([, slugs]) => slugs));
  const grouped = GROUPS.map(([title, slugs]) => [title, slugs.map((slug) => guides.find((guide) => guide.slug === slug)).filter(Boolean)]);
  const uncategorised = guides.filter((guide) => !used.has(guide.slug));
  if (uncategorised.length) grouped.push(["More landlord guides", uncategorised]);

  return (
    <PublicChrome>

      <section className="guide-head">
        <div className="eyebrow">Guides</div>
        <h1 className="landing-h1 dark">Landlord compliance, explained</h1>
        <p className="guide-lede">
          Plain-English guides to the rules private landlords in England actually
          have to follow — and the deadlines that catch people out.
        </p>
      </section>

      {grouped.map(([title, items]) => items.length > 0 && <section className="guide-group" key={title}>
        <h2>{title}</h2>
        <div className="guide-list">
          {items.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="card guide-card">
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <span className="guide-meta mono">{guide.readMins} min read →</span>
            </Link>
          ))}
        </div>
      </section>)}

      <section className="final-cta hero">
        <h2 className="final-h2">Stop tracking this in your head.</h2>
        <p className="landing-sub">
          RentClock turns every rule above into a countdown and emails you before
          anything lapses. £5.99/month, unlimited properties.
        </p>
        <Link href="/login?trial=1" className="btn brass">Start your free trial</Link>
      </section>

    </PublicChrome>
  );
}
