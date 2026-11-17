-- ==============================================================================
-- Gr8r Studio - Skema Database Supabase Lengkap & Sinkronisasi 100%
-- Mendukung manajemen belajar & proyek siswa/mahasiswa:
-- 1. profiles: data identitas & preferensi pengguna (terhubung ke auth.users)
-- 2. projects: manajemen proyek lomba, persiapan SKL, & umum (+ archive, links, tags)
-- 3. tasks: daftar tugas (semua status: backlog, todo, progress, review, done)
-- 4. notes: catatan belajar cepat (Quick Notes) dengan pin & variasi warna
-- 5. activity: riwayat aktivitas pengguna lengkap
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL: PROFILES
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
-- ------------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
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
  archived boolean default false not null,
  archived_at timestamptz,
  tags text[] default '{}'::text[] not null,
  links jsonb default '[]'::jsonb not null,
  milestones jsonb default '[]'::jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Migrasi aman untuk menambahkan kolom yang mungkin belum ada di database lama
alter table public.projects add column if not exists archived boolean default false not null;
alter table public.projects add column if not exists archived_at timestamptz;
alter table public.projects add column if not exists tags text[] default '{}'::text[] not null;
alter table public.projects add column if not exists image text;

-- ------------------------------------------------------------------------------
-- 3. TABEL: TASKS
-- ------------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  "desc" text default '',
  status text check (status in ('backlog', 'todo', 'progress', 'review', 'done')) default 'todo' not null,
  priority text check (priority in ('urgent', 'high', 'medium', 'low', 'none')) default 'medium' not null,
  due timestamptz,
  start_date timestamptz,
  labels text[] default '{}'::text[] not null,
  subtasks jsonb default '[]'::jsonb not null,
  fav boolean default false not null,
  archived boolean default false not null,
  archived_at timestamptz,
  task_order numeric default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Hapus pembatasan status lama yang terlalu sempit jika tabel sudah pernah dibuat
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check check (status in ('backlog', 'todo', 'progress', 'review', 'done'));

alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks add constraint tasks_priority_check check (priority in ('urgent', 'high', 'medium', 'low', 'none'));

alter table public.tasks add column if not exists archived boolean default false not null;
alter table public.tasks add column if not exists archived_at timestamptz;
alter table public.tasks alter column task_order type numeric;

-- ------------------------------------------------------------------------------
-- 4. TABEL: NOTES
-- ------------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '' not null,
  content text default '' not null,
  color text default 'default' not null,
  pinned boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 5. TABEL: ACTIVITY
-- ------------------------------------------------------------------------------
create table if not exists public.activity (
  id text default gen_random_uuid()::text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  by_user text,
  verb text not null,
  task_id text,
  project_id text,
  extra text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXING
-- ==============================================================================
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_projects_due on public.projects(due);
create index if not exists idx_projects_archived on public.projects(archived);
create index if not exists idx_projects_tags on public.projects using gin(tags);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due on public.tasks(due);
create index if not exists idx_tasks_archived on public.tasks(archived);

create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_notes_pinned on public.notes(pinned);

create index if not exists idx_activity_user_id on public.activity(user_id);
create index if not exists idx_activity_created_at on public.activity(created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.activity enable row level security;

-- PROFILES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile" on public.profiles for delete using (auth.uid() = id);

-- PROJECTS
drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects" on public.projects for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id);

-- TASKS
drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- NOTES
drop policy if exists "Users can view own notes" on public.notes;
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- ACTIVITY
drop policy if exists "Users can view own activity" on public.activity;
create policy "Users can view own activity" on public.activity for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own activity" on public.activity;
create policy "Users can insert own activity" on public.activity for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own activity" on public.activity;
create policy "Users can update own activity" on public.activity for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own activity" on public.activity;
create policy "Users can delete own activity" on public.activity for delete using (auth.uid() = user_id);

-- ==============================================================================
-- FUNCTIONS & TRIGGERS
-- ==============================================================================

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

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects for each row execute function public.handle_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.handle_updated_at();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at before update on public.notes for each row execute function public.handle_updated_at();

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects') then
    alter publication supabase_realtime add table public.projects;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes') then
    alter publication supabase_realtime add table public.notes;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity') then
    alter publication supabase_realtime add table public.activity;
  end if;
end;
$$;