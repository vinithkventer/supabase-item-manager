
-- Run this in Supabase SQL editor

-- 1) Storage bucket
insert into storage.buckets (id, name, public) values ('files', 'files', false)
on conflict (id) do nothing;

-- 2) Tables
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  item_code text not null,
  item_name text not null,
  material text,
  vendor text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create type if not exists file_kind as enum ('drawing','certificate','other');

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  file_type file_kind not null,
  version int not null check (version > 0),
  path text not null,
  is_latest boolean not null default false,
  uploaded_by uuid default auth.uid(),
  uploaded_at timestamptz not null default now()
);

-- At most one "latest" per (item_id, file_type)
create unique index if not exists files_one_latest_idx
  on public.files (item_id, file_type)
  where is_latest;

-- 3) RLS
alter table public.items enable row level security;
alter table public.files enable row level security;

-- Allow signed-in users full access (simple team scenario). Tighten later if needed.
create policy "items_auth_read" on public.items for select to authenticated using (true);
create policy "items_auth_write" on public.items for insert to authenticated with check (true);
create policy "items_auth_update" on public.items for update to authenticated using (true) with check (true);
create policy "items_auth_delete" on public.items for delete to authenticated using (true);

create policy "files_auth_read" on public.files for select to authenticated using (true);
create policy "files_auth_write" on public.files for insert to authenticated with check (true);
create policy "files_auth_update" on public.files for update to authenticated using (true) with check (true);
create policy "files_auth_delete" on public.files for delete to authenticated using (true);

-- 4) Storage RLS: allow authenticated users to manage objects under the bucket
create policy "storage_auth_read" on storage.objects
  for select to authenticated using (bucket_id = 'files');

create policy "storage_auth_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'files');

create policy "storage_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'files') with check (bucket_id = 'files');

create policy "storage_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'files');

-- Optional: Trigger to enforce single latest per (item_id, file_type)
create or replace function public.ensure_single_latest()
returns trigger as $$
begin
  if NEW.is_latest then
    update public.files
      set is_latest = false
      where item_id = NEW.item_id and file_type = NEW.file_type and id <> NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists files_single_latest_trg on public.files;
create trigger files_single_latest_trg
after insert or update on public.files
for each row execute function public.ensure_single_latest();
