// ============================================================================
// FORMS LIST PAGE
// ============================================================================
import { mountNavbar } from '/src/components/navbar.js';
import { mountFooter } from '/src/components/footer.js';
import { formService } from '/src/services/form.service.js';
import { formatDate, escapeHTML } from '/src/utils/helpers.js';

mountNavbar();
mountFooter();

const grid = document.querySelector('#form-grid');

async function load() {
  grid.innerHTML = Array.from({length:3}).map(()=>`
    <div class="card p-6 animate-pulse space-y-3">
      <div class="h-4 bg-slate-200 rounded w-3/4"></div>
      <div class="h-2.5 bg-slate-200 rounded w-1/2"></div>
      <div class="h-2.5 bg-slate-200 rounded w-full"></div>
    </div>
  `).join('');

  try {
    const forms = await formService.listActive();
    if (!forms.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-16 text-slate-500">Belum ada formulir aktif saat ini.</div>`;
      return;
    }
    grid.innerHTML = forms.map(f => `
      <a href="/form.html?slug=${encodeURIComponent(f.slug)}" class="card p-6 group hover:shadow-md transition">
        <div class="flex items-center gap-2 mb-3">
          <span class="badge badge-emerald">● Aktif</span>
          <span class="text-xs text-slate-500">${f.fields?.[0]?.count ?? 0} pertanyaan</span>
        </div>
        <h3 class="font-display text-xl font-semibold text-navy-950 group-hover:text-gold-700 leading-tight">${escapeHTML(f.title)}</h3>
        ${f.description ? `<p class="mt-2 text-sm text-slate-600 line-clamp-3">${escapeHTML(f.description)}</p>` : ''}
        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Dibuka ${formatDate(f.created_at)}</span>
          <span class="font-medium text-navy-900 inline-flex items-center gap-1">Isi formulir
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </span>
        </div>
      </a>
    `).join('');
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="col-span-full text-center py-16 text-rose-600">Gagal memuat formulir.</div>`;
  }
}

load();
