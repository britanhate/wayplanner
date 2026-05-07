-- Запусти цей SQL в Supabase Dashboard → SQL Editor

-- Таблиця точок на карті
create table points (
  id uuid primary key default gen_random_uuid(),
  created_by text not null,
  name text not null,
  type text not null default 'sight',
  lat double precision not null,
  lng double precision not null,
  addr text,
  description text,
  estimated_cost numeric,
  currency text default 'EUR',
  comment text,
  created_at timestamptz default now()
);

-- Таблиця нотаток
create table notes (
  id uuid primary key default gen_random_uuid(),
  created_by text not null,
  title text default '',
  body text default '',
  created_at timestamptz default now()
);

-- Таблиця витрат
create table expenses (
  id uuid primary key default gen_random_uuid(),
  created_by text not null,
  name text not null,
  amount numeric not null,
  currency text default 'UAH',
  category text not null,
  created_at timestamptz default now()
);

-- Налаштування подорожі (один рядок)
create table trip_settings (
  id integer primary key default 1,
  budget numeric default 0,
  currency text default 'UAH'
);

insert into trip_settings (id, budget, currency) values (1, 0, 'UAH')
  on conflict (id) do nothing;

-- Дозволити читання/запис без авторизації (RLS off для простоти)
alter table points enable row level security;
alter table notes enable row level security;
alter table expenses enable row level security;
alter table trip_settings enable row level security;

-- Публічні політики (всі можуть читати і писати)
create policy "public read points"  on points  for select using (true);
create policy "public write points" on points  for insert with check (true);
create policy "public delete points" on points for delete using (true);
create policy "public update points" on points for update using (true);

create policy "public read notes"   on notes   for select using (true);
create policy "public write notes"  on notes   for insert with check (true);
create policy "public delete notes" on notes   for delete using (true);
create policy "public update notes" on notes   for update using (true);

create policy "public read expenses"  on expenses  for select using (true);
create policy "public write expenses" on expenses  for insert with check (true);
create policy "public delete expenses" on expenses for delete using (true);

create policy "public read settings"  on trip_settings for select using (true);
create policy "public write settings" on trip_settings for all using (true);

-- Увімкнути реалтайм для всіх таблиць
alter publication supabase_realtime add table points;
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table expenses;
