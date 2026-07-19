// ============================================================================
// JOBS PAGE
// ============================================================================
import { mountNavbar }   from '/src/components/navbar.js';
import { mountFooter }   from '/src/components/footer.js';
import { jobService }    from '/src/services/job.service.js';
import { debounce, formatDate, escapeHTML, sanitizeHTML } from '/src/utils/helpers.js';

mountNavbar();
mountFooter();

const $ = (s) => document.querySelector(s);
const state = { search:'', type:'', location:'', page:1, pageSize:10, count:0, rows:[], selectedId:null };

const TYPE_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', internship: 'Magang', freelance: 'Freelance',
};

function skeleton() {
  return Array.from({length:4}).map(()=>`
    <div class="card p-5 animate-pulse">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-lg bg-slate-200"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-slate-200 rounded w-2/3"></div>
          <div class="h-2.5 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  `).join('');
}

function jobRowHTML(j) {
  const initial = (j.company || 'J').slice(0,1).toUpperCase();
  const active = state.selectedId === j.id;
  return `
    <button data-id="${j.id}" class="w-full text-left card p-5 hover:shadow-md transition group ${active ? 'ring-2 ring-gold-500' : ''}">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-lg bg-navy-900 text-white grid place-items-center font-semibold text-lg shrink-0">${escapeHTML(initial)}</div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-navy-950 truncate group-hover:text-gold-700">${escapeHTML(j.title)}</h3>
          <p class="text-sm text-slate-600 truncate mt-0.5">${escapeHTML(j.company)}</p>
          <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
            <span class="inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHTML(j.location || '—')}</span>
            <span class="badge badge-slate">${TYPE_LABELS[j.type] || j.type}</span>
            ${j.deadline ? `<span>Deadline ${formatDate(j.deadline)}</span>` : ''}
          </div>
        </div>
      </div>
    </button>
  `;
}

function renderDetail(j) {
  if (!j) return;
  $('#job-detail').innerHTML = `
    <div class="flex items-start gap-4">
      <div class="w-14 h-14 rounded-xl bg-navy-900 text-white grid place-items-center font-semibold text-xl shrink-0">${escapeHTML((j.company||'J').slice(0,1).toUpperCase())}</div>
      <div class="flex-1 min-w-0">
        <h2 class="font-display text-2xl font-semibold text-navy-950 leading-tight">${escapeHTML(j.title)}</h2>
        <p class="text-slate-600 mt-1">${escapeHTML(j.company)}</p>
      </div>
    </div>
    <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
      <div class="bg-slate-50 rounded-lg p-3">
        <dt class="text-xs text-slate-500">Lokasi</dt>
        <dd class="font-medium text-navy-950 mt-0.5">${escapeHTML(j.location || '—')}</dd>
      </div>
      <div class="bg-slate-50 rounded-lg p-3">
        <dt class="text-xs text-slate-500">Tipe</dt>
        <dd class="font-medium text-navy-950 mt-0.5">${TYPE_LABELS[j.type] || j.type}</dd>
      </div>
      ${j.deadline ? `<div class="bg-slate-50 rounded-lg p-3 col-span-2">
        <dt class="text-xs text-slate-500">Deadline pendaftaran</dt>
        <dd class="font-medium text-navy-950 mt-0.5">${formatDate(j.deadline)}</dd>
      </div>` : ''}
    </dl>
    ${j.description ? `<div class="prose-article mt-6 text-[15px]">${sanitizeHTML(j.description.replace(/\n/g,'<br/>'))}</div>` : ''}
    ${j.apply_url ? `<a href="${escapeHTML(j.apply_url)}" target="_blank" rel="noopener" class="btn btn-primary w-full mt-6">
      Lamar Sekarang
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
    </a>` : '<p class="mt-6 text-sm text-slate-500 text-center">Informasi pendaftaran akan menyusul.</p>'}
  `;
}

function renderPag() {
  const totalPages = Math.max(1, Math.ceil(state.count / state.pageSize));
  if (totalPages <= 1) { $('#pagination').innerHTML = ''; return; }
  const btn = (l,p,d,a)=>`<button data-page="${p}" ${d?'disabled':''} class="min-w-9 h-9 px-3 rounded-lg text-sm font-medium ring-1 transition ${a?'bg-navy-900 text-white ring-navy-900':'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'} ${d?'opacity-40 cursor-not-allowed':''}">${l}</button>`;
  const items = [btn('‹', state.page-1, state.page===1, false)];
  for (let i=1;i<=totalPages;i++) items.push(btn(i,i,false,i===state.page));
  items.push(btn('›', state.page+1, state.page===totalPages, false));
  $('#pagination').innerHTML = items.join('');
  $('#pagination').querySelectorAll('button[data-page]').forEach(b=>b.addEventListener('click',()=>{
    state.page = Number(b.dataset.page); load();
  }));
}

async function load() {
  const list = $('#job-list');
  list.innerHTML = skeleton();
  try {
    const { rows, count } = await jobService.listActive({
      search: state.search, type: state.type, location: state.location,
      page: state.page, pageSize: state.pageSize,
    });
    state.rows = rows; state.count = count;
    if (!rows.length) {
      list.innerHTML = `<div class="card p-8 text-center text-slate-500">Tidak ada lowongan ditemukan.</div>`;
      $('#job-detail').innerHTML = `<div class="text-center py-16 text-slate-400">Belum ada lowongan untuk filter ini.</div>`;
      return;
    }
    list.innerHTML = rows.map(jobRowHTML).join('');
    list.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
      state.selectedId = b.dataset.id;
      const j = state.rows.find(x => String(x.id) === String(b.dataset.id));
      renderDetail(j);
      list.querySelectorAll('button[data-id]').forEach(bb => {
        bb.classList.toggle('ring-2', bb.dataset.id === state.selectedId);
        bb.classList.toggle('ring-gold-500', bb.dataset.id === state.selectedId);
      });
    }));
    // Auto-select first
    if (!state.selectedId || !rows.find(r=>String(r.id)===String(state.selectedId))) {
      state.selectedId = rows[0].id;
    }
    renderDetail(rows.find(r=>String(r.id)===String(state.selectedId)) || rows[0]);
    list.querySelector(`button[data-id="${state.selectedId}"]`)?.classList.add('ring-2','ring-gold-500');
    renderPag();
  } catch (e) {
    console.error(e);
    list.innerHTML = `<div class="card p-8 text-center text-rose-600">Gagal memuat lowongan.</div>`;
  }
}

$('#f-search').addEventListener('input', debounce(()=>{ state.search=$('#f-search').value.trim(); state.page=1; load(); }, 300));
$('#btn-apply').addEventListener('click', ()=>{
  state.search=$('#f-search').value.trim();
  state.type=$('#f-type').value;
  state.location=$('#f-location').value.trim();
  state.page=1; load();
});
$('#btn-reset').addEventListener('click', ()=>{
  ['#f-search','#f-location'].forEach(id=>$(id).value=''); $('#f-type').value='';
  Object.assign(state,{search:'',type:'',location:'',page:1}); load();
});

load();
