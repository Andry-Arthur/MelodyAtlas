const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''
const REDIRECT_URI = `${window.location.origin.replace('://localhost', '://127.0.0.1')}/spotify-callback`
const SCOPES = 'user-read-private'

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export async function redirectToSpotifyAuth(): Promise<void> {
  const codeVerifier = generateRandomString(64)
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed)

  localStorage.setItem('spotify_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<string | null> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier')
  if (!codeVerifier) return null

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  })

  const data = await response.json()
  if (data.access_token) {
    localStorage.setItem('spotify_access_token', data.access_token)
    localStorage.setItem('spotify_refresh_token', data.refresh_token)
    localStorage.setItem(
      'spotify_token_expiry',
      String(Date.now() + data.expires_in * 1000)
    )
    return data.access_token
  }
  return null
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('spotify_refresh_token')
  if (!refreshToken) return null

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  const data = await response.json()
  if (data.access_token) {
    localStorage.setItem('spotify_access_token', data.access_token)
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token)
    }
    localStorage.setItem(
      'spotify_token_expiry',
      String(Date.now() + data.expires_in * 1000)
    )
    return data.access_token
  }
  return null
}

export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem('spotify_access_token')
  const expiry = localStorage.getItem('spotify_token_expiry')

  if (token && expiry && Date.now() < Number(expiry) - 60_000) {
    return token
  }

  return refreshAccessToken()
}

export function isSpotifyConnected(): boolean {
  return !!localStorage.getItem('spotify_access_token')
}

export function disconnectSpotify(): void {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_refresh_token')
  localStorage.removeItem('spotify_token_expiry')
  localStorage.removeItem('spotify_code_verifier')
}

export async function searchTracks(
  query: string
): Promise<import('@/types').SpotifyTrack[]> {
  const token = await getValidToken()
  if (!token) return []

  const response = await fetch(
    `https://api.spotify.com/v1/search?${new URLSearchParams({
      q: query,
      type: 'track',
      limit: '10',
    })}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.tracks?.items ?? []
}
