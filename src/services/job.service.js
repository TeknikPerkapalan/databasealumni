// ============================================================================
// JOBS SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';

export const jobService = {
  async listActive({ search = '', type = '', location = '', page = 1, pageSize = 10 } = {}) {
    let q = supabase.from('jobs').select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (search)   q = q.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
    if (type)     q = q.eq('type', type);
    if (location) q = q.ilike('location', `%${location}%`);
    const from = (page - 1) * pageSize;
    q = q.range(from, from + pageSize - 1);
    const { data, count, error } = await q;
    if (error) throw error;
    return { rows: data ?? [], count: count ?? 0 };
  },

  async listAll() {
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(payload) {
    const { data, error } = await supabase.from('jobs').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, patch) {
    const { error } = await supabase.from('jobs').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw error;
  },
};
