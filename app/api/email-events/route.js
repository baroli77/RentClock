import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createAdminClient } from '@/lib/supabase/admin';
import { deliveryEvent } from '@/lib/email-delivery';
export const runtime='nodejs';
export async function POST(request) {
  const secret=process.env.RESEND_DELIVERY_WEBHOOK_SECRET;
  if(!secret) return NextResponse.json({error:'Delivery verification is not configured'},{status:503});
  const raw=await request.text();
  if(raw.length>200000) return NextResponse.json({error:'Payload too large'},{status:413});
  let event;
  const id=request.headers.get('svix-id');
  try { event=new Webhook(secret).verify(raw,{'svix-id':id,'svix-timestamp':request.headers.get('svix-timestamp'),'svix-signature':request.headers.get('svix-signature')}); }
  catch {return NextResponse.json({error:'Invalid signature'},{status:400});}
  let args;
  try {args=deliveryEvent(event,id);} catch {return NextResponse.json({error:'Invalid event'},{status:400});}
  if(!args) return NextResponse.json({ok:true,ignored:true});
  const {error}=await createAdminClient().rpc('record_email_delivery_event',args);
  if(error) return NextResponse.json({error:'Could not record event; retry required'},{status:500});
  return NextResponse.json({ok:true});
}
