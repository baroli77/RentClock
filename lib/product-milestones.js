import { createAdminClient } from './supabase/admin';
import { trackMarketingEvent } from './marketingman-attribution';

export async function forwardPendingMilestones(admin = createAdminClient()) {
  const { data, error } = await admin.from('product_milestones').select('id,user_id,event_name').is('forwarded_at', null).order('occurred_at').limit(100);
  if (error) throw new Error(error.message);
  for (const event of data || []) {
    const result = await trackMarketingEvent({ eventType: 'custom', externalUserId: event.user_id, dedupeKey: `rentclock:milestone:${event.user_id}:${event.event_name}`, metadata: { eventName: event.event_name } });
    if (!result.ok) break;
    if (result.ok) await admin.from('product_milestones').update({ forwarded_at: new Date().toISOString() }).eq('id',event.id);
  }
}
export async function recordMilestone(userId, eventName) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('product_milestones').upsert({ user_id: userId, event_name: eventName }, { onConflict: 'user_id,event_name', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    // Retries use the same attribution key; customer saves remain successful if analytics is unavailable.
    const { data } = await admin.from('product_milestones').select('id,forwarded_at').eq('user_id',userId).eq('event_name',eventName).single();
    if (data && !data.forwarded_at) {
      const result = await trackMarketingEvent({ eventType: 'custom', externalUserId: userId, dedupeKey: `rentclock:milestone:${userId}:${eventName}`, metadata: { eventName } });
      if (result.ok) await admin.from('product_milestones').update({ forwarded_at: new Date().toISOString() }).eq('id',data.id);
    }
  } catch { console.warn('Product milestone recording will need a retry'); }
}
