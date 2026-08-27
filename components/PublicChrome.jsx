import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export default function PublicChrome({ children }) {
  return <div className="app public-site">
    <PublicHeader />
    <main>{children}</main>
    <footer className="foot public-foot">
      <p>RentClock is a deadline ledger, not legal advice. Made in the UK.</p>
      <nav className="foot-links" aria-label="Footer">
        <Link href="/landlord-compliance-software">Software</Link><Link href="/gas-safety-certificate-reminders">Gas reminders</Link><Link href="/eicr-reminders">EICR reminders</Link><Link href="/landlord-document-storage">Document storage</Link><Link href="/about">About</Link><Link href="/tools">Tools</Link><Link href="/guides">Guides</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link>
      </nav>
    </footer>
  </div>;
}
