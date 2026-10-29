import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({ title: "About RentClock and Our Editorial Policy", description: "Meet Oliver Barton, the operator behind RentClock, and see how its England landlord guides, calculators and corrections are handled.", path: "/about", eyebrow: "About RentClock · England" });
export default function AboutPage() {
  return <PublicChrome><article className="legal-page">
    <p className="eyebrow">About RentClock</p><h1>A practical tool, with a person behind it.</h1>
    <p className="legal-updated">Last reviewed: 29 October 2026</p>
    <h2>Who runs RentClock?</h2>
    <p>RentClock is operated by Oliver Barton in the UK. Oliver is the named contact for account questions, support and corrections at <a href="mailto:support@rentclock.com">support@rentclock.com</a>.</p>
    <h2>Why RentClock exists</h2>
    <p>The problem RentClock is built to solve is straightforward: a landlord can have the right certificate and still lose track of its next deadline. RentClock puts core England compliance dates, property records and supporting documents in one ledger, with email reminders for tracked dates.</p>
    <p>It is designed for small landlords who want help organising those records. It is not a law firm, property manager or substitute for property-specific advice. The <Link href="/tools">public calculators and calendars</Link> are free to use without an account.</p>
    <h2>How guides are produced and reviewed</h2>
    <p>Guides start with a practical landlord question and are checked against primary sources such as GOV.UK, legislation and the Health and Safety Executive. Each guide identifies the official sources and carries a reviewed date. Oliver Barton is the named operator reviewing the published information; that byline does not imply a legal qualification or independent legal review.</p>
    <p>We distinguish rules in force from announced policy and future implementation stages. Calculators explain their inputs and counting rules, with worked examples. A calendar result does not decide whether a duty applies to your tenancy or certify compliance.</p>
    <h2>Updates and corrections</h2>
    <p>Material reviews update the article date, its structured data and sitemap date together. Existing links are kept where possible so earlier bookmarks continue to work. Downloaded calendars are snapshots and do not receive later corrections automatically.</p>
    <p>If you spot a problem, email the page address and relevant official source to <a href="mailto:support@rentclock.com">support@rentclock.com</a>. Check the source guidance yourself before taking action on a dispute, possession notice or other case-specific legal matter.</p>
    <h2>Property records and privacy</h2>
    <p>Customer records and uploaded documents are private to the account. Subscription cancellation and data deletion are different requests: the <Link href="/privacy">privacy policy</Link> explains retention, deletion requests and service providers.</p>
  </article></PublicChrome>;
}
