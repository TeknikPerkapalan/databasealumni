-- ============================================================================
-- PORTAL ALUMNI TEKNIK PERKAPALAN UNDIP - DATABASE SCHEMA
-- PostgreSQL / Supabase
-- ============================================================================
--
-- Execute this in the Supabase SQL Editor (one-shot) on a fresh project.
-- It creates all tables, indexes, triggers, RLS policies, and storage buckets.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fast text search

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'admin', 'alumni');
exception when duplicate_object then null; end $$;

do $$ begin
  create type article_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_type as enum ('full_time', 'part_time', 'contract', 'internship', 'remote');
exception when duplicate_object then null; end $$;

do $$ begin
  create type form_field_type as enum ('text','textarea','select','checkbox','radio','file','date','email','number');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- HELPER: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ----------------------------------------------------------------------------
-- USERS (extends auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text not null,
  role          user_role not null default 'alumni',
  avatar_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_users_role on public.users(role);
create trigger trg_users_updated before update on public.users
  for each row execute function public.handle_updated_at();

-- Auto-create profile row when an auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    'alumni'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- ALUMNI PROFILES
-- ----------------------------------------------------------------------------
create table if not exists public.alumni_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid unique not null references public.users(id) on delete cascade,
  nim             text unique,
  angkatan        integer not null,
  tahun_lulus     integer,
  alamat          text,
  no_hp           text,
  tempat_kerja    text,
  jabatan         text,
  lokasi_kerja    text,
  status_kerja    text,         -- e.g. 'Bekerja', 'Wirausaha', 'Studi Lanjut', 'Belum Bekerja'
  linkedin_url    text,
  instagram_url   text,
  bio             text,
  is_public       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_alumni_angkatan on public.alumni_profiles(angkatan);
create index if not exists idx_alumni_status on public.alumni_profiles(status_kerja);
create index if not exists idx_alumni_tempat_kerja on public.alumni_profiles using gin (tempat_kerja gin_trgm_ops);
create index if not exists idx_alumni_lokasi on public.alumni_profiles using gin (lokasi_kerja gin_trgm_ops);
create trigger trg_alumni_updated before update on public.alumni_profiles
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- ARTICLE CATEGORIES
-- ----------------------------------------------------------------------------
create table if not exists public.article_categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  slug        text unique not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ARTICLES
-- ----------------------------------------------------------------------------
create table if not exists public.articles (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  slug          text unique not null,
  excerpt       text,
  content       text not null,       -- HTML produced by QuillJS
  thumbnail_url text,
  author_id     uuid not null references public.users(id) on delete cascade,
  category_id   uuid references public.article_categories(id) on delete set null,
  status        article_status not null default 'draft',
  views         integer not null default 0,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_articles_author on public.articles(author_id);
create index if not exists idx_articles_published on public.articles(published_at desc);
create index if not exists idx_articles_title on public.articles using gin (title gin_trgm_ops);
create trigger trg_articles_updated before update on public.articles
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- GALLERIES (Albums) and IMAGES
-- ----------------------------------------------------------------------------
create table if not exists public.galleries (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text unique not null,
  description  text,
  cover_url    text,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_galleries_updated before update on public.galleries
  for each row execute function public.handle_updated_at();

create table if not exists public.gallery_images (
  id           uuid primary key default uuid_generate_v4(),
  gallery_id   uuid not null references public.galleries(id) on delete cascade,
  image_url    text not null,
  caption      text,
  uploaded_by  uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_gallery_images_gallery on public.gallery_images(gallery_id);

-- ----------------------------------------------------------------------------
-- JOBS
-- ----------------------------------------------------------------------------
create table if not exists public.jobs (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  company       text not null,
  location      text,
  type          job_type not null default 'full_time',
  description   text,
  apply_link    text,
  deadline      date,
  is_active     boolean not null default true,
  posted_by     uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_jobs_active on public.jobs(is_active);
create index if not exists idx_jobs_deadline on public.jobs(deadline);
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  location     text,
  banner_url   text,
  start_date   timestamptz not null,
  end_date     timestamptz,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_events_start on public.events(start_date);
create trigger trg_events_updated before update on public.events
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- DYNAMIC FORMS
-- ----------------------------------------------------------------------------
create table if not exists public.forms (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text unique not null,
  description  text,
  is_active    boolean not null default true,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_forms_updated before update on public.forms
  for each row execute function public.handle_updated_at();

create table if not exists public.form_fields (
  id           uuid primary key default uuid_generate_v4(),
  form_id      uuid not null references public.forms(id) on delete cascade,
  label        text not null,
  field_key    text not null,
  field_type   form_field_type not null,
  required     boolean not null default false,
  options      jsonb,    -- for select/radio/checkbox: ["a","b","c"]
  placeholder  text,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_form_fields_form on public.form_fields(form_id);

create table if not exists public.form_submissions (
  id            uuid primary key default uuid_generate_v4(),
  form_id       uuid not null references public.forms(id) on delete cascade,
  submitted_by  uuid references public.users(id) on delete set null,
  data          jsonb not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_form_subs_form on public.form_submissions(form_id);

-- ----------------------------------------------------------------------------
-- RUNNING TEXT (marquee announcements)
-- ----------------------------------------------------------------------------
create table if not exists public.running_texts (
  id          uuid primary key default uuid_generate_v4(),
  message     text not null,
  is_active   boolean not null default true,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_running_texts_updated before update on public.running_texts
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.users              enable row level security;
alter table public.alumni_profiles    enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles           enable row level security;
alter table public.galleries          enable row level security;
alter table public.gallery_images     enable row level security;
alter table public.jobs               enable row level security;
alter table public.events             enable row level security;
alter table public.forms              enable row level security;
alter table public.form_fields        enable row level security;
alter table public.form_submissions   enable row level security;
alter table public.running_texts      enable row level security;

-- Helper: is admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin','super_admin') and is_active
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'super_admin' and is_active
  );
$$;

-- --- USERS ---
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users for select using (true);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all" on public.users for all
  using (public.is_admin()) with check (public.is_admin());

-- --- ALUMNI PROFILES ---
drop policy if exists "alumni_public_read" on public.alumni_profiles;
create policy "alumni_public_read" on public.alumni_profiles for select
  using (is_public = true or auth.uid() = user_id or public.is_admin());

drop policy if exists "alumni_insert_self" on public.alumni_profiles;
create policy "alumni_insert_self" on public.alumni_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "alumni_update_self" on public.alumni_profiles;
create policy "alumni_update_self" on public.alumni_profiles for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "alumni_delete_admin" on public.alumni_profiles;
create policy "alumni_delete_admin" on public.alumni_profiles for delete
  using (public.is_admin());

-- --- ARTICLE CATEGORIES ---
drop policy if exists "cat_read_all" on public.article_categories;
create policy "cat_read_all" on public.article_categories for select using (true);

drop policy if exists "cat_admin_write" on public.article_categories;
create policy "cat_admin_write" on public.article_categories for all
  using (public.is_admin()) with check (public.is_admin());

-- --- ARTICLES ---
drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read" on public.articles for select
  using (status = 'published' or auth.uid() = author_id or public.is_admin());

drop policy if exists "articles_insert_auth" on public.articles;
create policy "articles_insert_auth" on public.articles for insert
  with check (auth.uid() = author_id);

drop policy if exists "articles_update_own" on public.articles;
create policy "articles_update_own" on public.articles for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

drop policy if exists "articles_delete_own" on public.articles;
create policy "articles_delete_own" on public.articles for delete
  using (auth.uid() = author_id or public.is_admin());

-- --- GALLERIES ---
drop policy if exists "gal_read_all" on public.galleries;
create policy "gal_read_all" on public.galleries for select using (true);
drop policy if exists "gal_admin_write" on public.galleries;
create policy "gal_admin_write" on public.galleries for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "galimg_read_all" on public.gallery_images;
create policy "galimg_read_all" on public.gallery_images for select using (true);
drop policy if exists "galimg_insert_auth" on public.gallery_images;
create policy "galimg_insert_auth" on public.gallery_images for insert
  with check (auth.uid() is not null);
drop policy if exists "galimg_delete_admin" on public.gallery_images;
create policy "galimg_delete_admin" on public.gallery_images for delete
  using (public.is_admin() or auth.uid() = uploaded_by);

-- --- JOBS ---
drop policy if exists "jobs_read_active" on public.jobs;
create policy "jobs_read_active" on public.jobs for select
  using (is_active = true or public.is_admin());
drop policy if exists "jobs_admin_write" on public.jobs;
create policy "jobs_admin_write" on public.jobs for all
  using (public.is_admin()) with check (public.is_admin());

-- --- EVENTS ---
drop policy if exists "events_read_all" on public.events;
create policy "events_read_all" on public.events for select using (true);
drop policy if exists "events_admin_write" on public.events;
create policy "events_admin_write" on public.events for all
  using (public.is_admin()) with check (public.is_admin());

-- --- FORMS ---
drop policy if exists "forms_read_active" on public.forms;
create policy "forms_read_active" on public.forms for select
  using (is_active = true or public.is_admin());
drop policy if exists "forms_admin_write" on public.forms;
create policy "forms_admin_write" on public.forms for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "form_fields_read_all" on public.form_fields;
create policy "form_fields_read_all" on public.form_fields for select using (true);
drop policy if exists "form_fields_admin_write" on public.form_fields;
create policy "form_fields_admin_write" on public.form_fields for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "form_subs_insert_anyone" on public.form_submissions;
create policy "form_subs_insert_anyone" on public.form_submissions for insert
  with check (true);
drop policy if exists "form_subs_read_admin" on public.form_submissions;
create policy "form_subs_read_admin" on public.form_submissions for select
  using (public.is_admin() or auth.uid() = submitted_by);
drop policy if exists "form_subs_delete_admin" on public.form_submissions;
create policy "form_subs_delete_admin" on public.form_submissions for delete
  using (public.is_admin());

-- --- RUNNING TEXTS ---
drop policy if exists "rt_read_all" on public.running_texts;
create policy "rt_read_all" on public.running_texts for select using (true);
drop policy if exists "rt_admin_write" on public.running_texts;
create policy "rt_admin_write" on public.running_texts for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('avatars',    'avatars',    true),
  ('articles',   'articles',   true),
  ('galleries',  'galleries',  true),
  ('events',     'events',     true),
  ('forms',      'forms',      true)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload; everyone can read
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects for select
  using (bucket_id in ('avatars','articles','galleries','events','forms'));

drop policy if exists "storage_auth_insert" on storage.objects;
create policy "storage_auth_insert" on storage.objects for insert
  with check (auth.uid() is not null
              and bucket_id in ('avatars','articles','galleries','events','forms'));

drop policy if exists "storage_auth_update" on storage.objects;
create policy "storage_auth_update" on storage.objects for update
  using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "storage_auth_delete" on storage.objects;
create policy "storage_auth_delete" on storage.objects for delete
  using (auth.uid() = owner or exists (
    select 1 from public.users where id = auth.uid()
      and role in ('admin','super_admin')
  ));

-- ============================================================================
-- VIEW: Public alumni statistics (used on landing page)
-- ============================================================================
create or replace view public.alumni_stats as
select
  (select count(*) from public.alumni_profiles)                            as total_alumni,
  (select count(distinct angkatan) from public.alumni_profiles)            as total_angkatan,
  (select count(*) from public.alumni_profiles where status_kerja = 'Bekerja')    as total_bekerja,
  (select count(*) from public.alumni_profiles where status_kerja = 'Wirausaha')  as total_wirausaha;

grant select on public.alumni_stats to anon, authenticated;
