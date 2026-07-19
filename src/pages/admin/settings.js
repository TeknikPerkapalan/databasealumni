// admin/settings.js — Account settings (own profile + password + super admin info)

import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService } from '/src/services/auth.service.js';
import { alumniService } from '/src/services/alumni.service.js';
import { storageService } from '/src/services/storage.service.js';
import { supabase } from '/src/config/supabase.js';
import { toast } from '/src/utils/toast.js';
import { initials, escapeHTML } from '/src/utils/helpers.js';

let currentUser = null;

(async function init() {
  currentUser = await authService.requireAuth({ adminOnly: true });
  if (!currentUser) return;
  mountAdminSidebar('#admin-sidebar');
  bindUI();
  hydrate();
  if (currentUser.role === 'super_admin') showSuperSection();
})();

function bindUI() {
  document.getElementById('form-profile').addEventListener('submit', onSaveProfile);
  document.getElementById('form-password').addEventListener('submit', onSavePassword);
  document.getElementById('btn-avatar').addEventListener('click', () =>
    document.getElementById('avatar-file').click(),
  );
  document.getElementById('avatar-file').addEventListener('change', onAvatarChange);
  document.getElementById('btn-logout').addEventListener('click', onLogout);
}

function hydrate() {
  document.getElementById('p-name').value = currentUser.full_name || '';
  document.getElementById('p-email').value = currentUser.email || '';
  document.getElementById('p-role').value = currentUser.role || 'alumni';
  renderAvatar();
}

function renderAvatar() {
  const box = document.getElementById('avatar-box');
  if (currentUser.avatar_url) {
    box.innerHTML = `<img src="${escapeHTML(currentUser.avatar_url)}" class="w-full h-full object-cover" />`;
  } else {
    box.textContent = initials(currentUser.full_name || currentUser.email);
  }
}

async function onAvatarChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const btn = document.getElementById('btn-avatar');
  btn.disabled = true;
  btn.textContent = 'Mengunggah...';
  try {
    const { publicUrl } = await storageService.upload('avatars', file, {
      folder: currentUser.id,
      validateImage: true,
    });
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', currentUser.id);
    if (error) throw error;
    currentUser.avatar_url = publicUrl;
    renderAvatar();
    toast.success('Foto diperbarui');
  } catch (err) {
    toast.error(err.message || 'Gagal mengunggah foto');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ubah Foto';
    e.target.value = '';
  }
}

async function onSaveProfile(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-profile');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';
  try {
    const full_name = document.getElementById('p-name').value.trim();
    const { error } = await supabase
      .from('users')
      .update({ full_name })
      .eq('id', currentUser.id);
    if (error) throw error;
    currentUser.full_name = full_name;
    toast.success('Profil diperbarui');
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Perubahan';
  }
}

async function onSavePassword(e) {
  e.preventDefault();
  const pw = document.getElementById('pw-new').value;
  const pwc = document.getElementById('pw-confirm').value;
  if (pw !== pwc) {
    toast.error('Konfirmasi password tidak cocok');
    return;
  }
  const btn = document.getElementById('btn-save-pw');
  btn.disabled = true;
  btn.textContent = 'Memperbarui...';
  try {
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) throw error;
    toast.success('Password diperbarui');
    document.getElementById('form-password').reset();
  } catch (err) {
    toast.error(err.message || 'Gagal memperbarui password');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Perbarui Password';
  }
}

async function onLogout() {
  if (!confirm('Keluar dari akun?')) return;
  try {
    await authService.logout();
    window.location.href = '/login.html';
  } catch (err) {
    toast.error(err.message || 'Gagal logout');
  }
}

async function showSuperSection() {
  document.getElementById('super-section').classList.remove('hidden');
  try {
    const stats = await alumniService.getStats();
    const grid = document.getElementById('stats-grid');
    const cells = [
      { label: 'Total Alumni', value: stats.total_alumni ?? 0 },
      { label: 'Angkatan', value: stats.total_angkatan ?? 0 },
      { label: 'Bekerja', value: stats.total_bekerja ?? 0 },
      { label: 'Wirausaha', value: stats.total_wirausaha ?? 0 },
    ];
    grid.innerHTML = cells
      .map(
        (c) => `
      <div>
        <div class="font-display text-2xl font-semibold text-navy-950">${c.value}</div>
        <div class="text-xs text-slate-500 uppercase tracking-wide">${c.label}</div>
      </div>`,
      )
      .join('');
  } catch (err) {
    console.error(err);
  }
}
