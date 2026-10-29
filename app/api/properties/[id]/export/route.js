import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RECURRING, ONEOFFS, recurringStatus, oneoffStatus, rightToRentFollowUps, toISO } from '@/lib/compliance';
import { registrationTasks } from '@/lib/registration-workflow';
export async function GET(request,{params}) {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Not signed in'},{status:401});
 const {id}=await params;
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))return NextResponse.json({error:'Invalid property'},{status:400});
 const {data,error}=await db.from('properties').select('id,payload').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(error)return NextResponse.json({error:'Could not load property'},{status:500});
 if(!data)return NextResponse.json({error:'Property not found'},{status:404});
 const property={...data.payload,id:data.id};const docs=property.docs || [];
 if(docs.length>50 || docs.reduce((n,d)=>n+(Number(d.size)||0),0)>30*1024*1024)return NextResponse.json({error:'Export up to 50 documents and 30 MB per pack. Download larger files individually.'},{status:413});
 if(docs.some(d=>typeof d.path!=='string' || !d.path.startsWith(`${user.id}/`) || d.path.split('/').some(s=>s==='..' || s==='.')))return NextResponse.json({error:'Invalid document reference in property'},{status:400});
 const {data:profile,error:profileError}=await db.from('profiles').select('registration_renewal_due').eq('id',user.id).single();
 if(profileError)return NextResponse.json({error:'Could not load the common renewal date. Retry the export.'},{status:500});
 const entries=[...RECURRING.map(item=>({item,st:recurringStatus(property,item)})),...ONEOFFS.map(item=>({item,st:oneoffStatus(item,property.checks?.[item.key],property)})),...rightToRentFollowUps(property),...registrationTasks(property,profile?.registration_renewal_due || '')];
 const records=entries.map(({item,st})=>({label:item.label,due:st.due ? toISO(st.due):'',status:st.code}));
 const documents=[];
 for(const doc of docs){const {data:signed,error:signError}=await db.storage.from('certs').createSignedUrl(doc.path,300);if(signError)return NextResponse.json({error:'A document could not be accessed. Try its individual download first.'},{status:500});documents.push({...doc,url:signed.signedUrl});}
 return NextResponse.json({property,records,documents,exportedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
}
