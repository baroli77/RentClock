import { createAdminClient } from './supabase/admin';

// Activation reporting stays within RentClock. The unique owner/event key
// preserves first-occurrence counts when uploads or saves are retried.
export async function recordMilestone(userId, eventName) {
  try {
    const { error } = await createAdminClient().from('product_milestones').upsert(
      { user_id: userId, event_name: eventName },
      { onConflict: 'user_id,event_name', ignoreDuplicates: true }
    );
    if (error) throw new Error(error.message);
  } catch { console.warn('Product milestone could not be recorded'); }
}
