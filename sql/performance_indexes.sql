create index if not exists points_user_id_idx on points(created_by);
create index if not exists expenses_user_id_idx on expenses(created_by);
create index if not exists expenses_point_id_idx on expenses(point_id);
create index if not exists notes_user_id_idx on notes(created_by);
create index if not exists points_point_date_idx on points(point_date);
create index if not exists expenses_created_at_idx on expenses(created_at desc);
create index if not exists notes_created_at_idx on notes(created_at desc);
