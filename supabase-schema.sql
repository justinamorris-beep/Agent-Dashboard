-- =============================================
-- KW Agent Dashboard — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. CATEGORIES
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. RESOURCES
create table if not exists resources (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  url text,
  category_id uuid references categories(id) on delete set null,
  is_featured boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 3. ANNOUNCEMENTS (broker bulletins)
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  message text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. EVENTS
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  location text,
  rsvp_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. PREFERRED PARTNERS
create table if not exists partners (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text,
  phone text,
  email text,
  website_url text,
  logo_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 6. ADMIN ROLES — tracks which users are admins
create table if not exists user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'agent', -- 'agent' | 'admin'
  created_at timestamptz default now(),
  unique(user_id)
);

-- =============================================
-- Row Level Security
-- =============================================

alter table categories enable row level security;
alter table resources enable row level security;
alter table announcements enable row level security;
alter table events enable row level security;
alter table partners enable row level security;
alter table user_roles enable row level security;

-- Authenticated users can READ everything
create policy "Authenticated read categories" on categories for select to authenticated using (true);
create policy "Authenticated read resources" on resources for select to authenticated using (true);
create policy "Authenticated read announcements" on announcements for select to authenticated using (true);
create policy "Authenticated read events" on events for select to authenticated using (true);
create policy "Authenticated read partners" on partners for select to authenticated using (true);
create policy "Authenticated read user_roles" on user_roles for select to authenticated using (true);

-- Only admins can INSERT/UPDATE/DELETE
create policy "Admin write categories" on categories for all to authenticated
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

create policy "Admin write resources" on resources for all to authenticated
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

create policy "Admin write announcements" on announcements for all to authenticated
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

create policy "Admin write events" on events for all to authenticated
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

create policy "Admin write partners" on partners for all to authenticated
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

create policy "Admin write user_roles" on user_roles for all to authenticated
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

-- =============================================
-- Seed: Categories from your existing sheet
-- =============================================
insert into categories (name, sort_order) values
  ('New Associates', 1),
  ('Market Center Resources', 2),
  ('Training', 3),
  ('Technology', 4),
  ('Culture', 5),
  ('Vendors', 6),
  ('Keller Williams', 7),
  ('Communities', 8);

-- =============================================
-- HOW TO MAKE YOURSELF AN ADMIN
-- After signing up, run this in SQL editor:
-- (replace the email with yours)
-- =============================================
-- insert into user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'your@email.com';
