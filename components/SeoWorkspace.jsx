"use client";

import { useMemo, useState } from "react";

const blank = {
  title: "",
  primaryKeyword: "",
  searchIntent: "informational",
  pageType: "guide",
  priority: "60",
  sourceUrl: "",
  notes: "",
};

export default function SeoWorkspace({ initialOpportunities }) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [draftingId, setDraftingId] = useState(null);
  const [message, setMessage] = useState("");

  const stats = useMemo(
    () => ({
      total: opportunities.length,
      ready: opportunities.filter((item) => item.status === "ready").length,
      high: opportunities.filter((item) => item.priority >= 70).length,
    }),
    [opportunities]
  );

  async function generateDraft(id) {
    setDraftingId(id);
    setMessage("");
    try {
      const response = await fetch("/api/seo/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not generate draft");
      setOpportunities((current) =>
        current.map((item) => (item.id === id ? payload.opportunity : item))
      );
      setMessage("AI draft created and marked ready for review.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDraftingId(null);
    }
  }

  async function addOpportunity(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/seo/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save opportunity");
      setOpportunities((current) => [payload.opportunity, ...current]);
      setForm(blank);
      setMessage("Opportunity added to the content queue.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app seo-app">
      <header className="masthead">
        <a className="brand-link" href="/dashboard">⌑ <b>RentClock</b></a>
        <nav className="nav"><a href="/dashboard">Compliance ledger</a><a href="/seo">SEO workspace</a></nav>
      </header>

      <section className="seo-hero">
        <p className="eyebrow light">Owner workspace</p>
        <h1>Make the useful pages Google is already asking for.</h1>
        <p>Queue an opportunity, set its search intent and priority, then turn it into a fact-checked draft before publishing. No keyword-stuffed landfill.</p>
        <div className="seo-stats">
          <span><b>{stats.total}</b> opportunities</span>
          <span><b>{stats.high}</b> high-priority</span>
          <span><b>{stats.ready}</b> ready to review</span>
        </div>
      </section>

      <section className="seo-grid">
        <form className="card seo-form" onSubmit={addOpportunity}>
          <div>
            <p className="eyebrow">Content opportunity</p>
            <h2>Add a guide, checklist, tool or page update</h2>
          </div>
          <label>Working title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Complete landlord compliance checklist" /></label>
          <label>Primary Google search<input required value={form.primaryKeyword} onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })} placeholder="landlord compliance checklist" /></label>
          <div className="seo-field-row">
            <label>Intent<select value={form.searchIntent} onChange={(e) => setForm({ ...form, searchIntent: e.target.value })}><option value="informational">Informational</option><option value="commercial">Commercial</option><option value="transactional">Transactional</option></select></label>
            <label>Format<select value={form.pageType} onChange={(e) => setForm({ ...form, pageType: e.target.value })}><option value="guide">Guide</option><option value="checklist">Checklist</option><option value="tool">Free tool</option><option value="landing-page">Landing page</option><option value="update">Improve existing page</option></select></label>
            <label>Priority<input min="1" max="100" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></label>
          </div>
          <label>Existing page or competitor URL <span className="muted">(optional)</span><input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://" /></label>
          <label>What should the draft cover? <span className="muted">(optional)</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Include a moving-in checklist, renewal dates and links to relevant RentClock features." /></label>
          <button className="btn primary" disabled={saving}>{saving ? "Adding…" : "Add to content queue"}</button>
          {message && <p className="seo-message">{message}</p>}
        </form>

        <aside className="card seo-roadmap">
          <p className="eyebrow">What this will do</p>
          <ol>
            <li><b>Search Console import</b><span>Prioritise queries already close to page one.</span></li>
            <li><b>AI content drafts</b><span>Produce titles, outlines, FAQs, internal links and source checks.</span></li>
            <li><b>Review then publish</b><span>Keep legal claims and facts under human control before they go live.</span></li>
            <li><b>Measure the win</b><span>Track impressions, clicks, rankings and sign-ups by page.</span></li>
          </ol>
          <div className="seo-notice"><b>AI drafting is enabled.</b><br />Each draft sends only that opportunity’s title, keyword, URL and editorial notes to OpenAI. It never reads customer property or certificate data.</div>
        </aside>
      </section>

      <section className="seo-queue">
        <div className="seo-section-head"><div><p className="eyebrow">Content queue</p><h2>Prioritised opportunities</h2></div><span>{opportunities.length} total</span></div>
        {opportunities.length === 0 ? (
          <div className="card seo-empty">Start with the useful guides: landlord compliance checklist, EICR, gas safety, EPC, deposits, Right to Rent and Renters’ Rights Act preparation.</div>
        ) : (
          <div className="seo-list">
            {opportunities.map((item) => (
              <article className="card seo-item" key={item.id}>
                <div className="seo-priority">P{item.priority}</div>
                <div className="seo-item-main">
                  <h3>{item.title}</h3>
                  <p><code>{item.primary_keyword}</code> · {item.search_intent} · {item.page_type}</p>
                  {item.notes && <p className="seo-notes">{item.notes}</p>}
                </div>
                <div className="seo-item-actions">
                  <div className={"seo-status " + item.status}>{item.status}</div>
                  <button className="btn ghost sm" disabled={draftingId === item.id} onClick={() => generateDraft(item.id)}>
                    {draftingId === item.id ? "Drafting…" : item.draft ? "Redraft with AI" : "Create AI draft"}
                  </button>
                </div>
                {item.draft && (
                  <div className="seo-draft-preview">
                    <b>{item.draft.title}</b>
                    <p>{item.draft.metaDescription}</p>
                    <span>{item.draft.sections?.length || 0} sections · {item.draft.faqs?.length || 0} FAQs · check sources before publishing</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
