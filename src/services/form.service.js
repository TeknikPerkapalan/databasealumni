// ============================================================================
// FORM SERVICE (dynamic forms)
// ============================================================================
import { supabase } from '../config/supabase.js';
import { slugify } from '../utils/helpers.js';

export const formService = {
  async listActive() {
    const { data, error } = await supabase
      .from('forms')
      .select('*, fields:form_fields(count)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listAll() {
    const { data, error } = await supabase.from('forms')
      .select('*, fields:form_fields(count), submissions:form_submissions(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('forms')
      .select('*, fields:form_fields(*)')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (data?.fields) data.fields.sort((a,b)=>a.order_index - b.order_index);
    return data;
  },

  async createForm({ title, description, is_active = true, created_by }) {
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2,5)}`;
    const { data, error } = await supabase.from('forms')
      .insert({ title, slug, description, is_active, created_by })
      .select().single();
    if (error) throw error;
    return data;
  },

  async getById(form_id) {
    const { data, error } = await supabase
      .from('forms')
      .select('*, fields:form_fields(*)')
      .eq('id', form_id)
      .maybeSingle();
    if (error) throw error;
    if (data?.fields) data.fields.sort((a,b)=>a.order_index - b.order_index);
    return data;
  },

  async updateForm(id, patch) {
    const { error } = await supabase.from('forms').update(patch).eq('id', id);
    if (error) throw error;
  },

  async deleteForm(id) {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw error;
  },

  async addField(form_id, field) {
    const { data, error } = await supabase.from('form_fields')
      .insert({ form_id, ...field }).select().single();
    if (error) throw error;
    return data;
  },

  async updateField(id, patch) {
    const { error } = await supabase.from('form_fields').update(patch).eq('id', id);
    if (error) throw error;
  },

  async deleteField(id) {
    const { error } = await supabase.from('form_fields').delete().eq('id', id);
    if (error) throw error;
  },

  async submit(form_id, data, submitted_by = null) {
    const { error } = await supabase.from('form_submissions')
      .insert({ form_id, data, submitted_by });
    if (error) throw error;
  },

  async getSubmissions(form_id) {
    const { data, error } = await supabase.from('form_submissions')
      .select('*, user:users!form_submissions_submitted_by_fkey(full_name, email)')
      .eq('form_id', form_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
