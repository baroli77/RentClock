import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export default function FeatureLanding({ page }) {
  return <PublicChrome>
    <section className="marketing-hero">
      <div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="marketing-lead">{page.lead}</p><div className="home-v2-hero-actions"><Link href="/login" className="btn brass">Start your 14-day free trial</Link><Link href="/pricing" className="home-v2-sign-in">See pricing</Link></div><p className="home-v2-note">£5.99/month or £59.90/year · unlimited properties · cancel any time</p></div>
      <aside className="home-v2-ledger" aria-label="Example RentClock compliance ledger"><div className="home-v2-ledger-top"><span>Compliance ledger</span><span>saved</span></div><div className="home-v2-property">12 Mill Road</div><div className="home-v2-deadline"><div>Gas safety<small>Certificate attached</small></div><span>DUE SOON</span></div><div className="home-v2-deadline"><div>Electrical report<small>Next inspection recorded</small></div><span className="ok">ON TRACK</span></div><div className="home-v2-deadline"><div>EPC<small>Band and expiry recorded</small></div><span className="ok">ON TRACK</span></div></aside>
    </section>
    <section className="marketing-grid">{page.points.map(([title, copy]) => <article className="card" key={title}><h2>{title}</h2><p>{copy}</p></article>)}</section>
    <section className="marketing-proof"><div><p className="eyebrow">Built for small landlords</p><h2>Enough structure to stay ahead. None of the agent-suite clutter.</h2><p>RentClock tracks dates and evidence. It does not pretend to replace official guidance, professional advice or council licensing checks.</p></div><div className="card"><b>Continue with something useful</b><p><Link href={page.guide}>Read the related landlord guide →</Link></p>{page.tool && <p><Link href={page.tool}>Use the free deadline calculator →</Link></p>}</div></section>
    <section className="home-v2-cta"><p className="eyebrow">Set it up once</p><h2>Know what is due before it becomes expensive.</h2><p>Start with a 14-day free trial. Card required; cancel before day 14 to pay nothing.</p><Link href="/login" className="btn brass">Start free trial</Link></section>
  </PublicChrome>;
}
