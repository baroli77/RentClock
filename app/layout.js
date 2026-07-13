import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "RentClock — compliance deadlines for small landlords",
    template: "%s · RentClock",
  },
  description:
    "Track gas safety, EICR, EPC and Renters' Rights Act deadlines across your properties. Never miss a renewal, never risk a fine. £5.99/month, unlimited properties.",
  keywords: [
    "landlord compliance",
    "gas safety certificate reminder",
    "EICR renewal",
    "EPC landlord",
    "Renters Rights Act",
    "landlord software UK",
    "compliance deadline tracker",
  ],
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
  },
  twitter: {
    card: "summary_large_image",
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
  return (
    <html lang="en-GB">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
