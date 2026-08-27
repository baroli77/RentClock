import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export default function NotFound() {
  return <PublicChrome><section className="legal-page"><p className="eyebrow">404</p><h1>That page does not exist.</h1><p>It may have moved, been retired, or never existed in the first place. Websites do enjoy a bit of theatre.</p><p><Link className="btn brass" href="/">Return to RentClock</Link></p></section></PublicChrome>;
}
