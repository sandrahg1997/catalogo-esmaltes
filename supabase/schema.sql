-- Catálogo de esmaltes: tabla, fotos y reglas de acceso (solo el dueño de cada fila).
-- Pégalo entero en Supabase → SQL Editor → New query → Run.

create table if not exists public.polishes (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brand       text not null default '',
  name        text not null,
  number      text not null default '',
  finish      text not null default 'Crema',
  coats       int  not null default 2,
  notes       text not null default '',
  hex         text not null,
  lab         jsonb not null,
  family      text not null default '',
  calibrated  boolean not null default false,
  demo        boolean not null default false,
  swatch_path text,
  nail_path   text,
  created_at  timestamptz not null default now()
);

alter table public.polishes enable row level security;

drop policy if exists "polishes_owner_all" on public.polishes;
create policy "polishes_owner_all" on public.polishes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Almacén privado de fotos: cada usuario solo ve su carpeta (<user_id>/...)
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

drop policy if exists "fotos_owner_select" on storage.objects;
drop policy if exists "fotos_owner_insert" on storage.objects;
drop policy if exists "fotos_owner_update" on storage.objects;
drop policy if exists "fotos_owner_delete" on storage.objects;

create policy "fotos_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
