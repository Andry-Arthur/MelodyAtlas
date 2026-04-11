import { describe, it, expect } from 'vitest'
import {
  detectPlatform,
  getPlatformLabel,
  getPlatformColor,
  extractEmbedUrl,
  getEmbedHeight,
  parseSpotifyFromUrl,
} from '../lib/platforms'

describe('detectPlatform', () => {
  it('detects Spotify track URLs', () => {
    expect(
      detectPlatform('https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6')
    ).toBe('spotify')
  })

  it('detects Spotify URLs with intl locale segment', () => {
    expect(
      detectPlatform(
        'https://open.spotify.com/intl-en/track/6rqhFgbbKwnb9MLmUQDhG6'
      )
    ).toBe('spotify')
  })

  it('detects Spotify URLs with query string', () => {
    expect(
      detectPlatform(
        'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6?si=abc123'
      )
    ).toBe('spotify')
  })

  it('detects Spotify album URLs', () => {
    expect(
      detectPlatform('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')
    ).toBe('spotify')
  })

  it('detects Spotify playlist URLs', () => {
    expect(
      detectPlatform(
        'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
      )
    ).toBe('spotify')
  })

  it('detects Deezer track URLs', () => {
    expect(detectPlatform('https://www.deezer.com/track/3135556')).toBe(
      'deezer'
    )
  })

  it('detects Deezer track URLs with locale path', () => {
    expect(detectPlatform('https://www.deezer.com/en/track/3135556')).toBe(
      'deezer'
    )
  })

  it('detects Tidal listen URLs', () => {
    expect(
      detectPlatform('https://listen.tidal.com/track/251380832')
    ).toBe('tidal')
  })

  it('detects YouTube watch URLs', () => {
    expect(
      detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe('youtube')
  })

  it('detects YouTube short URLs', () => {
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
  })

  it('detects YouTube embed URLs', () => {
    expect(
      detectPlatform('https://www.youtube.com/embed/dQw4w9WgXcQ')
    ).toBe('youtube')
  })

  it('detects YouTube Music URLs', () => {
    expect(
      detectPlatform('https://music.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe('youtube')
  })

  it('detects SoundCloud URLs', () => {
    expect(
      detectPlatform('https://soundcloud.com/artist-name/track-name')
    ).toBe('soundcloud')
  })

  it('detects Apple Music URLs', () => {
    expect(
      detectPlatform(
        'https://music.apple.com/us/album/some-album/1234567890'
      )
    ).toBe('apple_music')
  })

  it('detects Bandcamp URLs', () => {
    expect(
      detectPlatform('https://artist-name.bandcamp.com/track/song-name')
    ).toBe('bandcamp')
  })

  it('returns null for unknown URLs', () => {
    expect(detectPlatform('https://example.com/some-music')).toBeNull()
  })

  it('returns null for empty strings', () => {
    expect(detectPlatform('')).toBeNull()
  })
})

describe('parseSpotifyFromUrl', () => {
  it('parses intl and plain Spotify URLs', () => {
    expect(
      parseSpotifyFromUrl(
        'https://open.spotify.com/intl-de/track/6rqhFgbbKwnb9MLmUQDhG6'
      )
    ).toEqual({ kind: 'track', id: '6rqhFgbbKwnb9MLmUQDhG6' })
    expect(
      parseSpotifyFromUrl('https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6')
    ).toEqual({ kind: 'track', id: '6rqhFgbbKwnb9MLmUQDhG6' })
  })
})

describe('getPlatformLabel', () => {
  it('returns correct labels for all platforms', () => {
    expect(getPlatformLabel('spotify')).toBe('Spotify')
    expect(getPlatformLabel('youtube')).toBe('YouTube')
    expect(getPlatformLabel('soundcloud')).toBe('SoundCloud')
    expect(getPlatformLabel('apple_music')).toBe('Apple Music')
    expect(getPlatformLabel('bandcamp')).toBe('Bandcamp')
    expect(getPlatformLabel('deezer')).toBe('Deezer')
    expect(getPlatformLabel('tidal')).toBe('Tidal')
  })
})

describe('getPlatformColor', () => {
  it('returns correct colors for each platform', () => {
    expect(getPlatformColor('spotify')).toBe('#1DB954')
    expect(getPlatformColor('youtube')).toBe('#FF0000')
    expect(getPlatformColor('soundcloud')).toBe('#FF5500')
    expect(getPlatformColor('apple_music')).toBe('#FA243C')
    expect(getPlatformColor('bandcamp')).toBe('#1DA0C3')
    expect(getPlatformColor('deezer')).toBe('#A238FF')
    expect(getPlatformColor('tidal')).toBe('#000000')
  })
})

describe('extractEmbedUrl', () => {
  it('extracts Spotify embed URL from track link', () => {
    const url = 'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6'
    expect(extractEmbedUrl(url, 'spotify')).toBe(
      'https://open.spotify.com/embed/track/6rqhFgbbKwnb9MLmUQDhG6?theme=0'
    )
  })

  it('extracts Spotify embed from intl URL', () => {
    const url =
      'https://open.spotify.com/intl-en/track/6rqhFgbbKwnb9MLmUQDhG6'
    expect(extractEmbedUrl(url, 'spotify')).toBe(
      'https://open.spotify.com/embed/track/6rqhFgbbKwnb9MLmUQDhG6?theme=0'
    )
  })

  it('extracts Spotify embed URL from album link', () => {
    const url = 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy'
    expect(extractEmbedUrl(url, 'spotify')).toBe(
      'https://open.spotify.com/embed/album/4aawyAB9vmqN3uQ7FjRGTy?theme=0'
    )
  })

  it('extracts Tidal embed URL from listen URL', () => {
    const url = 'https://listen.tidal.com/track/251380832'
    expect(extractEmbedUrl(url, 'tidal')).toBe(
      'https://embed.tidal.com/tracks/251380832'
    )
  })

  it('extracts YouTube embed URL from watch link', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    expect(extractEmbedUrl(url, 'youtube')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('extracts YouTube embed URL from short link', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ'
    expect(extractEmbedUrl(url, 'youtube')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('extracts Apple Music embed URL', () => {
    const url =
      'https://music.apple.com/us/album/some-album/1234567890'
    expect(extractEmbedUrl(url, 'apple_music')).toBe(
      'https://embed.music.apple.com/us/album/some-album/1234567890'
    )
  })

  it('returns null for Deezer (oEmbed only)', () => {
    expect(
      extractEmbedUrl('https://www.deezer.com/track/3135556', 'deezer')
    ).toBeNull()
  })

  it('returns null for SoundCloud (oEmbed only)', () => {
    expect(
      extractEmbedUrl(
        'https://soundcloud.com/artist/track',
        'soundcloud'
      )
    ).toBeNull()
  })

  it('returns null for Bandcamp (oEmbed only)', () => {
    expect(
      extractEmbedUrl(
        'https://artist.bandcamp.com/track/song',
        'bandcamp'
      )
    ).toBeNull()
  })

  it('returns null for invalid Spotify URL', () => {
    expect(extractEmbedUrl('https://example.com', 'spotify')).toBeNull()
  })
})

describe('getEmbedHeight', () => {
  it('returns correct heights for each platform', () => {
    expect(getEmbedHeight('spotify')).toBe(80)
    expect(getEmbedHeight('youtube')).toBe(200)
    expect(getEmbedHeight('soundcloud')).toBe(166)
    expect(getEmbedHeight('apple_music')).toBe(150)
    expect(getEmbedHeight('bandcamp')).toBe(120)
    expect(getEmbedHeight('deezer')).toBe(180)
    expect(getEmbedHeight('tidal')).toBe(150)
  })
})
