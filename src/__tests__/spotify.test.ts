import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

vi.stubGlobal('crypto', {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = i % 256
    return arr
  },
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
})

const {
  exchangeCodeForToken,
  refreshAccessToken,
  getValidToken,
  isSpotifyConnected,
  disconnectSpotify,
  searchTracks,
} = await import('@/lib/spotify')

beforeEach(() => {
  localStorage.clear()
  fetchMock.mockReset()
})

afterEach(() => {
  localStorage.clear()
})

describe('isSpotifyConnected', () => {
  it('returns false when no token exists', () => {
    expect(isSpotifyConnected()).toBe(false)
  })

  it('returns true when token exists', () => {
    localStorage.setItem('spotify_access_token', 'tok')
    expect(isSpotifyConnected()).toBe(true)
  })
})

describe('disconnectSpotify', () => {
  it('removes all spotify keys from localStorage', () => {
    localStorage.setItem('spotify_access_token', 'tok')
    localStorage.setItem('spotify_refresh_token', 'ref')
    localStorage.setItem('spotify_token_expiry', '123')
    localStorage.setItem('spotify_code_verifier', 'ver')

    disconnectSpotify()

    expect(localStorage.getItem('spotify_access_token')).toBeNull()
    expect(localStorage.getItem('spotify_refresh_token')).toBeNull()
    expect(localStorage.getItem('spotify_token_expiry')).toBeNull()
    expect(localStorage.getItem('spotify_code_verifier')).toBeNull()
  })
})

describe('exchangeCodeForToken', () => {
  it('returns null when no code_verifier in localStorage', async () => {
    const result = await exchangeCodeForToken('some-code')
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('exchanges code for access token and stores it', async () => {
    localStorage.setItem('spotify_code_verifier', 'verifier123')

    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          access_token: 'new-access-tok',
          refresh_token: 'new-refresh-tok',
          expires_in: 3600,
        }),
    })

    const token = await exchangeCodeForToken('auth-code')

    expect(token).toBe('new-access-tok')
    expect(localStorage.getItem('spotify_access_token')).toBe('new-access-tok')
    expect(localStorage.getItem('spotify_refresh_token')).toBe('new-refresh-tok')
  })

  it('returns null on failed exchange', async () => {
    localStorage.setItem('spotify_code_verifier', 'verifier123')

    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    })

    const token = await exchangeCodeForToken('bad-code')
    expect(token).toBeNull()
  })
})

describe('refreshAccessToken', () => {
  it('returns null when no refresh token in localStorage', async () => {
    const result = await refreshAccessToken()
    expect(result).toBeNull()
  })

  it('refreshes and stores new tokens', async () => {
    localStorage.setItem('spotify_refresh_token', 'old-refresh')

    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          access_token: 'refreshed-tok',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        }),
    })

    const token = await refreshAccessToken()
    expect(token).toBe('refreshed-tok')
    expect(localStorage.getItem('spotify_access_token')).toBe('refreshed-tok')
    expect(localStorage.getItem('spotify_refresh_token')).toBe('new-refresh')
  })
})

describe('getValidToken', () => {
  it('returns existing token if not expired', async () => {
    localStorage.setItem('spotify_access_token', 'valid-tok')
    localStorage.setItem('spotify_token_expiry', String(Date.now() + 600_000))

    const token = await getValidToken()
    expect(token).toBe('valid-tok')
  })

  it('attempts refresh when token is expired', async () => {
    localStorage.setItem('spotify_access_token', 'old-tok')
    localStorage.setItem('spotify_token_expiry', String(Date.now() - 1000))
    localStorage.setItem('spotify_refresh_token', 'ref')

    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          access_token: 'new-tok',
          expires_in: 3600,
        }),
    })

    const token = await getValidToken()
    expect(token).toBe('new-tok')
  })

  it('returns null when no token and no refresh token', async () => {
    const token = await getValidToken()
    expect(token).toBeNull()
  })
})

describe('searchTracks', () => {
  it('returns tracks from Spotify API', async () => {
    localStorage.setItem('spotify_access_token', 'tok')
    localStorage.setItem('spotify_token_expiry', String(Date.now() + 600_000))

    const fakeItems = [{ id: 'track1', name: 'Test Song' }]
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ tracks: { items: fakeItems } }),
    })

    const results = await searchTracks('test')
    expect(results).toEqual(fakeItems)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('api.spotify.com/v1/search'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer tok' },
      })
    )
  })

  it('returns empty array when no token', async () => {
    const results = await searchTracks('test')
    expect(results).toEqual([])
  })

  it('returns empty array on non-ok response', async () => {
    localStorage.setItem('spotify_access_token', 'tok')
    localStorage.setItem('spotify_token_expiry', String(Date.now() + 600_000))

    fetchMock.mockResolvedValueOnce({ ok: false })

    const results = await searchTracks('test')
    expect(results).toEqual([])
  })
})
