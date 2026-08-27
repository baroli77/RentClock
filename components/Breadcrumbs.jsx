import Link from "next/link";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";

export default function Breadcrumbs({ items }) {
  const list = [{ label: "RentClock", href: "/" }, ...items];
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE}${item.href}`,
    })),
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {list.map((item, index) => <span key={item.href}>{index < list.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}{index < list.length - 1 && <span aria-hidden="true"> / </span>}</span>)}
    </nav>
  </>;
}
