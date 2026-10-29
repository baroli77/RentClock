import PublicChrome from "@/components/PublicChrome";

export const metadata = {
  title: "Privacy Policy",
  description: "How RentClock collects, uses and protects personal information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <PublicChrome>
      <section className="legal-page">
        <div className="eyebrow">Legal</div>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: 29 October 2026</p>
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

        <h2>Retention, cancellation and deletion</h2>
        <p>We retain your account, property ledger and uploaded documents while your account remains open. Cancelling a subscription stops future renewal charges; it does not close your account or erase your records. Records are retained after cancellation so you can return to the same ledger. There is currently no automatic deletion date triggered by cancellation.</p>
        <p>To close your account or request erasure, email <a href="mailto:support@rentclock.com">support@rentclock.com</a> from the address linked to your account. Say whether you want account closure, deletion of particular records or a copy of your information. You do not need an active paid subscription to make a privacy request. We may need to confirm your identity before releasing or deleting personal information.</p>
        <p>Retention depends on the purpose: open-account records support the ledger and account recovery; payment records support accounting and tax obligations; support correspondence is kept while resolving the request and any related dispute; security records are retained where needed to investigate misuse. If information must be retained after an erasure request, we will explain the reason and applicable retention criteria. Deletion is handled through support rather than an automatic cancellation process.</p>
        <p>Use the available document controls to remove individual uploads while you have editing access, or contact support for help. Removing a property record and deleting an uploaded file are separate actions. Do not assume that removing a property automatically removes every file previously attached to it.</p>
        <p>We use account access controls and private document storage. No internet service can guarantee absolute security. Avoid uploading information that is unnecessary for managing the property record.</p>

        <h2>International processing</h2>
        <p>Our providers may process information outside the UK, including in the United States and in other countries listed in their subprocessor information. A UK website or European database location does not mean every supporting operation takes place in the UK.</p>
        <p>Transfer arrangements depend on the provider and applicable terms. Provider data-processing terms include contractual protections for international transfers, including Standard Contractual Clauses with UK-specific provisions where applicable. You can review the published terms for <a href="https://supabase.com/legal/dpa">Supabase</a>, <a href="https://stripe.com/legal/dpa">Stripe</a>, <a href="https://resend.com/legal/dpa">Resend</a> and <a href="https://vercel.com/legal/dpa">Vercel</a>. Contact support to ask about the locations and safeguards relevant to your information or to request a copy of the applicable safeguards.</p>

        <h2>Your rights</h2>
        <p>Depending on where you live, you may have rights to access, correct, erase, restrict or object to the processing of your personal information, and to ask for a copy of it. To make a request, email <a href="mailto:support@rentclock.com">support@rentclock.com</a>. You can complain to the <a href="https://ico.org.uk/make-a-complaint/">UK Information Commissioner&rsquo;s Office</a>.</p>

        <h2>Your right to object</h2>
        <p>You can object to processing based on legitimate interests, including our marketing-attribution analysis. Email support with your objection so we can assess it and explain the outcome. Essential processing needed to provide the service or meet legal obligations may still be required.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy when the service or applicable law changes. The latest version will always be published on this page.</p>
      </section>
    </PublicChrome>
  );
}
