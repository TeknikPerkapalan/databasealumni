// ============================================================================
// ALUMNI PAGE
// ============================================================================
import { mountNavbar }    from '/src/components/navbar.js';
import { mountFooter }    from '/src/components/footer.js';
import { alumniService }  from '/src/services/alumni.service.js';
import { debounce, initials, escapeHTML } from '/src/utils/helpers.js';
import { toast }          from '/src/utils/toast.js';

mountNavbar();
mountFooter();

const $ = (s) => document.querySelector(s);

const state = {
  search: '', angkatan: '', status: '', lokasi: '', perusahaan: '',
  page: 1, pageSize: 12, count: 0, rows: [],
};

const grid = $('#alumni-grid');
const pag  = $('#pagination');

function skeletonCards(n = 6) {
  return Array.from({ length: n }).map(() => `
    <div class="card p-5 animate-pulse">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-full bg-slate-200"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-slate-200 rounded w-2/3"></div>
          <div class="h-2.5 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
      <div class="mt-4 space-y-2">
        <div class="h-2.5 bg-slate-200 rounded w-3/4"></div>
        <div class="h-2.5 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
  `).join('');
}

function cardHTML(row) {
  const u = row.user || {};
  const name = u.full_name || 'Alumni';
  const avatar = u.avatar_url
    ? `<img src="${u.avatar_url}" alt="${escapeHTML(name)}" class="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow" loading="lazy" />`
    : `<div class="w-14 h-14 rounded-full bg-navy-900 text-white grid place-items-center font-semibold ring-2 ring-white shadow">${initials(name)}</div>`;

  const statusTone = {
    'Bekerja': 'badge-emerald',
    'Wirausaha': 'badge-gold',
    'Studi Lanjut': 'badge-sky',
    'Mencari Kerja': 'badge-amber',
  }[row.status_kerja] || 'badge-slate';

  const socials = [
    row.linkedin_url ? `<a href="${row.linkedin_url}" target="_blank" rel="noopener" class="text-slate-400 hover:text-navy-900" title="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45z"/></svg></a>` : '',
    row.instagram_url ? `<a href="${row.instagram_url}" target="_blank" rel="noopener" class="text-slate-400 hover:text-navy-900" title="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>` : '',
  ].join('');

  return `
    <article class="card p-5 hover:shadow-md transition group">
      <div class="flex items-start gap-3">
        ${avatar}
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-navy-950 truncate">${escapeHTML(name)}</h3>
          <p class="text-xs text-slate-500 mt-0.5">Angkatan ${row.angkatan ?? '—'} · NIM ${escapeHTML(row.nim ?? '—')}</p>
          <span class="badge ${statusTone} mt-2 inline-flex">${escapeHTML(row.status_kerja || 'Alumni')}</span>
        </div>
      </div>
      <dl class="mt-4 space-y-1.5 text-sm">
        ${row.jabatan ? `<div class="flex items-start gap-2 text-slate-700"><svg class="shrink-0 mt-0.5 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg><span class="truncate"><strong class="font-medium">${escapeHTML(row.jabatan)}</strong>${row.tempat_kerja ? ` · ${escapeHTML(row.tempat_kerja)}` : ''}</span></div>` : ''}
        ${row.lokasi_kerja ? `<div class="flex items-center gap-2 text-slate-600"><svg class="shrink-0 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span class="truncate">${escapeHTML(row.lokasi_kerja)}</span></div>` : ''}
      </dl>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">${socials}</div>
        <a href="/profile.html?id=${row.user_id}" class="text-xs font-medium text-navy-900 hover:text-gold-600 inline-flex items-center gap-1">Lihat profil
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
    </article>
  `;
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(state.count / state.pageSize));
  if (totalPages <= 1) { pag.innerHTML = ''; return; }

  const btn = (label, page, disabled = false, active = false) =>
    `<button data-page="${page}" ${disabled ? 'disabled' : ''}
      class="min-w-9 h-9 px-3 rounded-lg text-sm font-medium ring-1 transition
        ${active ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}">${label}</button>`;

  const items = [];
  items.push(btn('‹', state.page - 1, state.page === 1));
  const max = Math.min(totalPages, 7);
  let start = Math.max(1, state.page - 3);
  let end   = Math.min(totalPages, start + max - 1);
  start = Math.max(1, end - max + 1);
  for (let i = start; i <= end; i++) items.push(btn(i, i, false, i === state.page));
  items.push(btn('›', state.page + 1, state.page === totalPages));

  pag.innerHTML = items.join('');
  pag.querySelectorAll('button[data-page]').forEach(b => {
    b.addEventListener('click', () => {
      state.page = Number(b.dataset.page);
      load();
      window.scrollTo({ top: document.querySelector('#alumni-grid').offsetTop - 80, behavior: 'smooth' });
    });
  });
}

async function load() {
  grid.innerHTML = skeletonCards(state.pageSize);
  document.querySelector('#result-count').textContent = 'Memuat…';
  try {
    const { rows, count } = await alumniService.list({
      search: state.search,
      angkatan: state.angkatan || null,
      status: state.status,
      lokasi: state.lokasi,
      perusahaan: state.perusahaan,
      page: state.page,
      pageSize: state.pageSize,
    });
    state.rows = rows; state.count = count;
    document.querySelector('#result-count').textContent = `${count} alumni ditemukan`;
    if (!rows.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-16 text-slate-500">
        <div class="text-5xl mb-3 opacity-30">⚓</div>
        Belum ada alumni yang sesuai filter.
      </div>`;
      pag.innerHTML = '';
      return;
    }
    grid.innerHTML = rows.map(cardHTML).join('');
    renderPagination();
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="col-span-full text-center py-16 text-rose-600">Gagal memuat data. Pastikan Supabase sudah dikonfigurasi.</div>`;
  }
}

// Event wiring
const onSearchInput = debounce(() => {
  state.search = document.querySelector('#f-search').value.trim();
  state.page = 1;
  load();
}, 300);
document.querySelector('#f-search').addEventListener('input', onSearchInput);

document.querySelector('#btn-apply').addEventListener('click', () => {
  state.search     = document.querySelector('#f-search').value.trim();
  state.angkatan   = document.querySelector('#f-angkatan').value.trim();
  state.status     = document.querySelector('#f-status').value;
  state.lokasi     = document.querySelector('#f-lokasi').value.trim();
  state.perusahaan = document.querySelector('#f-perusahaan').value.trim();
  state.page = 1;
  load();
});

document.querySelector('#btn-reset').addEventListener('click', () => {
  ['#f-search','#f-angkatan','#f-lokasi','#f-perusahaan'].forEach(id => document.querySelector(id).value = '');
  document.querySelector('#f-status').value = '';
  Object.assign(state, { search:'', angkatan:'', status:'', lokasi:'', perusahaan:'', page: 1 });
  load();
});

document.querySelector('#btn-csv').addEventListener('click', async () => {
  try {
    const { rows } = await alumniService.list({
      search: state.search,
      angkatan: state.angkatan || null,
      status: state.status,
      lokasi: state.lokasi,
      perusahaan: state.perusahaan,
      page: 1, pageSize: 1000,
    });
    const csv = alumniService.toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `alumni-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV berhasil diunduh');
  } catch (e) {
    toast.error('Gagal mengunduh CSV');
  }
});

load();
