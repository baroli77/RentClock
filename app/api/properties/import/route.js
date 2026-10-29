import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasAccess } from '@/lib/billing';
import { previewPropertyCSV } from '@/lib/property-csv';
import { recordMilestone } from '@/lib/product-milestones';
export async function POST(request) {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Not signed in'},{status:401});
 const {data:profile}=await db.from('profiles').select('subscription_status').eq('id',user.id).single();
 if(!hasAccess(profile))return NextResponse.json({error:'An active trial or subscription is required'},{status:403});
 const raw=await request.text();if(raw.length>2200000)return NextResponse.json({error:'File too large'},{status:413});
 let body;try{body=JSON.parse(raw);}catch{return NextResponse.json({error:'Invalid import'},{status:400});}
 if(!body || typeof body!=='object' || Array.isArray(body))return NextResponse.json({error:'Invalid import'},{status:400});
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.batchId || ''))return NextResponse.json({error:'Invalid import reference'},{status:400});
 let preview;try{preview=previewPropertyCSV(body.csv);}catch(e){return NextResponse.json({error:e.message},{status:400});}
 if(preview.errors.length)return NextResponse.json({error:preview.errors.join('\n')},{status:400});
 const {data,error}=await createAdminClient().rpc('import_property_records',{p_user_id:user.id,p_batch_id:body.batchId,p_digest:createHash('sha256').update(body.csv).digest('hex'),p_properties:preview.properties});
 if(error)return NextResponse.json({error:'The import could not be saved. Retry the same preview.'},{status:500});
 if(data.properties?.length)await recordMilestone(user.id,'first_property_saved');
 return NextResponse.json({...data,skipped:data.skipped+preview.skipped.length});
}
