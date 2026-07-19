// ============================================================================
// PROFILE PAGE - view (?id=) or edit (own profile if no id)
// ============================================================================
import { mountNavbar }    from '/src/components/navbar.js';
import { mountFooter }    from '/src/components/footer.js';
import { authService }    from '/src/services/auth.service.js';
import { alumniService }  from '/src/services/alumni.service.js';
import { storageService } from '/src/services/storage.service.js';
import { supabase }       from '/src/config/supabase.js';
import { getQueryParam, initials, escapeHTML, formatDate } from '/src/utils/helpers.js';
import { toast }          from '/src/utils/toast.js';

mountNavbar();
mountFooter();

const $ = (s) => document.querySelector(s);
const root = $('#profile-root');
const otherId = getQueryParam('id');

async function init() {
  const me = await authService.getCurrentUser();

  // If no id in URL → require login → show own profile (editable)
  // If id in URL → show that user (read-only unless it's me)
  const targetId = otherId || me?.id;
  if (!targetId) {
    root.innerHTML = `<div class="card p-10 text-center">
      <h2 class="font-display text-2xl text-navy-950">Silakan masuk</h2>
      <p class="text-slate-600 mt-2">Anda harus login untuk melihat halaman profil.</p>
      <a href="/login.html" class="btn btn-primary mt-6 inline-flex">Masuk</a>
    </div>`;
    return;
  }

  const isOwn = me && me.id === targetId;
  let profile;
  try {
    profile = await alumniService.getById(targetId);
  } catch (e) { console.error(e); }

  if (!profile) {
    root.innerHTML = `<div class="card p-10 text-center">
      <h2 class="font-display text-2xl text-navy-950">Profil tidak ditemukan</h2>
      <a href="/alumni.html" class="btn btn-primary mt-6 inline-flex">Cari alumni lain</a>
    </div>`;
    return;
  }

  renderProfile(profile, isOwn);
}

