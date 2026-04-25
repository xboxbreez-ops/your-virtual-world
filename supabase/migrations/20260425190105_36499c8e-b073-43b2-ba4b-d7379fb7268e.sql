
-- Profiles: username is the public account identifier
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bux integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Avatars: per-user 3D avatar customization
create table public.avatars (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rig text not null default 'R15' check (rig in ('R6','R15')),
  skin_color text not null default '#f5c896',
  shirt_color text not null default '#2563eb',
  pants_color text not null default '#1f2937',
  face text not null default 'smile',
  hat text not null default 'none',
  updated_at timestamptz not null default now()
);

alter table public.avatars enable row level security;

create policy "Avatars are viewable by everyone"
  on public.avatars for select
  using (true);

create policy "Users manage own avatar"
  on public.avatars for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Presence: who is online and where
create table public.presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  location text not null default 'lobby',
  last_seen timestamptz not null default now()
);

alter table public.presence enable row level security;

create policy "Presence is viewable by everyone"
  on public.presence for select
  using (true);

create policy "Users manage own presence"
  on public.presence for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Game scores for bux rewards leaderboard
create table public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  game text not null,
  score integer not null,
  bux_earned integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.game_scores enable row level security;

create policy "Scores viewable by everyone"
  on public.game_scores for select
  using (true);

create policy "Users insert own scores"
  on public.game_scores for insert
  with check (auth.uid() = user_id);

-- Trigger to auto-create profile + avatar on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'Player' || substr(new.id::text, 1, 6)));
  insert into public.avatars (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger avatars_updated_at before update on public.avatars
  for each row execute function public.set_updated_at();
