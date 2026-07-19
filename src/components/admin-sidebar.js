// ============================================================================
// ADMIN SIDEBAR
// ============================================================================
import { authService } from '../services/auth.service.js';
import { initials }    from '../utils/helpers.js';

const menu = [
  { href: '/admin/index.html',        icon: 'layout-dashboard', label: 'Dashboard' },
  { href: '/admin/articles.html',     icon: 'file-text',        label: 'Artikel' },
  { href: '/admin/gallery.html',      icon: 'image',            label: 'Galeri' },
  { href: '/admin/forms.html',        icon: 'clipboard-list',   label: 'Formulir' },
  { href: '/admin/alumni.html',       icon: 'users',            label: 'Alumni' },
  { href: '/admin/jobs.html',         icon: 'briefcase',        label: 'Lowongan' },
  { href: '/admin/events.html',       icon: 'calendar',         label: 'Kalender' },
  { href: '/admin/running-text.html', icon: 'megaphone',        label: 'Running Text' },
  { href: '/admin/settings.html',     icon: 'settings',         label: 'Pengaturan' },
];

const ICONS = {
  'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  'file-text':        '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
  'image':            '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  'clipboard-list':   '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  'users':            '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  'briefcase':        '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'calendar':         '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  'megaphone':        '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  'settings':         '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'log-out':          '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
};
const icon = (k) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;

export async function mountAdminSidebar(target = '#admin-sidebar') {
  const root = document.querySelector(target);
  if (!root) return;
  const user = await authService.getCurrentUser();
  const here = window.location.pathname;

  root.innerHTML = `
    <aside class="lg:fixed lg:inset-y-0 lg:w-64 bg-navy-950 text-slate-300 flex flex-col z-30">
      <div class="px-6 py-5 flex items-center gap-3 border-b border-white/10">
        <span class="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 grid place-content-center text-navy-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/></svg>
        </span>
        <div>
          <div class="text-white font-semibold leading-tight">Admin Panel</div>
          <div class="text-[11px] text-slate-400">Portal Alumni TP UNDIP</div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        ${menu.map(m => {
          const active = here.endsWith(m.href);
          return `<a href="${m.href}"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              active
                ? 'bg-gold-400 text-navy-950 font-semibold shadow'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }">
            ${icon(m.icon)}
            <span>${m.label}</span>
          </a>`;
        }).join('')}
      </nav>

      <div class="px-3 py-4 border-t border-white/10">
        <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
          ${user?.avatar_url
            ? `<img src="${user.avatar_url}" class="w-9 h-9 rounded-full object-cover"/>`
            : `<span class="w-9 h-9 rounded-full bg-gold-400 text-navy-900 grid place-content-center text-xs font-bold">${initials(user?.full_name ?? '?')}</span>`}
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white truncate">${user?.full_name ?? '-'}</div>
            <div class="text-[11px] text-slate-400 capitalize">${(user?.role ?? '').replace('_',' ')}</div>
          </div>
          <button class="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white" data-logout title="Keluar">${icon('log-out')}</button>
        </div>
        <a href="/" class="block mt-2 text-center text-[11px] text-slate-500 hover:text-gold-400 transition">← Kembali ke situs</a>
      </div>
    </aside>
  `;
  root.querySelector('[data-logout]')?.addEventListener('click', async () => {
    await authService.logout(); window.location.href = '/login.html';
  });
}
