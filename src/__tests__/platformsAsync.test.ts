import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchOEmbedMetadata, resolveMusic } from '@/lib/platforms'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

beforeEach(() => {
  fetchMock.mockReset()
})

describe('fetchOEmbedMetadata', () => {
  it('returns metadata for SoundCloud URLs', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: 'Cool Track',
          author_name: 'Cool Artist',
          thumbnail_url: 'https://img.sc/thumb.jpg',
          html: '<iframe src="https://w.soundcloud.com/player/?url=abc"></iframe>',
        }),
    })

    const result = await fetchOEmbedMetadata(
      'https://soundcloud.com/artist/track',
      'soundcloud'
    )

    expect(result).toEqual({
      title: 'Cool Track',
      artist: 'Cool Artist',
      thumbnail: 'https://img.sc/thumb.jpg',
      embedHtml: '<iframe src="https://w.soundcloud.com/player/?url=abc"></iframe>',
      embedUrl: 'https://w.soundcloud.com/player/?url=abc',
    })
  })

  it('returns metadata for Bandcamp URLs', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: 'Bandcamp Track',
          author_name: 'BC Artist',
          thumbnail_url: 'https://f4.bc/img.jpg',
          html: '<iframe src="https://bandcamp.com/embed/123"></iframe>',
        }),
    })

    const result = await fetchOEmbedMetadata(
      'https://artist.bandcamp.com/track/song',
      'bandcamp'
    )

    expect(result?.title).toBe('Bandcamp Track')
    expect(result?.embedUrl).toBe('https://bandcamp.com/embed/123')
  })

  it('returns null for non-oEmbed platforms', async () => {
    const result = await fetchOEmbedMetadata(
      'https://open.spotify.com/track/abc',
      'spotify'
    )
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null on fetch error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchOEmbedMetadata(
      'https://soundcloud.com/artist/track',
      'soundcloud'
    )
    expect(result).toBeNull()
  })

  it('returns null on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false })

    const result = await fetchOEmbedMetadata(
      'https://soundcloud.com/artist/track',
      'soundcloud'
    )
    expect(result).toBeNull()
  })

  it('handles missing fields gracefully', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const result = await fetchOEmbedMetadata(
      'https://soundcloud.com/artist/track',
      'soundcloud'
    )

    expect(result).toEqual({
      title: 'Unknown',
      artist: 'Unknown Artist',
      thumbnail: '',
      embedHtml: '',
      embedUrl: null,
    })
  })
})

describe('resolveMusic', () => {
  it('resolves Spotify URLs with embed info', async () => {
    const result = await resolveMusic(
      'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6'
    )

    expect(result).toEqual({
      platform: 'spotify',
      embedUrl: 'https://open.spotify.com/embed/track/6rqhFgbbKwnb9MLmUQDhG6?theme=0',
      title: 'Spotify Track',
      artist: '',
      thumbnail: '',
    })
  })

  it('resolves YouTube URLs with embed info', async () => {
    const result = await resolveMusic(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    )

    expect(result).toEqual({
      platform: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'YouTube Video',
      artist: '',
      thumbnail: '',
    })
  })

  it('resolves Apple Music URLs', async () => {
    const result = await resolveMusic(
      'https://music.apple.com/us/album/some-album/1234567890'
    )

    expect(result).toEqual({
      platform: 'apple_music',
      embedUrl: 'https://embed.music.apple.com/us/album/some-album/1234567890',
      title: 'Apple Music',
      artist: '',
      thumbnail: '',
    })
  })

  it('resolves SoundCloud via oEmbed', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: 'SC Track',
          author_name: 'SC Artist',
          thumbnail_url: 'https://img.sc/th.jpg',
          html: '<iframe src="https://w.soundcloud.com/player/?url=xyz"></iframe>',
        }),
    })

    const result = await resolveMusic(
      'https://soundcloud.com/artist-name/track-name'
    )

    expect(result?.platform).toBe('soundcloud')
    expect(result?.embedUrl).toBe('https://w.soundcloud.com/player/?url=xyz')
    expect(result?.title).toBe('SC Track')
  })

  it('returns null for SoundCloud when oEmbed fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false })

    const result = await resolveMusic(
      'https://soundcloud.com/artist-name/track-name'
    )
    expect(result).toBeNull()
  })

  it('returns null for unknown URLs', async () => {
    const result = await resolveMusic('https://example.com/not-music')
    expect(result).toBeNull()
  })
})
