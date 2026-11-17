-- ==============================================================================
-- Gr8r Studio - Skema Database Supabase
-- Mendukung manajemen belajar & proyek siswa/mahasiswa:
-- 1. profiles: data identitas & preferensi pengguna (terhubung ke auth.users)
-- 2. projects: manajemen proyek lomba, persiapan SKL, & umum
-- 3. tasks: daftar tugas terinci dengan prioritas, due date, & subtasks (jsonb)
-- 4. notes: catatan belajar cepat (Quick Notes) dengan pin & variasi warna
-- Dilengkapi Row Level Security (RLS) lengkap, indexing performan, & trigger otomatis.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL: PROFILES
-- Menyimpan profil pengguna yang otomatis dibuat saat registrasi di auth.users.
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  title text default 'Pelajar',
  theme text default 'system',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 2. TABEL: PROJECTS
-- Menyimpan proyek belajar, perlombaan, maupun persiapan SKL (Standar Kelulusan).
-- ID bertipe text agar kompatibel dengan sistem ID lokal dan UUID Supabase.
-- ------------------------------------------------------------------------------
create table if not exists public.projects (
  id text default gen_random_uuid()::text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  "desc" text default '',
  category text check (category in ('lomba', 'skl', 'umum')) default 'umum' not null,
  icon text default 'folder' not null,
  color text default 'indigo' not null,
  status text default 'active' not null,
  due timestamptz,
  start_date timestamptz,
  progress integer default 0 check (progress >= 0 and progress <= 100) not null,
  fav boolean default false not null,
  links jsonb default '[]'::jsonb not null,
  milestones jsonb default '[]'::jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 3. TABEL: TASKS
-- Menyimpan tugas belajar, milestone lomba, atau item tugas sekolah.
-- ------------------------------------------------------------------------------
create table if not exists public.tasks (
  id text default gen_random_uuid()::text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id text references public.projects(id) on delete cascade,
  title text not null,
  "desc" text default '',
  status text check (status in ('todo', 'progress', 'done')) default 'todo' not null,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium' not null,
  due timestamptz,
  start_date timestamptz,
  labels text[] default '{}'::text[] not null,
  subtasks jsonb default '[]'::jsonb not null,
  fav boolean default false not null,
  task_order integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 4. TABEL: NOTES
-- Menyimpan ide catatan cepat, rangkuman, atau informasi lomba (Google Keep style).
-- ------------------------------------------------------------------------------
create table if not exists public.notes (
  id text default gen_random_uuid()::text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '' not null,
  content text default '' not null,
  color text default 'default' not null,
  pinned boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXING
-- Optimasi performa filter user_id, relasi foreign key, dan sorting.
-- ==============================================================================
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_projects_due on public.projects(due);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due on public.tasks(due);

create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_notes_pinned on public.notes(pinned);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Memastikan isolasi data: tiap pengguna hanya dapat mengakses miliknya sendiri.
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

-- Kebijakan RLS: PROFILES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Kebijakan RLS: PROJECTS
drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Kebijakan RLS: TASKS
drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Kebijakan RLS: NOTES
drop policy if exists "Users can view own notes" on public.notes;
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- FUNCTIONS & TRIGGERS
-- 1. Otomatis buat data profil saat user mendaftar di auth.users
-- 2. Otomatis mutakhirkan updated_at sebelum proses UPDATE tabel
-- ==============================================================================

-- Fungsi pembuat profil otomatis dari auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fungsi update kolom updated_at otomatis
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- Mengaktifkan publikasi Supabase Realtime untuk kolaborasi dan sinkronisasi instan
-- ==============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects'
  ) then
    alter publication supabase_realtime add table public.projects;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end;
$$;
