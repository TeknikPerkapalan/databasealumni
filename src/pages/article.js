// ============================================================================
// ARTICLE DETAIL PAGE
// ============================================================================
import { mountNavbar }   from '/src/components/navbar.js';
import { mountFooter }   from '/src/components/footer.js';
import { articleService } from '/src/services/article.service.js';
import { formatDate, getQueryParam, sanitizeHTML, escapeHTML, initials } from '/src/utils/helpers.js';

mountNavbar();
mountFooter();

const slug = getQueryParam('slug');
const root = document.querySelector('#article-root');

async function load() {
  if (!slug) {
    root.innerHTML = `<div class="text-center py-20">
      <h1 class="font-display text-3xl text-navy-950">Artikel tidak ditemukan</h1>
      <p class="text-slate-600 mt-2">Slug tidak diberikan dalam URL.</p>
      <a href="/articles.html" class="btn btn-primary mt-6 inline-flex">Kembali ke daftar artikel</a>
    </div>`;
    return;
  }
  try {
    const a = await articleService.getBySlug(slug);
    if (!a) {
      root.innerHTML = `<div class="text-center py-20">
        <h1 class="font-display text-3xl text-navy-950">404 — Artikel tidak ditemukan</h1>
        <a href="/articles.html" class="btn btn-primary mt-6 inline-flex">Lihat semua artikel</a>
      </div>`;
      return;
    }
    if (a.status !== 'published') {
      root.innerHTML = `<div class="text-center py-20">
        <h1 class="font-display text-3xl text-navy-950">Artikel ini belum dipublikasikan.</h1>
        <a href="/articles.html" class="btn btn-primary mt-6 inline-flex">Lihat semua artikel</a>
      </div>`;
      return;
    }

    document.querySelector('#page-title').textContent = `${a.title} · Portal Alumni Perkapalan UNDIP`;
    document.querySelector('meta[name="description"]')?.remove();
    if (a.excerpt) {
      const m = document.createElement('meta'); m.name = 'description'; m.content = a.excerpt.slice(0, 160);
      document.head.appendChild(m);
    }
    articleService.incrementViews(a.id);

    const author = a.author?.full_name || 'Anonim';
    const avatar = a.author?.avatar_url
      ? `<img src="${a.author.avatar_url}" alt="" class="w-10 h-10 rounded-full object-cover" />`
      : `<div class="w-10 h-10 rounded-full bg-navy-900 text-white grid place-items-center text-xs font-semibold">${initials(author)}</div>`;

    root.innerHTML = `
      <nav class="text-sm text-slate-500 mb-6 flex items-center gap-2 flex-wrap">
        <a href="/" class="hover:text-navy-900">Beranda</a>
        <span>/</span>
        <a href="/articles.html" class="hover:text-navy-900">Artikel</a>
        ${a.category ? `<span>/</span><span class="text-navy-900 font-medium">${escapeHTML(a.category.name)}</span>` : ''}
      </nav>

      <header>
        ${a.category ? `<span class="badge badge-gold">${escapeHTML(a.category.name)}</span>` : ''}
        <h1 class="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl text-navy-950 mt-3 leading-[1.15] tracking-tight">${escapeHTML(a.title)}</h1>
        ${a.excerpt ? `<p class="mt-4 text-lg text-slate-600 leading-relaxed">${escapeHTML(a.excerpt)}</p>` : ''}
        <div class="mt-6 flex items-center gap-3 pb-6 border-b border-slate-200">
          ${avatar}
          <div>
            <div class="font-medium text-navy-950">${escapeHTML(author)}</div>
            <div class="text-xs text-slate-500">${formatDate(a.published_at || a.created_at)} · ${a.views ?? 0} kali dibaca</div>
          </div>
        </div>
      </header>

      ${a.thumbnail_url ? `<img src="${a.thumbnail_url}" alt="" class="w-full rounded-xl mt-8 mb-8" />` : '<div class="mt-8"></div>'}

      <div class="prose-article">${sanitizeHTML(a.content || '')}</div>

      <div class="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
        <a href="/articles.html" class="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Semua artikel
        </a>
        <div class="flex items-center gap-2 text-sm text-slate-500">
          Bagikan:
          <a href="https://wa.me/?text=${encodeURIComponent(a.title + ' ' + window.location.href)}" target="_blank" rel="noopener" class="p-2 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50" title="WhatsApp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.8-1.9-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.8-2.1-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.2 3.3 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 22a10 10 0 0 1-5.1-1.4L2 22l1.4-4.8A10 10 0 1 1 12 22"/></svg>
          </a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener" class="p-2 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50" title="X / Twitter">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <button id="btn-copy" class="p-2 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50" title="Salin link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
      </div>
    `;

    document.querySelector('#btn-copy')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(window.location.href);
        const { toast } = await import('/src/utils/toast.js'); toast.success('Link disalin');
      } catch (_) {}
    });
  } catch (e) {
    console.error(e);
    root.innerHTML = `<div class="text-center py-20 text-rose-600">Gagal memuat artikel.</div>`;
  }
}

load();
