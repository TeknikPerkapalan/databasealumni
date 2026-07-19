// ============================================================================
// ADMIN: ARTICLES (Quill editor)
// ============================================================================
import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService }       from '/src/services/auth.service.js';
import { articleService }    from '/src/services/article.service.js';
import { storageService }    from '/src/services/storage.service.js';
import { formatDate, escapeHTML, getQueryParam, truncate } from '/src/utils/helpers.js';
import { toast }             from '/src/utils/toast.js';

const user = await authService.requireAuth({ adminOnly: false });
if (!user) throw new Error('redirecting');

mountAdminSidebar('#admin-sidebar');

const $ = (s) => document.querySelector(s);

const state = {
  mode: 'list',        // 'list' | 'editor'
  editing: null,       // article id when editing
  thumbUrl: '',
  categories: [],
  quill: null,
};

// ============== LIST ==============
async function loadList() {
  const tbody = $('#tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-slate-500">Memuat...</td></tr>`;
  try {
    const rows = await articleService.listAll();
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-12 text-center text-slate-500">Belum ada artikel. Klik "Tulis Artikel Baru" untuk memulai.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(a => `
      <tr class="border-t border-slate-100 hover:bg-slate-50/50">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
              ${a.thumbnail_url ? `<img src="${a.thumbnail_url}" class="w-full h-full object-cover" />` : ''}
            </div>
            <div class="min-w-0">
              <p class="font-medium text-navy-950 truncate max-w-xs">${escapeHTML(a.title)}</p>
              ${a.excerpt ? `<p class="text-xs text-slate-500 truncate max-w-xs">${escapeHTML(truncate(a.excerpt, 80))}</p>` : ''}
            </div>
          </div>
        </td>
        <td class="px-5 py-4 hidden md:table-cell text-slate-700">${escapeHTML(a.category?.name || '—')}</td>
        <td class="px-5 py-4 hidden md:table-cell text-slate-700">${escapeHTML(a.author?.full_name || '—')}</td>
        <td class="px-5 py-4">
          <span class="badge ${a.status==='published'?'badge-emerald':'badge-amber'}">${a.status}</span>
        </td>
        <td class="px-5 py-4 hidden lg:table-cell text-slate-500 text-xs">${formatDate(a.created_at)}</td>
        <td class="px-5 py-4 text-right">
          <button data-edit="${a.id}" class="p-1.5 text-slate-500 hover:text-navy-900" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3 3 18v3h3L17.7 9.3"/><path d="M14.7 6.3l3-3a2.1 2.1 0 0 1 3 3l-3 3"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button[data-edit]').forEach(b => b.addEventListener('click', () => openEditor(b.dataset.edit)));
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-rose-600">Gagal memuat artikel.</td></tr>`;
  }
}

// ============== EDITOR ==============
function initQuill() {
  if (state.quill) return;
  state.quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    },
    placeholder: 'Mulai menulis...',
  });
  // Image upload handler — uploads to articles bucket
  state.quill.getModule('toolbar').addHandler('image', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      toast.info('Mengunggah gambar...');
      try {
        const { publicUrl } = await storageService.upload('articles', file, { folder: 'inline' });
        const range = state.quill.getSelection(true);
        state.quill.insertEmbed(range.index, 'image', publicUrl, 'user');
        state.quill.setSelection(range.index + 1);
      } catch (err) { toast.error(err.message || 'Gagal upload'); }
    };
    input.click();
  });
}

async function loadCategories() {
  state.categories = await articleService.listCategories();
  const sel = $('#art-category');
  sel.innerHTML = `<option value="">— tidak ada —</option>` +
    state.categories.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
}

async function openEditor(id = null) {
  state.editing = id;
  $('#list-view').classList.add('hidden');
  $('#editor-view').classList.remove('hidden');
  $('#page-h').textContent = id ? 'Edit Artikel' : 'Tulis Artikel Baru';
  $('#btn-new').classList.toggle('hidden', true);

  initQuill();
  if (!state.categories.length) await loadCategories();

  if (id) {
    try {
      const all = await articleService.listAll();
      const a = all.find(x => String(x.id) === String(id));
      if (!a) { toast.error('Artikel tidak ditemukan'); return showList(); }
      $('#art-title').value = a.title || '';
      $('#art-excerpt').value = a.excerpt || '';
      $('#art-status').value = a.status || 'draft';
      $('#art-category').value = a.category_id || '';
      state.thumbUrl = a.thumbnail_url || '';
      renderThumb();
      state.quill.clipboard.dangerouslyPasteHTML(a.content || '');
      $('#btn-delete').classList.remove('hidden');
    } catch (e) { toast.error('Gagal memuat artikel'); }
  } else {
    $('#art-title').value = '';
    $('#art-excerpt').value = '';
    $('#art-status').value = 'draft';
    $('#art-category').value = '';
    state.thumbUrl = '';
    renderThumb();
    state.quill.setText('');
    $('#btn-delete').classList.add('hidden');
  }
}

function showList() {
  state.mode = 'list';
  state.editing = null;
  $('#editor-view').classList.add('hidden');
  $('#list-view').classList.remove('hidden');
  $('#page-h').textContent = 'Kelola Artikel';
  $('#btn-new').classList.remove('hidden');
  loadList();
}

function renderThumb() {
  const box = $('#thumb-preview');
  box.innerHTML = state.thumbUrl
    ? `<img src="${state.thumbUrl}" class="w-full h-full object-cover" />`
    : `<p class="text-xs text-slate-400">Belum ada gambar</p>`;
}

$('#thumb-input').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  toast.info('Mengunggah...');
  try {
    const { publicUrl } = await storageService.upload('articles', file, { folder: 'thumbnails' });
    state.thumbUrl = publicUrl;
    renderThumb();
    toast.success('Thumbnail diunggah');
  } catch (err) { toast.error(err.message || 'Gagal upload'); }
});

$('#btn-new').addEventListener('click', () => openEditor(null));
$('#btn-back').addEventListener('click', showList);

$('#btn-save').addEventListener('click', async () => {
  const title = $('#art-title').value.trim();
  if (!title) return toast.error('Judul wajib diisi');
  const content = state.quill.root.innerHTML;
  const payload = {
    title,
    excerpt: $('#art-excerpt').value.trim(),
    content,
    thumbnail_url: state.thumbUrl || null,
    category_id: $('#art-category').value || null,
    status: $('#art-status').value,
  };
  const btn = $('#btn-save');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    if (state.editing) {
      await articleService.update(state.editing, payload);
      toast.success('Artikel diperbarui');
    } else {
      const created = await articleService.create({ ...payload, author_id: user.id });
      toast.success('Artikel disimpan');
      state.editing = created.id;
      $('#btn-delete').classList.remove('hidden');
    }
  } catch (err) { console.error(err); toast.error(err.message || 'Gagal menyimpan'); }
  finally { btn.disabled = false; btn.textContent = 'Simpan'; }
});

$('#btn-delete').addEventListener('click', async () => {
  if (!state.editing) return;
  if (!confirm('Hapus artikel ini secara permanen?')) return;
  try {
    await articleService.remove(state.editing);
    toast.success('Artikel dihapus');
    showList();
  } catch (err) { toast.error(err.message || 'Gagal menghapus'); }
});

// Init
loadList();
if (getQueryParam('new') === '1') openEditor(null);
else if (getQueryParam('edit')) openEditor(getQueryParam('edit'));
