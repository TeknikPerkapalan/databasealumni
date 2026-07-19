// ============================================================================
// FORM DETAIL PAGE (dynamic renderer)
// ============================================================================
import { mountNavbar }    from '/src/components/navbar.js';
import { mountFooter }    from '/src/components/footer.js';
import { formService }    from '/src/services/form.service.js';
import { storageService } from '/src/services/storage.service.js';
import { authService }    from '/src/services/auth.service.js';
import { getQueryParam, escapeHTML } from '/src/utils/helpers.js';
import { toast }          from '/src/utils/toast.js';

mountNavbar();
mountFooter();

const slug = getQueryParam('slug');
const root = document.querySelector('#form-root');

function renderField(field) {
  const id = `field-${field.id}`;
  const required = field.required ? 'required' : '';
  const placeholder = field.placeholder ? `placeholder="${escapeHTML(field.placeholder)}"` : '';
  const label = `<label for="${id}" class="label">${escapeHTML(field.label)}${field.required?' <span class="text-rose-500">*</span>':''}</label>`;
  let control = '';
  switch (field.type) {
    case 'text':     control = `<input id="${id}" name="${field.id}" type="text" class="input" ${placeholder} ${required} />`; break;
    case 'textarea': control = `<textarea id="${id}" name="${field.id}" class="textarea" rows="4" ${placeholder} ${required}></textarea>`; break;
    case 'date':     control = `<input id="${id}" name="${field.id}" type="date" class="input" ${required} />`; break;
    case 'select':
      control = `<select id="${id}" name="${field.id}" class="select" ${required}>
        <option value="">— pilih —</option>
        ${(field.options || []).map(o => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('')}
      </select>`;
      break;
    case 'radio':
      control = `<div class="space-y-2">${(field.options || []).map((o,i) => `
        <label class="flex items-center gap-3 p-3 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer">
          <input type="radio" name="${field.id}" value="${escapeHTML(o)}" ${i===0&&field.required?'required':''} class="w-4 h-4 text-navy-900" />
          <span class="text-sm">${escapeHTML(o)}</span>
        </label>
      `).join('')}</div>`;
      break;
    case 'checkbox':
      control = `<div class="space-y-2">${(field.options || []).map(o => `
        <label class="flex items-center gap-3 p-3 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer">
          <input type="checkbox" name="${field.id}" value="${escapeHTML(o)}" class="w-4 h-4 text-navy-900 rounded" />
          <span class="text-sm">${escapeHTML(o)}</span>
        </label>
      `).join('')}</div>`;
      break;
    case 'file':
      control = `<input id="${id}" name="${field.id}" type="file" class="input" ${required} />
                 <p class="text-xs text-slate-500 mt-1">Max 10MB.</p>`;
      break;
    default: control = `<input id="${id}" name="${field.id}" type="text" class="input" ${placeholder} ${required} />`;
  }
  return `<div>${label}${control}</div>`;
}

async function init() {
  if (!slug) {
    root.innerHTML = `<p class="text-center py-12 text-slate-500">Formulir tidak ditemukan (slug kosong).</p>`;
    return;
  }
  let form;
  try { form = await formService.getBySlug(slug); } catch (e) { console.error(e); }
  if (!form) {
    root.innerHTML = `<p class="text-center py-12 text-slate-500">Formulir tidak ditemukan.</p>`;
    return;
  }
  if (!form.is_active) {
    root.innerHTML = `<div class="text-center py-12">
      <h2 class="font-display text-2xl text-navy-950">${escapeHTML(form.title)}</h2>
      <p class="mt-3 text-slate-500">Formulir ini sedang ditutup. Silakan periksa kembali nanti.</p>
      <a href="/forms.html" class="btn btn-primary mt-6 inline-flex">Formulir aktif lainnya</a>
    </div>`;
    return;
  }

  document.querySelector('#page-title').textContent = `${form.title} · Portal Alumni Perkapalan UNDIP`;

  root.innerHTML = `
    <p class="text-sm text-gold-700 font-medium uppercase tracking-wide">Formulir</p>
    <h1 class="font-display font-semibold text-3xl text-navy-950 mt-1">${escapeHTML(form.title)}</h1>
    ${form.description ? `<p class="mt-3 text-slate-600">${escapeHTML(form.description)}</p>` : ''}
    <form id="dyn-form" class="mt-8 space-y-5">
      ${(form.fields || []).map(renderField).join('')}
      <div class="pt-2">
        <button type="submit" id="btn-submit" class="btn btn-primary w-full">
          Kirim Formulir
        </button>
      </div>
    </form>
    <div id="success" class="hidden text-center py-10">
      <div class="w-16 h-16 rounded-full bg-emerald-100 grid place-items-center mx-auto">
        <svg class="text-emerald-600" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
      <h2 class="font-display text-2xl text-navy-950 mt-4">Terima kasih!</h2>
      <p class="text-slate-600 mt-2">Jawaban Anda sudah kami terima.</p>
      <a href="/forms.html" class="btn btn-ghost mt-6 inline-flex">Lihat formulir lain</a>
    </div>
  `;

  document.querySelector('#dyn-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.querySelector('#btn-submit');
    btn.disabled = true; btn.textContent = 'Mengirim...';

    try {
      const fd = new FormData(e.target);
      const data = {};

      for (const field of form.fields) {
        const name = String(field.id);
        if (field.type === 'checkbox') {
          data[field.label] = fd.getAll(name);
        } else if (field.type === 'file') {
          const file = fd.get(name);
          if (file && file.size > 0) {
            const { publicUrl } = await storageService.upload('forms', file, { folder: form.slug, validateImage: false });
            data[field.label] = publicUrl;
          } else {
            data[field.label] = null;
          }
        } else {
          data[field.label] = fd.get(name);
        }
      }

      const session = await authService.getSession();
      await formService.submit(form.id, data, session?.user?.id ?? null);

      document.querySelector('#dyn-form').classList.add('hidden');
      document.querySelector('#success').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim: ' + (err.message || 'tidak diketahui'));
      btn.disabled = false; btn.textContent = 'Kirim Formulir';
    }
  });
}

init();
