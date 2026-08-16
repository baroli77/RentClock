// ---------------------------------------------------------------------------
// RentClock compliance rules & status logic (England).
// Pure JS — shared by the dashboard UI and the reminder cron.
// ---------------------------------------------------------------------------

export const RECURRING = [
  {
    key: "gas",
    label: "Gas Safety Certificate (CP12)",
    months: 12,
    note: "Annual check by a Gas Safe registered engineer. Renew in the final 2 months and your original expiry date is preserved.",
    fixLabel: "Find a Gas Safe engineer",
    fixUrl: "https://www.gassaferegister.co.uk/find-an-engineer/",
  },
  {
    key: "eicr",
    label: "Electrical Safety Report (EICR)",
    months: 60,
    note: "Required at least every 5 years, or sooner if the latest report specifies an earlier date. Give tenants a copy within 28 days of the inspection.",
    fixLabel: "Find a registered electrician",
    fixUrl: "https://electricalcompetentperson.co.uk/",
  },
  {
    key: "epc",
    label: "Energy Performance Certificate (EPC)",
    months: 120,
    note: "Valid for 10 years. Minimum band E to let the property.",
    fixLabel: "Get a new EPC",
    fixUrl: "https://www.gov.uk/get-new-energy-certificate",
    hasBand: true,
  },
  {
    key: "legionella",
    label: "Legionella risk assessment",
    eventBased: true,
    note: "Review when the water system, occupancy or risk changes. The law does not set an annual or biennial renewal interval.",
    recommended: true,
  },
];

export const RRA_COMMENCEMENT = "2026-05-01";
export const RRA_INFO_SHEET_DEADLINE = "2026-05-31";

export const ONEOFFS = [
  {
    key: "deposit",
    label: "Deposit protected & prescribed information served",
    deadlineFromField: "depositReceived",
    deadlineDays: 30,
    perTenancy: true,
    note: "Within 30 days of receiving the deposit. Unprotected deposits mean 1\u20133x penalties and possession headaches.",
  },
  {
    key: "rtr",
    label: "Right to Rent checks completed",
    deadlineFromAgreement: true,
    perTenancy: true,
    note: "Check every adult occupier before the tenancy is agreed (limited exceptions apply for an occupier overseas) and retain evidence for the required period.",
  },
  {
    key: "howtorent",
    label: "Historic \u2018How to Rent\u2019 guide record",
    legacyOptIn: true,
    note: "Only relevant where you need evidence of the guide served for a pre-1 May 2026 Section 21 case. The guide was withdrawn on 1 May 2026.",
  },
  {
    key: "alarms",
    label: "Smoke & carbon monoxide alarms checked",
    deadlineFromTenancy: 0,
    perTenancy: true,
    note: "Required at the start of each tenancy. Tenants should test regularly and report faults; repair or replace faulty alarms promptly.",
  },
  {
    key: "infosheet",
    label: "Renters\u2019 Rights Act information sheet given",
    fixedDeadline: RRA_INFO_SHEET_DEADLINE,
    preRraWrittenOnly: true,
    note: "For written tenancies already in place before 1 May 2026. The deadline was 31 May 2026.",
  },
  {
    key: "wsot",
    label: "Written statement of terms provided",
    perTenancy: true,
    deadlineFromAgreement: true,
    postRraOrPreRraVerbal: true,
    note: "For tenancies agreed on or after 1 May 2026, provide the required written information before signing or orally agreeing the tenancy. Pre-existing verbal tenancies had a 31 May 2026 deadline.",
  },
  {
    key: "prsdb",
    label: "PRS database registration",
    pending: true,
    note: "National landlord database rollout expected from late 2026. Registration isn\u2019t open yet \u2014 RentClock will track it.",
  },
];

export const EPC_BANDS = ["A", "B", "C", "D", "E", "F", "G"];

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export const DAY = 86400000;

export function today() {
  // Pinned to Europe/London: statutory deadlines are UK calendar dates, and
  // servers (Vercel = UTC) disagree with the UK for an hour a day during BST.
  // en-CA locale formats as YYYY-MM-DD, which parseISO understands.
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
  return parseISO(iso);
}

export function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function toISO(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function addMonths(date, months) {
  // Clamp to the final day of the target month. Native Date rollover turns
  // 29 Feb + 12 months into 1 Mar, which can make a legal deadline a day late.
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY);
}

export function daysUntil(date) {
  return Math.round((date.getTime() - today().getTime()) / DAY);
}

