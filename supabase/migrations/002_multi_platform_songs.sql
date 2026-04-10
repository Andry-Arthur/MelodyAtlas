-- Add multi-platform support to pin_songs
alter table public.pin_songs
  add column if not exists platform text not null default 'spotify',
  add column if not exists platform_url text,
  add column if not exists embed_url text;

-- Make spotify-specific columns nullable for non-spotify platforms
alter table public.pin_songs
  alter column spotify_track_id drop not null,
  alter column spotify_uri drop not null;

-- Index for filtering by platform
create index if not exists idx_pin_songs_platform on public.pin_songs(platform);
