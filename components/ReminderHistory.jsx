'use client';
import { useEffect, useState } from 'react';
import { DELIVERY_LABELS } from '@/lib/email-delivery';
const DEMO_ROWS=[{id:'demo-delivered',status:'delivered',subject:'RentClock: a compliance deadline needs your attention',item_count:1,requested_at:'2026-10-28T08:00:00Z'},{id:'demo-bounced',status:'bounced',subject:'RentClock: a certificate has no date recorded',item_count:1,requested_at:'2026-10-26T08:00:00Z'}];
export default function ReminderHistory({demo=false}) {
 const [rows,setRows]=useState(demo?DEMO_ROWS:[]);const [error,setError]=useState('');const [loading,setLoading]=useState(!demo);const [attempt,setAttempt]=useState(0);
 useEffect(()=>{if(demo)return;let active=true;fetch('/api/account/setup',{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);if(active)setRows(data.deliveries);}).catch(()=>{if(active)setError('Delivery history could not be loaded.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[demo,attempt]);
 const failure=rows.find(r=>['bounced','failed','suppressed','complained'].includes(r.status));
 return <section className="card reminder-history" aria-labelledby="reminder-history"><div className="eyebrow" id="reminder-history">Reminder delivery</div>
  {failure && <p className="delivery-warning" role="alert">A recent reminder could not be delivered normally. Check your account email address and contact support if needed.</p>}
  {loading?<p>Loading delivery history…</p>:error?<p role="alert">{error} <button className="billing-link" onClick={()=>{setError('');setLoading(true);setAttempt(n=>n+1);}}>Retry</button></p>:rows.length===0?<p>No reminders have been sent since delivery tracking was enabled. Scheduled reminders will appear here after they are sent.</p>:<ul>{rows.map(row=><li key={row.id}><div><b>{row.subject}</b><small>{new Date(row.requested_at).toLocaleString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} · {row.item_count} {row.item_count===1?'item':'items'}</small></div><span className={`delivery-status delivery-${row.status}`}>{DELIVERY_LABELS[row.status] || 'Status unavailable'}</span></li>)}</ul>}
  <p className="workflow-note">Delivered means accepted by the receiving mail server. It does not confirm that the message reached the inbox or was read. Earlier reminders do not have retrospective delivery status.</p>
 </section>;
}
