-- Synchronizácia dát Kalorickej polície: profil + jedlá, každý vidí len svoje.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb,
  onboarded_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.meals (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  photo text,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index meals_user_updated on public.meals (user_id, updated_at);

-- updated_at vždy nastaví server, aby sa dalo bezpečne sťahovať „čo je nové od…“.
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before insert or update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger meals_touch before insert or update on public.meals
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.meals enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own meals" on public.meals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
