-- ============================================================================
-- SEED DATA - PORTAL ALUMNI TEKNIK PERKAPALAN UNDIP
-- ============================================================================
-- Run AFTER schema.sql. Provides demo content so the UI is populated.
-- For real auth users, create them via Supabase Auth UI first, then update
-- the role of one user to 'super_admin' in the SQL editor.
-- ============================================================================

-- Article categories
insert into public.article_categories (name, slug, description) values
  ('Berita',     'berita',     'Berita seputar alumni dan kampus'),
  ('Prestasi',   'prestasi',   'Prestasi alumni dan mahasiswa'),
  ('Karir',      'karir',      'Tips karir dan pengembangan diri'),
  ('Reuni',      'reuni',      'Informasi reuni dan kegiatan alumni'),
  ('Industri',   'industri',   'Berita industri maritim dan perkapalan')
on conflict (slug) do nothing;

-- Running text announcements
insert into public.running_texts (message, is_active, order_index) values
  ('🎓 Reuni Akbar Alumni Teknik Perkapalan UNDIP akan dilaksanakan pada Agustus 2026 — Mark your calendar!', true, 1),
  ('📢 Pendaftaran beasiswa kontribusi alumni untuk adik-adik mahasiswa telah dibuka.', true, 2),
  ('⚓ Selamat kepada alumni angkatan 2016 yang telah menyelesaikan program S2 di luar negeri.', true, 3)
on conflict do nothing;

-- Sample jobs (no posted_by — adjust after admin user exists)
insert into public.jobs (title, company, location, type, description, apply_link, deadline, is_active) values
  ('Naval Architect',          'PT PAL Indonesia',           'Surabaya',  'full_time',  'Mendesain struktur kapal niaga dan militer untuk proyek strategis nasional.', 'https://pal.co.id/karir', '2026-07-31', true),
  ('Marine Engineer',          'PT Daya Radar Utama',        'Jakarta',   'full_time',  'Bertanggung jawab atas sistem propulsi dan permesinan kapal.', 'https://example.com', '2026-08-15', true),
  ('Project Engineer',         'Samudera Indonesia',         'Jakarta',   'full_time',  'Memimpin proyek pembangunan kapal kontainer baru.', 'https://example.com', '2026-09-01', true),
  ('Ship Surveyor Intern',     'Biro Klasifikasi Indonesia', 'Batam',     'internship', 'Program magang untuk fresh graduate Teknik Perkapalan.', 'https://example.com', '2026-06-30', true),
  ('Offshore Design Engineer', 'McDermott',                  'Batam',     'contract',   'Design engineer untuk proyek offshore structures.', 'https://example.com', '2026-07-15', true)
on conflict do nothing;

-- Sample events
insert into public.events (title, description, location, start_date, end_date) values
  ('Reuni Akbar 2026',         'Pertemuan alumni lintas angkatan Teknik Perkapalan UNDIP.', 'Hotel Patra Jasa, Semarang', '2026-08-15 09:00+07', '2026-08-15 17:00+07'),
  ('Webinar Karir Maritim',    'Sharing session bersama alumni yang berkarir di industri maritim global.', 'Online (Zoom)', '2026-06-20 19:00+07', '2026-06-20 21:00+07'),
  ('Workshop CAD Perkapalan',  'Pelatihan AutoCAD dan Rhino untuk desain kapal modern.', 'Lab Komputer Teknik Perkapalan UNDIP', '2026-07-05 08:00+07', '2026-07-05 16:00+07'),
  ('Halal Bihalal Alumni',     'Silaturahmi alumni pasca Idul Fitri.', 'Aula Widya Puraya UNDIP', '2026-04-12 09:00+07', '2026-04-12 12:00+07')
on conflict do nothing;

-- Sample galleries
insert into public.galleries (title, slug, description, cover_url) values
  ('Wisuda Angkatan 2016', 'wisuda-2016', 'Momen wisuda angkatan 2016 Teknik Perkapalan UNDIP.', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'),
  ('Kunjungan Galangan',   'kunjungan-galangan', 'Kunjungan ke galangan kapal PT PAL Indonesia.', 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800'),
  ('Reuni Mini 2024',      'reuni-mini-2024', 'Reuni mini alumni angkatan 2016 di Jakarta.', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800')
on conflict (slug) do nothing;

-- Gallery images (Unsplash placeholders)
insert into public.gallery_images (gallery_id, image_url, caption)
select g.id, img.url, img.caption
from public.galleries g
cross join lateral (values
  ('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200', 'Prosesi wisuda'),
  ('https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200', 'Foto bersama'),
  ('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200', 'Toga dan tawa')
) as img(url, caption)
where g.slug = 'wisuda-2016'
on conflict do nothing;

-- Sample dynamic form
insert into public.forms (title, slug, description, is_active) values
  ('Konfirmasi Kehadiran Reuni 2026', 'reuni-2026', 'Mohon isi formulir berikut untuk konfirmasi kehadiran pada Reuni Akbar 2026.', true)
on conflict (slug) do nothing;

insert into public.form_fields (form_id, label, field_key, field_type, required, options, placeholder, order_index)
select f.id, x.label, x.field_key, x.field_type::form_field_type, x.required, x.options::jsonb, x.placeholder, x.order_index
from public.forms f
cross join lateral (values
  ('Nama Lengkap',  'nama',        'text',     true,  null,                                     'Nama sesuai KTP', 1),
  ('Email',         'email',       'email',    true,  null,                                     'nama@email.com',  2),
  ('Angkatan',      'angkatan',    'select',   true,  '["2014","2015","2016","2017","2018"]',   null,              3),
  ('Akan Hadir?',   'hadir',       'radio',    true,  '["Ya, Hadir","Tidak Hadir","Mungkin"]',  null,              4),
  ('Catatan',       'catatan',     'textarea', false, null,                                     'Pesan / permintaan khusus', 5)
) as x(label, field_key, field_type, required, options, placeholder, order_index)
where f.slug = 'reuni-2026'
on conflict do nothing;
