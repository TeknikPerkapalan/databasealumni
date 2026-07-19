// ============================================================================
// HOME PAGE
// ============================================================================
import { mountNavbar }        from '../components/navbar.js';
import { mountFooter }        from '../components/footer.js';
import { alumniService }      from '../services/alumni.service.js';
import { articleService }     from '../services/article.service.js';
import { jobService }         from '../services/job.service.js';
import { eventService }       from '../services/event.service.js';
import { runningTextService } from '../services/runningText.service.js';
import { animateCounter, formatDate, truncate, debounce, escapeHTML, initials } from '../utils/helpers.js';

mountNavbar();
mountFooter();

// ---------- Stats ----------
(async () => {
  try {
    const s = await alumniService.getStats();
    document.querySelectorAll('[data-stat]').forEach(el => {
      animateCounter(el, Number(s[el.dataset.stat] ?? 0));
    });
  } catch (e) { console.error(e); }
})();

// ---------- Marquee ----------
(async () => {
  try {
    const items = await runningTextService.listActive();
    const t = document.getElementById('marquee-track');
    if (!items.length) { t.innerHTML = '<span class="opacity-60">Tidak ada pengumuman aktif.</span>'; return; }
    // Duplicate for seamless loop
    const html = items.map(i =>
      `<span class="flex items-center gap-2"><span class="text-gold-400">◆</span>${escapeHTML(i.message)}</span>`
    ).join('');
    t.innerHTML = html + html;
  } catch (e) { console.error(e); }
})();

// ---------- Hero search (alumni) ----------
const heroForm    = document.getElementById('hero-search');
const heroInput   = document.getElementById('hero-search-input');
const heroResults = document.getElementById('hero-search-results');

const runSearch = async (q) => {
  if (!q || q.length < 2) { heroResults.classList.add('hidden'); heroResults.innerHTML = ''; return; }
  try {
    const { rows } = await alumniService.list({ search: q, pageSize: 6 });
    if (!rows.length) {
      heroResults.innerHTML = '<div class="p-5 text-sm text-slate-500">Tidak ada alumni cocok. Coba kata kunci lain.</div>';
    } else {
      heroResults.innerHTML = rows.map(r => `
        <a href="/profile.html?id=${r.user_id}" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0">
          ${r.user?.avatar_url
            ? `<img src="${r.user.avatar_url}" class="w-10 h-10 rounded-full object-cover"/>`
            : `<span class="w-10 h-10 rounded-full bg-navy-100 text-navy-700 grid place-content-center text-xs font-semibold">${initials(r.user?.full_name ?? '?')}</span>`}
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-navy-900 truncate">${escapeHTML(r.user?.full_name ?? '-')}</div>
            <div class="text-xs text-slate-500 truncate">
              Angkatan ${r.angkatan ?? '-'} · ${escapeHTML(r.tempat_kerja ?? 'Belum dilengkapi')} · ${escapeHTML(r.lokasi_kerja ?? '')}
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-400"><path d="m9 18 6-6-6-6"/></svg>
        </a>`).join('');
    }
    heroResults.classList.remove('hidden');
  } catch (e) {
    console.error(e);
    heroResults.innerHTML = '<div class="p-5 text-sm text-rose-600">Gagal memuat pencarian.</div>';
    heroResults.classList.remove('hidden');
  }
};
heroInput?.addEventListener('input', debounce(e => runSearch(e.target.value.trim()), 300));
heroForm?.addEventListener('submit', e => {
  e.preventDefault();
  const q = heroInput.value.trim();
  if (q) window.location.href = `/alumni.html?q=${encodeURIComponent(q)}`;
});
document.addEventListener('click', e => {
  if (!heroResults?.contains(e.target) && e.target !== heroInput) heroResults?.classList.add('hidden');
});

