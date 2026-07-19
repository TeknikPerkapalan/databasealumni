// ============================================================================
// NAVBAR COMPONENT
// ============================================================================
import { authService } from '../services/auth.service.js';
import { initials }    from '../utils/helpers.js';

const navLinks = [
  { href: '/index.html',    label: 'Beranda' },
  { href: '/alumni.html',   label: 'Alumni' },
  { href: '/articles.html', label: 'Artikel' },
  { href: '/gallery.html',  label: 'Galeri' },
  { href: '/jobs.html',     label: 'Lowongan' },
  { href: '/events.html',   label: 'Kegiatan' },
];

export async function mountNavbar(target = '#navbar') {
  const root = document.querySelector(target);
  if (!root) return;

  const user = await authService.getCurrentUser();
  const here = window.location.pathname;
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  const linksHTML = navLinks.map(l => {
    const active = here === l.href || (l.href === '/index.html' && (here === '/' || here === ''));
    return `<a href="${l.href}" class="nav-link ${active ? 'nav-link-active' : ''}">${l.label}</a>`;
  }).join('');

  const userBlock = user ? `
    <div class="relative" data-menu>
      <button class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-white/70 hover:bg-white ring-1 ring-slate-200 transition" data-menu-trigger>
        ${user.avatar_url
          ? `<img src="${user.avatar_url}" class="w-8 h-8 rounded-full object-cover" alt=""/>`
          : `<span class="w-8 h-8 rounded-full bg-navy-700 text-white grid place-content-center text-xs font-semibold">${initials(user.full_name)}</span>`}
        <span class="text-sm font-medium text-navy-900 hidden sm:inline">${user.full_name.split(' ')[0]}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-500"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="hidden absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 py-2 z-50" data-menu-panel>
        <a href="/profile.html" class="menu-item">Profil Saya</a>
        ${isAdmin ? '<a href="/admin/index.html" class="menu-item">Admin Panel</a>' : ''}
        <a href="/admin/articles.html" class="menu-item">Tulis Artikel</a>
        <hr class="my-1.5 border-slate-100"/>
        <button class="menu-item w-full text-left text-rose-600" data-logout>Keluar</button>
      </div>
    </div>` : `
    <div class="flex items-center gap-2">
      <a href="/login.html"    class="hidden sm:inline-block px-4 py-2 text-sm font-medium text-navy-900 hover:text-navy-700 transition">Masuk</a>
      <a href="/register.html" class="px-4 py-2 text-sm font-semibold bg-navy-900 text-white rounded-full hover:bg-navy-700 shadow-sm transition">Daftar</a>
    </div>`;

  root.innerHTML = `
    <div class="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-slate-200/70">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <a href="/" class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 grid place-content-center text-gold-400 shadow-md">
              <!-- ship icon -->
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
                <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                <path d="M12 10v4M12 2v3"/>
              </svg>
            </span>
            <div class="leading-tight">
              <div class="font-display text-[15px] font-semibold text-navy-900 tracking-tight">Alumni TP UNDIP</div>
              <div class="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">Teknik Perkapalan · Angkatan 2016</div>
            </div>
          </a>

          <div class="hidden lg:flex items-center gap-1">
            ${linksHTML}
          </div>

          <div class="flex items-center gap-3">
            ${userBlock}
            <button class="lg:hidden p-2 rounded-lg hover:bg-slate-100" data-mobile-toggle aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        <div class="lg:hidden hidden border-t border-slate-200 py-3" data-mobile-menu>
          ${navLinks.map(l => `<a href="${l.href}" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50">${l.label}</a>`).join('')}
          ${!user ? `<a href="/login.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50">Masuk</a>` : ''}
        </div>
      </div>
    </div>
  `;

  // wire up dropdown
  const trigger = root.querySelector('[data-menu-trigger]');
  const panel   = root.querySelector('[data-menu-panel]');
  if (trigger && panel) {
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      panel.classList.toggle('hidden');
    });
    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && !trigger.contains(e.target)) panel.classList.add('hidden');
    });
  }
  root.querySelector('[data-logout]')?.addEventListener('click', async () => {
    await authService.logout();
    window.location.href = '/';
  });
  const mobBtn  = root.querySelector('[data-mobile-toggle]');
  const mobMenu = root.querySelector('[data-mobile-menu]');
  mobBtn?.addEventListener('click', () => mobMenu.classList.toggle('hidden'));
}
