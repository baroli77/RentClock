import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";
import { TOOLS } from "@/lib/tools";
export const metadata = { title: "Free Landlord Compliance Calculators", description: "Free gas safety, EICR, deposit and Right to Rent deadline calculators for landlords in England.", alternates: { canonical: "/tools" } };
export default function ToolsPage() { return <PublicChrome><section className="guide-head"><p className="eyebrow">Free landlord tools</p><h1 className="landing-h1 dark">Turn the rule into a date.</h1><p className="guide-lede">Simple planning calculators for common England landlord deadlines. No account needed. Always verify the result against the official guidance and source document.</p></section><div className="tool-grid">{Object.entries(TOOLS).map(([slug, tool]) => <Link className="card tool-card" href={`/tools/${slug}`} key={slug}><h2>{tool.title}</h2><p>{tool.description}</p><span>Use free tool →</span></Link>)}</div></PublicChrome>; }
