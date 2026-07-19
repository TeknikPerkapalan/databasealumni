// admin/forms.js — Forms builder & submissions viewer

import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService } from '/src/services/auth.service.js';
import { formService } from '/src/services/form.service.js';
import { toast } from '/src/utils/toast.js';
import { formatDateTime, escapeHTML } from '/src/utils/helpers.js';

let forms = [];
let currentForm = null;   // form being edited (with .fields)
let currentUser = null;

const TYPE_LABEL = {
  text: 'Text Singkat',
  textarea: 'Text Panjang',
  select: 'Dropdown',
  radio: 'Radio',
  checkbox: 'Checkbox',
  date: 'Tanggal',
  file: 'File Upload',
};

(async function init() {
  currentUser = await authService.requireAuth({ adminOnly: true });
  if (!currentUser) return;
  mountAdminSidebar('#admin-sidebar');
  bindUI();
  await loadForms();
})();

function bindUI() {
  document.getElementById('btn-new').addEventListener('click', () => openNewModal());
  document.getElementById('modal-new-close').addEventListener('click', closeNewModal);
  document.getElementById('btn-new-cancel').addEventListener('click', closeNewModal);
  document.getElementById('form-new').addEventListener('submit', onCreateForm);
  document.getElementById('back-list').addEventListener('click', showList);
  document.getElementById('back-builder').addEventListener('click', () => showBuilder(currentForm));
  document.getElementById('btn-save-meta').addEventListener('click', onSaveMeta);
  document.getElementById('btn-delete-form').addEventListener('click', onDeleteForm);
  document.getElementById('btn-view-sub').addEventListener('click', onViewSubmissions);
  document.getElementById('btn-add-field').addEventListener('click', () => openFieldModal());
  document.getElementById('modal-field-close').addEventListener('click', closeFieldModal);
  document.getElementById('btn-field-cancel').addEventListener('click', closeFieldModal);
  document.getElementById('form-field').addEventListener('submit', onSaveField);
  document.getElementById('fld-type').addEventListener('change', toggleOptsVisibility);

  document.getElementById('modal-new').addEventListener('click', (e) => {
    if (e.target.id === 'modal-new') closeNewModal();
  });
  document.getElementById('modal-field').addEventListener('click', (e) => {
    if (e.target.id === 'modal-field') closeFieldModal();
  });
}