// ---------- Articles carousel ----------
(async () => {
  try {
    const { rows } = await articleService.listPublished({ pageSize: 6 });
    const t = document.getElementById('articles-track');
    if (!rows.length) {
      t.innerHTML = '<div class="swiper-slide"><div class="card p-10 text-center text-slate-500">Belum ada artikel diterbitkan.</div></div>';
    } else {
      t.innerHTML = rows.map(a => `
        <div class="swiper-slide">
          <a href="/article.html?slug=${a.slug}" class="card card-hover block overflow-hidden h-full">
            <div class="aspect-[16/10] bg-slate-100 overflow-hidden">
              ${a.thumbnail_url
                ? `<img src="${escapeHTML(a.thumbnail_url)}" class="w-full h-full object-cover" loading="lazy"/>`
                : `<div class="w-full h-full bg-gradient-to-br from-navy-800 to-navy-600 grid place-content-center text-gold-400 text-5xl font-display">⚓</div>`}
            </div>
            <div class="p-5">
              ${a.category ? `<span class="badge badge-gold">${escapeHTML(a.category.name)}</span>` : ''}
              <h3 class="font-display text-lg font-semibold text-navy-900 mt-3 line-clamp-2 leading-tight">${escapeHTML(a.title)}</h3>
              <p class="text-sm text-slate-600 mt-2 line-clamp-2">${escapeHTML(truncate(a.excerpt || a.content, 110))}</p>
              <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span class="font-medium text-navy-700">${escapeHTML(a.author?.full_name ?? 'Anonim')}</span>
                <span>${formatDate(a.published_at)}</span>
              </div>
            </div>
          </a>
        </div>`).join('');
    }
    // eslint-disable-next-line no-undef
    new Swiper('.article-swiper', {
      slidesPerView: 1, spaceBetween: 20,
      pagination: { el: '.article-swiper .swiper-pagination', clickable: true },
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
    });
  } catch (e) { console.error(e); }
})();

// ---------- Jobs ----------
(async () => {
  try {
    const { rows } = await jobService.listActive({ pageSize: 6 });
    const grid = document.getElementById('jobs-grid');
    if (!rows.length) {
      grid.innerHTML = '<div class="col-span-full card p-10 text-center text-slate-500">Belum ada lowongan aktif.</div>';
      return;
    }
    grid.innerHTML = rows.map(j => `
      <div class="card card-hover p-5 flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <h3 class="font-semibold text-navy-900 leading-tight">${escapeHTML(j.title)}</h3>
            <div class="text-sm text-slate-600 mt-0.5">${escapeHTML(j.company)}</div>
          </div>
          <span class="badge ${j.type === 'internship' ? 'badge-navy' : 'badge-gold'}">${(j.type||'').replace('_',' ')}</span>
        </div>
        <div class="mt-4 text-xs text-slate-500 space-y-1.5">
          ${j.location  ? `<div class="flex items-center gap-1.5">📍 ${escapeHTML(j.location)}</div>` : ''}
          ${j.deadline  ? `<div class="flex items-center gap-1.5">⏳ Deadline ${formatDate(j.deadline)}</div>` : ''}
        </div>
        <a href="/jobs.html#${j.id}" class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy-900 hover:text-gold-600 transition">
          Lihat Detail
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
        </a>
      </div>`).join('');
  } catch (e) { console.error(e); }
})();

// ---------- Events carousel ----------
(async () => {
  try {
    const rows = await eventService.listUpcoming(6);
    const t = document.getElementById('events-track');
    if (!rows.length) {
      t.innerHTML = '<div class="swiper-slide"><div class="card p-10 text-center text-slate-500">Belum ada kegiatan dijadwalkan.</div></div>';
    } else {
      t.innerHTML = rows.map(ev => `
        <div class="swiper-slide">
          <div class="card card-hover overflow-hidden h-full">
            <div class="aspect-[16/9] bg-slate-100 overflow-hidden">
              ${ev.banner_url
                ? `<img src="${escapeHTML(ev.banner_url)}" class="w-full h-full object-cover" loading="lazy"/>`
                : `<div class="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 grid place-content-center text-navy-950 text-5xl">📅</div>`}
            </div>
            <div class="p-5">
              <div class="text-xs font-semibold text-gold-600 uppercase tracking-wider">${formatDate(ev.start_date)}</div>
              <h3 class="font-display text-lg font-semibold text-navy-900 mt-1.5 leading-tight">${escapeHTML(ev.title)}</h3>
              <div class="text-sm text-slate-600 mt-2 flex items-center gap-1.5">📍 ${escapeHTML(ev.location ?? '-')}</div>
              <p class="text-sm text-slate-500 mt-2 line-clamp-2">${escapeHTML(truncate(ev.description ?? '', 100))}</p>
            </div>
          </div>
        </div>`).join('');
    }
    // eslint-disable-next-line no-undef
    new Swiper('.events-swiper', {
      slidesPerView: 1, spaceBetween: 20,
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
    });
  } catch (e) { console.error(e); }
})();
