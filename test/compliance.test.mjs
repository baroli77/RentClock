import test from "node:test";
import assert from "node:assert/strict";
import {
  ONEOFFS,
  RECURRING,
  addMonths,
  oneoffStatus,
  recurringStatus,
  toISO,
} from "../lib/compliance.js";

const item = (key) => ONEOFFS.find((entry) => entry.key === key);
const recurring = (key) => RECURRING.find((entry) => entry.key === key);

test("month arithmetic clamps leap-day deadlines to February", () => {
  assert.equal(toISO(addMonths(new Date(2024, 1, 29), 12)), "2025-02-28");
  assert.equal(toISO(addMonths(new Date(2024, 1, 29), 60)), "2029-02-28");
});

test("deposit deadline is based on receipt, not tenancy start", () => {
  const status = oneoffStatus(item("deposit"), false, {
    tenancyStart: "2026-06-01",
    dates: { depositReceived: "2026-06-10" },
    applicability: { deposit: true },
  });
  assert.equal(toISO(status.due), "2026-07-10");
});

test("Right to Rent and post-Act written terms have tenancy deadlines", () => {
  const property = { tenancyStart: "2026-07-20", agreementType: "written" };
  assert.equal(toISO(oneoffStatus(item("rtr"), false, property).due), "2026-07-20");
  assert.equal(toISO(oneoffStatus(item("wsot"), false, property).due), "2026-07-20");
});

test("legacy How to Rent is opt-in and pre-Act verbal terms use 31 May deadline", () => {
  const base = { tenancyStart: "2026-04-10", agreementType: "verbal" };
  assert.equal(oneoffStatus(item("howtorent"), false, base).code, "na");
  assert.equal(toISO(oneoffStatus(item("wsot"), false, base).due), "2026-05-31");
});

test("gas-free property and registered EPC exemption are not applicable", () => {
  assert.equal(recurringStatus({ applicability: { gas: false } }, recurring("gas")).code, "na");
  assert.equal(recurringStatus({ applicability: { epcExempt: true } }, recurring("epc")).code, "na");
});

