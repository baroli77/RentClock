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
    months: 24,
    note: "No fixed statutory interval — every 2 years is widely used good practice.",
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
    deadlineFromTenancy: 0,
    perTenancy: true,
    note: "Check every adult occupier before the tenancy starts and retain evidence for the required period.",
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
    deadlineFromTenancy: 0,
    postRraOrPreRraVerbal: true,
    note: "Required before post-1 May 2026 tenancies; pre-existing verbal tenancies also needed written terms by 31 May 2026.",
  },
  {
    key: "rtrfollow",
    label: "Right to Rent follow-up check",
    userDateField: "rtrFollowUpDue",
    note: "Only set this where an occupier has time-limited status. RentClock will remind you before the follow-up date.",
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
  let base = last;
  let anchored = false;
  if (item.key === "gas" && prop.anchors?.gas) {
    const a = parseISO(prop.anchors.gas);
    // A preserved expiry can only legitimately sit 0-61 days after the
    // inspection date. Anything else is stale data - ignore it.
    const gapFromLast = a ? Math.round((a.getTime() - last.getTime()) / DAY) : -1;
    if (a && gapFromLast >= 0 && gapFromLast <= 61) {
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
  const tenancyStartISO = prop.tenancyStart;
  const ts = parseISO(tenancyStartISO);
  const rra = parseISO(RRA_COMMENCEMENT);

  if (item.key === "deposit" && prop.applicability?.deposit === false) {
    return { code: "na", due: null, days: null };
  }
  if (item.legacyOptIn && prop.applicability?.howtorent !== true) {
    return { code: "na", due: null, days: null };
  }
  if (item.preRraWrittenOnly) {
    if (!ts || ts >= rra || prop.agreementType === "verbal") {
      return { code: "na", due: null, days: null };
    }
  }
  if (item.postRraOrPreRraVerbal) {
    const preRraVerbal = ts && ts < rra && prop.agreementType === "verbal";
    const postRra = ts && ts >= rra;
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
  if (item.deadlineFromTenancy !== undefined) { // zero means due on tenancy start
    if (ts) due = addDays(ts, item.deadlineFromTenancy);
  }
  if (item.postRraOrPreRraVerbal && ts && ts < rra) {
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
  return out;
}
