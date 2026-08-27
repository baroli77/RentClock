import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export const metadata = {
  title: "Contact",
  description: "Contact RentClock for account and support help.",
  alternates: { canonical: "/contact" },
  robots: { index: false, follow: true },
};

export default function ContactPage() {
  return (
    <PublicChrome>
      <section className="legal-page contact-page">
        <div className="eyebrow">Contact</div>
        <h1>How can we help?</h1>
        <p>For account, billing or general support, email Oliver at <a href="mailto:support@rentclock.com">support@rentclock.com</a>.</p>
        <p>To help us respond quickly, please include the email address linked to your RentClock account and a short description of the issue.</p>
        <p>For a question about personal information, please see the <Link href="/privacy">Privacy Policy</Link>.</p>
      </section>
    </PublicChrome>
  );
}
