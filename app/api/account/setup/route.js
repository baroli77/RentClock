import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasAccess } from '@/lib/billing';
import { validISO } from '@/lib/property-csv';
export async function GET() {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Not signed in'},{status:401});
 const [profile,deliveries]=await Promise.all([db.from('profiles').select('registration_renewal_due').eq('id',user.id).single(),db.from('email_deliveries').select('id,kind,subject,item_count,status,requested_at,status_at').eq('user_id',user.id).order('requested_at',{ascending:false}).limit(20)]);
 if(profile.error || deliveries.error)return NextResponse.json({error:'Could not load account status'},{status:500});
 return NextResponse.json({renewalDue:profile.data?.registration_renewal_due || '',deliveries:deliveries.data || []},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(request) {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Not signed in'},{status:401});
 const {data:profile}=await db.from('profiles').select('subscription_status').eq('id',user.id).single();
 if(!hasAccess(profile))return NextResponse.json({error:'An active trial or subscription is required'},{status:403});
 const body=await request.json().catch(()=>null);const value=body?.renewalDue;
 if(typeof value!=='string' || (value && !validISO(value)))return NextResponse.json({error:'Enter a valid renewal date'},{status:400});
 const {error}=await createAdminClient().from('profiles').update({registration_renewal_due:value || null}).eq('id',user.id);
 if(error)return NextResponse.json({error:'Could not save renewal date'},{status:500});
 return NextResponse.json({renewalDue:value});
}
