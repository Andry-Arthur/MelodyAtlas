import type { PlatformType } from '@/lib/platforms'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
}

export interface Pin {
  id: string
  user_id: string
  latitude: number
  longitude: number
  title: string
  description: string | null
  pin_date: string
  created_at: string
  images?: PinImage[]
  songs?: PinSong[]
  profile?: Profile
}

export interface PinImage {
  id: string
  pin_id: string
  storage_path: string
  url: string
  order_index: number
}

export interface PinSong {
  id: string
  pin_id: string
  spotify_track_id: string | null
  track_name: string
  artist_name: string
  album_name: string
  album_art_url: string
  spotify_uri: string | null
  platform: PlatformType
  platform_url: string | null
  embed_url: string | null
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string; width: number; height: number }[]
  }
  uri: string
  external_urls: { spotify: string }
}

export interface MusicLink {
  platform: PlatformType
  platformUrl: string
  embedUrl: string
  title: string
  artist: string
  thumbnail: string
}

export interface NewPin {
  latitude: number
  longitude: number
  title: string
  description: string
  pin_date: string
  images: File[]
  songs: SpotifyTrack[]
}
