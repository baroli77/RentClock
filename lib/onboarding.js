import { RECURRING, ONEOFFS, recurringStatus, oneoffStatus, today, toISO, addDays } from './compliance.js';
export function emptyProperty() {
 return {id:`tmp-${Date.now().toString(36)}`,name:'',address:'',agreementDate:'',tenancyStart:'',agreementType:'written',dates:{},checks:{},anchors:{},docs:[],epcBand:'',propertyDetails:{occupied:true},applicability:{gas:true,deposit:true,epcExempt:false,howtorent:false},rightToRent:{occupiers:[]},registration:{},setup:{step:1,completed:false}};
}
export function nextReminderPlan(property,now=new Date()) {
 const entries=[...RECURRING.map(item=>({item,st:recurringStatus(property,item)})),...ONEOFFS.map(item=>({item,st:oneoffStatus(item,property.checks?.[item.key],property)}))].filter(({item,st})=>st.due && !['na','pending'].includes(st.code) && !(st.code==='ok' && ONEOFFS.includes(item)));
 const upcoming=entries.sort((a,b)=>a.st.due-b.st.due)[0];
 if(!upcoming)return null;
 const run=new Date(now);run.setUTCHours(8,0,0,0);if(run<=now)run.setUTCDate(run.getUTCDate()+1);
 const firstDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(run);
 const expected=upcoming.st.days<=60?firstDay:toISO(addDays(upcoming.st.due,-60));
 return {label:upcoming.item.label,due:toISO(upcoming.st.due),overdue:upcoming.st.days<0,expectedReminder:expected};
}
export function demoProperties() {
 const shift=days=>toISO(addDays(today(),days));
 const yearAgo=days=>{const d=addDays(today(),days);d.setFullYear(d.getFullYear()-1);return toISO(d);};
 return [
  {...emptyProperty(),id:'demo-mill',name:'12 Mill Road',address:'12 Mill Road, Example Town',dates:{gas:yearAgo(-7),eicr:'2025-04-01',epc:'2024-03-01'},epcBand:'C',setup:{completed:true},registration:{region:'west-midlands'}},
  {...emptyProperty(),id:'demo-park',name:'Park View flat',address:'Flat 2, 8 Park View, Example Town',dates:{gas:yearAgo(14),eicr:'2025-05-01',epc:'2024-04-01'},epcBand:'D',setup:{completed:true},registration:{region:'london'}},
  {...emptyProperty(),id:'demo-orchard',name:'Orchard Cottage',address:'3 Orchard Lane, Example Town',dates:{gas:yearAgo(120),eicr:'2024-06-01',epc:'2023-02-01'},epcBand:'B',docs:[{id:'demo-doc',name:'Example gas safety record.pdf',itemKey:'gas',path:'demo/sample.pdf',size:1200,added:shift(-10)}],setup:{completed:true},registration:{region:'south-west'}},
 ];
}
