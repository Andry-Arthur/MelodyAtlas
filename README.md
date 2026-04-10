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

- **Interactive Map** -- Full-screen dark Mapbox map with smooth pan/zoom and pin clustering
- **Your Atlas** -- Each account has its own map of memories; see pins you created and pins friends tagged you on
- **Pin Memories** -- Click to place photos and music (Spotify plus other platforms via embeds) at a location and date
- **Image Uploads** -- Photos stored in Supabase Storage
- **Friends & Profiles** -- Friend requests, public profile pages at `/u/:profileId`, and optional tagging on memories
- **Search** -- Memories, people (by profile ID), and Mapbox places from the header
- **Timeline** -- Filter pins by date range from birthday (or earliest pin) through today
- **Accounts** -- Sign up / sign in with email or OAuth (configure providers in Supabase)

See the **[Roadmap](ROADMAP.md)** for planned work and how to contribute to direction.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Framer Motion
- Mapbox GL JS via react-map-gl
- Supabase (Auth, PostgreSQL, Storage)
- Spotify Web API (PKCE flow)
- Zustand + React Router
