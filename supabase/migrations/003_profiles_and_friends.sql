-- Add profile_id and bio to profiles
alter table public.profiles
  add column if not exists profile_id text unique,
  add column if not exists bio text;

-- Backfill profile_id from username for existing rows
update public.profiles
  set profile_id = lower(replace(coalesce(username, id::text), ' ', ''))
  where profile_id is null;

alter table public.profiles
  alter column profile_id set not null;

-- Update the trigger to set profile_id on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_id text;
  final_id text;
begin
  base_id := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    '[^a-z0-9]', '', 'g'
  ));
  final_id := base_id || floor(random() * 9000 + 1000)::text;

  insert into public.profiles (id, username, avatar_url, profile_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    final_id
  );
  return new;
end;
$$ language plpgsql security definer;

-- Friendships table
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Authenticated users can send requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

create policy "Addressee can accept or decline"
  on public.friendships for update
  using (auth.uid() = addressee_id);

create policy "Either party can remove friendship"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Indexes
create index if not exists idx_friendships_requester on public.friendships(requester_id);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id);
create index if not exists idx_profiles_profile_id on public.profiles(profile_id);

-- Avatar storage bucket
insert into storage.buckets (id, name, public)
values ('avatar-images', 'avatar-images', true)
on conflict (id) do nothing;

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatar-images');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatar-images' and auth.role() = 'authenticated');

create policy "Users can update own avatars"
  on storage.objects for update
  using (bucket_id = 'avatar-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatars"
  on storage.objects for delete
  using (bucket_id = 'avatar-images' and auth.uid()::text = (storage.foldername(name))[1]);
