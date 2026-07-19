// ============================================================================
// AUTH SERVICE
// ============================================================================
import { supabase } from '../config/supabase.js';

export const authService = {
  /** Register a new alumni account. profile = { full_name, nim, angkatan, ... } */
  async register({ email, password, profile }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: profile.full_name },
        emailRedirectTo: `${window.location.origin}/login.html`,
      },
    });
    if (error) throw error;

    // The trigger handle_new_user creates a row in public.users.
    // Now create the alumni_profile row.
    if (data.user) {
      const { error: pErr } = await supabase.from('alumni_profiles').insert({
        user_id:      data.user.id,
        nim:          profile.nim || null,
        angkatan:     profile.angkatan,
        tahun_lulus:  profile.tahun_lulus || null,
        alamat:       profile.alamat || null,
        no_hp:        profile.no_hp || null,
        tempat_kerja: profile.tempat_kerja || null,
        jabatan:      profile.jabatan || null,
        lokasi_kerja: profile.lokasi_kerja || null,
        status_kerja: profile.status_kerja || 'Bekerja',
        linkedin_url: profile.linkedin_url || null,
        instagram_url:profile.instagram_url || null,
        bio:          profile.bio || null,
      });
      if (pErr) console.warn('Profile creation failed (will need login first):', pErr);
    }
    return data;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`,
    });
    if (error) throw error;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentUser() {
    const session = await this.getSession();
    if (!session) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*, alumni_profiles(*)')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
  },

  async isAdmin() {
    const u = await this.getCurrentUser();
    return u && (u.role === 'admin' || u.role === 'super_admin');
  },

  onAuthStateChange(cb) {
    return supabase.auth.onAuthStateChange(cb);
  },

  /** Route guard helper - redirects if user does not have required role.  */
  async requireAuth({ adminOnly = false, redirectTo = '/login.html' } = {}) {
    const user = await this.getCurrentUser();
    if (!user) { window.location.href = redirectTo; return null; }
    if (adminOnly && !(user.role === 'admin' || user.role === 'super_admin')) {
      window.location.href = '/';
      return null;
    }
    return user;
  },
};
