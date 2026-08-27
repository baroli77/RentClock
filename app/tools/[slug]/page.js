import Link from "next/link";
import { notFound } from "next/navigation";
import PublicChrome from "@/components/PublicChrome";
import DeadlineTool from "@/components/DeadlineTool";
import { TOOLS } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/site";
export function generateStaticParams() { return Object.keys(TOOLS).map((slug) => ({ slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const tool = TOOLS[slug]; return tool ? pageMetadata({ ...tool, path: `/tools/${slug}`, eyebrow: "Free landlord calculator · England" }) : {}; }
export default async function ToolPage({ params }) { const { slug } = await params; const tool = TOOLS[slug]; if (!tool) notFound(); const appLd = { "@context": "https://schema.org", "@type": "WebApplication", name: tool.title, applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: `https://rentclock.com/tools/${slug}`, description: tool.description, isAccessibleForFree: true }; return <PublicChrome><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} /><article className="tool-page"><Breadcrumbs items={[{ label: "Free tools", href: "/tools" }, { label: tool.title, href: `/tools/${slug}` }]} /><p className="eyebrow">Free landlord calculator</p><h1>{tool.title}</h1><p className="marketing-lead">{tool.description}</p><DeadlineTool type={tool.type} /><section className="article-section"><h2>How to use this result</h2><p>Copy the date into your property record, then keep the supporting certificate, report or official check beside it. If the document states an earlier date, that earlier date wins.</p><p><Link href={tool.guide}>Read the related RentClock guide →</Link></p></section></article></PublicChrome>; }
