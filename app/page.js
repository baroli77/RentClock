import Link from "next/link";

export default function Landing() {
  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> RentClock
        </div>
        <nav className="nav">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login" className="btn primary sm">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="hero landing-hero">
        <div className="eyebrow light">For landlords with 1–10 properties · England</div>
        <h1 className="landing-h1">
          One missed certificate
          <br />
          can cost you £7,000.
        </h1>
        <p className="landing-sub">
          Gas safety. EICR. EPC. Deposit rules. And now the Renters&rsquo; Rights Act, rolling out
          in phases with new obligations and civil penalties attached. RentClock tracks every
          deadline across every property and emails you before anything lapses — so compliance
          stops living in your head.
        </p>
        <Link href="/login" className="btn brass">
          Start your 14-day free trial
        </Link>
        <div className="landing-note mono">£4.99/month or £49/year · unlimited properties · cancel anytime</div>
      </section>

      <section className="mockwrap">
        <div className="eyebrow">What your ledger looks like</div>
        <div className="card mock-card" aria-hidden="true">
          <div className="mock-title">12 Mill Road</div>
          <div className="ledger tight">
            <div className="row slim">
              <div className="row-label">
                Gas Safety Certificate (CP12)
                <span className="row-prop">Renew by 4 Jun 2026</span>
              </div>
              <div className="row-due mono">4 Jun 2026</div>
              <div className="row-status">
                <span className="days mono neg">37d over</span>
                <span className="stamp st-overdue tilted">OVERDUE</span>
              </div>
            </div>
            <div className="row slim">
              <div className="row-label">
                Electrical Safety Report (EICR)
                <span className="row-prop">Renew by 22 Aug 2026</span>
              </div>
              <div className="row-due mono">22 Aug 2026</div>
              <div className="row-status">
                <span className="days mono">42d</span>
                <span className="stamp st-soon">DUE SOON</span>
              </div>
            </div>
            <div className="row slim">
              <div className="row-label">
                Energy Performance Certificate (EPC)
                <span className="row-prop">Band C · valid to 2033</span>
              </div>
              <div className="row-due mono">14 Mar 2033</div>
              <div className="row-status">
                <span className="stamp st-ok">COMPLIANT</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mock-caption">
          Every property gets its full statutory checklist, a countdown on every renewal, and the
          actual certificates attached — out of your inbox, ready when the council or your lender
          asks.
        </p>
      </section>

      <section className="stakes">
        <div className="eyebrow">What non-compliance actually costs</div>
        <div className="stakes-grid">
          <div className="card stake">
            <div className="stake-num mono">£7,000</div>
            <p>
              Civil penalty for missing Renters&rsquo; Rights Act duties like the tenant
              information sheet — one of several new obligations phasing in through 2028.
            </p>
          </div>
          <div className="card stake">
            <div className="stake-num mono">£30,000</div>
            <p>
              Maximum council penalty for electrical safety breaches — a lapsed EICR is exactly
              that.
            </p>
          </div>
          <div className="card stake">
            <div className="stake-num mono">1–3×</div>
            <p>
              The deposit, awarded to your tenant, if it isn&rsquo;t protected within 30 days —
              plus real trouble regaining possession later.
            </p>
          </div>
        </div>
      </section>

      <section className="how">
        <div className="eyebrow">How it works</div>
        <ol className="how-list">
          <li>
            <b>Add your properties.</b> RentClock builds each one&rsquo;s legal checklist
            automatically — no setup, no spreadsheet.
          </li>
          <li>
            <b>Enter the last date each check was done.</b> Attach the certificate while
            you&rsquo;re at it.
          </li>
          <li>
            <b>Get emailed before anything lapses.</b> Reminders at 60, 30, 14 and 7 days, on the
            day, and when something goes overdue. Plus a weekly note about anything you
            haven&rsquo;t recorded yet.
          </li>
        </ol>
      </section>

      <section className="features">
        <div className="card feature">
          <div className="eyebrow">Built for the rules</div>
          <h3>Knows the details spreadsheets miss</h3>
          <p>
            Like the gas certificate rule where renewing in the final two months preserves your
            original expiry date, or which Renters&rsquo; Rights Act duties apply to pre-2026
            tenancies versus new ones.
          </p>
        </div>
        <div className="card feature">
          <div className="eyebrow">Renters&rsquo; Rights Act</div>
          <h3>Kept current as the law rolls out</h3>
          <p>
            Database registration, ombudsman membership and more land in stages through 2028.
            Each new duty appears in your ledger when it goes live — with its deadline.
          </p>
        </div>
        <div className="card feature">
          <div className="eyebrow">Documents</div>
          <h3>Certificates out of the inbox</h3>
          <p>
            Attach the actual gas cert, EICR and EPC to each item. When someone asks for proof,
            it&rsquo;s one click — not an inbox excavation.
          </p>
        </div>
        <div className="card feature">
          <div className="eyebrow">Deliberately simple</div>
          <h3>Not another accounting suite</h3>
          <p>
            No rent ledgers, no bookkeeping, no tax modules you&rsquo;ll never open. RentClock does
            one job — you never miss a compliance deadline — and does it properly.
          </p>
        </div>
      </section>

      <section className="compare">
        <div className="eyebrow">Where RentClock fits</div>
        <div className="compare-rows">
          <div className="card compare-row">
            <b>Your spreadsheet</b>
            <p>Free, and it never emails you. It just sits there while the deadline passes.</p>
          </div>
          <div className="card compare-row">
            <b>Full property-management suites</b>
            <p>
              Powerful, priced per tenancy, and built for agents. You&rsquo;ll pay for accounting
              features to get the one reminder you needed.
            </p>
          </div>
          <div className="card compare-row highlight">
            <b>RentClock — £4.99/month, unlimited properties</b>
            <p>
              Just the deadlines, the documents, and the reminders. Tax deductible as a business
              expense, like the rest of your letting costs.
            </p>
          </div>
        </div>
      </section>

      <section className="faq">
        <div className="eyebrow">Fair questions</div>
        <div className="faq-item">
          <b>Is this legal advice?</b>
          <p>
            No — it&rsquo;s a deadline ledger. RentClock tells you what&rsquo;s due and when, based
            on England&rsquo;s private rented sector rules. For disputes or edge cases, speak to a
            professional.
          </p>
        </div>
        <div className="faq-item">
          <b>Can other users see my properties?</b>
          <p>
            No. Your data is isolated per account at the database level, and documents are stored
            privately — only you can access your files.
          </p>
        </div>
        <div className="faq-item">
          <b>What if I cancel?</b>
          <p>
            Cancel in two clicks from the billing page, keep access until your period ends. Your
            ledger stays intact if you come back.
          </p>
        </div>
        <div className="faq-item">
          <b>Scotland, Wales, Northern Ireland?</b>
          <p>
            RentClock currently covers England only — the rules differ enough elsewhere that
            pretending otherwise would be a disservice. Other nations are on the roadmap.
          </p>
        </div>
      </section>

      <section className="final-cta hero">
        <h2 className="final-h2">The fine costs more than a decade of RentClock.</h2>
        <p className="landing-sub">
          Set it up in ten minutes. First reminder could save you four figures.
        </p>
        <Link href="/login" className="btn brass">
          Start your free trial
        </Link>
      </section>

      <footer className="foot">
        <p>RentClock is a deadline ledger, not legal advice. Made in the UK.</p>
      </footer>
    </div>
  );
}
