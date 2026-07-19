// admin/alumni.js — Alumni/users management

import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService } from '/src/services/auth.service.js';
import { alumniService } from '/src/services/alumni.service.js';
import { toast } from '/src/utils/toast.js';
import { debounce, escapeHTML, initials } from '/src/utils/helpers.js';

let rows = [];
let currentUser = null;
const ROLE_BADGE = {
  super_admin: 'badge-gold',
  admin: 'badge-sky',
  alumni: 'badge-slate',
};

(async function init() {
  currentUser = await authService.requireAuth({ adminOnly: true });
  if (!currentUser) return;
  mountAdminSidebar('#admin-sidebar');
  bindUI();
  await loadRows();
  document.getElementById('hint').textContent = currentUser.role === 'super_admin'
    ? 'Anda Super Admin: dapat mengubah peran semua pengguna.'
    : 'Hanya Super Admin yang dapat mengubah peran pengguna.';
})();

function bindUI() {
  const dq = debounce(loadRows, 350);
  document.getElementById('f-search').addEventListener('input', dq);
  document.getElementById('f-role').addEventListener('change', loadRows);
  document.getElementById('f-active').addEventListener('change', loadRows);
  document.getElementById('btn-export').addEventListener('click', exportCSV);
}

async function loadRows() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>';
  const activeVal = document.getElementById('f-active').value;
  try {
    rows = await alumniService.listAllForAdmin({
      search: document.getElementById('f-search').value.trim(),
      role: document.getElementById('f-role').value,
      isActive: activeVal === '' ? null : activeVal === 'true',
    });
    renderTable();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-rose-500">Gagal memuat: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('tbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-12 text-center text-slate-400">Tidak ada pengguna yang cocok.</td></tr>';
    return;
  }
  const canEditRole = currentUser.role === 'super_admin';

  tbody.innerHTML = rows.map((u) => {
    const p = Array.isArray(u.profile) ? u.profile[0] : u.profile;
    const isSelf = u.id === currentUser.id;
    return `
    <tr class="border-t border-slate-100 hover:bg-slate-50/60">
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          ${u.avatar_url
            ? `<img src="${escapeHTML(u.avatar_url)}" class="w-9 h-9 rounded-full object-cover" />`
            : `<div class="w-9 h-9 rounded-full bg-navy-900 text-white text-xs font-semibold flex items-center justify-center">${escapeHTML(initials(u.full_name || u.email))}</div>`}
          <div>
            <div class="font-medium text-navy-950">${escapeHTML(u.full_name || '—')}</div>
            ${p?.nim ? `<div class="text-xs text-slate-500">NIM ${escapeHTML(p.nim)}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="px-5 py-3 text-slate-700">${escapeHTML(u.email || '')}</td>
      <td class="px-5 py-3 text-slate-700">${p?.angkatan ?? '—'}</td>
      <td class="px-5 py-3 text-slate-700">${p?.tempat_kerja ? escapeHTML(p.tempat_kerja) : '—'}</td>
      <td class="px-5 py-3">
        ${canEditRole && !isSelf
          ? `<select data-act="role" data-id="${u.id}" class="select text-xs py-1.5">
              <option value="alumni" ${u.role === 'alumni' ? 'selected' : ''}>Alumni</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="super_admin" ${u.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
            </select>`
          : `<span class="badge ${ROLE_BADGE[u.role] || 'badge-slate'}">${escapeHTML(u.role)}</span>`}
      </td>
      <td class="px-5 py-3">
        ${u.is_active
          ? '<span class="badge badge-emerald">Aktif</span>'
          : '<span class="badge badge-slate">Nonaktif</span>'}
      </td>
      <td class="px-5 py-3 text-right">
        <div class="inline-flex items-center gap-1">
          <a href="/profile.html?id=${u.id}" target="_blank" class="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 text-slate-600" title="Lihat profil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </a>
          ${!isSelf ? `<button data-act="toggle" data-id="${u.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 text-slate-600" title="${u.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
            ${u.is_active
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>'}
          </button>` : ''}
        </div>
      </td>
    </tr>
  `;
  }).join('');

  tbody.querySelectorAll('select[data-act="role"]').forEach((s) => {
    s.addEventListener('change', () => onRoleChange(s.dataset.id, s.value));
  });
  tbody.querySelectorAll('button[data-act="toggle"]').forEach((b) => {
    b.addEventListener('click', () => onToggleActive(b.dataset.id));
  });
}

async function onRoleChange(id, role) {
  if (!confirm(`Ubah peran pengguna menjadi ${role}?`)) {
    await loadRows();
    return;
  }
  try {
    await alumniService.setRole(id, role);
    toast.success('Peran diperbarui');
    await loadRows();
  } catch (err) {
    toast.error(err.message || 'Gagal memperbarui peran');
    await loadRows();
  }
}

async function onToggleActive(id) {
  const u = rows.find((x) => x.id === id);
  if (!u) return;
  const next = !u.is_active;
  if (!confirm(next ? 'Aktifkan pengguna ini?' : 'Nonaktifkan pengguna ini? Ia tidak akan tampil di portal publik.')) return;
  try {
    await alumniService.setActive(id, next);
    toast.success(next ? 'Diaktifkan' : 'Dinonaktifkan');
    await loadRows();
  } catch (err) {
    toast.error(err.message || 'Gagal memperbarui status');
  }
}

function exportCSV() {
  if (!rows.length) {
    toast.info('Tidak ada data untuk diekspor');
    return;
  }
  const headers = ['Nama', 'Email', 'Angkatan', 'NIM', 'Tempat Kerja', 'Jabatan', 'Lokasi', 'Status Kerja', 'Peran', 'Aktif'];
  const lines = [headers.join(',')];
  for (const u of rows) {
    const p = Array.isArray(u.profile) ? u.profile[0] : u.profile;
    const cols = [
      u.full_name || '',
      u.email || '',
      p?.angkatan ?? '',
      p?.nim || '',
      p?.tempat_kerja || '',
      p?.jabatan || '',
      p?.lokasi_kerja || '',
      p?.status_kerja || '',
      u.role || '',
      u.is_active ? 'Ya' : 'Tidak',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(cols.join(','));
  }
  const csv = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alumni-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('CSV diunduh');
}
