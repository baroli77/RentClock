export const DELIVERY_EVENTS = { 'email.sent':'sent','email.delivered':'delivered','email.delivery_delayed':'delayed','email.bounced':'bounced','email.failed':'failed','email.suppressed':'suppressed','email.complained':'complained' };
export const DELIVERY_LABELS = {queued:'Pending status',sent:'Sent',delivered:'Delivered to mail server',delayed:'Delivery delayed',bounced:'Bounced',failed:'Sending failed',suppressed:'Not sent — address suppressed',complained:'Marked as spam'};
export function deliveryEvent(event, eventId) {
  const status=DELIVERY_EVENTS[event?.type];
  if(!status) return null;
  const emailId=event.data?.email_id;
  const occurredAt=event.created_at || event.data?.created_at;
  if(typeof emailId!=='string' || emailId.length>150 || !eventId || eventId.length>200 || !Number.isFinite(new Date(occurredAt).getTime())) throw new Error('Invalid delivery event');
  return {p_event_id:eventId,p_email_id:emailId,p_status:status,p_occurred_at:new Date(occurredAt).toISOString()};
}
export async function sendTrackedEmail({admin,resend,userId,kind,itemCount,message,onAccepted}) {
  const {data:delivery,error:insertError}=await admin.from('email_deliveries').insert({user_id:userId,kind,subject:message.subject,item_count:itemCount}).select('id').single();
  if(insertError) throw new Error('Could not create delivery record');
  let result;
  try { result=await resend.emails.send({...message,tags:[{name:'rentclock_delivery',value:delivery.id}]}); }
  catch {
    await admin.from('email_deliveries').update({status:'failed',status_at:new Date().toISOString()}).eq('id',delivery.id);
    throw new Error('Email provider request failed');
  }
  if(result.error || !result.data?.id) {
    await admin.from('email_deliveries').update({status:'failed',status_at:new Date().toISOString()}).eq('id',delivery.id);
    throw new Error('Email provider did not accept the reminder');
  }
  onAccepted?.();
  const {error}=await admin.from('email_deliveries').update({provider_email_id:result.data.id,status:'sent',status_at:new Date().toISOString()}).eq('id',delivery.id);
  if(error) throw new Error('Email accepted, but its delivery record could not be finalised');
  const refreshed=await admin.rpc('refresh_email_delivery',{p_email_id:result.data.id});
  if(refreshed.error) throw new Error('Email accepted, but status synchronisation needs a retry');
  return result.data;
}
