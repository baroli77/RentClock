import { REGISTRATION_REGIONS } from './registration.js';
export const CSV_COLUMNS = ['name','address','gas_last_done','eicr_last_done','eicr_next_due','epc_last_done','epc_band','tenancy_start','agreement_date','deposit_received','gas_applies','deposit_taken','epc_exempt','registration_region'];
export function validISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value && Number(value.slice(0,4)) >= 1900;
}
export function parseCSV(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 1024 * 1024) throw new Error('Choose a CSV file under 1 MB.');
  const rows = []; let row = []; let field = ''; let quoted = false; let closed = false;
  text = text.replace(/^\uFEFF/,'');
  for (let i=0;i<text.length;i++) {
    const char=text[i];
    if (quoted) {
      if (char==='"' && text[i+1]==='"') { field+='"'; i++; }
      else if (char==='"') { quoted=false; closed=true; }
      else field+=char;
    } else if (char==='"') {
      if (field || closed) throw new Error('Unexpected quote in CSV. Export it again with comma-separated columns.');
      quoted=true;
    } else if (char===',' || char==='\n' || char==='\r') {
      row.push(field); field=''; closed=false;
      if (char!==',') {
        if (row.some(v=>v.trim())) rows.push(row);
        row=[]; if (char==='\r' && text[i+1]==='\n') i++;
      }
    } else {
      if (closed && !/\s/.test(char)) throw new Error('Unexpected text after a quoted CSV field.');
      if (!closed) field+=char;
    }
  }
  if (quoted) throw new Error('A quoted CSV field was not closed.');
  row.push(field); if (row.some(v=>v.trim())) rows.push(row);
  if (rows.length>251) throw new Error('Import up to 250 properties at a time.');
  return rows;
}
const normalHeader = (s) => s.trim().toLowerCase().replace(/[\s-]+/g,'_');
export function previewPropertyCSV(text, existingAddresses = []) {
  const [headers,...rows] = parseCSV(text);
  if (!headers || !rows.length) throw new Error('The CSV needs a header row and at least one property.');
  const columns=headers.map(normalHeader);
  if (new Set(columns).size!==columns.length) throw new Error('The CSV has duplicate column headings.');
  if (!columns.includes('address')) throw new Error('Add an address column. Download the template for the supported headings.');
  const unknown=columns.filter(c=>!CSV_COLUMNS.includes(c));
  if (unknown.length) throw new Error(`Unsupported columns: ${unknown.join(', ')}. Use the template headings.`);
  const seen=new Set(existingAddresses.map(v=>v.trim().toLowerCase()));
  const result=[]; const errors=[]; const skipped=[];
  const dateColumns={gas_last_done:'gas',eicr_last_done:'eicr',eicr_next_due:'eicrNextDue',epc_last_done:'epc',deposit_received:'depositReceived'};
  rows.forEach((values,index)=>{
    const number=index+2;
    if (values.length!==columns.length) { errors.push(`Row ${number}: column count does not match the header.`); return; }
    const data=Object.fromEntries(columns.map((key,i)=>[key,values[i].trim()]));
    if (!data.address || data.address.length>500) { errors.push(`Row ${number}: enter an address of up to 500 characters.`); return; }
    const badDate=[...Object.keys(dateColumns),'tenancy_start','agreement_date'].find(key=>data[key] && !validISO(data[key]));
    if (badDate) { errors.push(`Row ${number}: ${badDate} must be a real date in YYYY-MM-DD format.`); return; }
    const badBool=['gas_applies','deposit_taken','epc_exempt'].find(key=>data[key] && !['yes','no','true','false'].includes(data[key].toLowerCase()));
    if (badBool) { errors.push(`Row ${number}: ${badBool} must be yes or no.`); return; }
    if (data.epc_band && !/^[A-G]$/i.test(data.epc_band)) { errors.push(`Row ${number}: EPC band must be A–G.`); return; }
    const region=data.registration_region ? REGISTRATION_REGIONS.find(r=>[r.id,r.name.toLowerCase()].includes(data.registration_region.toLowerCase())) : null;
    if (data.registration_region && !region) { errors.push(`Row ${number}: registration_region must be an English region from the template notes.`); return; }
    if (seen.has(data.address.toLowerCase())) { skipped.push(number); return; }
    seen.add(data.address.toLowerCase());
    const yes=(key,fallback)=>data[key] ? ['yes','true'].includes(data[key].toLowerCase()) : fallback;
    const dates=Object.fromEntries(Object.entries(dateColumns).filter(([key])=>data[key]).map(([key,name])=>[name,data[key]]));
    if (dates.eicr && dates.eicrNextDue && dates.eicrNextDue<=dates.eicr) { errors.push(`Row ${number}: the next EICR date must be after its inspection.`); return; }
    result.push({name:data.name || data.address,address:data.address,tenancyStart:data.tenancy_start || '',agreementDate:data.agreement_date || '',agreementType:'written',dates,checks:{},anchors:{},docs:[],epcBand:(data.epc_band || '').toUpperCase(),propertyDetails:{occupied:true},applicability:{gas:yes('gas_applies',true),deposit:yes('deposit_taken',true),epcExempt:yes('epc_exempt',false),howtorent:false},registration:{region:region?.id || ''},rightToRent:{occupiers:[]}});
  });
  return { properties:result, errors, skipped, total:rows.length };
}
export function csvCell(value) {
  let text=String(value ?? '');
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function propertiesCSV(properties) {
  const lines=[CSV_COLUMNS];
  for(const p of properties) lines.push([p.name,p.address,p.dates?.gas,p.dates?.eicr,p.dates?.eicrNextDue,p.dates?.epc,p.epcBand,p.tenancyStart,p.agreementDate,p.dates?.depositReceived,p.applicability?.gas===false?'no':'yes',p.applicability?.deposit===false?'no':'yes',p.applicability?.epcExempt?'yes':'no',p.registration?.region]);
  return '\uFEFF'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
export const PROPERTY_CSV_TEMPLATE = CSV_COLUMNS.join(',')+'\r\nExample flat,"1 Example Road, Stafford",2026-06-10,2025-04-01,,2024-03-01,C,2026-07-01,2026-06-20,2026-06-20,yes,yes,no,west-midlands\r\n';
