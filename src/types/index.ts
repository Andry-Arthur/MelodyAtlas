import type { PlatformType } from '@/lib/platforms'

export interface Profile {
  id: string
  profile_id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  date_of_birth: string | null
  created_at: string
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  requester?: Profile
  addressee?: Profile
}

export interface PinTag {
  id: string
  pin_id: string
  tagged_user_id: string
  created_at: string
  profile?: Profile
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
  tags?: PinTag[]
  profile?: Profile
  isTagged?: boolean
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
