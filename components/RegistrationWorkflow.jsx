'use client';
import { useEffect, useState } from 'react';
import { REGISTRATION_REGIONS, REGISTRATION_SOURCE, registrationDeadline } from '@/lib/registration';
import { registrationInitialDue, registrationTasks } from '@/lib/registration-workflow';
import { fmt, today, toISO } from '@/lib/compliance';
export default function RegistrationWorkflow({property,onUpdate,renewalDue,onSaveRenewal}) {
 const reg=property.registration || {};const [renewal,setRenewal]=useState(renewalDue || '');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>setRenewal(renewalDue || ''),[renewalDue]);
 const update=patch=>onUpdate({...property,registration:{...reg,...patch}});
 const tasks=registrationTasks(property,renewalDue);const due=registrationInitialDue(property);
 async function saveRenewal(){setBusy(true);setError('');try{await onSaveRenewal(renewal);}catch(e){setError(e.message);}finally{setBusy(false);}}
 function recordChange(){const date=toISO(today());const pending=(reg.changeRevision || 0)>(reg.syncedRevision || 0);update({changeRevision:(reg.changeRevision || 0)+1,changeDate:pending?reg.changeDate || date:date});}
 return <section className="registration-workflow" aria-labelledby={`registration-${property.id}`}><h3 id={`registration-${property.id}`}>Rental property registration</h3>
  <p className="workflow-note">Record what you have done in the government service. RentClock does not register or update properties on your behalf.</p>
  <label className="check-wrap compact-check"><input type="checkbox" checked={Boolean(reg.notRequired)} onChange={e=>update({notRequired:e.target.checked})}/><span>This property is outside the registration requirement</span></label>
  {!reg.notRequired && <>
   <div className="form-grid"><label><span className="lbl">Property region</span><select value={reg.region || ''} onChange={e=>onUpdate({...property,registration:{...reg,region:e.target.value},dates:{...property.dates,prsdbDue:registrationDeadline(e.target.value)?.deadline || ''}})}><option value="">Choose a region</option>{REGISTRATION_REGIONS.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label>
    <label><span className="lbl">Registration deadline</span><input type="date" value={due} onChange={e=>onUpdate({...property,dates:{...property.dates,prsdbDue:e.target.value}})}/></label>
    <label><span className="lbl">Registered on GOV.UK</span><input type="date" value={reg.registeredOn || ''} onChange={e=>onUpdate({...property,registration:{...reg,registeredOn:e.target.value},checks:{...property.checks,prsdb:Boolean(e.target.value)}})}/></label>
    <label><span className="lbl">Required information completed</span><input type="date" min={reg.registeredOn || undefined} value={reg.informationCompletedOn || ''} onChange={e=>update({informationCompletedOn:e.target.value})}/></label>
    <label><span className="lbl">Government property registration number</span><input value={reg.propertyNumber || ''} maxLength={100} onChange={e=>update({propertyNumber:e.target.value})}/></label>
   </div>
   {property.checks?.prsdb && !reg.registeredOn && <p className="workflow-note">You previously marked registration as done. Add the actual registration date to track completion of the property record.</p>}
   <div className="renewal-setting"><label><span className="lbl">Annual renewal date shown by GOV.UK — shared across your properties</span><input type="date" value={renewal} onChange={e=>setRenewal(e.target.value)}/></label><button className="btn ghost sm" disabled={busy} onClick={saveRenewal}>{busy?'Saving…':'Save common renewal date'}</button><p className="workflow-note">Use the actual common renewal date from the government service, including properties registered outside RentClock.</p></div>
   {(reg.changeRevision || 0)>(reg.syncedRevision || 0) && <label><span className="lbl">Earliest outstanding change — actual date it occurred</span><input type="date" max={toISO(today())} value={reg.changeDate || ''} onChange={e=>update({changeDate:e.target.value})}/></label>}
   {reg.registeredOn && <><div className="workflow-actions"><button className="btn ghost sm" onClick={recordChange}>Record another change to report</button>{tasks.some(t=>t.item.key==='registration-update' || t.item.key.startsWith('registration-expiry-')) && <button className="btn primary sm" onClick={()=>update({syncedRevision:reg.changeRevision,lastUpdatedOn:toISO(today())})}>I have updated the GOV.UK record</button>}</div><p className="workflow-note">Changes to the address, occupancy or safety records recorded here flag a government-record update. Other changes can be flagged using the button. Check the actual change date: the 28-day deadline runs from when the change happened, not when it was entered here. Expired certificates also flag an update. {reg.lastUpdatedOn && `Last update recorded: ${reg.lastUpdatedOn}.`}</p></>}
   {tasks.length>0 && <ul className="registration-tasks">{tasks.map(({item,st})=><li key={item.key}><b>{item.label}</b><span>{fmt(st.due)} · {st.code==='ok'?'Recorded as completed':st.days<0?`${Math.abs(st.days)} days overdue`:`${st.days} days remaining`}</span></li>)}</ul>}
  </>}
  {error && <p role="alert" className="trial-error">{error}</p>}<p className="workflow-note"><a href={REGISTRATION_SOURCE} target="_blank" rel="noreferrer">Check the official scope, deadlines and update rules ↗</a></p>
 </section>;
}
