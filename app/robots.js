const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/app areas out of the index
      disallow: ["/dashboard", "/api/", "/login"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
