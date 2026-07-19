# Perbaikan Portal Alumni TP UNDIP 2016

Ringkasan apa yang diperbaiki dan langkah menyelesaikannya. Kode aslimu sudah bagus —
masalahnya terpusat, bukan tersebar di tiap file.

## Apa yang sebelumnya bikin halaman "polos / error"

1. **Tidak ada `tailwind.config` di halaman mana pun** (kecuali `index.html`).
   Warna `navy-*` / `gold-*` cuma ditambal sebagian secara manual di `main.css`,
   sehingga banyak class (mis. `hover:text-gold-600`, `text-gold-300`, gradient)
   tidak menghasilkan warna apa pun.
2. **Tidak ada `env.js`.** Semua halaman dinamis (alumni, artikel, galeri, lowongan,
   kegiatan, profil) mengambil data dari Supabase; tanpa kredensial, kontennya kosong.
3. **Membuka lewat `file://` (klik ganda).** Semua path absolut `/src/...` (CSS + module
   JS) gagal dimuat di `file://` → itulah "tidak ada warna background". Situs ini harus
   dijalankan lewat server (Vercel, atau server statis lokal).

## Yang diubah

- **BARU `src/config/tailwind.js`** — satu config Tailwind bersama: palet lengkap
  navy 50–950 & gold 100–700, font (Fraunces + Plus Jakarta Sans), `shadow-soft`.
  Dimuat di **setiap** halaman tepat setelah script CDN Tailwind. Sekarang semua
  utility warna + variannya (hover/focus/responsive) bekerja natif.
- **`src/styles/main.css`** — blok utility warna manual yang rapuh dihapus (kini
  ditangani config); komponen, dekoratif, dan prose tetap.
- **22 halaman `.html`** (root + `admin/`) — disisipi satu baris:
  `<script src="/src/config/tailwind.js"></script>` setelah CDN Tailwind.
- **`index.html`** — ditulis ulang agar seragam dengan sistem desain situs (palet &
  font yang sama), berdiri sendiri dengan **data contoh**, jadi landing selalu tampil
  benar bahkan sebelum Supabase disetel.
- **BARU `env.js`** — salinan dari `env.example.js`, tinggal diisi kredensial.

## Langkah menyelesaikan (3 langkah)

1. **Jangan buka via `file://`.** Jalankan lewat server:
   - Lokal cepat: `npx serve` (atau `python3 -m http.server`) di folder proyek, lalu
     buka `http://localhost:...`.
   - Produksi: deploy ke Vercel seperti biasa.
2. **Isi `env.js`** dengan `SUPABASE_URL` + `SUPABASE_ANON_KEY` dari
   Supabase → Project Settings → API.
3. **Isi database** agar halaman dinamis berisi contoh: jalankan `supabase/schema.sql`
   lalu `supabase/seed.sql` di SQL Editor Supabase.

Setelah itu seluruh halaman (bukan hanya beranda) tampil berwarna dan berisi data.

> Catatan: `index.html` sengaja tetap memakai data contoh statis supaya beranda selalu
> rapi walau backend belum siap. Bila ingin beranda dinamis (search alumni, carousel
> artikel/acara dari Supabase), `src/pages/home.js` sudah tersedia untuk versi itu.
