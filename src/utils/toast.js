// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
// Usage: import { toast } from './utils/toast.js';
//        toast.success('Saved!'); toast.error('Oops'); toast.info('FYI');
// ============================================================================

const ensureContainer = () => {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(c);
  }
  return c;
};

const ICONS = {
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  error:   '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
  info:    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  warn:    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
};
const TONES = {
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  error:   'bg-rose-50 text-rose-900 ring-rose-200',
  info:    'bg-sky-50 text-sky-900 ring-sky-200',
  warn:    'bg-amber-50 text-amber-900 ring-amber-200',
};

const show = (type, message, ms = 3500) => {
  const c = ensureContainer();
  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg ring-1 ${TONES[type]} max-w-sm transform translate-x-4 opacity-0 transition-all duration-300`;
  el.innerHTML = `<span class="shrink-0 mt-0.5">${ICONS[type]}</span><span class="text-sm font-medium leading-snug">${message}</span>`;
  c.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.remove('translate-x-4', 'opacity-0');
  });
  setTimeout(() => {
    el.classList.add('translate-x-4', 'opacity-0');
    setTimeout(() => el.remove(), 300);
  }, ms);
};

export const toast = {
  success: (m, ms) => show('success', m, ms),
  error:   (m, ms) => show('error',   m, ms),
  info:    (m, ms) => show('info',    m, ms),
  warn:    (m, ms) => show('warn',    m, ms),
};
