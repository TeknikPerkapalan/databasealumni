// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
import { mountAdminSidebar } from '/src/components/admin-sidebar.js';
import { authService }       from '/src/services/auth.service.js';
import { alumniService }     from '/src/services/alumni.service.js';
import { articleService }    from '/src/services/article.service.js';
import { jobService }        from '/src/services/job.service.js';
import { eventService }      from '/src/services/event.service.js';
import { formatDate, escapeHTML } from '/src/utils/helpers.js';

const user = await authService.requireAuth({ adminOnly: false });
if (!user) throw new Error('redirecting');

mountAdminSidebar('#admin-sidebar');

(async () => {
  // Stats
  try {
    const stats = await alumniService.getStats();
    document.querySelector('#stat-alumni').textContent = stats.total_alumni ?? 0;
  } catch {}
  try {
    const allArt = await articleService.listAll();
    document.querySelector('#stat-articles').textContent = allArt.length;
    const recent = allArt.slice(0, 5);
    document.querySelector('#recent-articles').innerHTML = recent.length
      ? recent.map(a => `
        <a href="/admin/articles.html?edit=${a.id}" class="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-slate-50">
          <div class="w-10 h-10 rounded-lg ${a.thumbnail_url ? '' : 'bg-navy-100'} overflow-hidden shrink-0">
            ${a.thumbnail_url ? `<img src="${a.thumbnail_url}" class="w-full h-full object-cover" />` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-navy-950 text-sm truncate">${escapeHTML(a.title)}</p>
            <p class="text-xs text-slate-500 mt-0.5">${escapeHTML(a.author?.full_name||'—')} · <span class="${a.status==='published'?'text-emerald-600':'text-amber-600'}">${a.status}</span> · ${formatDate(a.created_at)}</p>
          </div>
        </a>`).join('')
      : `<p class="text-sm text-slate-500 text-center py-6">Belum ada artikel.</p>`;
  } catch {}
  try {
    const jobs = await jobService.listAll();
    document.querySelector('#stat-jobs').textContent = jobs.filter(j => j.is_active).length;
  } catch {}
  try {
    const events = await eventService.listUpcoming(20);
    document.querySelector('#stat-events').textContent = events.length;
    const recent = events.slice(0,5);
    document.querySelector('#recent-events').innerHTML = recent.length
      ? recent.map(e => `
        <a href="/admin/events.html?edit=${e.id}" class="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-slate-50">
          <div class="shrink-0 w-12 text-center">
            <div class="text-[10px] font-medium text-rose-500 uppercase">${new Date(e.start_date).toLocaleDateString('id-ID',{month:'short'})}</div>
            <div class="text-xl font-display font-semibold text-navy-950 leading-none">${new Date(e.start_date).getDate()}</div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-navy-950 text-sm truncate">${escapeHTML(e.title)}</p>
            <p class="text-xs text-slate-500 mt-0.5 truncate">${escapeHTML(e.location||'—')}</p>
          </div>
        </a>`).join('')
      : `<p class="text-sm text-slate-500 text-center py-6">Belum ada kegiatan terjadwal.</p>`;
  } catch {}
})();
