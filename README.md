# Portal Alumni Teknik Perkapalan UNDIP 2016

Portal komunitas untuk alumni Teknik Perkapalan Universitas Diponegoro Angkatan 2016 — database alumni, artikel, lowongan kerja, kegiatan, galeri, dan formulir pendaftaran dinamis.

Dibangun sebagai aplikasi web produksi dengan HTML, Tailwind CSS, JavaScript modular (vanilla ES modules), dan Supabase sebagai backend (PostgreSQL + Auth + Storage).

---

## 🎯 Fitur Utama

**Untuk Alumni**

- 📇 Database alumni dengan pencarian, filter (angkatan, lokasi, perusahaan, status kerja), dan kartu profil lengkap
- 👤 Halaman profil per alumni dengan kontak, sosial media, riwayat karir
- 📰 Artikel & berita komunitas dengan editor rich-text
- 🖼️ Galeri foto kegiatan dengan masonry layout & lightbox
- 💼 Lowongan kerja dari & untuk alumni
- 📅 Kalender kegiatan (FullCalendar) dengan tampilan bulan/minggu/list
- 📝 Formulir pendaftaran dinamis (reuni, survei, dll) yang dapat dibuat sendiri oleh admin

**Untuk Admin**

- 🔐 Sistem peran tiga tingkat: `super_admin`, `admin`, `alumni`
- 📊 Dashboard dengan ringkasan statistik
- ✍️ CRUD artikel dengan editor Quill 2.0 (gambar, video, blockquote, dll)
- 🖼️ Manajemen galeri album multi-upload
- 💼 CRUD lowongan kerja
- 📅 CRUD kegiatan dengan banner upload
- 📰 Pengelola running text (marquee landing page)
- 🛠️ Form builder dengan 7 tipe field + viewer hasil submission
- 👥 Manajemen pengguna: ubah peran (super admin), aktivasi/non-aktivasi akun, export CSV
- ⚙️ Pengaturan profil + ubah password

---

## 🧱 Tech Stack

| Layer       | Teknologi |
|-------------|-----------|
| Frontend    | HTML5 multi-page, JavaScript ES Modules (no build step) |
| Styling     | Tailwind CSS (Play CDN) + design system CSS variables |
| Fonts       | Fraunces (display) + Plus Jakarta Sans (body) |
| Backend     | Supabase: PostgreSQL, Auth, Storage |
| Editor      | Quill 2.0 |
| Calendar    | FullCalendar 6.1 |
| Carousel    | Swiper 11 |
| Icons       | Inline SVG / Lucide |
| Deploy      | Vercel (static) |

---

## 📁 Struktur Folder

```
portal-alumni/
├── index.html                    # Landing page
├── login.html                    # Login
├── register.html                 # Pendaftaran alumni
├── reset-password.html           # Reset password
├── alumni.html                   # Database alumni publik
├── profile.html                  # Profil alumni (view & edit)
├── articles.html                 # Daftar artikel
├── article.html                  # Detail artikel
├── gallery.html                  # Galeri foto
├── jobs.html                     # Lowongan kerja
├── events.html                   # Kalender kegiatan
├── forms.html                    # Daftar formulir aktif
├── form.html                     # Formulir dinamis (?slug=)
├── 404.html
│
├── admin/
│   ├── index.html               # Dashboard admin
│   ├── articles.html            # CRUD artikel + Quill
│   ├── gallery.html             # Manajemen galeri
│   ├── jobs.html                # CRUD lowongan
│   ├── events.html              # CRUD kegiatan
│   ├── alumni.html              # Manajemen pengguna
│   ├── forms.html               # Form builder
│   ├── running-text.html        # Pengelola marquee
│   └── settings.html            # Pengaturan akun
│
├── src/
│   ├── config/
│   │   └── supabase.js          # Klien Supabase
│   ├── components/
│   │   ├── navbar.js
│   │   ├── footer.js
│   │   └── admin-sidebar.js
│   ├── services/                # Akses data (1 file per domain)
│   │   ├── auth.service.js
│   │   ├── alumni.service.js
│   │   ├── article.service.js
│   │   ├── event.service.js
│   │   ├── form.service.js
│   │   ├── gallery.service.js
│   │   ├── job.service.js
│   │   ├── runningText.service.js
│   │   └── storage.service.js
│   ├── pages/                   # Page controller scripts
│   │   ├── home.js / alumni.js / article.js / ...
│   │   └── admin/...
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── toast.js
│   │   └── validator.js
│   └── styles/
│       └── main.css             # Design tokens + komponen
│
├── supabase/
│   ├── schema.sql               # Skema database + RLS + storage
│   └── seed.sql                 # Data demo
│
├── env.example.js               # Template konfigurasi
├── vercel.json                  # Konfigurasi deploy Vercel
├── .gitignore
└── README.md
```

---

## ⚙️ Setup

### 1) Buat project Supabase

