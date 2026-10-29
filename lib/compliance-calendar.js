import { REGISTRATION_REGIONS } from "./registration.js";
export const CALENDAR_EVENTS = {
  2026: [
    { date: "2026-05-01", summary: "Main Renters’ Rights Act tenancy reforms began", detail: "For most private assured tenancies in England." },
    { date: "2026-05-31", summary: "Information Sheet deadline", detail: "For most pre-1 May written agreements; limited later-delivery cases apply." },
    { date: "2026-10-01", summary: "Updated Right to Rent code", detail: "New checking guidance and digital verification requirements took effect." },
    { date: "2026-12-15", summary: "Register your rental property service opens", detail: "West Midlands rollout begins. Other regions can register early from this date." },
  ],
  2027: REGISTRATION_REGIONS.flatMap((region) => [
    ...(region.starts.startsWith("2027") ? [{ date: region.starts, summary: `${region.name}: registration period begins`, detail: `Occupied properties must be registered by ${region.deadline}.` }] : []),
    { date: region.deadline, summary: `${region.name}: registration deadline`, detail: "Register occupied properties by the end of this day. Local licensing remains separate." },
  ]).sort((a, b) => a.date.localeCompare(b.date)),
};
const escapeIcs = (value) => String(value).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
function foldIcs(line) {
  const lines = []; let part = ""; let size = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (size + bytes > 75) { lines.push(part); part = " "; size = 1; }
    part += char; size += bytes;
  }
  lines.push(part); return lines.join("\r\n");
}
export function complianceCalendarIcs(year) {
  const events = CALENDAR_EVENTS[year];
  if (!events) throw new RangeError("Unsupported compliance calendar year");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RentClock//Landlord Compliance Calendar//EN", "CALSCALE:GREGORIAN", ...events.flatMap((event) => [
    "BEGIN:VEVENT", `UID:rentclock-${event.date}-${event.summary.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@rentclock.com`,
    "DTSTAMP:20261029T000000Z", `DTSTART;VALUE=DATE:${event.date.replaceAll("-", "")}`,
    `SUMMARY:${escapeIcs(event.summary)}`, `DESCRIPTION:${escapeIcs(event.detail)}`, "END:VEVENT",
  ]), "END:VCALENDAR"];
  return lines.map(foldIcs).join("\r\n") + "\r\n";
}
