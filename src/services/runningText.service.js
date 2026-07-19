// ============================================================================
// RUNNING TEXT SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';

export const runningTextService = {
  async listActive() {
    const { data, error } = await supabase
      .from('running_texts').select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  async listAll() {
    const { data, error } = await supabase.from('running_texts').select('*').order('order_index');
    if (error) throw error;
    return data ?? [];
  },
  async create(payload) {
    // Accept either a string (legacy) or a full record object
    const record = typeof payload === 'string'
      ? { message: payload, is_active: true }
      : { message: payload.message, order_index: payload.order_index ?? 0, is_active: payload.is_active ?? true };
    const { error } = await supabase.from('running_texts').insert(record);
    if (error) throw error;
  },
  async update(id, patch) {
    const { error } = await supabase.from('running_texts').update(patch).eq('id', id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from('running_texts').delete().eq('id', id);
    if (error) throw error;
  },
};
