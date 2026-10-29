"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { depositProtectionDeadline, eicrNextInspection, formatDate, gasSafetyWindow, rightToRentFollowUp } from "@/lib/deadline-calculators";
import { REGISTRATION_LAUNCH, REGISTRATION_REGIONS, REGISTRATION_SOURCE, registrationDeadline } from "@/lib/registration";
import { CALENDAR_EVENTS, complianceCalendarIcs } from "@/lib/compliance-calendar";

const OFFICIAL = {
  gas: "https://www.hse.gov.uk/gas/landlords/gassaferecord.htm",
  eicr: "https://www.gov.uk/government/publications/electrical-safety-standards-in-the-private-and-social-rented-sectors-guidance/electrical-safety-standards-in-the-private-and-social-rented-sectors-guidance",
  deposit: "https://www.legislation.gov.uk/ukpga/2004/34/section/213",
  rightToRent: "https://www.gov.uk/government/publications/landlords-guide-to-right-to-rent-checks/landlords-guide-to-right-to-rent-checks-1-october-2026-accessible",
};
const calendarDate = (value) => formatDate(new Date(`${value}T00:00:00Z`));

function TrackDeadline() {
  return <div className="calculator-track"><p>Keep this date with your property records and supporting documents. RentClock can email you before recorded deadlines.</p><Link href="/login?trial=1" className="btn brass">Track your deadlines in RentClock</Link><small>14-day free trial · card required · £5.99/month or £59.90/year after trial</small></div>;
}

export default function DeadlineTool({ type, year = 2026 }) {
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const invalidEarlier = type === "eicr" && primary && secondary && secondary <= primary;
  const result = useMemo(() => {
    if (invalidEarlier) return null;
    if (type === "gas") return gasSafetyWindow(primary);
    if (type === "eicr") return eicrNextInspection(primary, secondary);
    if (type === "deposit") return depositProtectionDeadline(primary);
    if (type === "rightToRent") return rightToRentFollowUp(primary);
    return null;
  }, [type, primary, secondary, invalidEarlier]);

  if (type === "calendar") return <ComplianceCalendar year={year} />;
  if (type === "registration") return <RegistrationCalculator />;
  const labels = { gas: "Current gas safety deadline", eicr: "Date of the inspection/report", deposit: "Date the deposit was received", rightToRent: "Exact statutory excuse expiry" };
  return <div className="calculator card">
    <label>{labels[type]}<input type="date" value={primary} onChange={(event) => setPrimary(event.target.value)} /></label>
    {type === "eicr" && <label>Earlier next-inspection date stated in the report <span>(optional)</span><input type="date" value={secondary} min={primary || undefined} aria-invalid={Boolean(invalidEarlier)} aria-describedby={invalidEarlier ? "eicr-date-error" : undefined} onChange={(event) => setSecondary(event.target.value)} /></label>}
    {invalidEarlier && <p id="eicr-date-error" role="alert">The next-inspection date must be after the inspection date. Check the report.</p>}
    {result && <>
      <div className="calculator-result" aria-live="polite" role="status">
        {type === "gas" && <><span>Early-check window opens</span><strong>{formatDate(result.earliestRetainedDeadlineCheck)}</strong><span>Current deadline</span><strong>{formatDate(result.deadline)}</strong></>}
        {type === "eicr" && <><span>Next inspection no later than</span><strong>{formatDate(result)}</strong></>}
        {type === "deposit" && <><span>Protection and prescribed information due by</span><strong>{formatDate(result)}</strong><span>How the 30 days are counted</span><strong>Receipt date is day one</strong></>}
        {type === "rightToRent" && <><span>Planning reminder (28 days before)</span><strong>{formatDate(result.reminder)}</strong><span>Complete the required follow-up before</span><strong>{formatDate(result.completeBefore)}</strong></>}
      </div>
      <TrackDeadline />
    </>}
    <p className="calculator-warning">Planning aid only, not legal advice. {type === "rightToRent" ? "Enter the exact expiry from the official service or accepted evidence; this tool does not determine immigration status. " : "Check the source document and your circumstances. "}<a href={OFFICIAL[type]} rel="noreferrer">Read the official guidance</a>.</p>
  </div>;
}

function RegistrationCalculator() {
  const [regionId, setRegionId] = useState("");
  const region = registrationDeadline(regionId);
  return <div className="calculator card">
    <label>Region where the property is located<select value={regionId} onChange={(event) => setRegionId(event.target.value)}><option value="">Choose a region</option>{REGISTRATION_REGIONS.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    {region && <>
      <div className="calculator-result" aria-live="polite" role="status"><span>Property region</span><strong>{region.name}</strong><span>Regional registration period begins</span><strong>{calendarDate(region.starts)}</strong><span>Register occupied properties by</span><strong>{calendarDate(region.deadline)} (end of day)</strong><span>Early registration available from</span><strong>{calendarDate(REGISTRATION_LAUNCH)}</strong></div>
      <p>The initial rollout covers properties already let or becoming let, subject to official scope and exemptions. Empty-property marketing requirements follow later. Complete outstanding property information within 28 days of registering.</p>
      <TrackDeadline />
    </>}
    <p className="calculator-warning">Published timetable checked 29 October 2026. This tool does not register properties or decide whether an exemption applies. <a href={REGISTRATION_SOURCE} rel="noreferrer">Read the official registration guidance</a>.</p>
  </div>;
}

function ComplianceCalendar({ year }) {
  const events = CALENDAR_EVENTS[year] || [];
  function download() {
    const url = URL.createObjectURL(new Blob([complianceCalendarIcs(year)], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `rentclock-landlord-compliance-${year}.ics`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="calendar-card card"><div className="calendar-actions"><button className="btn brass" onClick={download}>Download {year} .ics calendar</button><button className="btn ghost" onClick={() => window.print()}>Print calendar</button></div><ol>{events.map((event) => <li key={`${event.date}-${event.summary}`}><time dateTime={event.date}>{calendarDate(event.date)}</time><b>{event.summary}</b><span>{event.detail}</span></li>)}</ol><p className="calculator-warning">National England milestones only. Add each property&apos;s certificate, licence, deposit and tenancy-specific dates separately. Downloaded calendars do not update automatically.</p><p><Link href={`/tools/landlord-compliance-calendar-${year === 2027 ? 2026 : 2027}`}>View the {year === 2027 ? 2026 : 2027} calendar →</Link></p></div>;
}
