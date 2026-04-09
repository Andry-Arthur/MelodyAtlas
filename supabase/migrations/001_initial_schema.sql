-- Profiles table (auto-created on signup via trigger)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Pins table
create table if not exists public.pins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  latitude float8 not null,
  longitude float8 not null,
  title text not null,
  description text default '',
  pin_date date not null default current_date,
  created_at timestamptz default now()
);

alter table public.pins enable row level security;

create policy "Pins are viewable by everyone"
  on public.pins for select
  using (true);

create policy "Users can create own pins"
  on public.pins for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pins"
  on public.pins for update
  using (auth.uid() = user_id);

create policy "Users can delete own pins"
  on public.pins for delete
  using (auth.uid() = user_id);

-- Pin images table
create table if not exists public.pin_images (
  id uuid default gen_random_uuid() primary key,
  pin_id uuid references public.pins(id) on delete cascade not null,
  storage_path text not null,
  url text not null,
  order_index int default 0
);

alter table public.pin_images enable row level security;

create policy "Pin images are viewable by everyone"
  on public.pin_images for select
  using (true);

create policy "Users can insert images for own pins"
  on public.pin_images for insert
  with check (
    exists (
      select 1 from public.pins where id = pin_id and user_id = auth.uid()
    )
  );

create policy "Users can delete images for own pins"
  on public.pin_images for delete
  using (
    exists (
      select 1 from public.pins where id = pin_id and user_id = auth.uid()
    )
  );

-- Pin songs table
create table if not exists public.pin_songs (
  id uuid default gen_random_uuid() primary key,
  pin_id uuid references public.pins(id) on delete cascade not null,
  spotify_track_id text not null,
  track_name text not null,
  artist_name text not null,
  album_name text not null,
  album_art_url text default '',
  spotify_uri text not null
);

alter table public.pin_songs enable row level security;

create policy "Pin songs are viewable by everyone"
  on public.pin_songs for select
  using (true);

create policy "Users can insert songs for own pins"
  on public.pin_songs for insert
  with check (
    exists (
      select 1 from public.pins where id = pin_id and user_id = auth.uid()
    )
  );

create policy "Users can delete songs for own pins"
  on public.pin_songs for delete
  using (
    exists (
      select 1 from public.pins where id = pin_id and user_id = auth.uid()
    )
  );

-- Storage bucket for pin images
insert into storage.buckets (id, name, public)
values ('pin-images', 'pin-images', true)
on conflict (id) do nothing;

create policy "Anyone can view pin images"
  on storage.objects for select
  using (bucket_id = 'pin-images');

create policy "Authenticated users can upload pin images"
  on storage.objects for insert
  with check (bucket_id = 'pin-images' and auth.role() = 'authenticated');

create policy "Users can delete own pin images"
  on storage.objects for delete
  using (bucket_id = 'pin-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes
create index if not exists idx_pins_user_id on public.pins(user_id);
create index if not exists idx_pins_pin_date on public.pins(pin_date);
create index if not exists idx_pin_images_pin_id on public.pin_images(pin_id);
create index if not exists idx_pin_songs_pin_id on public.pin_songs(pin_id);
