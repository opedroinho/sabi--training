-- ============================================================
-- Wilson Sabiá Trainer App — Database Schema
-- Safe to re-run (IF NOT EXISTS + drops policies before recreating)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. ALL TABLES FIRST (no cross-references between them) ─

create table if not exists profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  name       text not null,
  role       text not null check (role in ('trainer', 'student')),
  created_at timestamptz default now()
);

create table if not exists templates (
  id         uuid default gen_random_uuid() primary key,
  trainer_id uuid references profiles(id) on delete cascade not null,
  name       text not null default 'Meu Treino',
  version    int  not null default 1,
  data       jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists assignments (
  id              uuid default gen_random_uuid() primary key,
  template_id     uuid references templates(id) on delete cascade not null,
  student_id      uuid references profiles(id)  on delete cascade not null unique,
  trainer_id      uuid references profiles(id)  on delete cascade not null,
  current_version int  not null default 1,
  pending_version int,
  created_at      timestamptz default now()
);

create table if not exists student_records (
  id            uuid default gen_random_uuid() primary key,
  assignment_id uuid references assignments(id) on delete cascade not null unique,
  student_id    uuid references profiles(id)    on delete cascade not null,
  data          jsonb not null default '{}',
  updated_at    timestamptz default now()
);


-- ── 2. ENABLE RLS ─────────────────────────────────────────

alter table profiles        enable row level security;
alter table templates       enable row level security;
alter table assignments     enable row level security;
alter table student_records enable row level security;


-- ── 3. POLICIES (all tables exist now, safe to reference any of them) ─

-- Drop first so re-runs don't error on duplicates
do $$ begin
  drop policy if exists "profiles_read_own"             on profiles;
  drop policy if exists "profiles_update_own"           on profiles;
  drop policy if exists "profiles_trainer_read"         on profiles;
  drop policy if exists "profiles_authenticated_read"   on profiles;
  drop policy if exists "profiles_service_insert"       on profiles;
  drop policy if exists "templates_trainer_all"      on templates;
  drop policy if exists "templates_student_read"     on templates;
  drop policy if exists "assignments_trainer_all"    on assignments;
  drop policy if exists "assignments_student_select" on assignments;
  drop policy if exists "assignments_student_update" on assignments;
  drop policy if exists "records_student_all"        on student_records;
  drop policy if exists "records_trainer_select"     on student_records;
end $$;

-- profiles
-- Any authenticated user can read any profile.
-- Safe for this app (small private trainer+students group; profiles only store name+role).
-- Avoids the recursive-policy issue where a SELECT policy queries the same table it guards.
create policy "profiles_authenticated_read"
  on profiles for select using (auth.uid() is not null);

create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id);

create policy "profiles_service_insert"
  on profiles for insert with check (true);

-- templates
create policy "templates_trainer_all"
  on templates for all using (auth.uid() = trainer_id);

create policy "templates_student_read"
  on templates for select using (
    exists (
      select 1 from assignments a
      where a.template_id = templates.id
        and a.student_id  = auth.uid()
    )
  );

-- assignments
create policy "assignments_trainer_all"
  on assignments for all using (auth.uid() = trainer_id);

create policy "assignments_student_select"
  on assignments for select using (auth.uid() = student_id);

create policy "assignments_student_update"
  on assignments for update using (auth.uid() = student_id);

-- student_records
create policy "records_student_all"
  on student_records for all using (auth.uid() = student_id);

create policy "records_trainer_select"
  on student_records for select using (
    exists (
      select 1 from assignments a
      join   profiles p on p.id = auth.uid()
      where  a.id         = student_records.assignment_id
        and  a.trainer_id = auth.uid()
        and  p.role       = 'trainer'
    )
  );


-- ── 4. TRIGGERS ───────────────────────────────────────────

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists templates_updated_at on templates;
drop trigger if exists records_updated_at   on student_records;

create trigger templates_updated_at
  before update on templates
  for each row execute procedure touch_updated_at();

create trigger records_updated_at
  before update on student_records
  for each row execute procedure touch_updated_at();
