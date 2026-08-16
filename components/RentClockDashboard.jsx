"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  RECURRING,
  ONEOFFS,
  EPC_BANDS,
  addMonths,
  today,
  parseISO,
  toISO,
  fmt,
  recurringStatus,
  oneoffStatus,
  rightToRentOccupiers,
  rightToRentFollowUps,
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
    setBusy(true);
    try {
      const res = await fetch(`/api/docs?path=${encodeURIComponent(doc.path)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not delete document");
      onUpdate({ ...prop, docs: (prop.docs || []).filter((d) => d.id !== doc.id) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="docs">
      {docs.map((d) => (
        <span className="doc-chip" key={d.id}>
          <button className="doc-name mono" onClick={() => download(d)} title="Download">
            📎 {d.name}
          </button>
          <button className="doc-x" onClick={() => remove(d)} title="Delete" disabled={busy}>
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
  const [agreementDate, setAgreementDate] = useState("");
  const [tenancyStart, setTenancyStart] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [households, setHouseholds] = useState("");
  const [residents, setResidents] = useState("");
  const [occupied, setOccupied] = useState(true);
  const [furnished, setFurnished] = useState("");
  const [jointLandlords, setJointLandlords] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!address.trim()) {
      setError("Enter the full property address.");
      return;
    }
    onAdd({
      id: `tmp-${Date.now().toString(36)}`,
      name: name.trim() || address.trim(),
      address: address.trim(),
      agreementDate,
      tenancyStart,
      propertyDetails: {
        propertyType,
        bedrooms: bedrooms === "" ? null : Number(bedrooms),
        households: households === "" ? null : Number(households),
        residents: residents === "" ? null : Number(residents),
        occupied,
        furnished,
        jointLandlords: jointLandlords.trim(),
      },
      dates: {},
      checks: {},
      anchors: {},
      docs: [],
      epcBand: "",
      agreementType: "written",
      applicability: { gas: true, deposit: true, epcExempt: false, howtorent: false },
      rightToRent: { occupiers: [] },
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
          <span className="lbl">Full address *</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
        </label>
        <label>
          <span className="lbl">Tenancy agreed / signed</span>
          <input type="date" value={agreementDate} onChange={(e) => setAgreementDate(e.target.value)} />
        </label>
        <label>
          <span className="lbl">Current tenancy start</span>
          <input type="date" value={tenancyStart} onChange={(e) => setTenancyStart(e.target.value)} />
        </label>
        <label>
          <span className="lbl">Property type</span>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            <option value="">Select…</option>
            <option value="house">House</option>
            <option value="flat">Flat</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label><span className="lbl">Bedrooms</span><input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></label>
        <label><span className="lbl">Households</span><input type="number" min="0" value={households} onChange={(e) => setHouseholds(e.target.value)} /></label>
        <label><span className="lbl">Adult and child residents</span><input type="number" min="0" value={residents} onChange={(e) => setResidents(e.target.value)} /></label>
        <label>
          <span className="lbl">Furnishing</span>
          <select value={furnished} onChange={(e) => setFurnished(e.target.value)}>
            <option value="">Select…</option>
            <option value="furnished">Furnished</option>
            <option value="part-furnished">Part-furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </label>
        <label><span className="lbl">Joint landlords</span><input value={jointLandlords} onChange={(e) => setJointLandlords(e.target.value)} placeholder="Names or reference" /></label>
        <label className="check-wrap compact-check">
          <input type="checkbox" checked={occupied} onChange={(e) => setOccupied(e.target.checked)} />
          <span>Currently occupied</span>
        </label>
      </div>
      {error && <p className="trial-error">{error}</p>}
      <div className="form-actions">
        <button className="btn primary" onClick={submit}>Add property</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function NewTenancyForm({ onConfirm, onCancel }) {
  const [agreementDate, setAgreementDate] = useState(toISO(today()));
  const [start, setStart] = useState(toISO(today()));
  return (
    <div className="newtenancy">
      <span className="lbl">New tenancy dates</span>
      <div className="nt-row">
        <label><span className="lbl">Agreed / signed</span><input type="date" value={agreementDate} onChange={(e) => setAgreementDate(e.target.value)} /></label>
        <label><span className="lbl">Starts</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <button className="btn primary sm" onClick={() => onConfirm({ agreementDate, start })}>Confirm</button>
        <button className="btn ghost sm" onClick={onCancel}>Cancel</button>
      </div>
      <div className="nt-note">
        Resets deposit protection, Right to Rent, alarm and written-statement tasks for the new tenants.
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
        const windowStart = addMonths(prevStatus.due, -2);
        if (nd >= windowStart && nd <= prevStatus.due) {
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

  const occupiers = rightToRentOccupiers(prop);
  const setOccupiers = (next) => onUpdate({ ...prop, rightToRent: { occupiers: next } });
  const addOccupier = () => setOccupiers([
    ...occupiers,
    { id: `rtr-${Date.now().toString(36)}`, name: "", method: "", checkedOn: "", followUpDue: "", notes: "" },
  ]);
  const updateOccupier = (id, patch) => setOccupiers(
    occupiers.map((occupier) => (occupier.id === id ? { ...occupier, ...patch } : occupier))
  );
  const removeOccupier = (id) => setOccupiers(occupiers.filter((occupier) => occupier.id !== id));

  const startNewTenancy = ({ start, agreementDate }) => {
    const checks = { ...(prop.checks || {}) };
    for (const item of ONEOFFS) {
      if (item.perTenancy) checks[item.key] = false;
    }
    const dates = { ...(prop.dates || {}) };
    delete dates.depositReceived;
    delete dates.rtrFollowUpDue;
    onUpdate({
      ...prop,
      agreementDate,
      tenancyStart: start,
      checks,
      dates,
      rightToRent: { occupiers: [] },
      applicability: { ...(prop.applicability || {}), howtorent: false },
    });
    setNewTenancy(false);
  };

  const statuses = RECURRING.map((item) => ({ item, st: recurringStatus(prop, item) }));
  const followUps = rightToRentFollowUps(prop);
  const bandBad =
    prop.applicability?.epcExempt !== true && (prop.epcBand === "F" || prop.epcBand === "G");
  const overdueCount =
    statuses.filter((s) => s.st.code === "overdue").length +
    ONEOFFS.filter((i) => oneoffStatus(i, prop.checks?.[i.key], prop).code === "overdue").length +
    followUps.filter((entry) => entry.st.code === "overdue").length +
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
              <span className="lbl">Tenancy agreed / signed</span>
              <input
                type="date"
                value={prop.agreementDate || ""}
                onChange={(e) => onUpdate({ ...prop, agreementDate: e.target.value })}
              />
            </div>
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
          <div className="eyebrow">Property details</div>
          <div className="form-grid property-details-grid">
            <label>
              <span className="lbl">Full address</span>
              <input value={prop.address || ""} onChange={(e) => onUpdate({ ...prop, address: e.target.value })} />
            </label>
            <label>
              <span className="lbl">Property type</span>
              <select value={prop.propertyDetails?.propertyType || ""} onChange={(e) => onUpdate({ ...prop, propertyDetails: { ...(prop.propertyDetails || {}), propertyType: e.target.value } })}>
                <option value="">Select…</option><option value="house">House</option><option value="flat">Flat</option><option value="other">Other</option>
              </select>
            </label>
            <label><span className="lbl">Bedrooms</span><input type="number" min="0" value={prop.propertyDetails?.bedrooms ?? ""} onChange={(e) => onUpdate({ ...prop, propertyDetails: { ...(prop.propertyDetails || {}), bedrooms: e.target.value === "" ? null : Number(e.target.value) } })} /></label>
            <label><span className="lbl">Households</span><input type="number" min="0" value={prop.propertyDetails?.households ?? ""} onChange={(e) => onUpdate({ ...prop, propertyDetails: { ...(prop.propertyDetails || {}), households: e.target.value === "" ? null : Number(e.target.value) } })} /></label>
            <label><span className="lbl">Residents</span><input type="number" min="0" value={prop.propertyDetails?.residents ?? ""} onChange={(e) => onUpdate({ ...prop, propertyDetails: { ...(prop.propertyDetails || {}), residents: e.target.value === "" ? null : Number(e.target.value) } })} /></label>
            <label>
              <span className="lbl">Furnishing</span>
              <select value={prop.propertyDetails?.furnished || ""} onChange={(e) => onUpdate({ ...prop, propertyDetails: { ...(prop.propertyDetails || {}), furnished: e.target.value } })}>
                <option value="">Select…</option><option value="furnished">Furnished</option><option value="part-furnished">Part-furnished</option><option value="unfurnished">Unfurnished</option>
              </select>
            </label>
            <label><span className="lbl">Joint landlords</span><input value={prop.propertyDetails?.jointLandlords || ""} onChange={(e) => onUpdate({ ...prop, propertyDetails: { ...(prop.propertyDetails || {}), jointLandlords: e.target.value } })} placeholder="Names or reference" /></label>
            <label className="check-wrap compact-check"><input type="checkbox" checked={prop.propertyDetails?.occupied !== false} onChange={(e) => onUpdate({ ...prop, propertyDetails: { ...(prop.propertyDetails || {}), occupied: e.target.checked } })} /><span>Currently occupied</span></label>
          </div>
          <div className="applicability-grid">
            <label>
              <span className="lbl">Tenancy agreement</span>
              <select
                value={prop.agreementType || "written"}
                onChange={(e) => onUpdate({ ...prop, agreementType: e.target.value })}
              >
                <option value="written">Written agreement</option>
                <option value="verbal">Verbal agreement</option>
              </select>
            </label>
            <label className="check-wrap compact-check">
              <input
                type="checkbox"
                checked={prop.applicability?.deposit !== false}
                onChange={(e) =>
                  onUpdate({
                    ...prop,
                    applicability: { ...(prop.applicability || {}), deposit: e.target.checked },
                  })
                }
              />
              <span>Deposit taken</span>
            </label>
            <label className="check-wrap compact-check">
              <input
                type="checkbox"
                checked={prop.applicability?.howtorent === true}
                onChange={(e) =>
                  onUpdate({
                    ...prop,
                    applicability: { ...(prop.applicability || {}), howtorent: e.target.checked },
                  })
                }
              />
              <span>Track historic How to Rent evidence</span>
            </label>
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
                  {item.eventBased && (
                    <div className="row-note anchored">No automatic expiry: review this record when the property or risk changes.</div>
                  )}
                  {item.key === "gas" && (
                    <label className="check-wrap compact-check row-option">
                      <input
                        type="checkbox"
                        checked={prop.applicability?.gas === false}
                        onChange={(e) =>
                          onUpdate({
                            ...prop,
                            applicability: { ...(prop.applicability || {}), gas: !e.target.checked },
                          })
                        }
                      />
                      <span>No gas appliances at this property</span>
                    </label>
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
                  {item.key === "epc" && (
                    <label className="check-wrap compact-check row-option">
                      <input
                        type="checkbox"
                        checked={prop.applicability?.epcExempt === true}
                        onChange={(e) =>
                          onUpdate({
                            ...prop,
                            applicability: {
                              ...(prop.applicability || {}),
                              epcExempt: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Registered EPC / minimum-standard exemption applies</span>
                    </label>
                  )}
                  <FixLink item={item} code={st.code} />
                  <DocList prop={prop} itemKey={item.key} onUpdate={onUpdate} />
                </div>
                <div className="row-date">
                  <span className="lbl">{item.eventBased ? "Last reviewed" : "Last done"}</span>
                  <input
                    type="date"
                    value={prop.dates?.[item.key] || ""}
                    onChange={(e) => setDate(item.key, e.target.value)}
                    disabled={st.code === "na"}
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
                  {!item.eventBased && <><span className="lbl">Next due</span>{fmt(st.due)}</>}
                </div>
                <div className="row-status">
                  {!item.eventBased && <DaysChip days={st.days} />}
                  {item.eventBased && st.code === "ok" ? <span className="stamp st-ok">RECORDED</span> : <Stamp code={st.code} tilt />}
                </div>
              </div>
            ))}
          </div>

          <div className="eyebrow">Tenancy & Renters’ Rights Act tasks</div>
          <div className="ledger">
            {ONEOFFS.map((item) => {
              const done = !!prop.checks?.[item.key];
              const st = oneoffStatus(item, done, prop);
              return (
                <div className="row oneoff" key={item.key}>
                  <div className="row-main">
                    <div className="check-wrap">
                      <input
                        type="checkbox"
                        aria-label={item.label}
                        checked={done}
                        disabled={(item.pending && !done) || st.code === "na"}
                        onChange={() => toggleCheck(item.key)}
                      />
                      <div>
                        <div className="row-label">{item.label}</div>
                        <div className="row-note">{item.note}</div>
                        {st.code === "na" && (
                          <div className="row-note">This task is not applicable with the property details currently selected.</div>
                        )}
                        {item.key === "deposit" && prop.applicability?.deposit !== false && (
                          <label className="inline-detail">
                            <span className="lbl">Deposit received</span>
                            <input
                              type="date"
                              value={prop.dates?.depositReceived || ""}
                              onChange={(e) => setDate("depositReceived", e.target.value)}
                            />
                          </label>
                        )}
                        {item.key === "rtr" && (
                          <div>
                            {occupiers.map((occupier, index) => (
                              <div className="rtr-record" key={occupier.id || index}>
                                <label><span className="lbl">Adult occupier</span><input value={occupier.name || ""} onChange={(e) => updateOccupier(occupier.id, { name: e.target.value })} placeholder="Name" /></label>
                                <label>
                                  <span className="lbl">Check method</span>
                                  <select value={occupier.method || ""} onChange={(e) => updateOccupier(occupier.id, { method: e.target.value })}>
                                    <option value="">Select…</option>
                                    <option value="online">Home Office online service</option>
                                    <option value="documents">Original documents</option>
                                    <option value="digital-verification">Right to Rent digital verification provider</option>
                                    <option value="landlord-checking-service">Landlord Checking Service</option>
                                  </select>
                                </label>
                                <label><span className="lbl">Check carried out</span><input type="date" value={occupier.checkedOn || ""} onChange={(e) => updateOccupier(occupier.id, { checkedOn: e.target.value })} /></label>
                                <label><span className="lbl">Follow-up due</span><input type="date" value={occupier.followUpDue || ""} onChange={(e) => updateOccupier(occupier.id, { followUpDue: e.target.value })} /></label>
                                <label className="rtr-notes"><span className="lbl">Notes</span><input value={occupier.notes || ""} onChange={(e) => updateOccupier(occupier.id, { notes: e.target.value })} placeholder="Evidence retained or reference" /></label>
                                <button type="button" className="btn danger-ghost sm" onClick={() => removeOccupier(occupier.id)}>Remove occupier</button>
                              </div>
                            ))}
                            <button type="button" className="btn ghost sm" onClick={addOccupier}>+ Add adult occupier</button>
                          </div>
                        )}
                        {item.userDateField && (
                          <label className="inline-detail">
                            <span className="lbl">Follow-up due (if required)</span>
                            <input
                              type="date"
                              value={prop.dates?.[item.userDateField] || ""}
                              onChange={(e) => setDate(item.userDateField, e.target.value)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
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
            {followUps.map(({ item, st }) => (
              <div className="row oneoff" key={item.key}>
                <div className="row-main">
                  <div className="row-label">{item.label}</div>
                  <div className="row-note">Complete the follow-up before the current statutory excuse expires.</div>
                </div>
                <div className="row-due mono"><span className="lbl">Deadline</span>{fmt(st.due)}</div>
                <div className="row-status"><DaysChip days={st.days} /><Stamp code={st.code} tilt /></div>
              </div>
            ))}
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
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const pendingRef = useRef(new Map());
  const deleteRef = useRef(new Set());
  const inFlightRef = useRef(null);
  const latestRef = useRef(props);
  const viewRef = useRef(view);
  viewRef.current = view;

  const drainSaves = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    const run = async () => {
      setSaveState("saving");
      try {
        while (deleteRef.current.size || pendingRef.current.size) {
          const deletes = [...deleteRef.current];
          deleteRef.current.clear();
          for (const id of deletes) {
            const res = await fetch("/api/data", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              deleteRef.current.add(id);
              throw new Error(json.error || "Delete failed");
            }
          }

          const saves = [...pendingRef.current.values()];
          pendingRef.current.clear();
          for (const submitted of saves) {
            if (deleteRef.current.has(submitted.id)) continue;
            const res = await fetch("/api/data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ property: submitted }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.property) {
              pendingRef.current.set(submitted.id, pendingRef.current.get(submitted.id) || submitted);
              throw new Error(json.error || "Save failed");
            }

            if (String(submitted.id).startsWith("tmp-") && json.property.id) {
              const serverId = json.property.id;
              const newest = pendingRef.current.get(submitted.id);
              if (newest) {
                pendingRef.current.delete(submitted.id);
                pendingRef.current.set(serverId, { ...newest, id: serverId });
              }
              const next = latestRef.current.map((item) =>
                item.id === submitted.id ? { ...item, id: serverId } : item
              );
              latestRef.current = next;
              setProps(next);
              if (viewRef.current === submitted.id) setView(serverId);
            }
          }
        }
        retryCountRef.current = 0;
        setSaveState("saved");
        return true;
      } catch (error) {
        console.error(error);
        setSaveState("error");
        retryCountRef.current += 1;
        const wait = Math.min(30000, 1000 * 2 ** Math.min(retryCountRef.current, 5));
        retryTimerRef.current = setTimeout(() => drainSaves(), wait);
        return false;
      } finally {
        inFlightRef.current = null;
      }
    };

    inFlightRef.current = run();
    return inFlightRef.current;
  }, []);

  const scheduleSave = useCallback(
    (property) => {
      pendingRef.current.set(property.id, property);
      setSaveState("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => drainSaves(), 600);
    },
    [drainSaves]
  );

  const commitProperty = useCallback(
    (next, property) => {
      setProps(next);
      latestRef.current = next;
      scheduleSave(property);
    },
    [scheduleSave]
  );

  useEffect(() => {
    const warnBeforeLeaving = (event) => {
      if (saveState === "saved" && !pendingRef.current.size && !inFlightRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [saveState]);

  const addProperty = (p) => {
    commitProperty([...latestRef.current, p], p);
    setView(p.id);
  };
  const updateProperty = (p) => {
    commitProperty(latestRef.current.map((x) => (x.id === p.id ? p : x)), p);
  };
  const removeProperty = async (id) => {
    if (!window.confirm("Remove this property and its records?")) return;
    const gone = latestRef.current.find((x) => x.id === id);
    pendingRef.current.delete(id);
    if (/^[0-9a-f-]{36}$/i.test(id)) deleteRef.current.add(id);
    const next = latestRef.current.filter((x) => x.id !== id);
    latestRef.current = next;
    setProps(next);
    setSaveState("saving");
    drainSaves();
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
    const one = ONEOFFS.map((item) => oneoffStatus(item, p.checks?.[item.key], p));
    const all = [...rec, ...one, ...rightToRentFollowUps(p).map((entry) => entry.st)];
    let overdue = all.filter((st) => st.code === "overdue").length;
    const soon = all.filter((st) => st.code === "soon").length;
    if (p.applicability?.epcExempt !== true && (p.epcBand === "F" || p.epcBand === "G")) overdue += 1;
    return { overdue, soon };
  };

  const signOut = async () => {
    if (!(await drainSaves())) {
      setCheckoutError("Your latest changes could not be saved. Retry the save before signing out.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const openBillingPortal = async () => {
    setCheckoutError("");
    try {
      if (!(await drainSaves())) throw new Error("Save your latest changes before leaving RentClock.");
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
        "Switch to annual billing? During a trial you stay free until the trial ends. Otherwise Stripe applies credit for unused monthly time and charges the prorated annual amount now."
      )
    ) {
      return;
    }

    setUpgradeState("loading");
    setUpgradeMessage("");
    try {
      if (!(await drainSaves())) throw new Error("Save your latest changes before changing plan.");
      const res = await fetch("/api/subscription/annual", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not switch to annual billing");
      setUpgradeState("done");
      setUpgradeMessage(
        json.alreadyAnnual
          ? "Your subscription is already on the annual plan."
          : json.effective === "trial_end"
          ? "Annual billing is selected and will start when your free trial ends."
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
      if (!(await drainSaves())) throw new Error("Save your latest changes before opening checkout.");
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
      const st = oneoffStatus(item, p.checks?.[item.key], p);
      if (st.due && !["ok", "na"].includes(st.code)) entries.push({ prop: p, label: item.label, st });
    }
    for (const entry of rightToRentFollowUps(p)) {
      entries.push({ prop: p, label: entry.item.label, st: entry.st });
    }
  }
  const dated = entries
    .filter((e) => e.st.due && !["ok", "na"].includes(e.st.code))
    .sort((a, b) => a.st.due - b.st.due);
  const unrecorded = entries.filter((e) => e.st.code === "missing").length;
  const bandProblems = props.filter((p) => p.applicability?.epcExempt !== true && (p.epcBand === "F" || p.epcBand === "G")).length;
  const overdue = entries.filter((e) => e.st.code === "overdue").length + bandProblems;
  const next = dated.find((e) => e.st.days >= 0) || dated[0] || null;

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <Link href="/" className="brand-link" aria-label="RentClock home">
            <BrandLogo />
          </Link>
        </div>
        <div className="mast-right">
          {saveState !== "saved" && (
            <button
              type="button"
              className={`save-dot ${saveState}`}
              title={saveState === "saving" ? "Saving…" : "Save failed — click to retry now"}
              onClick={() => saveState === "error" && drainSaves()}
              disabled={saveState === "saving"}
            >
              <span className="dot" />
              {saveState === "saving" ? "Saving" : "Save failed — retry"}
            </button>
          )}
          {billingOn && (
            <button className="navbtn" onClick={openBillingPortal}>
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
        <section className="billing-card" id="billing">
          <div>
            <span className="billing-label">Annual plan</span>
            <p>Save £11.98 a year by switching to annual billing.</p>
          </div>
          <div className="billing-actions">
            <button className="billing-link" onClick={upgradeToAnnual} disabled={upgradeState === "loading"}>
              {upgradeState === "loading" ? "Switching…" : "Switch to annual"}
            </button>
            <button className="billing-link" onClick={openBillingPortal}>
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
            Add a property and RentClock builds a core checklist for gas safety, EICR, EPC,
            alarms, deposit protection, and selected Renters’ Rights Act tasks — then counts down
            the dates you record. Check local licensing and property-specific duties separately.
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
          Signed in as {email}. RentClock tracks core England private rented sector deadlines and
          selected Renters’ Rights Act 2025 tasks. Local and event-based duties may also apply. It’s
          a deadline ledger, not legal advice.
        </p>
      </footer>
    </div>
  );
}
