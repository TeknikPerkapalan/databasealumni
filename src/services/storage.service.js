// ============================================================================
// STORAGE SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';

const ALLOWED_TYPES = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024;          // 5 MB
const MAX_DOC_SIZE = 10 * 1024 * 1024;     // 10 MB for non-image uploads

export const storageService = {
  /** Upload a file. Returns public URL. */
  async upload(bucket, file, { folder = '', validateImage = true } = {}) {
    if (!file) throw new Error('No file provided');
    if (validateImage) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Unsupported file type. Use JPG/PNG/WEBP/GIF/SVG.');
      }
      if (file.size > MAX_SIZE) throw new Error('File too large (max 5MB).');
    } else if (file.size > MAX_DOC_SIZE) {
      throw new Error('File too large (max 10MB).');
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const path = folder ? `${folder.replace(/^\/+|\/+$/g,'')}/${safeName}` : safeName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  },

  async remove(bucket, path) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};
