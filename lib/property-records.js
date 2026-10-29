import { validISO } from './property-csv.js';
export function validateProperty(property,userId) {
 if(!property || typeof property!=='object' || Array.isArray(property))return 'Property object required';
 if(!String(property.name || property.address || '').trim())return 'Property name or address required';
 if(JSON.stringify(property).length>250000)return 'Property record is too large';
 for(const value of Object.values(property.dates || {}))if(value && (typeof value!=='string' || !validISO(value)))return 'Use complete, valid dates in YYYY-MM-DD format';
 for(const value of [property.tenancyStart,property.agreementDate,property.registration?.registeredOn,property.registration?.informationCompletedOn,property.registration?.lastUpdatedOn,property.registration?.changeDate])if(value && !validISO(value))return 'Enter a valid tenancy or registration date';
 const reg=property.registration || {};
 if(reg.registeredOn && reg.informationCompletedOn && reg.informationCompletedOn<reg.registeredOn)return 'Registration completion cannot be before registration';
 if(property.docs && (!Array.isArray(property.docs) || property.docs.length>100))return 'Too many attached documents';
 for(const doc of property.docs || [])if(typeof doc.path!=='string' || !doc.path.startsWith(`${userId}/`) || doc.path.split('/').some(p=>p==='..' || p==='.'))return 'Invalid document reference';
 return '';
}
export const safeFilename=(value)=>String(value || 'document').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^\.+/,'').slice(0,100) || 'document';
const escapeHtml=(value)=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function propertyRecordHtml(property,records,exportedAt) {
 return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>RentClock property record</title><style>body{font:16px system-ui;max-width:1000px;margin:40px auto;padding:0 24px;color:#17212a}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid #ddd;padding:10px}small{color:#555}@media print{body{margin:0}}</style></head><body><h1>'+escapeHtml(property.name || property.address)+'</h1><p>'+escapeHtml(property.address)+'</p><p>Exported '+escapeHtml(exportedAt)+'</p><h2>Recorded deadlines</h2><table><thead><tr><th>Record</th><th>Due</th><th>Status</th></tr></thead><tbody>'+records.map(r=>'<tr><td>'+escapeHtml(r.label)+'</td><td>'+escapeHtml(r.due || 'Not recorded')+'</td><td>'+escapeHtml(r.status)+'</td></tr>').join('')+'</tbody></table><h2>Attached documents</h2><ul>'+(property.docs || []).map(d=>'<li>'+escapeHtml(d.name)+' — '+escapeHtml(d.itemKey)+'; added '+escapeHtml(d.added || 'date not recorded')+'</li>').join('')+'</ul><p><small>This is an export of the information recorded by the account holder. It is not a certificate of compliance or proof that a document was served. Original files are in the documents folder. Open this page in a browser and print it to PDF if needed.</small></p></body></html>';
}
