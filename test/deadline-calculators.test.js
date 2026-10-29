import test from "node:test";
import assert from "node:assert/strict";
import { depositProtectionDeadline, eicrNextInspection, gasSafetyWindow, rightToRentFollowUp } from "../lib/deadline-calculators.js";
const iso = (date) => date?.toISOString().slice(0, 10);
test("gas early window subtracts two calendar months", () => { const result = gasSafetyWindow("2027-03-31"); assert.equal(iso(result.earliestRetainedDeadlineCheck), "2027-01-31"); assert.equal(iso(result.deadline), "2027-03-31"); });
test("EICR uses five years unless report gives an earlier date", () => { assert.equal(iso(eicrNextInspection("2026-08-27", "")), "2031-08-27"); assert.equal(iso(eicrNextInspection("2026-08-27", "2030-02-01")), "2030-02-01"); });
test("deposit receipt is day one of the 30-day period", () => {
  assert.equal(iso(depositProtectionDeadline("2026-11-01")), "2026-11-30");
  assert.equal(iso(depositProtectionDeadline("2026-10-01")), "2026-10-30");
  assert.equal(iso(depositProtectionDeadline("2026-12-20")), "2027-01-18");
  assert.equal(iso(depositProtectionDeadline("2028-02-01")), "2028-03-01");
  assert.equal(depositProtectionDeadline("2026-02-30"), null);
});
test("Right to Rent reminder is 28 days before expiry", () => { const result = rightToRentFollowUp("2027-01-31"); assert.equal(iso(result.reminder), "2027-01-03"); });
