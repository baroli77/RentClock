import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export const metadata = {
  title: "Privacy Policy",
  description: "How RentClock collects, uses and protects personal information.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="app">
      <header className="masthead">
        <Link href="/" className="brand-link" aria-label="RentClock home"><BrandLogo /></Link>
        <nav className="nav"><Link href="/guides">Guides</Link><Link href="/pricing">Pricing</Link></nav>
      </header>
      <main className="legal-page">
        <div className="eyebrow">Legal</div>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: 17 August 2026</p>
        <p>RentClock is operated by Oliver Barton. This policy explains how we handle personal information when you use RentClock.</p>

        <h2>Information we collect</h2>
        <p>We collect your email address and account information when you sign in. We also store the property, tenancy and compliance information you add, along with any documents you choose to upload. Payment card details are collected and processed by Stripe; RentClock does not store them.</p>
        <p>We also record limited first-party marketing and usage information so we can understand how people find RentClock and which campaigns lead to sign-ups or subscriptions. This can include referral or UTM campaign parameters, a pseudonymous browser-session identifier, your internal RentClock user identifier after sign-in, and subscription conversion events. We do not send your email address to our internal marketing-attribution system.</p>

        <h2>How we use your information</h2>
        <p>We use your information to provide the service, keep your account secure, send essential account and deadline-reminder emails, process subscriptions, respond to support requests, understand the effectiveness of our marketing and improve the reliability of RentClock. We do not sell your personal information.</p>

        <h2>Service providers</h2>
        <p>We use carefully selected providers to run RentClock: Supabase for authentication, database and document storage; Stripe for payments and subscription management; Resend for transactional emails; and Vercel for hosting and aggregated web analytics. Our internal MarketingMan system uses our existing hosted infrastructure to analyse pseudonymous campaign and conversion information. These providers process data only as needed to provide their services to us.</p>

        <h2>Legal basis</h2>
        <p>We process account, property and subscription information to perform our contract with you. We may also process limited information where it is necessary for our legitimate interests, such as keeping the service secure, preventing misuse, understanding the effectiveness of our marketing and improving the service.</p>

        <h2>Retention and security</h2>
        <p>We keep your information while your account is active and for as long as reasonably necessary afterwards for legitimate operational, legal or record-keeping reasons. We use access controls and reputable service providers to protect information, but no internet service can guarantee absolute security.</p>

        <h2>Your rights</h2>
        <p>Depending on where you live, you may have rights to access, correct, erase, restrict or object to the processing of your personal information, and to ask for a copy of it. To make a request, email <a href="mailto:support@rentclock.com">support@rentclock.com</a>. You may also have the right to complain to the UK Information Commissioner&rsquo;s Office.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy when the service or applicable law changes. The latest version will always be published on this page.</p>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return <footer className="foot"><p>RentClock is a deadline ledger, not legal advice.</p><nav className="foot-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>;
}
