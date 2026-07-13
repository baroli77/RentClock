import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export const metadata = {
  title: "Contact",
  description: "Contact RentClock for account and support help.",
  alternates: { canonical: "/contact" },
  robots: { index: false, follow: true },
};

export default function ContactPage() {
  return (
    <div className="app">
      <header className="masthead">
        <Link href="/" className="brand-link" aria-label="RentClock home"><BrandLogo /></Link>
        <nav className="nav"><Link href="/guides">Guides</Link><Link href="/pricing">Pricing</Link></nav>
      </header>
      <main className="legal-page contact-page">
        <div className="eyebrow">Contact</div>
        <h1>How can we help?</h1>
        <p>For account, billing or general support, email Oliver at <a href="mailto:support@rentclock.com">support@rentclock.com</a>.</p>
        <p>To help us respond quickly, please include the email address linked to your RentClock account and a short description of the issue.</p>
        <p>For a question about personal information, please see the <Link href="/privacy">Privacy Policy</Link>.</p>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return <footer className="foot"><p>RentClock is a deadline ledger, not legal advice.</p><nav className="foot-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>;
}
