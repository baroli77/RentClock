function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function formatDate(date) {
  return date?.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }) || "";
}

export function addDays(value, days) {
  const date = parseDate(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export function addYears(value, years) {
  const date = parseDate(value);
  if (!date) return null;
  const month = date.getUTCMonth();
  date.setUTCFullYear(date.getUTCFullYear() + years);
  if (date.getUTCMonth() !== month) date.setUTCDate(0);
  return date;
}

export function subtractCalendarMonths(value, months) {
  const date = parseDate(value);
  if (!date) return null;
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date;
}

export function gasSafetyWindow(deadline) {
  const due = parseDate(deadline);
  return due ? { earliestRetainedDeadlineCheck: subtractCalendarMonths(deadline, 2), deadline: due } : null;
}

export function eicrNextInspection(reportDate, earlierDate) {
  const report = parseDate(reportDate);
  if (!report) return null;
  const fiveYears = addYears(reportDate, 5);
  const earlier = parseDate(earlierDate);
  return earlier && earlier < fiveYears ? earlier : fiveYears;
}

export function depositProtectionDeadline(receivedDate) { return addDays(receivedDate, 30); }

export function rightToRentFollowUp(expiryDate) {
  const expiry = parseDate(expiryDate);
  return expiry ? { reminder: addDays(expiryDate, -28), completeBefore: expiry } : null;
}