1. Daftar / login di [supabase.com](https://supabase.com) dan buat project baru.
2. Catat **Project URL** dan **anon (public) key** dari **Settings → API**.

### 2) Jalankan skema database

Buka **SQL Editor** di dashboard Supabase, lalu:

1. Copy seluruh isi `supabase/schema.sql` dan jalankan. Ini akan membuat:
   - Tabel: `users`, `alumni_profiles`, `articles`, `article_categories`, `galleries`, `gallery_images`, `jobs`, `events`, `forms`, `form_fields`, `form_submissions`, `running_texts`
   - View: `alumni_stats`
   - Trigger auto-create `public.users` dari `auth.users`
   - RLS policies di semua tabel
   - 5 storage bucket: `avatars`, `articles`, `galleries`, `events`, `forms`
2. (Opsional) Copy isi `supabase/seed.sql` dan jalankan untuk mengisi data demo.

### 3) Aktifkan Email Auth

Di **Authentication → Providers**, pastikan **Email** aktif. Untuk testing cepat, matikan "Confirm email" agar tidak perlu verifikasi.

### 4) Konfigurasi keys

Copy `env.example.js` menjadi `env.js` di root project:

```bash
cp env.example.js env.js
```

Edit `env.js`:

```js
window.ENV = {
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...your-anon-key...',
};
```

> ⚠️ `env.js` sudah ada di `.gitignore`. **Jangan commit file ini.**

### 5) Jalankan secara lokal

Tidak ada build step — cukup serve folder ini sebagai static site:

```bash
# Opsi 1: dengan npx
npx serve .

# Opsi 2: dengan Python
python3 -m http.server 3000

# Opsi 3: VS Code "Live Server" extension
```

Buka `http://localhost:3000` di browser.

### 6) Buat akun super admin pertama

1. Daftar normal melalui `register.html`.
2. Di Supabase SQL Editor, jalankan:

```sql
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'email-anda@contoh.com';
```

3. Logout & login kembali. Sekarang Anda dapat mengakses semua menu admin dan mengubah peran pengguna lain.

---

## 🚀 Deploy ke Vercel

1. Push repo ke GitHub (pastikan `env.js` tidak ikut — sudah di `.gitignore`).
2. Di [vercel.com](https://vercel.com), klik **Add New → Project** dan pilih repo.
3. Framework Preset: **Other** (project ini static, tidak ada build).
4. Build Command: kosongkan. Output Directory: `.` (atau kosong).
5. Sebelum deploy, tambahkan file `env.js` melalui salah satu cara berikut:
   - **Cara A** — Buat file `env.js` langsung di repo *production* (tidak di `.gitignore` di branch deploy). Tidak direkomendasikan jika repo publik.
   - **Cara B (direkomendasikan)** — Gunakan Vercel "Build & Development → Environment Variables" + tambahkan small build script untuk men-generate `env.js` saat deploy. Contoh `package.json`:

     ```json
     {
       "scripts": {
         "build": "echo \"window.ENV={SUPABASE_URL:'$SUPABASE_URL',SUPABASE_ANON_KEY:'$SUPABASE_ANON_KEY'};\" > env.js"
       }
     }
     ```

     Set `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di Vercel Env Vars (Production). Set build command jadi `npm run build`.

`vercel.json` sudah dikonfigurasi untuk clean URLs (tanpa `.html`) dan security headers.

---

## 🔒 Keamanan & RLS

- Semua tabel dilindungi **Row Level Security**. Public tables (artikel, galeri, lowongan, kegiatan) hanya menampilkan baris dengan `status='published'` / `is_active=true`.
- Tabel `users` memiliki policy `users_update_self` — pengguna hanya dapat mengubah baris miliknya. **Hanya super admin** yang dapat mengubah `role` orang lain (via policy `users_admin_update`).
- Storage: bucket `avatars/articles/galleries/events` adalah **public read**, **authenticated insert**. Bucket `forms` mengizinkan upload anonim (untuk formulir publik) tapi hanya admin yang dapat membaca lampiran sensitif jika diatur demikian.
- Anon key aman untuk dipublikasi — semua proteksi dilakukan di sisi PostgreSQL via RLS.

---

## 🧪 Tips Pengembangan

- **Hot reload**: gunakan VS Code Live Server atau `npx serve --no-clipboard --no-port-switching` + reload manual.
- **Debug Supabase**: di console browser, akses `window.supabase` (eksposnya di `src/config/supabase.js`) untuk eksperimen query.
- **Reset password lokal**: di Supabase Auth → Users, klik titik tiga → "Send password recovery".
- **Test sebagai user lain**: gunakan tab Incognito.
- **Storage upload error**: pastikan bucket sudah dibuat oleh `schema.sql`. Jika belum, jalankan bagian storage policies secara manual.

### Struktur file penting

- **Service layer** (`src/services/*.service.js`) — semua query ke Supabase terpusat di sini. Komponen UI tidak boleh `import` langsung dari `supabase.js`.
- **Page controllers** (`src/pages/`) — satu file per halaman HTML, di-load via `<script type="module" src="...">`.
- **Component mounts** — `mountNavbar('#navbar')`, `mountFooter('#footer')`, `mountAdminSidebar('#admin-sidebar')`.

---

## 🎨 Design System

Token didefinisikan di `src/styles/main.css`:

```
Navy:    50  100 200 ... 900 (#0e2240)  950 (#07172d)
Gold:    200 300 400 500 (#d4af37) 600 700
Surface: bg-[#f6f7f9] (light app), white (cards)
```

Komponen utilitas: `.btn-primary`, `.btn-gold`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.input`, `.select`, `.textarea`, `.label`, `.card`, `.badge-emerald|gold|sky|amber|slate`, `.hero-gradient`, `.marquee`, `.prose-article`.

---

## 📝 Catatan

- Tidak ada build step — semua dependensi via CDN. Cocok untuk maintainability jangka panjang oleh tim non-teknis.
- Jika ingin migrasi ke build tooling (Vite, dll), file source di `src/` sudah pakai ES modules sehingga relatif mudah dipindahkan.
- Untuk skala lebih besar (>10k alumni), pertimbangkan pagination berbasis cursor di `alumni.service.list()`.

---

## 🤝 Kontribusi

Pull request diterima. Untuk perubahan besar, buka issue terlebih dahulu untuk diskusi.

## 📜 Lisensi

MIT — bebas digunakan oleh komunitas alumni manapun. Lihat header file untuk atribusi.

---

**Dibangun dengan ❤️ untuk Alumni Teknik Perkapalan UNDIP Angkatan 2016.**
