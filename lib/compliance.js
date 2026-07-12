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
    note: "Required at least every 5 years. Give tenants a copy within 28 days of the inspection.",
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
    key: "alarms",
    label: "Smoke & carbon monoxide alarm check",
    months: 12,
    note: "Alarms must work at the start of every tenancy. An annual test keeps you covered.",
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
    deadlineFromTenancy: 30,
    perTenancy: true,
    note: "Within 30 days of receiving the deposit. Unprotected deposits mean 1\u20133x penalties and possession headaches.",
  },
  {
    key: "rtr",
    label: "Right to Rent checks completed",
    perTenancy: true,
    note: "Check every adult occupier before the tenancy starts. Keep copies.",
  },
  {
    key: "howtorent",
    label: "\u2018How to Rent\u2019 guide given to tenant",
    perTenancy: true,
    note: "Latest government version, at the start of the tenancy.",
  },
  {
    key: "infosheet",
    label: "Renters\u2019 Rights Act information sheet given",
    fixedDeadline: RRA_INFO_SHEET_DEADLINE,
    preRraOnly: true,
    note: "Required for tenancies that existed before 1 May 2026. Deadline was 31 May 2026 \u2014 penalties up to \u00a37,000.",
  },
  {
    key: "wsot",
    label: "Written statement of terms provided",
    perTenancy: true,
    note: "Required before new tenancies entered into from 1 May 2026.",
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
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
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
  const due = addMonths(base, item.months);
  const days = daysUntil(due);
  let code = "ok";
  if (days < 0) code = "overdue";
  else if (days <= 60) code = "soon";
  return { code, due, days, anchored };
}

export function oneoffStatus(item, done, tenancyStartISO) {
  if (item.preRraOnly) {
    const ts = parseISO(tenancyStartISO);
    const rra = parseISO(RRA_COMMENCEMENT);
    // Only applies to tenancies that predate the RRA. If the tenancy started
    // on/after commencement — or we don't yet know the date — it's not owed,
    // so don't stamp a brand-new blank property as OVERDUE.
    if (!ts || ts >= rra) return { code: "na", due: null, days: null };
  }
  if (item.pending && !done) return { code: "pending", due: null, days: null };
  let due = null;
  if (item.fixedDeadline) due = parseISO(item.fixedDeadline);
  if (item.deadlineFromTenancy) {
    const ts = parseISO(tenancyStartISO);
    if (ts) due = addDays(ts, item.deadlineFromTenancy);
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
    const st = oneoffStatus(item, prop.checks?.[item.key], prop.tenancyStart);
    if (st.due && !["ok", "na", "pending"].includes(st.code)) out.push({ item, st });
  }
  return out;
}
