// admin/jobs.js — Jobs CRUD admin page

import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService } from '/src/services/auth.service.js';
import { jobService } from '/src/services/job.service.js';
import { toast } from '/src/utils/toast.js';
import { formatDate, escapeHTML } from '/src/utils/helpers.js';

const TYPE_LABEL = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Kontrak',
  internship: 'Magang',
  freelance: 'Freelance',
};

const TYPE_BADGE = {
  full_time: 'badge-emerald',
  part_time: 'badge-sky',
  contract: 'badge-amber',
  internship: 'badge-gold',
  freelance: 'badge-slate',
};

let jobs = [];

(async function init() {
  const user = await authService.requireAuth({ adminOnly: true });
  if (!user) return;
  mountAdminSidebar('#admin-sidebar');
  bindUI();
  await loadJobs();
})();

function bindUI() {
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('form-job').addEventListener('submit', onSave);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
}

async function loadJobs() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>';
  try {
    jobs = await jobService.listAll();
    renderTable();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-rose-500">Gagal memuat: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('tbody');
  if (!jobs.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-12 text-center text-slate-400">Belum ada lowongan. Klik "Lowongan Baru" untuk membuat.</td></tr>';
    return;
  }
  tbody.innerHTML = jobs.map((j) => `
    <tr class="border-t border-slate-100 hover:bg-slate-50/60">
      <td class="px-5 py-3">
        <div class="font-medium text-navy-950">${escapeHTML(j.title)}</div>
        <div class="text-xs text-slate-500 md:hidden">${escapeHTML(j.company)}</div>
      </td>
      <td class="px-5 py-3 hidden md:table-cell text-slate-700">${escapeHTML(j.company)}</td>
      <td class="px-5 py-3 hidden lg:table-cell text-slate-600">${escapeHTML(j.location || '-')}</td>
      <td class="px-5 py-3"><span class="badge ${TYPE_BADGE[j.type] || 'badge-slate'}">${TYPE_LABEL[j.type] || j.type}</span></td>
      <td class="px-5 py-3 hidden lg:table-cell text-slate-600 text-xs">${j.deadline ? formatDate(j.deadline) : '—'}</td>
      <td class="px-5 py-3">
        ${j.is_active
          ? '<span class="badge badge-emerald">Aktif</span>'
          : '<span class="badge badge-slate">Nonaktif</span>'}
      </td>
      <td class="px-5 py-3 text-right">
        <div class="inline-flex items-center gap-1">
          <button data-act="edit" data-id="${j.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 text-slate-600" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button data-act="del" data-id="${j.id}" class="px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-500" title="Hapus">
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
    const j = jobs.find((x) => x.id === id);
    if (j) openModal(j);
  } else if (act === 'del') {
    if (!confirm('Hapus lowongan ini?')) return;
    try {
      await jobService.remove(id);
      toast.success('Lowongan dihapus');
      await loadJobs();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus');
    }
  }
}

function openModal(j = null) {
  document.getElementById('modal-title').textContent = j ? 'Edit Lowongan' : 'Lowongan Baru';
  document.getElementById('f-id').value = j?.id || '';
  document.getElementById('f-title').value = j?.title || '';
  document.getElementById('f-company').value = j?.company || '';
  document.getElementById('f-location').value = j?.location || '';
  document.getElementById('f-type').value = j?.type || 'full_time';
  document.getElementById('f-deadline').value = j?.deadline || '';
  document.getElementById('f-description').value = j?.description || '';
  document.getElementById('f-apply-url').value = j?.apply_url || '';
  document.getElementById('f-active').checked = j ? !!j.is_active : true;
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
    title: document.getElementById('f-title').value.trim(),
    company: document.getElementById('f-company').value.trim(),
    location: document.getElementById('f-location').value.trim() || null,
    type: document.getElementById('f-type').value,
    deadline: document.getElementById('f-deadline').value || null,
    description: document.getElementById('f-description').value.trim(),
    apply_url: document.getElementById('f-apply-url').value.trim() || null,
    is_active: document.getElementById('f-active').checked,
  };

  try {
    if (id) await jobService.update(id, data);
    else await jobService.create(data);
    toast.success(id ? 'Lowongan diperbarui' : 'Lowongan dibuat');
    closeModal();
    await loadJobs();
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}