function renderProfile(p, isOwn) {
  const u = p.user || {};
  const name = u.full_name || 'Alumni';
  const avatar = u.avatar_url
    ? `<img id="avatar-img" src="${u.avatar_url}" alt="" class="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg" />`
    : `<div id="avatar-img" class="w-28 h-28 rounded-full bg-navy-900 text-white grid place-items-center text-2xl font-semibold ring-4 ring-white shadow-lg">${initials(name)}</div>`;

  root.innerHTML = `
    <!-- HEADER CARD -->
    <div class="card overflow-hidden">
      <div class="h-32 hero-gradient hero-grid"></div>
      <div class="px-6 sm:px-10 pb-6 sm:pb-8 -mt-14 relative">
        <div class="flex flex-col sm:flex-row sm:items-end sm:gap-6">
          <div class="relative inline-block">
            ${avatar}
            ${isOwn ? `<label class="absolute bottom-1 right-1 bg-white rounded-full p-1.5 ring-1 ring-slate-200 cursor-pointer shadow-md hover:bg-slate-50 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3 3 18v3h3L17.7 9.3M14.7 6.3l3-3a2.1 2.1 0 0 1 3 3l-3 3M14.7 6.3l3 3"/></svg>
              <input id="avatar-input" type="file" accept="image/*" class="hidden" />
            </label>` : ''}
          </div>
          <div class="mt-4 sm:mt-0 sm:pb-2 flex-1 min-w-0">
            <h1 class="font-display text-3xl font-semibold text-navy-950">${escapeHTML(name)}</h1>
            <p class="text-slate-600 mt-1">${escapeHTML(p.jabatan || '—')}${p.tempat_kerja ? ` · ${escapeHTML(p.tempat_kerja)}` : ''}</p>
            <p class="text-sm text-slate-500 mt-0.5">Angkatan ${p.angkatan ?? '—'} · NIM ${escapeHTML(p.nim ?? '—')}</p>
          </div>
          ${isOwn ? `<button id="btn-edit" class="btn btn-primary sm:mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3 3 18v3h3L17.7 9.3"/><path d="M14.7 6.3l3-3a2.1 2.1 0 0 1 3 3l-3 3"/></svg>
            Edit Profil
          </button>` : ''}
        </div>
      </div>
    </div>

    <!-- DETAILS -->
    <div class="grid lg:grid-cols-3 gap-6 mt-6">
      <div class="lg:col-span-2 space-y-6">
        <section class="card p-6">
          <h2 class="font-display text-xl font-semibold text-navy-950">Tentang</h2>
          <p class="mt-3 text-slate-700 whitespace-pre-line">${escapeHTML(p.bio || 'Belum ada bio.')}</p>
        </section>

        <section class="card p-6">
          <h2 class="font-display text-xl font-semibold text-navy-950">Karir</h2>
          <dl class="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div><dt class="text-slate-500">Status</dt><dd class="font-medium text-navy-950 mt-0.5">${escapeHTML(p.status_kerja || '—')}</dd></div>
            <div><dt class="text-slate-500">Tempat Kerja</dt><dd class="font-medium text-navy-950 mt-0.5">${escapeHTML(p.tempat_kerja || '—')}</dd></div>
            <div><dt class="text-slate-500">Jabatan</dt><dd class="font-medium text-navy-950 mt-0.5">${escapeHTML(p.jabatan || '—')}</dd></div>
            <div><dt class="text-slate-500">Lokasi Kerja</dt><dd class="font-medium text-navy-950 mt-0.5">${escapeHTML(p.lokasi_kerja || '—')}</dd></div>
            <div><dt class="text-slate-500">Tahun Lulus</dt><dd class="font-medium text-navy-950 mt-0.5">${p.tahun_lulus ?? '—'}</dd></div>
            <div><dt class="text-slate-500">Bergabung Portal</dt><dd class="font-medium text-navy-950 mt-0.5">${formatDate(u.created_at)}</dd></div>
          </dl>
        </section>
      </div>

      <aside class="space-y-6">
        <section class="card p-6">
          <h2 class="font-display text-xl font-semibold text-navy-950">Kontak</h2>
          <ul class="mt-3 space-y-2 text-sm break-words">
            ${u.email ? `<li class="flex items-start gap-2"><span class="text-slate-400 mt-0.5">✉</span><span class="break-all">${escapeHTML(u.email)}</span></li>` : ''}
            ${p.no_hp ? `<li class="flex items-start gap-2"><span class="text-slate-400 mt-0.5">📞</span>${escapeHTML(p.no_hp)}</li>` : ''}
            ${p.alamat ? `<li class="flex items-start gap-2"><span class="text-slate-400 mt-0.5">📍</span>${escapeHTML(p.alamat)}</li>` : ''}
          </ul>
        </section>
        <section class="card p-6">
          <h2 class="font-display text-xl font-semibold text-navy-950">Sosial</h2>
          <div class="mt-3 space-y-2 text-sm">
            ${p.linkedin_url ? `<a href="${p.linkedin_url}" target="_blank" rel="noopener" class="flex items-center gap-2 text-navy-900 hover:text-gold-700">LinkedIn ↗</a>` : '<p class="text-slate-400 text-sm">LinkedIn —</p>'}
            ${p.instagram_url ? `<a href="${p.instagram_url}" target="_blank" rel="noopener" class="flex items-center gap-2 text-navy-900 hover:text-gold-700">Instagram ↗</a>` : '<p class="text-slate-400 text-sm">Instagram —</p>'}
          </div>
        </section>
      </aside>
    </div>
  `;

  if (isOwn) wireEdit(p);
}