async function loadForms() {
  const grid = document.getElementById('forms-grid');
  grid.innerHTML = '<p class="text-slate-400 col-span-full text-center py-10">Memuat...</p>';
  try {
    forms = await formService.listAll();
    renderGrid();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="text-rose-500 col-span-full text-center py-10">Gagal memuat: ${escapeHTML(err.message)}</p>`;
  }
}

function renderGrid() {
  const grid = document.getElementById('forms-grid');
  if (!forms.length) {
    grid.innerHTML = '<p class="text-slate-400 col-span-full text-center py-12">Belum ada formulir. Klik "Formulir Baru" untuk membuat.</p>';
    return;
  }
  grid.innerHTML = forms.map((f) => {
    const fieldsCount = f.fields?.[0]?.count ?? 0;
    const subsCount = f.submissions?.[0]?.count ?? 0;
    return `
    <div class="card p-5 hover:-translate-y-0.5 transition cursor-pointer" data-id="${f.id}">
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-navy-900 text-gold-500 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
        </div>
        ${f.is_active ? '<span class="badge badge-emerald">Aktif</span>' : '<span class="badge badge-slate">Nonaktif</span>'}
      </div>
      <h3 class="font-display text-lg font-semibold text-navy-950 mb-1">${escapeHTML(f.title)}</h3>
      <p class="text-sm text-slate-600 line-clamp-2 mb-3">${escapeHTML(f.description || '')}</p>
      <div class="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
        <span>${fieldsCount} field</span>
        <span>${subsCount} submission</span>
      </div>
    </div>
  `;
  }).join('');
  grid.querySelectorAll('[data-id]').forEach((c) => {
    c.addEventListener('click', () => editForm(c.dataset.id));
  });
}

function openNewModal() {
  document.getElementById('n-title').value = '';
  document.getElementById('n-desc').value = '';
  const m = document.getElementById('modal-new');
  m.classList.remove('hidden');
  m.classList.add('flex');
}
function closeNewModal() {
  const m = document.getElementById('modal-new');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

async function onCreateForm(e) {
  e.preventDefault();
  const title = document.getElementById('n-title').value.trim();
  const description = document.getElementById('n-desc').value.trim() || null;
  try {
    const f = await formService.createForm({ title, description, is_active: true, created_by: currentUser.id });
    toast.success('Formulir dibuat');
    closeNewModal();
    await editForm(f.id);
    await loadForms();
  } catch (err) {
    toast.error(err.message || 'Gagal membuat formulir');
  }
}

async function editForm(id) {
  try {
    currentForm = await formService.getById(id);
    if (!currentForm) {
      toast.error('Formulir tidak ditemukan');
      return;
    }
    showBuilder(currentForm);
  } catch (err) {
    toast.error(err.message || 'Gagal memuat formulir');
  }
}

function showList() {
  document.getElementById('list-view').classList.remove('hidden');
  document.getElementById('builder-view').classList.add('hidden');
  document.getElementById('submissions-view').classList.add('hidden');
  document.getElementById('page-h').textContent = 'Kelola Formulir';
  document.getElementById('crumb').textContent = 'Formulir';
  document.getElementById('hdr-actions').innerHTML = '';
  document.getElementById('hdr-actions').appendChild(makeNewBtn());
}

function makeNewBtn() {
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Formulir Baru`;
  btn.addEventListener('click', openNewModal);
  return btn;
}

function showBuilder(f) {
  document.getElementById('list-view').classList.add('hidden');
  document.getElementById('builder-view').classList.remove('hidden');
  document.getElementById('submissions-view').classList.add('hidden');
  document.getElementById('crumb').textContent = 'Formulir › Edit';
  document.getElementById('page-h').textContent = f.title;
  document.getElementById('hdr-actions').innerHTML = '';

  document.getElementById('m-title').value = f.title;
  document.getElementById('m-desc').value = f.description || '';
  document.getElementById('m-active').checked = !!f.is_active;
  document.getElementById('m-slug').textContent = `Slug publik: /form.html?slug=${f.slug}`;

  renderFields();
}

function renderFields() {
  const wrap = document.getElementById('fields-list');
  const empty = document.getElementById('fields-empty');
  const fields = currentForm.fields || [];
  if (!fields.length) {
    wrap.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  wrap.innerHTML = fields.map((f) => `
    <div class="border border-slate-200 rounded-xl p-4 bg-white flex items-start gap-3">
      <div class="font-mono text-xs text-slate-400 mt-1 w-8">${f.order_index}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-medium text-navy-950">${escapeHTML(f.label)}</span>
          ${f.required ? '<span class="text-rose-500 text-xs">wajib</span>' : ''}
          <span class="badge badge-slate">${TYPE_LABEL[f.type] || f.type}</span>
        </div>
        ${f.placeholder ? `<p class="text-xs text-slate-500 mt-1">Hint: ${escapeHTML(f.placeholder)}</p>` : ''}
        ${f.options ? `<p class="text-xs text-slate-500 mt-1">Pilihan: ${escapeHTML((Array.isArray(f.options) ? f.options : []).join(', '))}</p>` : ''}
      </div>
      <div class="flex items-center gap-1 flex-none">
        <button data-act="edit" data-id="${f.id}" class="px-2 py-1.5 rounded hover:bg-slate-100 text-slate-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button>
        <button data-act="del" data-id="${f.id}" class="px-2 py-1.5 rounded hover:bg-rose-50 text-rose-500">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `).join('');
  wrap.querySelectorAll('button[data-act]').forEach((b) => {
    b.addEventListener('click', () => onFieldAction(b.dataset.act, b.dataset.id));
  });
}

async function onFieldAction(act, id) {
  const f = (currentForm.fields || []).find((x) => x.id === id);
  if (!f) return;
  if (act === 'edit') openFieldModal(f);
  else if (act === 'del') {
    if (!confirm('Hapus field ini?')) return;
    try {
      await formService.deleteField(id);
      toast.success('Field dihapus');
      currentForm = await formService.getById(currentForm.id);
      renderFields();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus field');
    }
  }
}

function toggleOptsVisibility() {
  const t = document.getElementById('fld-type').value;
  const wrap = document.getElementById('opts-wrap');
  if (['select', 'radio', 'checkbox'].includes(t)) wrap.classList.remove('hidden');
  else wrap.classList.add('hidden');
}

function openFieldModal(f = null) {
  document.getElementById('field-modal-title').textContent = f ? 'Edit Field' : 'Tambah Field';
  document.getElementById('fld-id').value = f?.id || '';
  document.getElementById('fld-label').value = f?.label || '';
  document.getElementById('fld-type').value = f?.type || 'text';
  document.getElementById('fld-order').value = f?.order_index ?? (currentForm.fields?.length || 0);
  document.getElementById('fld-placeholder').value = f?.placeholder || '';
  document.getElementById('fld-required').checked = !!f?.required;
  document.getElementById('fld-options').value = Array.isArray(f?.options) ? f.options.join('\n') : '';
  toggleOptsVisibility();
  const m = document.getElementById('modal-field');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeFieldModal() {
  const m = document.getElementById('modal-field');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

async function onSaveField(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-field-save');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';
  const id = document.getElementById('fld-id').value;
  const type = document.getElementById('fld-type').value;
  const optsRaw = document.getElementById('fld-options').value;
  const options = ['select', 'radio', 'checkbox'].includes(type)
    ? optsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : null;

  const data = {
    label: document.getElementById('fld-label').value.trim(),
    type,
    order_index: parseInt(document.getElementById('fld-order').value, 10) || 0,
    placeholder: document.getElementById('fld-placeholder').value.trim() || null,
    required: document.getElementById('fld-required').checked,
    options,
  };
  try {
    if (id) await formService.updateField(id, data);
    else await formService.addField(currentForm.id, data);
    toast.success(id ? 'Field diperbarui' : 'Field ditambahkan');
    closeFieldModal();
    currentForm = await formService.getById(currentForm.id);
    renderFields();
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan field');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Field';
  }
}

async function onSaveMeta() {
  const btn = document.getElementById('btn-save-meta');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';
  try {
    await formService.updateForm(currentForm.id, {
      title: document.getElementById('m-title').value.trim(),
      description: document.getElementById('m-desc').value.trim() || null,
      is_active: document.getElementById('m-active').checked,
    });
    toast.success('Pengaturan disimpan');
    currentForm = await formService.getById(currentForm.id);
    document.getElementById('page-h').textContent = currentForm.title;
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Pengaturan';
  }
}

async function onDeleteForm() {
  if (!confirm('Hapus formulir ini? Semua field dan submission akan ikut terhapus.')) return;
  try {
    await formService.deleteForm(currentForm.id);
    toast.success('Formulir dihapus');
    showList();
    await loadForms();
  } catch (err) {
    toast.error(err.message || 'Gagal menghapus');
  }
}

async function onViewSubmissions() {
  try {
    const subs = await formService.getSubmissions(currentForm.id);
    document.getElementById('list-view').classList.add('hidden');
    document.getElementById('builder-view').classList.add('hidden');
    document.getElementById('submissions-view').classList.remove('hidden');
    document.getElementById('crumb').textContent = `Formulir › ${currentForm.title} › Submission`;
    document.getElementById('page-h').textContent = 'Hasil Submission';

    const fields = currentForm.fields || [];
    const head = document.getElementById('sub-head');
    head.innerHTML = `
      <th class="text-left px-5 py-3 font-medium">Pengirim</th>
      <th class="text-left px-5 py-3 font-medium">Waktu</th>
      ${fields.map((f) => `<th class="text-left px-5 py-3 font-medium">${escapeHTML(f.label)}</th>`).join('')}
    `;

    const tbody = document.getElementById('sub-tbody');
    if (!subs.length) {
      tbody.innerHTML = `<tr><td colspan="${fields.length + 2}" class="px-5 py-12 text-center text-slate-400">Belum ada submission.</td></tr>`;
      return;
    }
    tbody.innerHTML = subs.map((s) => `
      <tr class="border-t border-slate-100">
        <td class="px-5 py-3">
          <div class="font-medium text-navy-950 text-sm">${escapeHTML(s.user?.full_name || 'Anonim')}</div>
          <div class="text-xs text-slate-500">${escapeHTML(s.user?.email || '')}</div>
        </td>
        <td class="px-5 py-3 text-xs text-slate-600">${formatDateTime(s.created_at)}</td>
        ${fields.map((f) => {
          const val = s.data?.[f.label];
          let cell = '';
          if (val == null || val === '') cell = '<span class="text-slate-300">—</span>';
          else if (Array.isArray(val)) cell = escapeHTML(val.join(', '));
          else if (f.type === 'file' && typeof val === 'string' && val.startsWith('http')) {
            cell = `<a href="${escapeHTML(val)}" target="_blank" class="text-navy-700 underline">Lihat file</a>`;
          } else cell = escapeHTML(String(val));
          return `<td class="px-5 py-3 text-sm text-slate-700">${cell}</td>`;
        }).join('')}
      </tr>
    `).join('');
  } catch (err) {
    toast.error(err.message || 'Gagal memuat submission');
  }
}