export function fmt(date) {
  if (!date) return "\u2014";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Status model
// ---------------------------------------------------------------------------

export function recurringStatus(prop, item) {
  if (item.key === "gas" && prop.applicability?.gas === false) {
    return { code: "na", due: null, days: null, anchored: false };
  }
  if (item.key === "epc" && prop.applicability?.epcExempt === true) {
    return { code: "na", due: null, days: null, anchored: false };
  }
  const lastISO = prop.dates?.[item.key];
  const last = parseISO(lastISO);
  if (!last) return { code: "missing", due: null, days: null, anchored: false };
  if (item.eventBased) {
    return { code: "ok", due: null, days: null, anchored: false };
  }
  let base = last;
  let anchored = false;
  if (item.key === "gas" && prop.anchors?.gas) {
    const a = parseISO(prop.anchors.gas);
    // The statutory window is two calendar months, not a fixed number of
    // days. That matters around 31-day months (30 Nov to 31 Jan is 62 days).
    const windowStart = a ? addMonths(a, -2) : null;
    if (a && windowStart && last >= windowStart && last <= a) {
      base = a;
      anchored = true;
    }
  }
  const override = item.key === "eicr" ? parseISO(prop.dates?.eicrNextDue) : null;
  const due = override && override > last ? override : addMonths(base, item.months);
  const days = daysUntil(due);
  let code = "ok";
  if (days < 0) code = "overdue";
  else if (days <= 60) code = "soon";
  return { code, due, days, anchored };
}

export function oneoffStatus(item, done, property) {
  // Keep compatibility with older callers/tests that passed only a date.
  const prop = typeof property === "string" ? { tenancyStart: property } : property || {};
  const ts = parseISO(prop.tenancyStart);
  // The Renters' Rights Act duties attach to when the tenancy is created,
  // which can be earlier than the move-in date. Fall back for legacy records.
  const agreement = parseISO(prop.agreementDate) || ts;
  const rra = parseISO(RRA_COMMENCEMENT);

  if (item.key === "deposit" && prop.applicability?.deposit === false) {
    return { code: "na", due: null, days: null };
  }
  if (item.legacyOptIn && prop.applicability?.howtorent !== true) {
    return { code: "na", due: null, days: null };
  }
  if (item.preRraWrittenOnly) {
    if (!agreement || agreement >= rra || prop.agreementType === "verbal") {
      return { code: "na", due: null, days: null };
    }
  }
  if (item.postRraOrPreRraVerbal) {
    const preRraVerbal = agreement && agreement < rra && prop.agreementType === "verbal";
    const postRra = agreement && agreement >= rra;
    if (!preRraVerbal && !postRra) return { code: "na", due: null, days: null };
  }
  if (item.userDateField && !prop.dates?.[item.userDateField]) {
    return { code: "na", due: null, days: null };
  }
  if (item.pending && !done) return { code: "pending", due: null, days: null };
  let due = null;
  if (item.fixedDeadline) due = parseISO(item.fixedDeadline);
  if (item.deadlineFromField) {
    const base = parseISO(prop.dates?.[item.deadlineFromField]);
    if (base) due = addDays(base, item.deadlineDays || 0);
  }
  if (item.userDateField) due = parseISO(prop.dates?.[item.userDateField]);
  if (item.deadlineFromAgreement && agreement) due = agreement;
  if (item.deadlineFromTenancy !== undefined) { // zero means due on tenancy start
    if (ts) due = addDays(ts, item.deadlineFromTenancy);
  }
  if (item.postRraOrPreRraVerbal && agreement && agreement < rra) {
    due = parseISO(RRA_INFO_SHEET_DEADLINE);
  }
  if (done) return { code: "ok", due, days: due ? daysUntil(due) : null };
  if (due) {
    const days = daysUntil(due);
    if (days < 0) return { code: "overdue", due, days };
    if (days <= 60) return { code: "soon", due, days };
  }
  return { code: "todo", due, days: due ? daysUntil(due) : null };
}

export function rightToRentOccupiers(prop) {
  const record = prop?.rightToRent || {};
  if (Array.isArray(record.occupiers)) return record.occupiers;
  if (!record.occupierName && !record.method && !record.checkedOn && !record.notes) return [];
  return [{
    id: "legacy",
    name: record.occupierName || "",
    method: record.method || "",
    checkedOn: record.checkedOn || "",
    followUpDue: prop?.dates?.rtrFollowUpDue || "",
    notes: record.notes || "",
  }];
}

export function rightToRentFollowUps(prop) {
  return rightToRentOccupiers(prop).flatMap((occupier) => {
    const due = parseISO(occupier.followUpDue);
    if (!due) return [];
    const days = daysUntil(due);
    return [{
      item: {
        key: `rtrfollow-${occupier.id || occupier.name || "occupier"}`,
        label: `Right to Rent follow-up${occupier.name ? ` — ${occupier.name}` : ""}`,
      },
      st: {
        code: days < 0 ? "overdue" : days <= 60 ? "soon" : "ok",
        due,
        days,
      },
    }];
  });
}

export const STATUS_META = {
  overdue: { label: "OVERDUE", cls: "st-overdue" },
  soon: { label: "DUE SOON", cls: "st-soon" },
  ok: { label: "COMPLIANT", cls: "st-ok" },
  missing: { label: "NOT RECORDED", cls: "st-missing" },
  todo: { label: "TO DO", cls: "st-missing" },
  pending: { label: "NOT YET OPEN", cls: "st-pending" },
  na: { label: "N/A", cls: "st-pending" },
};

// All dated, not-yet-compliant items for a property — used by the cron.
// Recurring certificates with no date recorded — the silent danger state.
export function missingItems(prop) {
  const out = [];
  for (const item of RECURRING) {
    if (item.recommended) continue; // don't nag about optional good-practice items
    if (recurringStatus(prop, item).code === "missing") out.push({ item });
  }
  const deposit = ONEOFFS.find((item) => item.key === "deposit");
  if (
    prop.applicability?.deposit !== false &&
    !prop.checks?.deposit &&
    !prop.dates?.depositReceived
  ) {
    out.push({ item: { ...deposit, key: "deposit-date", label: "Deposit received date not recorded" } });
  }
  return out;
}

export function datedItems(prop) {
  const out = [];
  for (const item of RECURRING) {
    const st = recurringStatus(prop, item);
    // Includes both "overdue" and "soon" (<=60 days) items.
    if (st.due && st.code !== "ok") out.push({ item, st });
  }
  for (const item of ONEOFFS) {
    const st = oneoffStatus(item, prop.checks?.[item.key], prop);
    if (st.due && !["ok", "na", "pending"].includes(st.code)) out.push({ item, st });
  }
  for (const followUp of rightToRentFollowUps(prop)) {
    if (followUp.st.code !== "ok") out.push(followUp);
  }
  return out;
}
