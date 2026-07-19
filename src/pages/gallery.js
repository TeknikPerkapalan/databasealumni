// ============================================================================
// GALLERY PAGE
// ============================================================================
import { mountNavbar }   from '/src/components/navbar.js';
import { mountFooter }   from '/src/components/footer.js';
import { galleryService } from '/src/services/gallery.service.js';
import { escapeHTML, formatDate } from '/src/utils/helpers.js';

mountNavbar();
mountFooter();

const $ = (s) => document.querySelector(s);

const state = {
  albums: [],
  selectedSlug: null,
  selectedTitle: 'Album',
  images: [],
  page: 1,
  pageSize: 18,
  count: 0,
  lightboxIdx: 0,
};

async function loadAlbums() {
  try {
    state.albums = await galleryService.listAlbums();
  } catch (e) {
    console.error(e);
    state.albums = [];
  }

  // Render pills
  const pills = $('#album-pills');
  const allPill = (slug, label, count, active) => `
    <button data-slug="${slug ?? ''}" class="px-4 py-2 rounded-full text-sm font-medium ring-1 transition
      ${active ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}">
      ${escapeHTML(label)}${count != null ? `<span class="ml-1.5 text-xs opacity-70">${count}</span>` : ''}
    </button>`;
  pills.innerHTML = [
    allPill(null, 'Semua', null, !state.selectedSlug),
    ...state.albums.map(a => allPill(a.slug, a.title, a.images?.[0]?.count ?? 0, state.selectedSlug === a.slug)),
  ].join('');
  pills.querySelectorAll('button[data-slug]').forEach(b => {
    b.addEventListener('click', () => {
      const slug = b.dataset.slug || null;
      const album = state.albums.find(a => a.slug === slug);
      selectAlbum(slug, album?.title || 'Album');
    });
  });

  // Render album grid
  const grid = $('#album-grid');
  if (!state.albums.length) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">Belum ada album.</div>`;
    return;
  }
  grid.innerHTML = state.albums.map(a => `
    <article class="card overflow-hidden group cursor-pointer hover:shadow-md transition" data-album="${a.slug}">
      <div class="relative aspect-[4/3] overflow-hidden">
        ${a.cover_url
          ? `<img src="${a.cover_url}" alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />`
          : `<div class="absolute inset-0 hero-gradient"></div>`}
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 class="font-display font-semibold text-lg leading-tight">${escapeHTML(a.title)}</h3>
          <p class="text-xs text-white/80 mt-1">${a.images?.[0]?.count ?? 0} foto · ${formatDate(a.created_at)}</p>
        </div>
      </div>
    </article>
  `).join('');
  grid.querySelectorAll('[data-album]').forEach(el => {
    el.addEventListener('click', () => {
      const slug = el.dataset.album;
      const album = state.albums.find(a => a.slug === slug);
      selectAlbum(slug, album?.title || 'Album');
    });
  });
}

async function selectAlbum(slug, title) {
  state.selectedSlug = slug;
  state.selectedTitle = title;
  state.page = 1;
  state.images = [];

  // Update pills active state
  $('#album-pills').querySelectorAll('button[data-slug]').forEach(b => {
    const active = (b.dataset.slug || null) === slug;
    b.className = `px-4 py-2 rounded-full text-sm font-medium ring-1 transition ${
      active ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
    }`;
  });

  if (slug) {
    $('#album-section').classList.add('hidden');
    $('#image-section').classList.remove('hidden');
    $('#album-title').textContent = title;
    await loadImages();
  } else {
    $('#image-section').classList.add('hidden');
    $('#album-section').classList.remove('hidden');
  }
}

async function loadImages() {
  const grid = $('#image-grid');
  if (state.page === 1) grid.innerHTML = skeletonImages(8);
  try {
    const { rows, count } = await galleryService.listImages({
      albumSlug: state.selectedSlug, page: state.page, pageSize: state.pageSize,
    });
    state.count = count;
    if (state.page === 1) state.images = rows;
    else state.images = state.images.concat(rows);

    if (!state.images.length) {
      grid.innerHTML = `<div class="text-center py-12 text-slate-500" style="grid-column: 1 / -1">Belum ada foto di album ini.</div>`;
      $('#load-more-wrap').classList.add('hidden');
      return;
    }
    grid.innerHTML = state.images.map((img, i) => `
      <button class="masonry-item group" data-idx="${i}">
        <img src="${img.image_url}" alt="${escapeHTML(img.caption || '')}" class="w-full rounded-lg group-hover:opacity-90 transition shadow-sm" loading="lazy" />
        ${img.caption ? `<p class="text-xs text-slate-500 mt-2 px-1 text-left">${escapeHTML(img.caption)}</p>` : ''}
      </button>
    `).join('');
    grid.querySelectorAll('[data-idx]').forEach(b => {
      b.addEventListener('click', () => openLightbox(Number(b.dataset.idx)));
    });
    if (state.images.length < state.count) {
      $('#load-more-wrap').classList.remove('hidden');
    } else {
      $('#load-more-wrap').classList.add('hidden');
    }
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="text-center py-12 text-rose-600" style="grid-column: 1 / -1">Gagal memuat foto.</div>`;
  }
}

function skeletonImages(n=8) {
  return Array.from({length:n}).map((_,i) => {
    const h = 180 + (i*40) % 200;
    return `<div class="masonry-item"><div class="rounded-lg bg-slate-200 animate-pulse" style="height:${h}px"></div></div>`;
  }).join('');
}

// Lightbox
function openLightbox(idx) {
  state.lightboxIdx = idx;
  const img = state.images[idx];
  $('#lb-img').src = img.image_url;
  $('#lb-caption').textContent = img.caption || '';
  $('#lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  $('#lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}
function navigate(dir) {
  state.lightboxIdx = (state.lightboxIdx + dir + state.images.length) % state.images.length;
  const img = state.images[state.lightboxIdx];
  $('#lb-img').src = img.image_url;
  $('#lb-caption').textContent = img.caption || '';
}

$('#lb-close').addEventListener('click', closeLightbox);
$('#lb-prev').addEventListener('click', () => navigate(-1));
$('#lb-next').addEventListener('click', () => navigate(1));
$('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
window.addEventListener('keydown', (e) => {
  if ($('#lightbox').classList.contains('hidden')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') navigate(1);
  if (e.key === 'ArrowLeft')  navigate(-1);
});

$('#btn-back').addEventListener('click', () => selectAlbum(null, ''));
$('#btn-load-more').addEventListener('click', () => { state.page++; loadImages(); });

loadAlbums();
