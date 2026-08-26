import Link from "next/link";
import { notFound } from "next/navigation";
import PublicChrome from "@/components/PublicChrome";
import DeadlineTool from "@/components/DeadlineTool";
import { TOOLS } from "@/lib/tools";
export function generateStaticParams() { return Object.keys(TOOLS).map((slug) => ({ slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const tool = TOOLS[slug]; return tool ? { title: tool.title, description: tool.description, alternates: { canonical: `/tools/${slug}` } } : {}; }
export default async function ToolPage({ params }) { const { slug } = await params; const tool = TOOLS[slug]; if (!tool) notFound(); return <PublicChrome><article className="tool-page"><p className="eyebrow"><Link href="/tools">Free tools</Link></p><h1>{tool.title}</h1><p className="marketing-lead">{tool.description}</p><DeadlineTool type={tool.type} /><section className="article-section"><h2>How to use this result</h2><p>Copy the date into your property record, then keep the supporting certificate, report or official check beside it. If the document states an earlier date, that earlier date wins.</p><p><Link href={tool.guide}>Read the related RentClock guide →</Link></p></section></article></PublicChrome>; }
