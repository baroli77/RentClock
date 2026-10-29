import Link from "next/link";
import { notFound } from "next/navigation";
import PublicChrome from "@/components/PublicChrome";
import DeadlineTool from "@/components/DeadlineTool";
import { TOOLS } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import { pageMetadata, SITE } from "@/lib/site";
export function generateStaticParams() { return Object.keys(TOOLS).map((slug) => ({ slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params; const tool = TOOLS[slug];
  return tool ? pageMetadata({ title: tool.title, description: tool.description, path: `/tools/${slug}`, eyebrow: tool.year ? `${tool.year} landlord calendar · England` : "Free landlord calculator · England" }) : {};
}
export default async function ToolPage({ params }) {
  const { slug } = await params; const tool = TOOLS[slug]; if (!tool) notFound();
  const appLd = { "@context": "https://schema.org", "@type": "WebApplication", name: tool.title, applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: `${SITE}/tools/${slug}`, description: tool.description, isAccessibleForFree: true, dateModified: tool.updated };
  return <PublicChrome>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
    <article className="tool-page">
      <Breadcrumbs items={[{ label: "Free tools", href: "/tools" }, { label: tool.title, href: `/tools/${slug}` }]} />
      <p className="eyebrow">{tool.year ? "Free landlord calendar" : "Free landlord calculator"}</p>
      <h1>{tool.title}</h1><p className="marketing-lead">{tool.description}</p>
      <DeadlineTool type={tool.type} year={tool.year} />
      {tool.sections.map((section) => <section className="article-section" key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <section className="article-section"><h2>Related guidance</h2><p><Link href={tool.guide}>Read the related RentClock guide →</Link></p>{tool.type === "registration" && <p><Link href="/tools/landlord-compliance-calendar-2027">Download the 2027 registration calendar →</Link></p>}</section>
    </article>
  </PublicChrome>;
}
