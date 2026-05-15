create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  created_by text not null,
  name text not null,
  description text,
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table points add column if not exists trip_id uuid references trips(id) on delete set null;
alter table expenses add column if not exists trip_id uuid references trips(id) on delete set null;

alter table trips enable row level security;
create policy if not exists "public read trips" on trips for select using (true);
create policy if not exists "public write trips" on trips for insert with check (true);
create policy if not exists "public update trips" on trips for update using (true);

with users_with_data as (
  select created_by from points
  union
  select created_by from expenses
), defaults as (
  insert into trips (created_by, name)
  select u.created_by, 'My Trip'
  from users_with_data u
  where not exists (select 1 from trips t where t.created_by = u.created_by)
  returning id, created_by
)
update points p
set trip_id = t.id
from trips t
where p.trip_id is null and p.created_by = t.created_by;

update expenses e
set trip_id = t.id
from trips t
where e.trip_id is null and e.created_by = t.created_by;

alter publication supabase_realtime add table trips;
