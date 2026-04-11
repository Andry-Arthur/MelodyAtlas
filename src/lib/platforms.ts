export type PlatformType =
  | 'spotify'
  | 'youtube'
  | 'soundcloud'
  | 'apple_music'
  | 'bandcamp'
  | 'deezer'
  | 'tidal'

interface PlatformDef {
  type: PlatformType
  label: string
  color: string
  patterns: RegExp[]
}

const PLATFORMS: PlatformDef[] = [
  {
    type: 'spotify',
    label: 'Spotify',
    color: '#1DB954',
    patterns: [
      /open\.spotify\.com\/(?:[^\s]+\/)*?(track|album|playlist)\/([a-zA-Z0-9]+)/,
    ],
  },
  {
    type: 'tidal',
    label: 'Tidal',
    color: '#000000',
    patterns: [
      /(?:listen\.)?tidal\.com\/(?:[\w/-]*\/)?(track|album)\/(\d+)/i,
    ],
  },
  {
    type: 'deezer',
    label: 'Deezer',
    color: '#A238FF',
    patterns: [/deezer\.com\/(?:[\w-]+\/)*(track|album|playlist)\/(\d+)/i],
  },
  {
    type: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    patterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/,
      /music\.youtube\.com\/watch\?v=([\w-]+)/,
    ],
  },
  {
    type: 'soundcloud',
    label: 'SoundCloud',
    color: '#FF5500',
    patterns: [/soundcloud\.com\/[\w-]+\/[\w-]+/],
  },
  {
    type: 'apple_music',
    label: 'Apple Music',
    color: '#FA243C',
    patterns: [/music\.apple\.com\/[\w-]+\/(album|playlist|song)\//],
  },
  {
    type: 'bandcamp',
    label: 'Bandcamp',
    color: '#1DA0C3',
    patterns: [/[\w-]+\.bandcamp\.com\/(track|album)\//],
  },
]

/** Robust Spotify open.spotify.com path parse (supports /intl-xx/track/id, query strings). */
export function parseSpotifyFromUrl(url: string): {
  kind: 'track' | 'album' | 'playlist'
  id: string
} | null {
  try {
    const u = new URL(url.trim())
    if (u.hostname !== 'open.spotify.com') return null
    const m = u.pathname.match(/\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
    if (!m) return null
    return { kind: m[1] as 'track' | 'album' | 'playlist', id: m[2] }
  } catch {
    return null
  }
}

function parseTidalFromUrl(url: string): {
  kind: 'track' | 'album'
  id: string
} | null {
  try {
    const u = new URL(url.trim())
    if (!/(?:^|\.)tidal\.com$/i.test(u.hostname)) return null
    const m = u.pathname.match(/\/(track|album)\/(\d+)/)
    if (!m) return null
    return { kind: m[1] as 'track' | 'album', id: m[2] }
  } catch {
    return null
  }
}

function parseDeezerFromUrl(url: string): {
  kind: 'track' | 'album' | 'playlist'
  id: string
} | null {
  try {
    const u = new URL(url.trim())
    if (!u.hostname.includes('deezer.com')) return null
    const m = u.pathname.match(/\/(track|album|playlist)\/(\d+)/)
    if (!m) return null
    return { kind: m[1] as 'track' | 'album' | 'playlist', id: m[2] }
  } catch {
    return null
  }
}

export function detectPlatform(url: string): PlatformType | null {
  const trimmed = url.trim()
  if (parseSpotifyFromUrl(trimmed)) return 'spotify'
  if (parseTidalFromUrl(trimmed)) return 'tidal'
  if (parseDeezerFromUrl(trimmed)) return 'deezer'

  for (const platform of PLATFORMS) {
    if (
      platform.type === 'spotify' ||
      platform.type === 'tidal' ||
      platform.type === 'deezer'
    )
      continue
    for (const pattern of platform.patterns) {
      if (pattern.test(trimmed)) return platform.type
    }
  }
  return null
}

export function getPlatformLabel(type: PlatformType): string {
  return PLATFORMS.find((p) => p.type === type)?.label ?? type
}

export function getPlatformColor(type: PlatformType): string {
  return PLATFORMS.find((p) => p.type === type)?.color ?? '#888'
}

export function extractEmbedUrl(
  url: string,
  platform: PlatformType
): string | null {
  switch (platform) {
    case 'spotify': {
      const parsed = parseSpotifyFromUrl(url)
      if (!parsed) return null
      return `https://open.spotify.com/embed/${parsed.kind}/${parsed.id}?theme=0`
    }
    case 'tidal': {
      const parsed = parseTidalFromUrl(url)
      if (!parsed) return null
      const segment = parsed.kind === 'track' ? 'tracks' : 'albums'
      return `https://embed.tidal.com/${segment}/${parsed.id}`
    }
    case 'deezer':
      return null
    case 'youtube': {
      let videoId: string | null = null
      const watchMatch = url.match(
        /(?:youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=)([\w-]+)/
      )
      if (watchMatch) videoId = watchMatch[1]
      const shortMatch = url.match(/youtu\.be\/([\w-]+)/)
      if (shortMatch) videoId = shortMatch[1]
      const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/)
      if (embedMatch) videoId = embedMatch[1]
      if (!videoId) return null
      return `https://www.youtube.com/embed/${videoId}`
    }
    case 'apple_music': {
      const match = url.match(
        /music\.apple\.com\/([\w-]+)\/(album|playlist|song)\/([^?]+)/
      )
      if (!match) return null
      return `https://embed.music.apple.com/${match[1]}/${match[2]}/${match[3]}`
    }
    case 'soundcloud':
      return null
    case 'bandcamp':
      return null
    default:
      return null
  }
}

export function getEmbedHeight(platform: PlatformType): number {
  switch (platform) {
    case 'spotify':
      return 80
    case 'youtube':
      return 200
    case 'soundcloud':
      return 166
    case 'apple_music':
      return 150
    case 'bandcamp':
      return 120
    case 'deezer':
      return 180
    case 'tidal':
      return 150
    default:
      return 80
  }
}

interface OEmbedResult {
  title: string
  artist: string
  thumbnail: string
  embedHtml: string
  embedUrl: string | null
}

export async function fetchOEmbedMetadata(
  url: string,
  platform: PlatformType
): Promise<OEmbedResult | null> {
  let oembedUrl: string | null = null

  if (platform === 'soundcloud') {
    oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
  } else if (platform === 'bandcamp') {
    oembedUrl = `https://bandcamp.com/api/oembed?url=${encodeURIComponent(url)}&format=json`
  } else if (platform === 'deezer') {
    oembedUrl = `https://www.deezer.com/plugins/oembed?url=${encodeURIComponent(url)}&format=json`
  }

  if (!oembedUrl) return null

  try {
    const response = await fetch(oembedUrl)
    if (!response.ok) return null
    const data = await response.json()

    let embedUrl: string | null = null
    const htmlStr: string = data.html ?? ''
    const srcMatch = htmlStr.match(/src="([^"]+)"/)
    if (srcMatch) embedUrl = srcMatch[1]

    return {
      title: data.title ?? 'Unknown',
      artist: data.author_name ?? 'Unknown Artist',
      thumbnail: data.thumbnail_url ?? '',
      embedHtml: htmlStr,
      embedUrl,
    }
  } catch {
    return null
  }
}

