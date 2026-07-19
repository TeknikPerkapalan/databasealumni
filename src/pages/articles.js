// ============================================================================
// ARTICLES LIST PAGE
// ============================================================================
import { mountNavbar }   from '/src/components/navbar.js';
import { mountFooter }   from '/src/components/footer.js';
import { articleService } from '/src/services/article.service.js';
import { debounce, formatDate, truncate, escapeHTML } from '/src/utils/helpers.js';

mountNavbar();
mountFooter();

const $ = (s) => document.querySelector(s);

const state = { search: '', categoryId: null, page: 1, pageSize: 9, count: 0 };
const grid = $('#article-grid');
const pag  = $('#pagination');

function skeleton(n=6) {
  return Array.from({length:n}).map(() => `
    <div class="card overflow-hidden animate-pulse">
      <div class="aspect-[16/10] bg-slate-200"></div>
      <div class="p-5 space-y-3">
        <div class="h-3 bg-slate-200 rounded w-3/4"></div>
        <div class="h-2.5 bg-slate-200 rounded w-1/2"></div>
        <div class="h-2.5 bg-slate-200 rounded w-full"></div>
      </div>
    </div>
  `).join('');
}

function cardHTML(a) {
  const cover = a.thumbnail_url
    ? `<img src="${a.thumbnail_url}" alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />`
    : `<div class="absolute inset-0 hero-gradient"></div>`;
  return `
    <a href="/article.html?slug=${encodeURIComponent(a.slug)}" class="card overflow-hidden group hover:shadow-md transition">
      <div class="relative aspect-[16/10] overflow-hidden">${cover}
        ${a.category ? `<span class="absolute top-3 left-3 badge badge-gold backdrop-blur-sm">${escapeHTML(a.category.name)}</span>` : ''}
      </div>
      <div class="p-5">
        <h3 class="font-display font-semibold text-lg text-navy-950 leading-snug line-clamp-2 group-hover:text-gold-700 transition">${escapeHTML(a.title)}</h3>
        ${a.excerpt ? `<p class="mt-2 text-sm text-slate-600 line-clamp-3">${escapeHTML(truncate(a.excerpt, 140))}</p>` : ''}
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span class="truncate">${escapeHTML(a.author?.full_name || 'Anonim')}</span>
          <span>${formatDate(a.published_at || a.created_at)}</span>
        </div>
      </div>
    </a>
  `;
}

function renderPag() {
  const totalPages = Math.max(1, Math.ceil(state.count / state.pageSize));
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  const btn = (l,p,d=false,a=false)=>`<button data-page="${p}" ${d?'disabled':''}
    class="min-w-9 h-9 px-3 rounded-lg text-sm font-medium ring-1 transition
      ${a?'bg-navy-900 text-white ring-navy-900':'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}
      ${d?'opacity-40 cursor-not-allowed':''}">${l}</button>`;
  const items = [btn('‹', state.page-1, state.page===1)];
  for (let i=1; i<=totalPages; i++) items.push(btn(i,i,false,i===state.page));
  items.push(btn('›', state.page+1, state.page===totalPages));
  pag.innerHTML = items.join('');
  pag.querySelectorAll('button[data-page]').forEach(b=>b.addEventListener('click',()=>{
    state.page = Number(b.dataset.page); load();
    window.scrollTo({top: grid.offsetTop-80, behavior:'smooth'});
  }));
}

async function loadCategories() {
  try {
    const cats = await articleService.listCategories();
    const sel = $('#f-category');
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.name; sel.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

async function load() {
  grid.innerHTML = skeleton(state.pageSize);
  try {
    const { rows, count } = await articleService.listPublished({
      search: state.search, categoryId: state.categoryId, page: state.page, pageSize: state.pageSize,
    });
    state.count = count;
    if (!rows.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-16 text-slate-500">
        <div class="text-5xl mb-3 opacity-30">📰</div>
        Belum ada artikel yang sesuai.
      </div>`;
      pag.innerHTML = ''; return;
    }
    grid.innerHTML = rows.map(cardHTML).join('');
    renderPag();
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="col-span-full text-center py-16 text-rose-600">Gagal memuat artikel.</div>`;
  }
}

$('#f-search').addEventListener('input', debounce(() => { state.search = $('#f-search').value.trim(); state.page=1; load(); }, 300));
$('#f-category').addEventListener('change', () => { state.categoryId = $('#f-category').value || null; state.page=1; load(); });
$('#btn-apply').addEventListener('click', () => { state.search = $('#f-search').value.trim(); state.categoryId = $('#f-category').value || null; state.page=1; load(); });
$('#btn-reset').addEventListener('click', () => { $('#f-search').value=''; $('#f-category').value=''; Object.assign(state,{search:'',categoryId:null,page:1}); load(); });

loadCategories();
load();
