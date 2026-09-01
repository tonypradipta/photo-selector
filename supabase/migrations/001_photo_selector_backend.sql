-- ============================================================
-- Perumda Photo Selector — Database Migration 001
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- TABLE: profiles
-- ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  studio_name   text,
  full_name     text,
  location      text,
  bio           text,
  whatsapp      text,
  website       text,
  avatar_url    text,
  show_branding boolean not null default true,
  allow_notes   boolean not null default true,
  send_reminders boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- TABLE: projects
-- ──────────────────────────────────────────────────────────
create table if not exists public.projects (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  client_name          text not null,
  drive_folder_url     text not null,
  drive_folder_id      text not null,
  whatsapp_number      text,
  max_photos           integer not null default 20,
  client_token         text unique not null,
  gallery_password_hash text,
  status               text not null default 'draft',
  selection_locked     boolean not null default false,
  last_synced_at       timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint projects_max_photos_check check (max_photos >= 1),
  constraint projects_status_check check (status in ('draft','active','completed','locked'))
);

-- ──────────────────────────────────────────────────────────
-- TABLE: photos
-- ──────────────────────────────────────────────────────────
create table if not exists public.photos (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  drive_file_id      text not null,
  file_name          text not null,
  photo_code         text not null,
  mime_type          text,
  preview_path       text,
  drive_modified_time timestamptz,
  width              integer,
  height             integer,
  sort_order         integer not null default 0,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint photos_project_drive_unique unique (project_id, drive_file_id)
);

-- ──────────────────────────────────────────────────────────
-- TABLE: selections
-- ──────────────────────────────────────────────────────────
create table if not exists public.selections (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  photo_id    uuid not null references public.photos(id) on delete cascade,
  selected_at timestamptz not null default now(),
  constraint selections_project_photo_unique unique (project_id, photo_id)
);

-- ──────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────
create index if not exists idx_projects_owner_id    on public.projects(owner_id);
create index if not exists idx_projects_client_token on public.projects(client_token);
create index if not exists idx_photos_project_id    on public.photos(project_id);
create index if not exists idx_photos_drive_file_id on public.photos(drive_file_id);
create index if not exists idx_selections_project_id on public.selections(project_id);
create index if not exists idx_selections_photo_id   on public.selections(photo_id);

-- ──────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.projects   enable row level security;
alter table public.photos     enable row level security;
alter table public.selections enable row level security;

-- profiles: owner only
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- projects: owner only
drop policy if exists "projects_owner" on public.projects;
create policy "projects_owner" on public.projects
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- photos: owner only (via project)
drop policy if exists "photos_owner" on public.photos;
create policy "photos_owner" on public.photos
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = photos.project_id
        and p.owner_id = auth.uid()
    )
  );

-- selections: owner only (via project)
drop policy if exists "selections_owner" on public.selections;
create policy "selections_owner" on public.selections
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = selections.project_id
        and p.owner_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────
-- HELPER FUNCTION: auto-update updated_at
-- ──────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at   on public.profiles;
drop trigger if exists projects_updated_at   on public.projects;
drop trigger if exists photos_updated_at     on public.photos;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger photos_updated_at
  before update on public.photos
  for each row execute procedure public.handle_updated_at();

-- ──────────────────────────────────────────────────────────
-- HELPER FUNCTION: auto-create profile on new user
-- ──────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, studio_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'studio_name', '')
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    studio_name = coalesce(nullif(excluded.studio_name, ''), profiles.studio_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- STORAGE BUCKET: gallery-previews (private)
-- ──────────────────────────────────────────────────────────
-- Run this separately if using Supabase Storage:
-- insert into storage.buckets (id, name, public)
-- values ('gallery-previews', 'gallery-previews', false)
-- on conflict (id) do nothing;
