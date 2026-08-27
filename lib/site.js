export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export function socialImage(title, eyebrow = "RentClock · England") {
  const params = new URLSearchParams({ title, eyebrow });
  return `/og?${params.toString()}`;
}

export function pageMetadata({ title, description, path, type = "website", eyebrow }) {
  const image = socialImage(title, eyebrow);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, url: path, title, description, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
