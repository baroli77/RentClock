import "./globals.css";
import "./guide-extras.css";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import MarketingAttribution from "@/components/MarketingAttribution";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "RentClock — compliance deadlines for small landlords",
    template: "%s · RentClock",
  },
  description:
    "Track gas safety, EICR, EPC and Renters' Rights Act deadlines across your properties. Never miss a renewal, never risk a fine. £5.99/month, unlimited properties.",
  authors: [{ name: "RentClock" }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "RentClock",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  const organisationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RentClock",
    url: SITE,
    logo: `${SITE}/opengraph-image`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RentClock",
    url: SITE,
  };
  return (
    <html lang="en-GB" className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
        {children}
        <Suspense fallback={null}>
          <MarketingAttribution />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
