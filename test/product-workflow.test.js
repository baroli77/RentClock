import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Webhook } from 'svix';
import { parseCSV, previewPropertyCSV, propertiesCSV, validISO, csvCell, PROPERTY_CSV_TEMPLATE } from '../lib/property-csv.js';
import { registrationTasks, markRegistrationChange } from '../lib/registration-workflow.js';
import { emptyProperty, nextReminderPlan } from '../lib/onboarding.js';
import { validateProperty, propertyRecordHtml, safeFilename } from '../lib/property-records.js';
import { deliveryEvent, sendTrackedEmail } from '../lib/email-delivery.js';
import { ONEOFFS, oneoffStatus, today, toISO, addDays } from '../lib/compliance.js';

test('CSV handles BOM, quoted commas, multiline fields and escaped quotation marks',()=>{
 assert.deepEqual(parseCSV('\uFEFFname,address\r\n"The ""Old"" House","1 Road,\nTown"\r\n'),[['name','address'],['The "Old" House','1 Road,\nTown']]);
 assert.throws(()=>parseCSV('address\n"unfinished'),/not closed/);
 assert.throws(()=>parseCSV('address\n"one"two'),/Unexpected text/);
});
test('CSV export can be imported with matching certificate dates and applicability',()=>{
 const property={...emptyProperty(),name:'Cottage "A"',address:'1 Road, Town',dates:{gas:'2026-06-10',eicr:'2025-04-01',eicrNextDue:'2028-04-01',epc:'2024-02-29'},epcBand:'C',registration:{region:'london'},applicability:{gas:false,deposit:false,epcExempt:true}};
 const parsed=previewPropertyCSV(propertiesCSV([property]));
 assert.deepEqual(parsed.errors,[]);assert.equal(parsed.properties[0].address,property.address);assert.deepEqual(parsed.properties[0].dates,property.dates);assert.equal(parsed.properties[0].applicability.gas,false);assert.equal(parsed.properties[0].registration.region,'london');
 assert.equal(previewPropertyCSV(PROPERTY_CSV_TEMPLATE).properties.length,1);
});
test('CSV rejects impossible dates, unknown headings and contradictory EICR dates',()=>{
 assert.equal(validISO('2026-02-29'),false);assert.equal(validISO('2028-02-29'),true);assert.equal(validISO('2026-13-01'),false);
 assert.match(previewPropertyCSV('address,gas_last_done\n1 Road,2026-02-29').errors[0],/real date/);
 assert.match(previewPropertyCSV('address,eicr_last_done,eicr_next_due\n1 Road,2026-01-02,2026-01-01').errors[0],/after its inspection/);
 assert.throws(()=>previewPropertyCSV('address,unknown\n1 Road,x'),/Unsupported columns/);
 assert.throws(()=>previewPropertyCSV('address,address\n1 Road,2 Road'),/duplicate column/);
 assert.throws(()=>parseCSV('address\n'+Array.from({length:251},(_,i)=>i+' Road').join('\n')),/250/);
});
test('CSV previews skip duplicate addresses in the file and existing portfolio',()=>{
 const p=previewPropertyCSV('address\n1 Road\n 1 ROAD \n2 Road',['2 road']);
 assert.equal(p.properties.length,1);assert.deepEqual(p.skipped,[3,4]);
 for(const value of ['=SUM(1,2)',' +cmd','-1+cmd','@cmd','\tcmd'])assert.ok(csvCell(value).startsWith('"\''));
});
test('Registration adds 28 calendar days, uses common renewal and respects completion',()=>{
 const p={...emptyProperty(),registration:{registeredOn:'2026-12-15',informationCompletedOn:'2027-01-01',changeDate:'2027-03-20',changeRevision:2,syncedRevision:1}};
 const tasks=registrationTasks(p,'2027-12-15');
 assert.equal(toISO(tasks[0].st.due),'2027-01-12');assert.equal(tasks[0].st.code,'ok');assert.equal(toISO(tasks[1].st.due),'2027-12-15');assert.equal(toISO(tasks[2].st.due),'2027-04-17');
 assert.deepEqual(registrationTasks({...p,registration:{...p.registration,notRequired:true}},'2027-12-15'),[]);
});
test('Registration revisions retain the earliest unreported change and support same-day changes',()=>{
 const p={...emptyProperty(),address:'1 Road',registration:{registeredOn:'2026-12-15'}};
 const changed=markRegistrationChange(p,{...p,address:'2 Road'},'2027-02-01');
 assert.equal(changed.registration.changeRevision,1);
 const changedAgain=markRegistrationChange(changed,{...changed,address:'3 Road'},'2027-02-03');
 assert.equal(changedAgain.registration.changeDate,'2027-02-01');assert.equal(changedAgain.registration.changeRevision,2);
 const synced={...changedAgain,registration:{...changedAgain.registration,syncedRevision:2}};
 assert.deepEqual(markRegistrationChange(changedAgain,synced,'2027-02-03'),synced);
 const later=markRegistrationChange(synced,{...synced,address:'4 Road'},'2027-02-03');assert.equal(later.registration.changeRevision,3);assert.equal(later.registration.changeDate,'2027-02-03');
});
test('Expired certificates flag a government update until acknowledged',()=>{
 const expired=toISO(addDays(today(),-5));const lastYear=new Date(expired);lastYear.setFullYear(lastYear.getFullYear()-1);
 const p={...emptyProperty(),dates:{gas:toISO(lastYear)},registration:{registeredOn:toISO(addDays(today(),-100))}};
 const task=registrationTasks(p).find(t=>t.item.key==='registration-expiry-gas');assert.ok(task);assert.equal(toISO(task.st.due),toISO(addDays(today(),23)));
 assert.ok(!registrationTasks({...p,registration:{...p.registration,lastUpdatedOn:toISO(today())}}).some(t=>t.item.key==='registration-expiry-gas'));
});
test('Registration initial due uses region and records completion without breaking legacy checks',()=>{
 const item=ONEOFFS.find(i=>i.key==='prsdb');const p={...emptyProperty(),registration:{region:'london'}};
 assert.equal(toISO(oneoffStatus(item,false,p).due),'2027-10-14');
 assert.equal(oneoffStatus(item,true,p).code,'ok');
 assert.equal(oneoffStatus(item,false,{...p,registration:{...p.registration,registeredOn:'2026-12-15'}}).code,'ok');
});
test('Setup predicts the first catch-up reminder and excludes completed one-off duties',()=>{
 const p={...emptyProperty(),dates:{gas:toISO(addDays(today(),-370))},checks:Object.fromEntries(ONEOFFS.map(i=>[i.key,true]))};
 const plan=nextReminderPlan(p);assert.ok(plan.overdue);assert.match(plan.label,/gas/i);assert.ok(plan.expectedReminder>=toISO(today()));
});
test('Property records reject cross-account documents and escape printable HTML',()=>{
 const p={...emptyProperty(),name:'<script>alert(1)</script>',address:'A & B',docs:[{path:'other/file.pdf',name:'<img onerror=x>'}]};
 assert.match(validateProperty(p,'owner'),/Invalid document/);
 assert.match(validateProperty({...p,docs:[{path:'owner/../other/file'}]},'owner'),/Invalid document/);
 assert.equal(validateProperty({...p,docs:[{path:'owner/file'}]},'owner'),'');
 const html=propertyRecordHtml(p,[],new Date().toISOString());assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('A &amp; B'));
 assert.ok(!safeFilename('../../bad/name.pdf').includes('/'));
});
test('Delivery events validate signatures, reject altered payloads and preserve event identity',()=>{
 const hook=new Webhook('whsec_'+randomBytes(32).toString('base64'));const body=JSON.stringify({type:'email.delivered',created_at:'2026-10-29T08:00:00Z',data:{email_id:'provider-id'}});const date=new Date();const signature=hook.sign('event-id',date,body);const headers={'svix-id':'event-id','svix-timestamp':String(Math.floor(date.getTime()/1000)),'svix-signature':signature};
 const event=hook.verify(body,headers);assert.deepEqual(deliveryEvent(event,'event-id'),{p_event_id:'event-id',p_email_id:'provider-id',p_status:'delivered',p_occurred_at:'2026-10-29T08:00:00.000Z'});
 assert.throws(()=>hook.verify(body.replace('provider-id','tampered'),headers));assert.equal(deliveryEvent({type:'email.opened'},'x'),null);assert.throws(()=>deliveryEvent({type:'email.bounced',data:{}},'x'));
});
function fakeAdmin({finalError=false}={}) {
 const updates=[];return {updates,from(){return {insert(){return {select(){return {single:async()=>({data:{id:'delivery-id'}})}}}},update(values){updates.push(values);return {eq:async()=>({error:finalError?new Error('DB down'):null})}}}},rpc:async()=>({error:null})};
}
test('Provider rejection records failure; acceptance is acknowledged before status persistence',async()=>{
 const admin=fakeAdmin();let accepted=false;
 await assert.rejects(sendTrackedEmail({admin,resend:{emails:{send:async()=>({error:{message:'rejected'}})}},userId:'u',kind:'deadline',itemCount:1,message:{subject:'x'},onAccepted:()=>{accepted=true;}}));assert.equal(accepted,false);assert.equal(admin.updates[0].status,'failed');
 const broken=fakeAdmin({finalError:true});await assert.rejects(sendTrackedEmail({admin:broken,resend:{emails:{send:async()=>({data:{id:'provider'}})}},userId:'u',kind:'deadline',itemCount:1,message:{subject:'x'},onAccepted:()=>{accepted=true;}}),/accepted/);assert.equal(accepted,true);
});
