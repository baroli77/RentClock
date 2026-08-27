const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/app areas out of the index
      // Login carries its own noindex directive. Let crawlers read that directive.
      disallow: ["/dashboard", "/seo", "/growth", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