async function fetchSpotifyOEmbed(
  trackUrl: string
): Promise<OEmbedResult | null> {
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`
  try {
    const response = await fetch(oembedUrl)
    if (!response.ok) return null
    const data = await response.json()

    let embedUrl: string | null = null
    const htmlStr: string = data.html ?? ''
    const srcMatch = htmlStr.match(/src="([^"]+)"/)
    if (srcMatch) embedUrl = srcMatch[1]

    const fallback = extractEmbedUrl(trackUrl, 'spotify')
    const title = (data.title as string) ?? 'Spotify'
    const thumbnail = (data.thumbnail_url as string) ?? ''

    return {
      title,
      artist: '',
      thumbnail,
      embedHtml: htmlStr,
      embedUrl: embedUrl ?? fallback,
    }
  } catch {
    return null
  }
}

export async function resolveMusic(url: string): Promise<{
  platform: PlatformType
  embedUrl: string
  title: string
  artist: string
  thumbnail: string
} | null> {
  const trimmed = url.trim()
  const platform = detectPlatform(trimmed)
  if (!platform) return null

  if (platform === 'soundcloud' || platform === 'bandcamp') {
    const meta = await fetchOEmbedMetadata(trimmed, platform)
    if (!meta || !meta.embedUrl) return null
    return {
      platform,
      embedUrl: meta.embedUrl,
      title: meta.title,
      artist: meta.artist,
      thumbnail: meta.thumbnail,
    }
  }

  if (platform === 'deezer') {
    const meta = await fetchOEmbedMetadata(trimmed, 'deezer')
    if (!meta || !meta.embedUrl) return null
    return {
      platform: 'deezer',
      embedUrl: meta.embedUrl,
      title: meta.title,
      artist: meta.artist,
      thumbnail: meta.thumbnail,
    }
  }

  if (platform === 'spotify') {
    const meta = await fetchSpotifyOEmbed(trimmed)
    if (meta?.embedUrl) {
      return {
        platform: 'spotify',
        embedUrl: meta.embedUrl,
        title: meta.title,
        artist: meta.artist,
        thumbnail: meta.thumbnail,
      }
    }
    const embedUrl = extractEmbedUrl(trimmed, 'spotify')
    if (!embedUrl) return null
    return {
      platform: 'spotify',
      embedUrl,
      title: 'Spotify Track',
      artist: '',
      thumbnail: '',
    }
  }

  if (platform === 'tidal') {
    const embedUrl = extractEmbedUrl(trimmed, 'tidal')
    if (!embedUrl) return null
    return {
      platform: 'tidal',
      embedUrl,
      title: 'Tidal',
      artist: '',
      thumbnail: '',
    }
  }

  const embedUrl = extractEmbedUrl(trimmed, platform)
  if (!embedUrl) return null

  let title = 'Music'
  const artist = ''
  const thumbnail = ''

  if (platform === 'youtube') {
    title = 'YouTube Video'
  } else if (platform === 'apple_music') {
    title = 'Apple Music'
  }

  return { platform, embedUrl, title, artist, thumbnail }
}
