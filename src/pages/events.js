// ============================================================================
// EVENTS PAGE (FullCalendar)
// ============================================================================
import { mountNavbar }   from '/src/components/navbar.js';
import { mountFooter }   from '/src/components/footer.js';
import { eventService }  from '/src/services/event.service.js';
import { formatDateTime, escapeHTML } from '/src/utils/helpers.js';

mountNavbar();
mountFooter();

const $ = (s) => document.querySelector(s);

async function init() {
  let events = [];
  try { events = await eventService.listAll(); } catch (e) { console.error(e); }

  // Initialize FullCalendar
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'id',
    firstDay: 1,
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listMonth',
    },
    buttonText: {
      today: 'Hari ini',
      month: 'Bulan',
      week: 'Minggu',
      list: 'Daftar',
    },
    events: eventService.toFullCalendar(events),
    eventClassNames: 'cursor-pointer',
    eventColor: '#0e2240',
    eventClick: (info) => {
      info.jsEvent.preventDefault();
      openModal({
        title: info.event.title,
        start: info.event.start,
        end:   info.event.end,
        location: info.event.extendedProps.location,
        description: info.event.extendedProps.description,
        banner_url: info.event.extendedProps.banner_url,
      });
    },
  });
  calendar.render();

  // Upcoming sidebar
  const upcoming = events
    .filter(e => new Date(e.start_date) >= new Date(new Date().toDateString()))
    .slice(0, 8);

  const list = $('#upcoming-list');
  if (!upcoming.length) {
    list.innerHTML = `<div class="card p-6 text-center text-slate-500">Belum ada kegiatan terjadwal.</div>`;
    return;
  }
  list.innerHTML = upcoming.map(e => `
    <button class="w-full text-left card p-4 hover:shadow-md transition group" data-id="${e.id}">
      <div class="flex items-start gap-3">
        <div class="shrink-0 w-12 text-center">
          <div class="text-xs font-medium text-rose-500 uppercase">${new Date(e.start_date).toLocaleDateString('id-ID',{month:'short'})}</div>
          <div class="text-2xl font-display font-semibold text-navy-950 leading-none">${new Date(e.start_date).getDate()}</div>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold text-navy-950 truncate group-hover:text-gold-700">${escapeHTML(e.title)}</h3>
          <p class="text-xs text-slate-500 mt-0.5 truncate">${escapeHTML(e.location || 'Lokasi belum ditentukan')}</p>
          <p class="text-xs text-slate-500 mt-1">${formatDateTime(e.start_date)}</p>
        </div>
      </div>
    </button>
  `).join('');

  list.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
    const e = events.find(x => String(x.id) === String(b.dataset.id));
    if (e) openModal({ title:e.title, start:new Date(e.start_date), end:e.end_date?new Date(e.end_date):null, location:e.location, description:e.description, banner_url:e.banner_url });
  }));
}

function openModal({ title, start, end, location, description, banner_url }) {
  $('#modal-title').textContent = title;
  const dateText = end
    ? `${formatDateTime(start)} — ${formatDateTime(end)}`
    : formatDateTime(start);
  $('#modal-date').textContent = dateText;
  $('#modal-location').innerHTML = location
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${escapeHTML(location)}`
    : '';
  $('#modal-desc').textContent = description || '';
  const banner = $('#modal-banner');
  banner.style.backgroundImage = banner_url ? `url('${banner_url}')` : '';
  banner.style.backgroundSize = 'cover';
  banner.style.backgroundPosition = 'center';
  $('#event-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#event-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

$('#modal-close').addEventListener('click', closeModal);
$('#modal-backdrop').addEventListener('click', closeModal);
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

init();
