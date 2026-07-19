// ============================================================================
// HELPERS
// ============================================================================

export const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const formatDate = (dateLike, opts = {}) => {
  if (!dateLike) return '-';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', ...opts,
  });
};

export const formatDateTime = (dateLike) => {
  if (!dateLike) return '-';
  const d = new Date(dateLike);
  return `${d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} · ${d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`;
};

export const truncate = (text, n = 140) => {
  if (!text) return '';
  const clean = String(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n).trim() + '…' : clean;
};

export const debounce = (fn, wait = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

// Lightweight HTML sanitizer — removes <script> / event handlers / javascript:.
// Use for rendering Quill output safely. Not a replacement for DOMPurify on
// hostile environments, but covers common XSS vectors for trusted authors.
export const sanitizeHTML = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const val  = attr.value.toLowerCase();
      if (name.startsWith('on') || val.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
};

export const escapeHTML = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const getQueryParam = (key) =>
  new URLSearchParams(window.location.search).get(key);

export const animateCounter = (el, target, duration = 1500) => {
  if (!el) return;
  const start  = 0;
  const startT = performance.now();
  const step = (now) => {
    const p = Math.min((now - startT) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = Math.floor(start + (target - start) * eased).toLocaleString('id-ID');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

export const initials = (name) => {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('');
};