function wireEdit(p) {
  const u = p.user || {};

  // Avatar upload
  $('#avatar-input')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info('Mengunggah foto...');
      const { publicUrl } = await storageService.upload('avatars', file, { folder: u.id });
      const { error } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', u.id);
      if (error) throw error;
      $('#avatar-img').outerHTML = `<img id="avatar-img" src="${publicUrl}" alt="" class="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg" />`;
      toast.success('Foto profil diperbarui');
    } catch (err) { console.error(err); toast.error(err.message || 'Gagal upload'); }
  });

  // Edit modal
  $('#btn-edit')?.addEventListener('click', () => openEditModal(p));
}

function openEditModal(p) {
  const u = p.user || {};
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/60" data-close></div>
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto thin-scroll">
      <div class="p-6 sm:p-8">
        <div class="flex items-start justify-between mb-6">
          <h2 class="font-display text-2xl font-semibold text-navy-950">Edit Profil</h2>
          <button data-close class="p-2 -m-2 text-slate-400 hover:text-slate-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form id="edit-form" class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="label">Nama Lengkap</label><input name="full_name" class="input" value="${escapeHTML(u.full_name || '')}" required /></div>
            <div><label class="label">NIM</label><input name="nim" class="input" value="${escapeHTML(p.nim || '')}" /></div>
            <div><label class="label">Angkatan</label><input name="angkatan" type="number" class="input" value="${p.angkatan ?? ''}" required /></div>
            <div><label class="label">Tahun Lulus</label><input name="tahun_lulus" type="number" class="input" value="${p.tahun_lulus ?? ''}" /></div>
            <div><label class="label">No. HP</label><input name="no_hp" class="input" value="${escapeHTML(p.no_hp || '')}" /></div>
            <div>
              <label class="label">Status Kerja</label>
              <select name="status_kerja" class="select">
                ${['Bekerja','Wirausaha','Studi Lanjut','Mencari Kerja','Lainnya'].map(o=>`<option ${p.status_kerja===o?'selected':''}>${o}</option>`).join('')}
              </select>
            </div>
            <div><label class="label">Tempat Kerja</label><input name="tempat_kerja" class="input" value="${escapeHTML(p.tempat_kerja || '')}" /></div>
            <div><label class="label">Jabatan</label><input name="jabatan" class="input" value="${escapeHTML(p.jabatan || '')}" /></div>
            <div><label class="label">Lokasi Kerja</label><input name="lokasi_kerja" class="input" value="${escapeHTML(p.lokasi_kerja || '')}" /></div>
            <div><label class="label">LinkedIn URL</label><input name="linkedin_url" type="url" class="input" value="${escapeHTML(p.linkedin_url || '')}" /></div>
            <div><label class="label">Instagram URL</label><input name="instagram_url" type="url" class="input" value="${escapeHTML(p.instagram_url || '')}" /></div>
          </div>
          <div><label class="label">Alamat</label><input name="alamat" class="input" value="${escapeHTML(p.alamat || '')}" /></div>
          <div><label class="label">Bio</label><textarea name="bio" class="textarea" rows="4">${escapeHTML(p.bio || '')}</textarea></div>
          <div class="flex justify-end gap-2 pt-4">
            <button type="button" data-close class="btn btn-ghost">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const close = () => { modal.remove(); document.body.style.overflow = ''; };
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));

  modal.querySelector('#edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const patch = Object.fromEntries(fd.entries());
    const full_name = patch.full_name; delete patch.full_name;
    patch.angkatan    = patch.angkatan ? Number(patch.angkatan) : null;
    patch.tahun_lulus = patch.tahun_lulus ? Number(patch.tahun_lulus) : null;
    try {
      // Update users.full_name
      const { error: uErr } = await supabase.from('users').update({ full_name }).eq('id', u.id);
      if (uErr) throw uErr;
      // Update alumni_profiles
      await alumniService.updateProfile(u.id, patch);
      toast.success('Profil berhasil diperbarui');
      close();
      setTimeout(() => location.reload(), 600);
    } catch (err) { console.error(err); toast.error(err.message || 'Gagal menyimpan'); }
  });
}

init();
