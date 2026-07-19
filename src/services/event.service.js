// ============================================================================
// EVENTS SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';

export const eventService = {
  async listAll() {
    const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async listUpcoming(limit = 6) {
    const { data, error } = await supabase
      .from('events').select('*')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async create(payload) {
    const { data, error } = await supabase.from('events').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, patch) {
    const { error } = await supabase.from('events').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  /** Convert event rows to FullCalendar event format. */
  toFullCalendar(events) {
    return events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start_date,
      end:   e.end_date,
      extendedProps: { location: e.location, description: e.description, banner_url: e.banner_url },
    }));
  },
};
