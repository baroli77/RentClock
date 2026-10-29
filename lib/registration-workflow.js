import { registrationDeadline } from './registration.js';
import { addDays, parseISO, today, toISO, daysUntil, RECURRING, recurringStatus } from './compliance.js';

export function registrationInitialDue(property) {
  return property.dates?.prsdbDue || registrationDeadline(property.registration?.region)?.deadline || '';
}
export function registrationTasks(property, renewalDue = '') {
  const reg = property.registration || {};
  if (reg.notRequired) return [];
  const registered = parseISO(reg.registeredOn);
  if (!registered) return [];
  const tasks = [];
  function add(key, label, due, done = false) {
    const parsed = parseISO(due);
    if (!parsed) return;
    const days = daysUntil(parsed);
    tasks.push({ item: { key, label }, st: { due: parsed, days, code: done ? 'ok' : days < 0 ? 'overdue' : days <= 60 ? 'soon' : 'todo' } });
  }
  add('registration-information', 'Complete registration information', toISO(addDays(registered, 28)), Boolean(reg.informationCompletedOn));
  add('registration-renewal', 'Annual registration renewal', renewalDue);
  if ((reg.changeRevision || 0) > (reg.syncedRevision || 0)) add('registration-update', 'Update the government property record', reg.changeDate ? toISO(addDays(parseISO(reg.changeDate), 28)) : '');
  for (const item of RECURRING.filter(i=>['gas','eicr','epc'].includes(i.key))) {
    const status=recurringStatus(property,item);
    if(status.due && status.days<0 && status.due>=registered && (!reg.lastUpdatedOn || toISO(status.due)>reg.lastUpdatedOn)) {
      add(`registration-expiry-${item.key}`, `Update government record: ${item.label} expired`,toISO(addDays(status.due,28)));
    }
  }
  return tasks;
}
function relevantRecord(property) {
  const fields = { address: property.address || '', details: property.propertyDetails || {}, dates: {}, epcBand: property.epcBand || '' };
  for (const key of ['gas','eicr','eicrNextDue','epc']) fields.dates[key] = property.dates?.[key] || '';
  fields.documents = (property.docs || []).filter(d => ['gas','eicr','epc','prsdb'].includes(d.itemKey)).map(d => d.path).sort();
  return JSON.stringify(fields);
}
export function markRegistrationChange(previous, next, date = toISO(today())) {
  if (!previous?.registration?.registeredOn || next.registration?.notRequired || relevantRecord(previous) === relevantRecord(next)) return next;
  const reg = previous.registration;
  const pending = (reg.changeRevision || 0) > (reg.syncedRevision || 0);
  return { ...next, registration: { ...next.registration, changeRevision: (reg.changeRevision || 0) + 1, changeDate: pending ? reg.changeDate || date : date } };
}
