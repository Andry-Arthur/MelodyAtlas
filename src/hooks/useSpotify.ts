import { useState, useCallback } from 'react'
import {
  searchTracks as search,
  isSpotifyConnected,
  redirectToSpotifyAuth,
  disconnectSpotify,
} from '@/lib/spotify'
import type { SpotifyTrack } from '@/types'

export function useSpotify() {
  const [results, setResults] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(isSpotifyConnected)

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const tracks = await search(query)
    setResults(tracks)
    setLoading(false)
  }, [])

  const connect = useCallback(() => {
    redirectToSpotifyAuth()
  }, [])

  const disconnect = useCallback(() => {
    disconnectSpotify()
    setConnected(false)
    setResults([])
  }, [])

  const refreshConnectionStatus = useCallback(() => {
    setConnected(isSpotifyConnected())
  }, [])

  return {
    results,
    loading,
    connected,
    searchTracks,
    connect,
    disconnect,
    refreshConnectionStatus,
  }
}
