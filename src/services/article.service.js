// ============================================================================
// ARTICLES SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';
import { slugify } from '../utils/helpers.js';

export const articleService = {
  /** Latest published articles (default for landing + listing). */
  async listPublished({ search = '', categoryId = null, page = 1, pageSize = 9 } = {}) {
    let q = supabase
      .from('articles')
      .select('*, author:users!articles_author_id_fkey(full_name, avatar_url), category:article_categories(name, slug)', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (search)     q = q.ilike('title', `%${search}%`);
    if (categoryId) q = q.eq('category_id', categoryId);

    const from = (page - 1) * pageSize;
    q = q.range(from, from + pageSize - 1);

    const { data, count, error } = await q;
    if (error) throw error;
    return { rows: data ?? [], count: count ?? 0 };
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users!articles_author_id_fkey(full_name, avatar_url, email), category:article_categories(name, slug)')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /** Increment view counter (best-effort). */
  async incrementViews(id) {
    // RPC-less approach: read & write. RLS forbids non-owners updating articles,
    // so we wrap this in an unrestricted RPC in production. For demo: silent fail.
    try {
      const { data } = await supabase.from('articles').select('views').eq('id', id).single();
      await supabase.from('articles').update({ views: (data?.views ?? 0) + 1 }).eq('id', id);
    } catch (_) { /* ignore */ }
  },

  async listForAuthor(authorId) {
    const { data, error } = await supabase
      .from('articles')
      .select('*, category:article_categories(name)')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listAll() {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users!articles_author_id_fkey(full_name), category:article_categories(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create({ title, content, excerpt, thumbnail_url, category_id, status, author_id }) {
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2,6)}`;
    const payload = {
      title, slug, content, excerpt, thumbnail_url, category_id, status, author_id,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase.from('articles').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, patch) {
    if (patch.status === 'published' && !patch.published_at) {
      patch.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from('articles').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
  },

  async listCategories() {
    const { data, error } = await supabase.from('article_categories').select('*').order('name');
    if (error) throw error;
    return data ?? [];
  },
};
