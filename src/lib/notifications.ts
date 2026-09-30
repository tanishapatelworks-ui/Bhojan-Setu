import { supabase } from '@/lib/supabase';
import type { NotificationType } from '@/types';

export async function createNotification(
  userId: string,
  message: string,
  type: NotificationType,
  donationId?: string
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    message,
    type,
    donation_id: donationId ?? null,
  });
  if (error) console.error('Failed to create notification:', error);
}

export async function updateImpactStats(
  userId: string,
  meals: number,
  kg: number,
  people: number
) {
  const { data: existing } = await supabase
    .from('impact_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('impact_stats')
      .update({
        meals_rescued: (existing.meals_rescued ?? 0) + meals,
        kg_saved: Number(existing.kg_saved ?? 0) + kg,
        people_served: (existing.people_served ?? 0) + people,
        rescues_completed: (existing.rescues_completed ?? 0) + 1,
      })
      .eq('user_id', userId);
    if (error) console.error('Failed to update impact stats:', error);
  } else {
    const { error } = await supabase.from('impact_stats').insert({
      user_id: userId,
      meals_rescued: meals,
      kg_saved: kg,
      people_served: people,
      rescues_completed: 1,
    });
    if (error) console.error('Failed to insert impact stats:', error);
  }
}
