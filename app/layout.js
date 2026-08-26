import "./globals.css";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import MarketingAttribution from "@/components/MarketingAttribution";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "RentClock — compliance deadlines for small landlords",
    template: "%s · RentClock",
  },
  description:
    "Track gas safety, EICR, EPC and Renters' Rights Act deadlines across your properties. Never miss a renewal, never risk a fine. £5.99/month, unlimited properties.",
  authors: [{ name: "RentClock" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE,
    siteName: "RentClock",
    title: "RentClock — compliance deadlines for small landlords",
    description:
      "Never miss a gas safety, EICR, EPC or Renters' Rights Act deadline again. £5.99/month, unlimited properties.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "RentClock — compliance deadlines for small landlords",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "RentClock — compliance deadlines for small landlords",
    description:
      "Never miss a gas safety, EICR, EPC or Renters' Rights Act deadline again.",
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
    <html lang="en-GB">
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
