// ============================================================================
// FOOTER COMPONENT
// ============================================================================

export function mountFooter(target = '#footer') {
  const root = document.querySelector(target);
  if (!root) return;
  const year = new Date().getFullYear();

  root.innerHTML = `
    <footer class="mt-24 bg-navy-950 text-slate-300">
      <div class="relative overflow-hidden">
        <div aria-hidden="true" class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#d4af37_0,transparent_40%),radial-gradient(circle_at_80%_80%,#0e3b66_0,transparent_45%)]"></div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-4 md:grid-cols-2 gap-12">
          <div class="lg:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 grid place-content-center text-navy-900 shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4M12 2v3"/></svg>
              </span>
              <div>
                <div class="font-display text-lg font-semibold text-white">Portal Alumni</div>
                <div class="text-xs text-slate-400">Teknik Perkapalan UNDIP</div>
              </div>
            </div>
            <p class="text-sm leading-relaxed text-slate-400 max-w-md">
              Rumah digital alumni Teknik Perkapalan Universitas Diponegoro. Membangun jaringan,
              berbagi pengetahuan, dan melestarikan tali silaturahmi lintas generasi.
            </p>
            <div class="flex items-center gap-3 mt-6">
              ${socialIcon('instagram','#')}
              ${socialIcon('linkedin','#')}
              ${socialIcon('youtube','#')}
              ${socialIcon('mail','mailto:alumni.tp@undip.ac.id')}
            </div>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Tautan Cepat</h4>
            <ul class="space-y-2.5 text-sm">
              <li><a href="/alumni.html"   class="hover:text-gold-400 transition">Database Alumni</a></li>
              <li><a href="/articles.html" class="hover:text-gold-400 transition">Artikel</a></li>
              <li><a href="/gallery.html"  class="hover:text-gold-400 transition">Galeri Foto</a></li>
              <li><a href="/jobs.html"     class="hover:text-gold-400 transition">Lowongan Kerja</a></li>
              <li><a href="/events.html"   class="hover:text-gold-400 transition">Kalender Kegiatan</a></li>
            </ul>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Kontak</h4>
            <ul class="space-y-2.5 text-sm text-slate-400">
              <li class="flex gap-2.5"><span class="text-gold-400">📍</span> Jl. Prof. Soedarto, Tembalang, Semarang 50275</li>
              <li class="flex gap-2.5"><span class="text-gold-400">✉</span> alumni.tp@undip.ac.id</li>
              <li class="flex gap-2.5"><span class="text-gold-400">☎</span> +62 24 7460053</li>
            </ul>
          </div>
        </div>

        <div class="relative border-t border-white/10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>© ${year} Portal Alumni Teknik Perkapalan UNDIP. All rights reserved.</div>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Crafted with care for the Class of 2016.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function socialIcon(kind, href) {
  const icons = {
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    linkedin:  '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    youtube:   '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    mail:      '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  };
  return `<a href="${href}" target="_blank" rel="noreferrer" aria-label="${kind}"
    class="w-10 h-10 rounded-full bg-white/5 hover:bg-gold-400/20 hover:text-gold-400 ring-1 ring-white/10 grid place-content-center transition">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[kind]}</svg>
  </a>`;
}
