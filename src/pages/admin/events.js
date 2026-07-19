// admin/events.js — Events CRUD admin page

import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService } from '/src/services/auth.service.js';
import { eventService } from '/src/services/event.service.js';
import { storageService } from '/src/services/storage.service.js';
import { toast } from '/src/utils/toast.js';
import { formatDateTime, escapeHTML } from '/src/utils/helpers.js';

let events = [];
let currentUser = null;

(async function init() {
  currentUser = await authService.requireAuth({ adminOnly: true });
  if (!currentUser) return;
  mountAdminSidebar('#admin-sidebar');
  bindUI();
  await loadEvents();
})();

function bindUI() {
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('form-event').addEventListener('submit', onSave);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.getElementById('f-banner-file').addEventListener('change', onBannerChange);
}

async function loadEvents() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>';
  try {
    events = await eventService.listAll();
    renderTable();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="px-5 py-10 text-center text-rose-500">Gagal memuat: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('tbody');
  if (!events.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-12 text-center text-slate-400">Belum ada kegiatan. Klik "Kegiatan Baru" untuk membuat.</td></tr>';
    return;
  }
  tbody.innerHTML = events.map((e) => `
    <tr class="border-t border-slate-100 hover:bg-slate-50/60">
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          ${e.banner_url
            ? `<img src="${escapeHTML(e.banner_url)}" class="w-12 h-12 rounded-lg object-cover flex-none" />`
            : '<div class="w-12 h-12 rounded-lg bg-navy-100 flex-none"></div>'}
          <div>
            <div class="font-medium text-navy-950">${escapeHTML(e.title)}</div>
            <div class="text-xs text-slate-500 md:hidden">${escapeHTML(e.location || '—')}</div>
          </div>
        </div>
      </td>
      <td class="px-5 py-3 hidden md:table-cell text-slate-700">${escapeHTML(e.location || '—')}</td>
      <td class="px-5 py-3 text-slate-700 text-xs">${formatDateTime(e.start_date)}</td>
      <td class="px-5 py-3 hidden lg:table-cell text-slate-600 text-xs">${e.end_date ? formatDateTime(e.end_date) : '—'}</td>
      <td class="px-5 py-3 text-right">
        <div class="inline-flex items-center gap-1">
          <button data-act="edit" data-id="${e.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 text-slate-600" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button data-act="del" data-id="${e.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-500" title="Hapus">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('button[data-act]').forEach((b) => {
    b.addEventListener('click', () => onAction(b.dataset.act, b.dataset.id));
  });
}

async function onAction(act, id) {
  if (act === 'edit') {
    const e = events.find((x) => x.id === id);
    if (e) openModal(e);
  } else if (act === 'del') {
    if (!confirm('Hapus kegiatan ini?')) return;
    try {
      await eventService.remove(id);
      toast.success('Kegiatan dihapus');
      await loadEvents();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus');
    }
  }
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openModal(ev = null) {
  document.getElementById('modal-title').textContent = ev ? 'Edit Kegiatan' : 'Kegiatan Baru';
  document.getElementById('f-id').value = ev?.id || '';
  document.getElementById('f-title').value = ev?.title || '';
  document.getElementById('f-location').value = ev?.location || '';
  document.getElementById('f-start').value = toLocalInput(ev?.start_date);
  document.getElementById('f-end').value = toLocalInput(ev?.end_date);
  document.getElementById('f-description').value = ev?.description || '';
  document.getElementById('f-banner-url').value = ev?.banner_url || '';
  document.getElementById('f-banner-file').value = '';

  const preview = document.getElementById('banner-preview');
  const img = document.getElementById('banner-img');
  if (ev?.banner_url) {
    img.src = ev.banner_url;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }

  const m = document.getElementById('modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeModal() {
  const m = document.getElementById('modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

async function onBannerChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = 'Mengunggah banner...';
  try {
    const { publicUrl } = await storageService.upload('events', file, { folder: 'banners', validateImage: true });
    document.getElementById('f-banner-url').value = publicUrl;
    const img = document.getElementById('banner-img');
    img.src = publicUrl;
    document.getElementById('banner-preview').classList.remove('hidden');
    toast.success('Banner diunggah');
  } catch (err) {
    toast.error(err.message || 'Gagal mengunggah banner');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}

async function onSave(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const id = document.getElementById('f-id').value;
  const startVal = document.getElementById('f-start').value;
  const endVal = document.getElementById('f-end').value;

  const data = {
    title: document.getElementById('f-title').value.trim(),
    location: document.getElementById('f-location').value.trim() || null,
    start_date: startVal ? new Date(startVal).toISOString() : null,
    end_date: endVal ? new Date(endVal).toISOString() : null,
    description: document.getElementById('f-description').value.trim() || null,
    banner_url: document.getElementById('f-banner-url').value || null,
  };

  if (!id) data.created_by = currentUser.id;

  try {
    if (id) await eventService.update(id, data);
    else await eventService.create(data);
    toast.success(id ? 'Kegiatan diperbarui' : 'Kegiatan dibuat');
    closeModal();
    await loadEvents();
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}
