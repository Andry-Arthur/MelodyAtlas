export type PlatformType =
  | 'spotify'
  | 'youtube'
  | 'soundcloud'
  | 'apple_music'
  | 'bandcamp'

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
    patterns: [/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/],
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

export function detectPlatform(url: string): PlatformType | null {
  for (const platform of PLATFORMS) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) return platform.type
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
      const match = url.match(
        /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/
      )
      if (!match) return null
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0`
    }
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
      return null // resolved via oEmbed
    case 'bandcamp':
      return null // resolved via oEmbed
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

export async function resolveMusic(url: string): Promise<{
  platform: PlatformType
  embedUrl: string
  title: string
  artist: string
  thumbnail: string
} | null> {
  const platform = detectPlatform(url)
  if (!platform) return null

  if (platform === 'soundcloud' || platform === 'bandcamp') {
    const meta = await fetchOEmbedMetadata(url, platform)
    if (!meta || !meta.embedUrl) return null
    return {
      platform,
      embedUrl: meta.embedUrl,
      title: meta.title,
      artist: meta.artist,
      thumbnail: meta.thumbnail,
    }
  }

  const embedUrl = extractEmbedUrl(url, platform)
  if (!embedUrl) return null

  let title = 'Music'
  let artist = ''
  const thumbnail = ''

  if (platform === 'youtube') {
    title = 'YouTube Video'
  } else if (platform === 'apple_music') {
    title = 'Apple Music'
  } else if (platform === 'spotify') {
    title = 'Spotify Track'
  }

  return { platform, embedUrl, title, artist, thumbnail }
}
