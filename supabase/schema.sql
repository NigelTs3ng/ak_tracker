-- Core tables
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('animal', 'strong', 'miracle')),
  rarity text not null check (rarity in ('gold', 'silver', 'bronze', 'normal')),
  version text not null check (version in ('v1', 'v2', 'v3')),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'free' check (role in ('free', 'premium')),
  active_device_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_cards (
  user_id uuid not null references auth.users on delete cascade,
  card_id uuid not null references public.cards on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.sequence_uploads (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  version text not null check (version in ('v1', 'v2', 'v3')),
  uploaded_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.card_sequences (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.sequence_uploads on delete cascade,
  position_index integer not null,
  card_id uuid not null references public.cards on delete cascade,
  deck_label text not null check (deck_label in ('A', 'B', 'C', 'D')),
  version text not null check (version in ('v1', 'v2', 'v3')),
  created_at timestamptz not null default now(),
  unique (upload_id, deck_label, position_index)
);

create index if not exists card_sequences_upload_position_idx
  on public.card_sequences (upload_id, deck_label, position_index);

-- If migrating an existing database, drop the old unique constraint first:
-- alter table public.card_sequences
--   drop constraint if exists card_sequences_upload_id_position_index_key;
-- alter table public.card_sequences
--   add constraint card_sequences_upload_deck_position_key
--   unique (upload_id, deck_label, position_index);

-- Aggregate counts
create or replace view public.card_global_counts as
  select card_id, sum(quantity)::int as total_owned
  from public.user_cards
  group by card_id;

grant select on public.card_global_counts to anon, authenticated;

-- Profile bootstrap
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'free')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Premium helper
create or replace function public.is_premium()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'premium'
  );
$$;

-- RLS
alter table public.cards enable row level security;
create policy "cards_select_all"
  on public.cards for select
  using (true);

alter table public.profiles enable row level security;
create policy "profiles_read_own"
  on public.profiles for select
  using (auth.uid() = id);
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.user_cards enable row level security;
create policy "user_cards_read_own"
  on public.user_cards for select
  using (auth.uid() = user_id);
create policy "user_cards_write_own"
  on public.user_cards for insert
  with check (auth.uid() = user_id);
create policy "user_cards_update_own"
  on public.user_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "user_cards_delete_own"
  on public.user_cards for delete
  using (auth.uid() = user_id);

alter table public.sequence_uploads enable row level security;
create policy "sequence_uploads_premium_read"
  on public.sequence_uploads for select
  using (public.is_premium());

alter table public.card_sequences enable row level security;
create policy "card_sequences_premium_read"
  on public.card_sequences for select
  using (public.is_premium());
