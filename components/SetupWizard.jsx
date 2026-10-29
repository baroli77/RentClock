'use client';
import { useState } from 'react';
import { emptyProperty, nextReminderPlan } from '@/lib/onboarding';
import { RECURRING, today, toISO } from '@/lib/compliance';
export default function SetupWizard({initialProperty,onPersist,onComplete,onCancel,demo=false}) {
 const [property,setProperty]=useState(()=>initialProperty || emptyProperty());
 const [step,setStep]=useState(initialProperty?.setup?.step || 1);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const patch=values=>setProperty(p=>({...p,...values}));
 const date=(key,value)=>setProperty(p=>({...p,dates:{...p.dates,[key]:value}}));
 async function advance() {
  setBusy(true);setError('');
  try {
   if(!property.address.trim())throw new Error('Enter the full property address.');
   const nextStep=step+1;const saved=await onPersist({...property,name:property.name.trim() || property.address.trim(),setup:{step:nextStep,completed:nextStep===4}});
   setProperty(saved);setStep(nextStep);
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function upload(event) {
  const file=event.target.files?.[0];event.target.value='';if(!file)return;setBusy(true);setError('');
  try {
   const form=new FormData();form.append('file',file);form.append('itemKey',property.applicability?.gas===false?'eicr':'gas');const res=await fetch('/api/docs',{method:'POST',body:form});const data=await res.json();if(!res.ok)throw new Error(data.error || 'Upload failed');
   const next={...property,docs:[...(property.docs || []),{id:crypto.randomUUID(),itemKey:property.applicability?.gas===false?'eicr':'gas',name:data.name,size:data.size,path:data.path,added:toISO(today())}]};
   setProperty(next);const saved=await onPersist(next);setProperty(saved);
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 const plan=nextReminderPlan(property);
 return <section className="card setup-wizard" aria-labelledby="setup-heading"><p className="eyebrow">Guided property setup · step {step} of 4</p><progress value={step} max="4" aria-label="Setup progress"/>
  <h2 id="setup-heading">{['','Add your property','Record your certificate dates','Keep a certificate with the property','Your property is saved'][step]}</h2>
  {step===1 && <div className="form-grid"><label><span className="lbl">Full property address</span><input value={property.address} onChange={e=>patch({address:e.target.value})} autoComplete="street-address" maxLength={500}/></label><label><span className="lbl">Nickname (optional)</span><input value={property.name} onChange={e=>patch({name:e.target.value})} maxLength={200}/></label><label><span className="lbl">Tenancy start (if known)</span><input type="date" value={property.tenancyStart} onChange={e=>patch({tenancyStart:e.target.value})}/></label><label><span className="lbl">Agreement date (if known)</span><input type="date" value={property.agreementDate} onChange={e=>patch({agreementDate:e.target.value})}/></label></div>}
  {step===2 && <><p>Use the actual certificate dates. You can leave unknown dates blank and add them later.</p><div className="workflow-actions"><label className="check-wrap"><input type="checkbox" checked={property.applicability?.gas!==false} onChange={e=>patch({applicability:{...property.applicability,gas:e.target.checked}})}/>Gas appliances supplied</label><label className="check-wrap"><input type="checkbox" checked={property.applicability?.epcExempt===true} onChange={e=>patch({applicability:{...property.applicability,epcExempt:e.target.checked}})}/>Registered EPC exemption</label></div><div className="form-grid">{RECURRING.filter(item=>['gas','eicr','epc'].includes(item.key)).map(item=><label key={item.key}><span className="lbl">{item.label} — last done</span><input type="date" disabled={(item.key==='gas' && property.applicability?.gas===false)||(item.key==='epc' && property.applicability?.epcExempt)} value={property.dates?.[item.key] || ''} onChange={e=>date(item.key,e.target.value)}/></label>)}<label><span className="lbl">Earlier EICR next-inspection date (if stated)</span><input type="date" value={property.dates?.eicrNextDue || ''} onChange={e=>date('eicrNextDue',e.target.value)}/></label><label><span className="lbl">EPC band</span><select value={property.epcBand || ''} onChange={e=>patch({epcBand:e.target.value})}><option value="">Not recorded</option>{'ABCDEFG'.split('').map(b=><option key={b}>{b}</option>)}</select></label></div></>}
  {step===3 && <><p>Attach your {property.applicability?.gas===false?'electrical safety report':'gas safety certificate'} now, or continue and attach it later. PDF, JPEG, PNG and WebP files up to 5 MB are supported.</p>{demo?<button className="btn ghost" onClick={()=>patch({docs:[{id:'demo-upload',name:'Example gas safety record.pdf',path:'demo/sample.pdf',itemKey:'gas',size:1200,added:toISO(today())}]})}>Attach a fictional sample certificate</button>:<label className="btn ghost">Upload certificate<input type="file" accept=".pdf,image/jpeg,image/png,image/webp" hidden onChange={upload} disabled={busy}/></label>}<ul>{property.docs?.map(d=><li key={d.id}>{d.name} — recorded with this property</li>)}</ul></>}
  {step===4 && <><p><b>{property.name}</b> has been saved. {property.docs?.length?'A supporting document is attached.':'No certificate is attached yet; you can add it in the property ledger.'}</p>{plan?<div className="setup-success"><b>{plan.label}</b><p>Next recorded deadline: {plan.due}{plan.overdue?' — already overdue; act now.':'.'}</p><p>Expected next deadline reminder: {plan.expectedReminder}, from the daily scheduled run. Missing-date reminders are checked separately each Monday.</p></div>:<p>Add your certificate dates in the ledger to enable deadline reminders.</p>}<p className="workflow-note">This confirms your records were saved. Check missing items, local licensing and any other duties that apply.</p><button className="btn primary" onClick={()=>onComplete(property)}>Open this property</button></>}
  {error && <p className="trial-error" role="alert">{error}</p>}
  {step<4 && <div className="workflow-actions"><button className="btn primary" disabled={busy} onClick={advance}>{busy?'Saving…':step===3?'Finish setup':'Save and continue'}</button>{step>1 && <button className="btn ghost" disabled={busy} onClick={()=>setStep(s=>s-1)}>Back</button>}<button className="btn ghost" disabled={busy} onClick={()=>onCancel(property.id)}>{step===1?'Cancel':'Finish later'}</button></div>}
 </section>;
}
