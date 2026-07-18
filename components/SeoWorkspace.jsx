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

function hasUnpublishedChanges(item) {
  return (
    item.status === "published" &&
    JSON.stringify(item.draft || null) !== JSON.stringify(item.published_draft || null)
  );
}

export default function SeoWorkspace({ initialOpportunities, searchConsole }) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [draftingId, setDraftingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [researching, setResearching] = useState(false);
  const [keywordIdeas, setKeywordIdeas] = useState([]);
  const [researchCost, setResearchCost] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  const stats = useMemo(
    () => ({
      total: opportunities.length,
      ready: opportunities.filter(
        (item) => item.status === "ready" || hasUnpublishedChanges(item)
      ).length,
      high: opportunities.filter((item) => item.priority >= 70).length,
    }),
    [opportunities]
  );

  async function publishGuide(item) {
    const isUpdate = item.status === "published";
    const action = isUpdate ? "Publish this update" : "Publish";
    if (!window.confirm(`${action} for "${item.draft.title}" publicly on RentClock now?`)) return;
    setPublishingId(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/seo/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not publish guide");
      setOpportunities((current) =>
        current.map((entry) => (entry.id === item.id ? payload.opportunity : entry))
      );
      setMessage(`${isUpdate ? "Guide update published" : "Guide published"}: ${payload.url}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPublishingId(null);
    }
  }

  async function importSearchConsole() {
    setImporting(true);
    setMessage("");
    try {
      const response = await fetch("/api/seo/search-console/import", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not import Google data");
      const queueResponse = await fetch("/api/seo/opportunities");
      const queuePayload = await queueResponse.json();
      if (queueResponse.ok) setOpportunities(queuePayload.opportunities || []);
      setMessage(`Imported ${payload.imported} new opportunities from ${payload.scanned} useful Google queries.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setImporting(false);
    }
  }

  async function researchGuideIdeas() {
    setResearching(true);
    setMessage("");
    try {
      const response = await fetch("/api/seo/keyword-ideas", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not research guide ideas");
      setKeywordIdeas(payload.ideas || []);
      setResearchCost(payload.cost || null);
      setMessage(`Found ${payload.ideas?.length || 0} UK landlord-related search opportunities.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setResearching(false);
    }
  }

  function useKeywordIdea(idea) {
    setForm({
      ...blank,
      title: idea.suggestedTitle,
      primaryKeyword: idea.keyword,
      searchIntent: idea.intent || "informational",
      pageType: "guide",
      priority: String(idea.priority),
      notes: `DataForSEO estimate: ${idea.searchVolume.toLocaleString("en-GB")} UK searches/month · ${idea.competition || "unknown"} paid competition · keyword difficulty ${idea.difficulty ?? "unknown"}.`,
    });
    document.querySelector(".seo-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function generateDraft(item) {
    const id = item.id;
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
      setMessage(
        item.status === "published"
          ? "AI draft created. The current public guide is unchanged until you publish the update."
          : "AI draft created and marked ready for review."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDraftingId(null);
    }
  }

  function editDraft(item) {
    setEditingId(item.id);
    setDraftText(JSON.stringify(item.draft, null, 2));
    setMessage("");
  }

  async function saveDraft(item) {
    setSavingDraft(true);
    setMessage("");
    try {
      const draft = JSON.parse(draftText);
      const response = await fetch("/api/seo/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save draft");
      setOpportunities((current) =>
        current.map((entry) => (entry.id === item.id ? payload.opportunity : entry))
      );
      setEditingId(null);
      setDraftText("");
      setMessage("Draft edits saved. Nothing public changed until you press Publish.");
    } catch (error) {
      setMessage(error instanceof SyntaxError ? "Draft JSON is not valid yet." : error.message);
    } finally {
      setSavingDraft(false);
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

      <section className="card search-console-card">
        <div>
          <p className="eyebrow">Google Search Console</p>
          <h2>{searchConsole ? "Connected — read-only" : "Connect performance data"}</h2>
          <p>{searchConsole
            ? `Using ${searchConsole.selected_property || "your selected property"}. The next step imports queries, impressions, clicks and rankings into this queue.`
            : "Connect the Google account that owns RentClock to discover real searches, pages close to page one and content gaps."}</p>
        </div>
        <div className="search-console-actions">
          {searchConsole && <span className="seo-status ready">connected</span>}
          {searchConsole && <button className="btn primary" disabled={importing} onClick={importSearchConsole}>
            {importing ? "Importing…" : "Import Google queries"}
          </button>}
          <a className={"btn " + (searchConsole ? "ghost" : "primary")} href="/api/seo/search-console/connect">
            {searchConsole ? "Reconnect Google" : "Connect Google"}
          </a>
        </div>
      </section>

      <section className="card keyword-research-card">
        <div>
          <p className="eyebrow">Keyword research · United Kingdom</p>
          <h2>Find guides people are already searching for</h2>
          <p>Checks live Google keyword data for relevant landlord-compliance queries, then ranks useful topics by demand and difficulty. It does not publish anything or spend money until you press the button.</p>
        </div>
        <div className="keyword-research-actions">
          <button className="btn brass" disabled={researching} onClick={researchGuideIdeas}>
            {researching ? "Researching…" : "Research UK guide ideas"}
          </button>
          <span>Typical request cost: a few pence</span>
        </div>
        {keywordIdeas.length > 0 && (
          <div className="keyword-ideas">
            <div className="keyword-ideas-head"><b>Best opportunities</b><span>{researchCost ? `DataForSEO reported ${Number(researchCost).toFixed(3)} for this refresh` : "Live Google keyword data"}</span></div>
            {keywordIdeas.map((idea) => (
              <article className="keyword-idea" key={idea.keyword}>
                <div>
                  <b>{idea.keyword}</b>
                  <span>{idea.searchVolume.toLocaleString("en-GB")} UK searches/month · {idea.intent || "informational"} · {idea.competition || "unknown"} competition · difficulty {idea.difficulty ?? "—"}</span>
                </div>
                <button className="btn ghost sm" onClick={() => useKeywordIdea(idea)}>Use in queue</button>
              </article>
            ))}
          </div>
        )}
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
          <label>Existing page or competitor URL <span className="muted">(optional — visible page text is analysed for gaps)</span><input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://" /></label>
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
            <li><b>Measure the win</b><span>Track impressions, clicks and rankings by page in Search Console.</span></li>
          </ol>
          <div className="seo-notice"><b>AI drafting is enabled.</b><br />Each draft sends only that opportunity’s brief and, if supplied, visible public reference-page text to OpenAI. It never reads customer property or certificate data.</div>
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
                  {hasUnpublishedChanges(item) && <div className="seo-status ready">update ready</div>}
                  <button className="btn ghost sm" disabled={draftingId === item.id} onClick={() => generateDraft(item)}>
                    {draftingId === item.id ? "Drafting…" : item.draft ? "Redraft with AI" : "Create AI draft"}
                  </button>
                  {item.draft && (
                    <button className="btn ghost sm" onClick={() => editDraft(item)}>
                      Edit draft
                    </button>
                  )}
                  {item.draft && (item.status !== "published" || hasUnpublishedChanges(item)) && (
                    <button className="btn brass sm" disabled={publishingId === item.id} onClick={() => publishGuide(item)}>
                      {publishingId === item.id
                        ? "Publishing…"
                        : item.status === "published"
                          ? "Publish update"
                          : "Publish guide"}
                    </button>
                  )}
                  {item.status === "published" && (item.published_draft || item.draft) && (
                    <a
                      className="btn ghost sm"
                      href={`/guides/${(item.published_draft || item.draft).slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View live guide
                    </a>
                  )}
                </div>
                {item.draft && (
                  <div className="seo-draft-preview">
                    {editingId === item.id && (
                      <div className="seo-draft-editor">
                        <label>
                          <span className="lbl">Draft JSON</span>
                          <textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} />
                        </label>
                        <div className="form-actions">
                          <button className="btn primary sm" disabled={savingDraft} onClick={() => saveDraft(item)}>
                            {savingDraft ? "Saving…" : "Save draft edits"}
                          </button>
                          <button className="btn ghost sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <b>{item.draft.title}</b>
                    <p>{item.draft.metaDescription}</p>
                    <span>{item.draft.sections?.length || 0} sections · {item.draft.faqs?.length || 0} FAQs · verify listed sources before publishing</span>
                    <details className="seo-draft-details">
                      <summary>Review full draft before publishing</summary>
                      <p className="seo-draft-intro">{item.draft.intro}</p>
                      {(item.draft.sections || []).map((section, index) => (
                        <section key={index}>
                          <h4>{section.heading}</h4>
                          {(section.paragraphs || section.points || []).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                        </section>
                      ))}
                      {(item.draft.faqs || []).length > 0 && <section>
                        <h4>FAQs</h4>
                        {item.draft.faqs.map((faq, index) => <p key={index}><b>{faq.question}</b><br />{faq.answer}</p>)}
                      </section>}
                      <section className="seo-source-list">
                        <h4>Sources to verify</h4>
                        <ul>{(item.draft.sourcesToVerify || []).map((source, index) => <li key={index}>{source}</li>)}</ul>
                      </section>
                    </details>
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
