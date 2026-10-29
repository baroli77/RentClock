'use client';
import { useState } from 'react';
import { previewPropertyCSV, propertiesCSV, PROPERTY_CSV_TEMPLATE } from '@/lib/property-csv';
import { propertyRecordHtml, safeFilename } from '@/lib/property-records';
export function downloadBlob(content,name,type) {
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function PortfolioTools({properties,canEdit,onImported,beforeExport,demo=false}) {
 const [csv,setCSV]=useState('');const [preview,setPreview]=useState(null);const [batchId,setBatchId]=useState('');
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');const [packId,setPackId]=useState('');
 async function readFile(event) {
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  setError('');setMessage('');setPreview(null);
  try {if(file.size>1024*1024)throw new Error('Choose a CSV under 1 MB.');const text=await file.text();setCSV(text);setPreview(previewPropertyCSV(text,properties.map(p=>p.address || '')));setBatchId(crypto.randomUUID());}
  catch(e){setError(e.message);}
 }
 async function confirmImport() {
  setBusy(true);setError('');
  try {
   let result;
   if(demo) result={properties:preview.properties.map((p,i)=>({...p,id:`demo-import-${i}-${Date.now()}`})),skipped:preview.skipped.length};
   else {const res=await fetch('/api/properties/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csv,batchId})});result=await res.json();if(!res.ok)throw new Error(result.error || 'Import failed');}
   onImported(result.properties);setMessage(`${result.properties.length} properties imported. ${result.skipped} duplicate rows skipped.`);setPreview(null);setCSV('');
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function exportPack() {
  if(!packId)return;
  setBusy(true);setError('');setMessage('Preparing property record…');
  try {
   if(demo)throw new Error('Document packs are available in your own account. Demo certificates are fictional.');
   if(beforeExport && !(await beforeExport()))throw new Error('Save your latest changes before exporting.');
   const res=await fetch(`/api/properties/${encodeURIComponent(packId)}/export`,{cache:'no-store'});const data=await res.json();if(!res.ok)throw new Error(data.error || 'Could not prepare the export');
   const files={};const enc=new TextEncoder();let bytes=0;
   files['property-record.html']=enc.encode(propertyRecordHtml(data.property,data.records,data.exportedAt));
   files['property.json']=enc.encode(JSON.stringify({exportedAt:data.exportedAt,property:data.property,records:data.records},null,2));
   files['dates.csv']=enc.encode(propertiesCSV([data.property]));
   for(let i=0;i<data.documents.length;i++) {
    const doc=data.documents[i];setMessage(`Downloading document ${i+1} of ${data.documents.length}…`);
    const response=await fetch(doc.url,{credentials:'omit'});if(!response.ok)throw new Error(`Could not download ${doc.name}. No incomplete pack was created.`);
    const content=new Uint8Array(await response.arrayBuffer());bytes+=content.byteLength;if(bytes>30*1024*1024)throw new Error('The documents exceed the 30 MB pack limit. Download larger files individually.');
    files[`documents/${String(i+1).padStart(2,'0')}-${safeFilename(doc.name)}`]=content;
   }
   const {zipSync}=await import('fflate');const archive=zipSync(files,{level:0});
   downloadBlob(archive,`${safeFilename(data.property.name)}-records.zip`,'application/zip');setMessage('Property pack downloaded. Open property-record.html to view or print the summary.');
  }catch(e){setError(e.message);setMessage('');}finally{setBusy(false);}
 }
 return <section className="card portfolio-tools" aria-labelledby="portfolio-tools"><div className="eyebrow" id="portfolio-tools">Import and export</div>
  <div className="workflow-actions"><button className="btn ghost sm" disabled={busy || !properties.length} onClick={()=>downloadBlob(propertiesCSV(properties),'rentclock-properties.csv','text/csv;charset=utf-8')}>Export dates as CSV</button>
   {canEdit && <><label className="btn ghost sm">Preview CSV import<input type="file" accept=".csv,text/csv" hidden disabled={busy} onChange={readFile}/></label><button className="btn ghost sm" disabled={busy} onClick={()=>downloadBlob(PROPERTY_CSV_TEMPLATE,'rentclock-import-template.csv','text/csv;charset=utf-8')}>Download import template</button></>}
  </div>
  {properties.length>0 && <div className="workflow-actions"><label>Property record pack<select value={packId} onChange={e=>setPackId(e.target.value)}><option value="">Choose a property</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="btn ghost sm" disabled={busy || !packId || packId.startsWith('tmp-')} onClick={exportPack}>{busy?'Working…':'Download ZIP pack'}</button></div>}
  <p className="workflow-note">CSV imports add new properties and skip existing addresses. Dates must use YYYY-MM-DD. Use a region slug such as west-midlands or london, or its full English region name. Packs contain the recorded dates and original attachments, with a printable summary.</p>
  {preview && <div className="import-preview" role="region" aria-label="CSV import preview"><h3>Review before importing</h3><p>{preview.properties.length} new properties · {preview.skipped.length} duplicate rows skipped · {preview.errors.length} errors</p>
   {preview.errors.length>0 && <ul className="trial-error">{preview.errors.map(e=><li key={e}>{e}</li>)}</ul>}
   {preview.properties.length>0 && <div className="table-scroll"><table><thead><tr><th>Name</th><th>Address</th><th>Gas last done</th><th>EPC band</th></tr></thead><tbody>{preview.properties.map((p,i)=><tr key={i}><td>{p.name}</td><td>{p.address}</td><td>{p.dates.gas || 'Not recorded'}</td><td>{p.epcBand || 'Not recorded'}</td></tr>)}</tbody></table></div>}
   <div className="workflow-actions"><button className="btn primary sm" disabled={busy || preview.errors.length>0 || !preview.properties.length} onClick={confirmImport}>{busy?'Importing…':`Import ${preview.properties.length} properties`}</button><button className="btn ghost sm" disabled={busy} onClick={()=>{setPreview(null);setCSV('');}}>Cancel import</button></div>
  </div>}
  {error && <p className="trial-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
 </section>;
}
