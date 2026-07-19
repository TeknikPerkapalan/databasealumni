// admin/running-text.js — Running text CRUD admin page

import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService } from '/src/services/auth.service.js';
import { runningTextService } from '/src/services/runningText.service.js';
import { toast } from '/src/utils/toast.js';
import { escapeHTML } from '/src/utils/helpers.js';

let items = [];

(async function init() {
  const user = await authService.requireAuth({ adminOnly: true });
  if (!user) return;
  mountAdminSidebar('#admin-sidebar');
  bindUI();
  await loadItems();
})();

function bindUI() {
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('form-rt').addEventListener('submit', onSave);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
}

async function loadItems() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>';
  try {
    items = await runningTextService.listAll();
    renderTable();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="4" class="px-5 py-10 text-center text-rose-500">Gagal memuat: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-5 py-12 text-center text-slate-400">Belum ada pesan. Klik "Tambah Pesan" untuk membuat.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map((r) => `
    <tr class="border-t border-slate-100 hover:bg-slate-50/60">
      <td class="px-5 py-3 font-mono text-slate-600">${r.order_index}</td>
      <td class="px-5 py-3 text-slate-800">${escapeHTML(r.message)}</td>
      <td class="px-5 py-3 hidden md:table-cell">
        ${r.is_active
          ? '<span class="badge badge-emerald">Aktif</span>'
          : '<span class="badge badge-slate">Nonaktif</span>'}
      </td>
      <td class="px-5 py-3 text-right">
        <div class="inline-flex items-center gap-1">
          <button data-act="toggle" data-id="${r.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 text-slate-600" title="${r.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
            ${r.is_active
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'}
          </button>
          <button data-act="edit" data-id="${r.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 text-slate-600" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button data-act="del" data-id="${r.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-500" title="Hapus">
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
  const r = items.find((x) => x.id === id);
  if (!r) return;
  if (act === 'edit') {
    openModal(r);
  } else if (act === 'toggle') {
    try {
      await runningTextService.update(id, { is_active: !r.is_active });
      toast.success(r.is_active ? 'Dinonaktifkan' : 'Diaktifkan');
      await loadItems();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui');
    }
  } else if (act === 'del') {
    if (!confirm('Hapus pesan ini?')) return;
    try {
      await runningTextService.remove(id);
      toast.success('Pesan dihapus');
      await loadItems();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus');
    }
  }
}

function openModal(r = null) {
  document.getElementById('modal-title').textContent = r ? 'Edit Pesan' : 'Tambah Pesan';
  document.getElementById('f-id').value = r?.id || '';
  document.getElementById('f-message').value = r?.message || '';
  document.getElementById('f-order').value = r?.order_index ?? 0;
  document.getElementById('f-active').checked = r ? !!r.is_active : true;
  const m = document.getElementById('modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeModal() {
  const m = document.getElementById('modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

async function onSave(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const id = document.getElementById('f-id').value;
  const data = {
    message: document.getElementById('f-message').value.trim(),
    order_index: parseInt(document.getElementById('f-order').value, 10) || 0,
    is_active: document.getElementById('f-active').checked,
  };

  try {
    if (id) await runningTextService.update(id, data);
    else await runningTextService.create(data);
    toast.success(id ? 'Pesan diperbarui' : 'Pesan dibuat');
    closeModal();
    await loadItems();
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}
