import test from "node:test";
import assert from "node:assert/strict";
import { registrationDeadline, REGISTRATION_REGIONS } from "../lib/registration.js";
import { CALENDAR_EVENTS, complianceCalendarIcs } from "../lib/compliance-calendar.js";
import { depositProtectionDeadline } from "../lib/deadline-calculators.js";
import { ONEOFFS, oneoffStatus, toISO, addDays, parseISO } from "../lib/compliance.js";

test("regional deadlines match the nine published government deadlines", () => {
  const expected = { "west-midlands": "2027-03-14", "east-of-england": "2027-04-14", "east-midlands": "2027-05-14", "south-east": "2027-06-14", "yorkshire-and-humber": "2027-07-14", "north-west": "2027-08-14", "north-east": "2027-09-14", london: "2027-10-14", "south-west": "2027-11-14" };
  assert.equal(REGISTRATION_REGIONS.length, 9);
  for (const [id, deadline] of Object.entries(expected)) assert.equal(registrationDeadline(id)?.deadline, deadline);
  assert.equal(registrationDeadline("scotland"), null);
  assert.equal(registrationDeadline(""), null);
});

test("2027 calendar includes every regional deadline and no dates from other years", () => {
  const events = CALENDAR_EVENTS[2027];
  assert.equal(events.length, 17);
  for (const region of REGISTRATION_REGIONS) assert.ok(events.some((event) => event.date === region.deadline && event.summary.startsWith(region.name)));
  assert.ok(events.every((event) => event.date.startsWith("2027")));
  assert.deepEqual(events.map((event) => event.date), events.map((event) => event.date).sort());
});

test("calendar export has complete all-day events and RFC-sized UTF-8 lines", () => {
  const ics = complianceCalendarIcs(2027);
  const lines = ics.split("\r\n");
  assert.equal(lines[0], "BEGIN:VCALENDAR");
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(lines.filter((line) => line === "BEGIN:VEVENT").length, 17);
  assert.equal(lines.filter((line) => line.startsWith("DTSTAMP:")).length, 17);
  assert.ok(lines.includes("DTSTART;VALUE=DATE:20270314"));
  assert.ok(lines.every((line) => Buffer.byteLength(line) <= 75));
  const uids = lines.filter((line) => line.startsWith("UID:"));
  assert.equal(new Set(uids).size, 17);
  assert.throws(() => complianceCalendarIcs(2028), RangeError);
});

test("public and dashboard deposit dates agree across year, leap-year and UK clock changes", () => {
  const item = ONEOFFS.find((entry) => entry.key === "deposit");
  for (const received of ["2026-11-01", "2026-10-01", "2026-12-20", "2028-02-01", "2026-03-20", "2026-10-20"]) {
    const publicDue = depositProtectionDeadline(received).toISOString().slice(0, 10);
    const dashboardDue = oneoffStatus(item, false, { dates: { depositReceived: received } }).due;
    assert.equal(toISO(dashboardDue), publicDue, received);
    assert.equal(dashboardDue.getHours(), 0, received);
  }
  assert.equal(toISO(addDays(parseISO("2026-03-20"), 29)), "2026-04-18");
});
