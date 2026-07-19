// ============================================================================
// ADMIN: GALLERY
// ============================================================================
import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService }       from '/src/services/auth.service.js';
import { galleryService }    from '/src/services/gallery.service.js';
import { storageService }    from '/src/services/storage.service.js';
import { formatDate, escapeHTML } from '/src/utils/helpers.js';
import { toast }             from '/src/utils/toast.js';

const user = await authService.requireAuth({ adminOnly: false });
if (!user) throw new Error('redirecting');

mountAdminSidebar('#admin-sidebar');

const $ = (s) => document.querySelector(s);
let openedAlbum = null;
let coverFile = null;

async function loadAlbums() {
  const grid = $('#albums');
  grid.innerHTML = Array.from({length:3}).map(()=>`<div class="card animate-pulse aspect-[4/3] bg-slate-200"></div>`).join('');
  try {
    const albums = await galleryService.listAlbums();
    if (!albums.length) {
      grid.innerHTML = `<div class="col-span-full card p-12 text-center text-slate-500">Belum ada album. Buat album pertama untuk mulai mengunggah foto.</div>`;
      return;
    }
    grid.innerHTML = albums.map(a => `
      <div class="card overflow-hidden group">
        <button data-open="${a.id}" data-title="${escapeHTML(a.title)}" class="block w-full text-left">
          <div class="relative aspect-[4/3] overflow-hidden">
            ${a.cover_url ? `<img src="${a.cover_url}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition" />` : '<div class="absolute inset-0 hero-gradient"></div>'}
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div class="absolute bottom-3 left-3 right-3 text-white">
              <h3 class="font-display font-semibold text-lg leading-tight">${escapeHTML(a.title)}</h3>
              <p class="text-xs text-white/70 mt-0.5">${a.images?.[0]?.count ?? 0} foto · ${formatDate(a.created_at)}</p>
            </div>
          </div>
        </button>
        <div class="px-4 py-3 flex items-center justify-between text-xs">
          <button data-open="${a.id}" data-title="${escapeHTML(a.title)}" class="text-navy-900 font-medium hover:text-gold-700">Kelola foto</button>
          <button data-del="${a.id}" class="text-rose-500 hover:text-rose-700">Hapus</button>
        </div>
      </div>
    `).join('');
    grid.querySelectorAll('button[data-open]').forEach(b => b.addEventListener('click', () => openAlbum(b.dataset.open, b.dataset.title)));
    grid.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', () => deleteAlbum(b.dataset.del)));
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="col-span-full text-rose-600 text-center py-12">Gagal memuat album.</div>`;
  }
}

async function deleteAlbum(id) {
  if (!confirm('Hapus album beserta semua fotonya?')) return;
  try { await galleryService.removeAlbum(id); toast.success('Album dihapus'); loadAlbums(); }
  catch (e) { toast.error(e.message || 'Gagal menghapus'); }
}

// New album
$('#btn-new-album').addEventListener('click', () => {
  $('#form-album').reset(); coverFile = null;
  $('#modal-album').classList.remove('hidden');
});
$('#modal-album').querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => $('#modal-album').classList.add('hidden')));
$('#cover-input').addEventListener('change', (e) => coverFile = e.target.files?.[0] || null);
$('#form-album').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    let coverUrl = null;
    if (coverFile) {
      const { publicUrl } = await storageService.upload('galleries', coverFile, { folder: 'covers' });
      coverUrl = publicUrl;
    }
    await galleryService.createAlbum({
      title: fd.get('title'),
      description: fd.get('description'),
      cover_url: coverUrl,
      created_by: user.id,
    });
    toast.success('Album dibuat');
    $('#modal-album').classList.add('hidden');
    loadAlbums();
  } catch (err) { toast.error(err.message || 'Gagal membuat album'); }
});

// Manage images
async function openAlbum(albumId, title) {
  openedAlbum = albumId;
  $('#modal-images-title').textContent = `Foto · ${title}`;
  $('#modal-images').classList.remove('hidden');
  await refreshImages();
}
async function refreshImages() {
  // List images for this album (no slug filter; we filter by id manually here)
  const { rows } = await galleryService.listImages({ page: 1, pageSize: 100 });
  // refilter by gallery_id since service uses slug
  const filtered = rows.filter(r => r.gallery_id === openedAlbum || (r.gallery && r.gallery.id === openedAlbum));
  const list = $('#image-list');
  if (!rows.length) { list.innerHTML = `<p class="col-span-full text-center text-slate-400 text-sm py-6">Belum ada foto.</p>`; return; }
  // Since albumSlug filter not used, show every image and tag the ones belonging here.
  list.innerHTML = rows
    .filter(r => r.gallery_id === openedAlbum)
    .map(img => `
      <div class="relative group">
        <img src="${img.image_url}" class="w-full aspect-square object-cover rounded-lg" />
        <button data-del-img="${img.id}" class="absolute top-2 right-2 bg-white/90 hover:bg-rose-50 text-rose-600 p-1.5 rounded-md shadow opacity-0 group-hover:opacity-100 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
        ${img.caption ? `<p class="text-xs text-slate-500 mt-1 truncate">${escapeHTML(img.caption)}</p>` : ''}
      </div>
    `).join('') || `<p class="col-span-full text-center text-slate-400 text-sm py-6">Belum ada foto di album ini.</p>`;
  list.querySelectorAll('button[data-del-img]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Hapus foto ini?')) return;
    try { await galleryService.removeImage(b.dataset.delImg); toast.success('Foto dihapus'); refreshImages(); }
    catch (e) { toast.error('Gagal menghapus'); }
  }));
}
$('#multi-input').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length || !openedAlbum) return;
  toast.info(`Mengunggah ${files.length} foto...`);
  let ok = 0, fail = 0;
  for (const f of files) {
    try {
      const { publicUrl } = await storageService.upload('galleries', f, { folder: openedAlbum });
      await galleryService.addImage({ gallery_id: openedAlbum, image_url: publicUrl, caption: f.name.replace(/\.[^.]+$/,''), uploaded_by: user.id });
      ok++;
    } catch { fail++; }
  }
  if (ok) toast.success(`${ok} foto berhasil diunggah`);
  if (fail) toast.error(`${fail} foto gagal diunggah`);
  e.target.value = '';
  refreshImages();
  loadAlbums();
});
$('#modal-images').querySelectorAll('[data-close-img]').forEach(el => el.addEventListener('click', () => $('#modal-images').classList.add('hidden')));

loadAlbums();
