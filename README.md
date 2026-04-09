# MelodyAtlas

An interactive world map where you can pin photos and Spotify songs across time. Built with React, Mapbox, Supabase, and the Spotify Web API.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Source |
|---|---|
| `VITE_MAPBOX_TOKEN` | [Mapbox account](https://account.mapbox.com/access-tokens/) (free tier) |
| `VITE_SUPABASE_URL` | Your [Supabase project](https://supabase.com/dashboard) URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase project anon/public key |
| `VITE_SPOTIFY_CLIENT_ID` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) app Client ID |

### 3. Set up Supabase

Run the migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project:

- **Option A**: Paste the SQL into the Supabase Dashboard SQL Editor and run it.
- **Option B**: Use the Supabase CLI:
  ```bash
  supabase db push
  ```

Also enable **Google** as an auth provider in your Supabase Dashboard under Authentication > Providers (optional, email/password works out of the box).

### 4. Configure Spotify

In your Spotify Developer Dashboard app settings, add a redirect URI:

```
http://127.0.0.1:5173/spotify-callback
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

## Features

- **Interactive Map** -- Full-screen dark Mapbox map with smooth pan/zoom
- **Pin Memories** -- Click anywhere to pin photos and Spotify songs to a location
- **Image Uploads** -- Drag-and-drop photo uploads stored in Supabase Storage
- **Spotify Search** -- Search and attach songs via the Spotify Web API (PKCE auth)
- **Timeline** -- Filter pins by date range with an animated timeline slider
- **Clustering** -- Pins cluster together when zoomed out
- **Multi-user** -- Sign up / sign in with email or Google OAuth; all pins are public on the map

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Framer Motion
- Mapbox GL JS via react-map-gl
- Supabase (Auth, PostgreSQL, Storage)
- Spotify Web API (PKCE flow)
- Zustand + React Router
