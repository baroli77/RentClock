"use client";
import { useMemo, useState } from "react";
import { depositProtectionDeadline, eicrNextInspection, formatDate, gasSafetyWindow, rightToRentFollowUp } from "@/lib/deadline-calculators";

const OFFICIAL = {
  gas: "https://www.hse.gov.uk/gas/landlords/gassaferecord.htm",
  eicr: "https://www.gov.uk/government/publications/electrical-safety-standards-in-the-private-and-social-rented-sectors-guidance/electrical-safety-standards-in-the-private-and-social-rented-sectors-guidance",
  deposit: "https://www.gov.uk/tenancy-deposit-protection",
  rightToRent: "https://www.gov.uk/check-tenant-right-to-rent-documents",
};

export default function DeadlineTool({ type }) {
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const result = useMemo(() => {
    if (type === "gas") return gasSafetyWindow(primary);
    if (type === "eicr") return eicrNextInspection(primary, secondary);
    if (type === "deposit") return depositProtectionDeadline(primary);
    if (type === "rightToRent") return rightToRentFollowUp(primary);
    return null;
  }, [type, primary, secondary]);

  if (type === "calendar") return <ComplianceCalendar />;
  const labels = { gas: "Current gas safety deadline", eicr: "Date of the inspection/report", deposit: "Date the deposit was received", rightToRent: "Exact statutory excuse expiry" };
  return <div className="calculator card">
    <label>{labels[type]}<input type="date" value={primary} onChange={(event) => setPrimary(event.target.value)} /></label>
    {type === "eicr" && <label>Earlier next-inspection date stated in the report <span>(optional)</span><input type="date" value={secondary} onChange={(event) => setSecondary(event.target.value)} /></label>}
    {result && <div className="calculator-result" aria-live="polite">
      {type === "gas" && <><span>Early-check window opens</span><strong>{formatDate(result.earliestRetainedDeadlineCheck)}</strong><span>Current deadline</span><strong>{formatDate(result.deadline)}</strong></>}
      {type === "eicr" && <><span>Next inspection no later than</span><strong>{formatDate(result)}</strong></>}
      {type === "deposit" && <><span>30-day deadline</span><strong>{formatDate(result)}</strong></>}
      {type === "rightToRent" && <><span>Planning reminder (28 days before)</span><strong>{formatDate(result.reminder)}</strong><span>Complete the required follow-up before</span><strong>{formatDate(result.completeBefore)}</strong></>}
    </div>}
    <p className="calculator-warning">Planning aid only, not legal advice. {type === "rightToRent" ? "Enter the exact expiry from the official service or accepted evidence; this tool does not determine immigration status. " : "Check the source document and your circumstances. "}<a href={OFFICIAL[type]} rel="noreferrer">Read the official guidance</a>.</p>
  </div>;
}

function ComplianceCalendar() {
  const events = [
    ["20260501", "Renters’ Rights Act main tenancy reforms began"],
    ["20260531", "Information Sheet deadline for most pre-existing written agreements"],
    ["20261001", "Updated Right to Rent code takes effect"],
  ];
  function download() {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RentClock//2026 Compliance Calendar//EN", ...events.flatMap(([date, summary], index) => ["BEGIN:VEVENT", `UID:rentclock-2026-${index}@rentclock.com`, `DTSTART;VALUE=DATE:${date}`, `SUMMARY:${summary}`, "END:VEVENT"]), "END:VCALENDAR"];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "rentclock-landlord-compliance-2026.ics"; anchor.click(); URL.revokeObjectURL(url);
  }
  return <div className="calendar-card card"><div className="calendar-actions"><button className="btn brass" onClick={download}>Download .ics calendar</button><button className="btn ghost" onClick={() => window.print()}>Print calendar</button></div><ol><li><time>1 May 2026</time><b>Main Renters’ Rights Act tenancy reforms began</b><span>Includes the new tenancy system for most private assured tenancies in England.</span></li><li><time>31 May 2026</time><b>Information Sheet deadline</b><span>Applied to most tenants with pre-1 May written agreements; check limited later-delivery cases.</span></li><li><time>1 October 2026</time><b>Updated Right to Rent code</b><span>The new landlord code of practice takes effect.</span></li><li><time>Late 2026</time><b>PRS Database regional rollout is planned</b><span>No single national registration date has been fixed. Follow GOV.UK for your area.</span></li></ol><p className="calculator-warning">National England milestones only. Add each property’s gas, EICR, EPC, licence, deposit and tenancy-specific dates separately.</p></div>;
}
