// ============================================================================
// ALUMNI SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';

export const alumniService = {
  /** Public list with optional filters. */
  async list({ search = '', angkatan = null, lokasi = '', perusahaan = '', status = '', page = 1, pageSize = 12 } = {}) {
    let q = supabase
      .from('alumni_profiles')
      .select('*, user:users!alumni_profiles_user_id_fkey(id, full_name, email, avatar_url, role)', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (angkatan)    q = q.eq('angkatan', Number(angkatan));
    if (status)      q = q.eq('status_kerja', status);
    if (lokasi)      q = q.ilike('lokasi_kerja', `%${lokasi}%`);
    if (perusahaan)  q = q.ilike('tempat_kerja', `%${perusahaan}%`);

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;

    // Client-side name filter (Supabase doesn't easily filter on joined column with ilike on initial query)
    let rows = data ?? [];
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.user?.full_name?.toLowerCase().includes(s));
    }
    return { rows, count: count ?? rows.length };
  },

  async getStats() {
    const { data, error } = await supabase.from('alumni_stats').select('*').single();
    if (error) { console.error(error); return { total_alumni: 0, total_angkatan: 0, total_bekerja: 0, total_wirausaha: 0 }; }
    return data;
  },

  async getById(userId) {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*, user:users!alumni_profiles_user_id_fkey(*)')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId, patch) {
    const { error } = await supabase.from('alumni_profiles').update(patch).eq('user_id', userId);
    if (error) throw error;
  },

  /** Admin: list ALL users with profiles (no is_public filter). */
  async listAllForAdmin({ search = '', role = '', isActive = null } = {}) {
    let q = supabase
      .from('users')
      .select('*, profile:alumni_profiles!alumni_profiles_user_id_fkey(angkatan, nim, tempat_kerja, jabatan, lokasi_kerja, status_kerja)')
      .order('created_at', { ascending: false });

    if (role) q = q.eq('role', role);
    if (isActive !== null) q = q.eq('is_active', isActive);
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async setRole(userId, role) {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) throw error;
  },

  async setActive(userId, isActive) {
    const { error } = await supabase.from('users').update({ is_active: isActive }).eq('id', userId);
    if (error) throw error;
  },

  /** Returns rows as CSV string for export. */
  toCSV(rows) {
    const headers = ['Nama','NIM','Angkatan','Tahun Lulus','Email','Tempat Kerja','Jabatan','Lokasi','Status'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const cols = [
        r.user?.full_name ?? '',
        r.nim ?? '',
        r.angkatan ?? '',
        r.tahun_lulus ?? '',
        r.user?.email ?? '',
        r.tempat_kerja ?? '',
        r.jabatan ?? '',
        r.lokasi_kerja ?? '',
        r.status_kerja ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cols.join(','));
    }
    return lines.join('\n');
  },
};
