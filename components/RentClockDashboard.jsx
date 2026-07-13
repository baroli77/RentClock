"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  RECURRING,
  ONEOFFS,
  EPC_BANDS,
  DAY,
  today,
  parseISO,
  toISO,
  fmt,
  recurringStatus,
  oneoffStatus,
  STATUS_META,
} from "@/lib/compliance";

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function Stamp({ code, tilt }) {
  const meta = STATUS_META[code];
  return (
    <span className={`stamp ${meta.cls} ${code === "overdue" && tilt ? "tilted" : ""}`}>
      {meta.label}
    </span>
  );
}

function DaysChip({ days }) {
  if (days === null || days === undefined) return <span className="days mono">—</span>;
  if (days < 0) return <span className="days mono neg">{Math.abs(days)}d over</span>;
  if (days === 0) return <span className="days mono neg">today</span>;
  return <span className="days mono">{days}d</span>;
}

function FixLink({ item, code }) {
  if (!item.fixUrl) return null;
  if (!["overdue", "soon", "missing"].includes(code)) return null;
  return (
    <a className="fixlink" href={item.fixUrl} target="_blank" rel="noreferrer">
      {item.fixLabel} ↗
    </a>
  );
}

function DocList({ prop, itemKey, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const docs = (prop.docs || []).filter((d) => d.itemKey === itemKey);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/docs", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      const meta = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        itemKey,
        name: json.name,
        size: json.size,
        path: json.path,
        added: toISO(today()),
      };
      onUpdate({ ...prop, docs: [...(prop.docs || []), meta] });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const download = async (doc) => {
    setError("");
    try {
      const res = await fetch(`/api/docs?path=${encodeURIComponent(doc.path)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not fetch document");
      window.open(json.url, "_blank", "noreferrer");
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (doc) => {
    setError("");
    try {
      await fetch(`/api/docs?path=${encodeURIComponent(doc.path)}`, { method: "DELETE" });
    } catch {
      // best effort; still remove from ledger
    }
    onUpdate({ ...prop, docs: (prop.docs || []).filter((d) => d.id !== doc.id) });
  };

  return (
    <div className="docs">
      {docs.map((d) => (
        <span className="doc-chip" key={d.id}>
          <button className="doc-name mono" onClick={() => download(d)} title="Download">
            📎 {d.name}
          </button>
          <button className="doc-x" onClick={() => remove(d)} title="Delete">
            ×
          </button>
        </span>
      ))}
      <label className={`doc-add mono ${busy ? "busy" : ""}`}>
        {busy ? "Saving…" : "+ attach"}
        <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={upload} disabled={busy} hidden />
      </label>
      {error && <span className="doc-err">{error}</span>}
    </div>
  );
}

function AddPropertyForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [tenancyStart, setTenancyStart] = useState("");

  const submit = () => {
    if (!name.trim() && !address.trim()) return;
    onAdd({
      id: `tmp-${Date.now().toString(36)}`,
      name: name.trim() || address.trim(),
      address: address.trim(),
      tenancyStart,
      dates: {},
      checks: {},
      anchors: {},
      docs: [],
      epcBand: "",
    });
  };

  return (
    <div className="card form-card">
      <div className="eyebrow">New property</div>
      <div className="form-grid">
        <label>
          <span className="lbl">Nickname</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flat 2, Mill Road" />
        </label>
        <label>
          <span className="lbl">Address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
        </label>
        <label>
          <span className="lbl">Current tenancy start</span>
          <input type="date" value={tenancyStart} onChange={(e) => setTenancyStart(e.target.value)} />
        </label>
      </div>
      <div className="form-actions">
        <button className="btn primary" onClick={submit}>Add property</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function NewTenancyForm({ onConfirm, onCancel }) {
  const [start, setStart] = useState(toISO(today()));
  return (
    <div className="newtenancy">
      <span className="lbl">New tenancy start date</span>
      <div className="nt-row">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <button className="btn primary sm" onClick={() => onConfirm(start)}>Confirm</button>
        <button className="btn ghost sm" onClick={onCancel}>Cancel</button>
      </div>
      <div className="nt-note">
        Resets deposit protection, Right to Rent, ‘How to Rent’, alarm and written-statement tasks for the new tenants.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property card
// ---------------------------------------------------------------------------

function PropertyCard({ prop, onUpdate, onRemove }) {
  const open = true;
  const [newTenancy, setNewTenancy] = useState(false);

  const setDate = (key, value) => {
    let anchors = { ...(prop.anchors || {}) };
    if (key === "gas") {
      const prevStatus = recurringStatus(prop, RECURRING[0]);
      const nd = parseISO(value);
      // Ignore partial keyboard input (e.g. year "0002" mid-typing) so
      // anchors are never computed against half-entered dates.
      const ndValid = nd && nd.getFullYear() >= 1900;
      if (prevStatus.due && ndValid) {
        const gap = Math.round((prevStatus.due.getTime() - nd.getTime()) / DAY);
        if (gap >= 0 && gap <= 61) {
          anchors.gas = toISO(prevStatus.due);
        } else {
          delete anchors.gas;
        }
      } else {
        delete anchors.gas;
      }
    }
    onUpdate({ ...prop, dates: { ...prop.dates, [key]: value }, anchors });
  };

  const toggleCheck = (key) => {
    onUpdate({ ...prop, checks: { ...prop.checks, [key]: !prop.checks?.[key] } });
  };

  const startNewTenancy = (startISO) => {
    const checks = { ...(prop.checks || {}) };
    for (const item of ONEOFFS) {
      if (item.perTenancy) checks[item.key] = false;
    }
    onUpdate({ ...prop, tenancyStart: startISO, checks });
    setNewTenancy(false);
  };

  const statuses = RECURRING.map((item) => ({ item, st: recurringStatus(prop, item) }));
  const bandBad = prop.epcBand === "F" || prop.epcBand === "G";
  const overdueCount =
    statuses.filter((s) => s.st.code === "overdue").length +
    ONEOFFS.filter((i) => oneoffStatus(i, prop.checks?.[i.key], prop.tenancyStart).code === "overdue").length +
    (bandBad ? 1 : 0);

  return (
    <section className="card prop-card">
      <header className="prop-head static">
        <div>
          <h3 className="prop-name">{prop.name}</h3>
          {prop.address && prop.address !== prop.name && <div className="prop-addr">{prop.address}</div>}
        </div>
        <div className="prop-head-right">
          {overdueCount > 0 && <span className="alert-pill">{overdueCount} overdue</span>}
        </div>
      </header>

      {open && (
        <div className="prop-body">
          <div className="tenancy-row">
            <div>
              <span className="lbl">Tenancy start</span>
              <input
                type="date"
                value={prop.tenancyStart || ""}
                onChange={(e) => onUpdate({ ...prop, tenancyStart: e.target.value })}
              />
            </div>
            {!newTenancy && (
              <button className="btn ghost sm" onClick={() => setNewTenancy(true)}>
                New tenancy started
              </button>
            )}
          </div>
          {newTenancy && (
            <NewTenancyForm onConfirm={startNewTenancy} onCancel={() => setNewTenancy(false)} />
          )}

          <div className="eyebrow">Recurring certificates</div>
          <div className="ledger">
            {statuses.map(({ item, st }) => (
              <div className="row" key={item.key}>
                <div className="row-main">
                  <div className="row-label">
                    {item.label}
                    {item.recommended && <span className="tag">good practice</span>}
                  </div>
                  <div className="row-note">{item.note}</div>
                  {item.key === "gas" && st.anchored && (
                    <div className="row-note anchored">Original expiry preserved — renewed within the final 2 months.</div>
                  )}
                  {item.hasBand && (
                    <div className="band-row">
                      <span className="lbl inline">Band</span>
                      <select
                        value={prop.epcBand || ""}
                        onChange={(e) => onUpdate({ ...prop, epcBand: e.target.value })}
                      >
                        <option value="">—</option>
                        {EPC_BANDS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {bandBad && <span className="band-warn">Below band E — cannot legally be let</span>}
                    </div>
                  )}
                  <FixLink item={item} code={st.code} />
                  <DocList prop={prop} itemKey={item.key} onUpdate={onUpdate} />
                </div>
                <div className="row-date">
                  <span className="lbl">Last done</span>
                  <input
                    type="date"
                    value={prop.dates?.[item.key] || ""}
                    onChange={(e) => setDate(item.key, e.target.value)}
                  />
                  {item.key === "eicr" && (
                    <label className="date-override">
                      <span className="lbl">Earlier due date (if stated)</span>
                      <input
                        type="date"
                        value={prop.dates?.eicrNextDue || ""}
                        onChange={(e) => setDate("eicrNextDue", e.target.value)}
                      />
                    </label>
                  )}
                </div>
                <div className="row-due mono">
                  <span className="lbl">Next due</span>
                  {fmt(st.due)}
                </div>
                <div className="row-status">
                  <DaysChip days={st.days} />
                  <Stamp code={st.code} tilt />
                </div>
              </div>
            ))}
          </div>

          <div className="eyebrow">Tenancy & Renters’ Rights Act tasks</div>
          <div className="ledger">
            {ONEOFFS.map((item) => {
              const done = !!prop.checks?.[item.key];
              const st = oneoffStatus(item, done, prop.tenancyStart);
              return (
                <div className="row oneoff" key={item.key}>
                  <div className="row-main">
                    <label className="check-wrap">
                      <input
                        type="checkbox"
                        checked={done}
                        disabled={(item.pending && !done) || st.code === "na"}
                        onChange={() => toggleCheck(item.key)}
                      />
                      <div>
                        <div className="row-label">{item.label}</div>
                        <div className="row-note">{item.note}</div>
                        {st.code === "na" && (
                          <div className="row-note">Tenancy started on or after 1 May 2026 — the written statement applies instead.</div>
                        )}
                      </div>
                    </label>
                    <DocList prop={prop} itemKey={item.key} onUpdate={onUpdate} />
                  </div>
                  <div className="row-due mono">
                    {st.due && st.code !== "na" && (
                      <>
                        <span className="lbl">Deadline</span>
                        {fmt(st.due)}
                      </>
                    )}
                  </div>
                  <div className="row-status">
                    <Stamp code={st.code} tilt />
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn danger-ghost" onClick={() => onRemove(prop.id)}>
            Remove property
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function RentClockDashboard({ initialProperties, email, access, billingOn }) {
  const router = useRouter();
  const [props, setProps] = useState(initialProperties || []);
  const [view, setView] = useState("overview"); // "overview" | "add" | property id
  const [saveState, setSaveState] = useState("saved"); // saved | saving | error
  const [checkoutState, setCheckoutState] = useState("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [upgradeState, setUpgradeState] = useState("idle");
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const timerRef = useRef(null);
  const latestRef = useRef(props);
  const viewRef = useRef(view);
  viewRef.current = view;

  const sync = useCallback(async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: latestRef.current }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      // Adopt canonical ids for newly created rows. If the selected property
      // had a temporary id, re-select it by name (server assigns real uuids).
      const selected = latestRef.current.find((p) => p.id === viewRef.current);
      latestRef.current = json.properties;
      setProps(json.properties);
      if (selected && !json.properties.some((p) => p.id === viewRef.current)) {
        const match =
          json.properties.find((p) => p.name === selected.name && p.address === selected.address) ||
          json.properties[json.properties.length - 1];
        setView(match ? match.id : "overview");
      }
      setSaveState("saved");
    } catch (e) {
      console.error(e);
      setSaveState("error");
    }
  }, []);

  const commit = useCallback(
    (next) => {
      setProps(next);
      latestRef.current = next;
      setSaveState("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(sync, 600);
    },
    [sync]
  );

  const addProperty = (p) => {
    commit([...latestRef.current, p]);
    setView(p.id);
  };
  const updateProperty = (p) => {
    commit(latestRef.current.map((x) => (x.id === p.id ? p : x)));
  };
  const removeProperty = async (id) => {
    if (!window.confirm("Remove this property and its records?")) return;
    const gone = latestRef.current.find((x) => x.id === id);
    commit(latestRef.current.filter((x) => x.id !== id));
    setView("overview");
    // Clean up attached documents from storage (best effort, after the UI moves on)
    for (const d of gone?.docs || []) {
      try {
        await fetch(`/api/docs?path=${encodeURIComponent(d.path)}`, { method: "DELETE" });
      } catch {
        // orphaned file at worst; not worth blocking the user
      }
    }
  };

  // Subscription lapsed: force the overview so the main pane is never blank
  const effView = access ? view : "overview";

  const propAlerts = (p) => {
    const rec = RECURRING.map((item) => recurringStatus(p, item));
    const one = ONEOFFS.map((item) => oneoffStatus(item, p.checks?.[item.key], p.tenancyStart));
    const all = [...rec, ...one];
    let overdue = all.filter((st) => st.code === "overdue").length;
    const soon = all.filter((st) => st.code === "soon").length;
    if (p.epcBand === "F" || p.epcBand === "G") overdue += 1;
    return { overdue, soon };
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const showBilling = () => {
    setView("overview");
    requestAnimationFrame(() => {
      document.getElementById("billing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openBillingPortal = async () => {
    setCheckoutError("");
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Could not open billing");
      window.location.href = json.url;
    } catch (err) {
      setCheckoutError(err.message);
    }
  };

  const upgradeToAnnual = async () => {
    if (
      !window.confirm(
        "Switch to annual billing now? Stripe will credit any unused monthly time and charge £59.90 today."
      )
    ) {
      return;
    }

    setUpgradeState("loading");
    setUpgradeMessage("");
    try {
      const res = await fetch("/api/subscription/annual", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not switch to annual billing");
      setUpgradeState("done");
      setUpgradeMessage(
        json.alreadyAnnual
          ? "Your subscription is already on the annual plan."
          : "You are now on annual billing."
      );
      router.refresh();
    } catch (err) {
      setUpgradeState("idle");
      setUpgradeMessage(err.message);
    }
  };

  const startCheckout = async (plan) => {
    setCheckoutState(plan);
    setCheckoutError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Could not start checkout");
      window.location.href = json.url;
    } catch (err) {
      setCheckoutError(err.message);
      setCheckoutState("idle");
    }
  };

  // Aggregate ledger
  const entries = [];
  for (const p of props) {
    for (const item of RECURRING) {
      const st = recurringStatus(p, item);
      entries.push({ prop: p, label: item.label, st });
    }
    for (const item of ONEOFFS) {
      const st = oneoffStatus(item, p.checks?.[item.key], p.tenancyStart);
      if (st.due && !["ok", "na"].includes(st.code)) entries.push({ prop: p, label: item.label, st });
    }
  }
  const dated = entries
    .filter((e) => e.st.due && !["ok", "na"].includes(e.st.code))
    .sort((a, b) => a.st.due - b.st.due);
  const unrecorded = entries.filter((e) => e.st.code === "missing").length;
  const bandProblems = props.filter((p) => p.epcBand === "F" || p.epcBand === "G").length;
  const overdue = entries.filter((e) => e.st.code === "overdue").length + bandProblems;
  const next = dated.find((e) => e.st.days >= 0) || dated[0] || null;

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <Link href="/" className="brand-link">
            <svg className="brand-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> RentClock
          </Link>
        </div>
        <div className="mast-right">
          {saveState !== "saved" && (
            <span
              className={`save-dot ${saveState}`}
              title={saveState === "saving" ? "Saving…" : "Save failed — retrying on next change"}
            >
              <span className="dot" />
              {saveState === "saving" ? "Saving" : "Save failed"}
            </span>
          )}
          {billingOn && (
            <button className="navbtn" onClick={access ? showBilling : openBillingPortal}>
              Billing
            </button>
          )}
          <button className="navbtn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {!access && (
        <section className="card paywall">
          <div className="eyebrow">Start your 14-day free trial</div>
          <p>
            Add your card details to start your trial. You will not be charged today. Cancel before
            your 14 days are up and you will not be charged.
          </p>
          <div className="trial-actions">
            <button
              className="btn brass"
              onClick={() => startCheckout("monthly")}
              disabled={checkoutState !== "idle"}
            >
              {checkoutState === "monthly" ? "Opening checkout…" : "Start trial — £5.99/month"}
            </button>
            <button
              className="btn ghost"
              onClick={() => startCheckout("annual")}
              disabled={checkoutState !== "idle"}
            >
              {checkoutState === "annual" ? "Opening checkout…" : "Start trial — £59.90/year"}
            </button>
          </div>
          <p className="trial-note">
            Choose a plan now. Stripe will charge it only when the trial ends unless you cancel.
          </p>
          {checkoutError && <p className="trial-error">{checkoutError}</p>}
        </section>
      )}

      {billingOn && access && (
        <section className="card billing-card" id="billing">
          <div className="eyebrow">Billing</div>
          <h2>Switch to annual and save</h2>
          <p>
            Annual membership is £59.90/year. Switching now credits any unused monthly time and
            charges the annual plan today.
          </p>
          <div className="trial-actions">
            <button className="btn brass" onClick={upgradeToAnnual} disabled={upgradeState === "loading"}>
              {upgradeState === "loading" ? "Switching…" : "Switch to annual — £59.90/year"}
            </button>
            <button className="btn ghost" onClick={openBillingPortal}>
              Manage billing
            </button>
          </div>
          {upgradeMessage && <p className="trial-note">{upgradeMessage}</p>}
        </section>
      )}

      {props.length === 0 && effView !== "add" ? (
        <section className="empty card">
          <h2>Start your ledger</h2>
          <p>
            Add a property and RentClock builds its statutory checklist: gas safety, EICR, EPC,
            alarms, deposit protection, and the new Renters’ Rights Act tasks — then counts down
            every renewal so nothing lapses.
          </p>
          {access && (
            <button className="btn primary" onClick={() => setView("add")}>
              Add your first property
            </button>
          )}
        </section>
      ) : (
        <div className="shell">
          <aside className="side">
            <button
              className={`side-item ${effView === "overview" ? "active" : ""}`}
              onClick={() => setView("overview")}
            >
              <span className="side-name">Overview</span>
              {overdue > 0 && <span className="side-pill">{overdue}</span>}
            </button>
            <div className="side-label mono">Properties</div>
            {props.map((p) => {
              const a = propAlerts(p);
              return (
                <button
                  key={p.id}
                  className={`side-item ${effView === p.id ? "active" : ""} ${
                    a.overdue > 0 ? "has-overdue" : a.soon > 0 ? "has-soon" : ""
                  }`}
                  onClick={() => setView(p.id)}
                  title={
                    a.overdue > 0
                      ? `${a.overdue} overdue`
                      : a.soon > 0
                      ? `${a.soon} due within 60 days`
                      : "All compliant"
                  }
                >
                  <span className="side-name">{p.name}</span>
                  {a.overdue > 0 ? (
                    <span className="side-pill">{a.overdue} overdue</span>
                  ) : a.soon > 0 ? (
                    <span className="side-pill soon">{a.soon} soon</span>
                  ) : (
                    <span className="side-ok mono">✓</span>
                  )}
                </button>
              );
            })}
            {access && (
              <button
                className={`side-item side-add ${effView === "add" ? "active" : ""}`}
                onClick={() => setView("add")}
              >
                <span className="side-name">+ Add property</span>
              </button>
            )}
          </aside>

          <main className="main">
            {effView === "overview" && (
              <>
                <section className="hero">
                  {next ? (
                    <>
                      <div className="eyebrow light">Next deadline</div>
                      <div className="hero-count mono">
                        {next.st.days < 0
                          ? `${Math.abs(next.st.days)} days overdue`
                          : next.st.days === 0
                          ? "Due today"
                          : `${next.st.days} days`}
                      </div>
                      <div className="hero-what">
                        {next.label} · {next.prop.name} ·{" "}
                        <span className="mono">{fmt(next.st.due)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="eyebrow light">Status</div>
                      <div className="hero-count mono">All clear</div>
                      <div className="hero-what">No dated deadlines outstanding.</div>
                    </>
                  )}
                  <div className="hero-stats">
                    <span className={overdue ? "hs bad" : "hs"}>
                      <b className="mono">{overdue}</b> overdue
                    </span>
                    <span className={unrecorded ? "hs warn" : "hs"}>
                      <b className="mono">{unrecorded}</b> not recorded
                    </span>
                    <span className="hs">
                      <b className="mono">{props.length}</b>{" "}
                      {props.length === 1 ? "property" : "properties"}
                    </span>
                  </div>
                </section>

                {dated.length > 0 && (
                  <section className="card">
                    <div className="eyebrow">Upcoming across all properties</div>
                    <div className="ledger tight">
                      {dated.slice(0, 10).map((e, i) => (
                        <button className="row slim rowlink" key={i} onClick={() => setView(e.prop.id)}>
                          <div className="row-label">
                            {e.label}
                            <span className="row-prop">{e.prop.name}</span>
                          </div>
                          <div className="row-due mono">{fmt(e.st.due)}</div>
                          <div className="row-status">
                            <DaysChip days={e.st.days} />
                            <Stamp code={e.st.code} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {effView === "add" && access && (
              <AddPropertyForm onAdd={addProperty} onCancel={() => setView("overview")} />
            )}

            {access &&
              props
                .filter((p) => p.id === effView)
                .map((p) => (
                  <PropertyCard
                    key={p.id}
                    prop={p}
                    onUpdate={updateProperty}
                    onRemove={removeProperty}
                  />
                ))}
          </main>
        </div>
      )}

      <footer className="foot">
        <p>
          Signed in as {email}. RentClock tracks England’s private rented sector rules including the
          Renters’ Rights Act 2025 (in force from 1 May 2026). It’s a deadline ledger, not legal
          advice.
        </p>
      </footer>
    </div>
  );
}
