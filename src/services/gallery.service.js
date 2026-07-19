// ============================================================================
// GALLERY SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';
import { slugify } from '../utils/helpers.js';

export const galleryService = {
  async listAlbums() {
    const { data, error } = await supabase
      .from('galleries')
      .select('*, images:gallery_images(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listImages({ albumSlug = null, page = 1, pageSize = 20 } = {}) {
    let q = supabase.from('gallery_images')
      .select('*, gallery:galleries!inner(slug, title)', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (albumSlug) q = q.eq('gallery.slug', albumSlug);
    const from = (page - 1) * pageSize;
    q = q.range(from, from + pageSize - 1);
    const { data, count, error } = await q;
    if (error) throw error;
    return { rows: data ?? [], count: count ?? 0 };
  },

  async createAlbum({ title, description, cover_url, created_by }) {
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2,5)}`;
    const { data, error } = await supabase.from('galleries')
      .insert({ title, slug, description, cover_url, created_by })
      .select().single();
    if (error) throw error;
    return data;
  },

  async addImage({ gallery_id, image_url, caption, uploaded_by }) {
    const { error } = await supabase.from('gallery_images')
      .insert({ gallery_id, image_url, caption, uploaded_by });
    if (error) throw error;
  },

  async removeAlbum(id) {
    const { error } = await supabase.from('galleries').delete().eq('id', id);
    if (error) throw error;
  },

  async removeImage(id) {
    const { error } = await supabase.from('gallery_images').delete().eq('id', id);
    if (error) throw error;
  },
};
