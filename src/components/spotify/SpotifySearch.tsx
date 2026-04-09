import { useState, useCallback, useRef } from 'react'
import { Search, Music, X, Plug } from 'lucide-react'
import { useSpotify } from '@/hooks/useSpotify'
import { Button } from '@/components/ui/Button'
import type { SpotifyTrack } from '@/types'

interface SpotifySearchProps {
  selected: SpotifyTrack[]
  onSelect: (tracks: SpotifyTrack[]) => void
  maxTracks?: number
}

export function SpotifySearch({
  selected,
  onSelect,
  maxTracks = 3,
}: SpotifySearchProps) {
  const [query, setQuery] = useState('')
  const { results, loading, connected, searchTracks, connect } = useSpotify()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        searchTracks(value)
      }, 400)
    },
    [searchTracks]
  )

  const addTrack = useCallback(
    (track: SpotifyTrack) => {
      if (selected.length >= maxTracks) return
      if (selected.some((t) => t.id === track.id)) return
      onSelect([...selected, track])
    },
    [selected, onSelect, maxTracks]
  )

  const removeTrack = useCallback(
    (id: string) => {
      onSelect(selected.filter((t) => t.id !== id))
    },
    [selected, onSelect]
  )

  if (!connected) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/70">
          Music
        </label>
        <div className="border border-white/10 rounded-xl p-6 text-center">
          <Plug size={24} className="mx-auto mb-2 text-white/30" />
          <p className="text-sm text-white/40 mb-3">
            Connect Spotify to search for songs
          </p>
          <Button size="sm" onClick={connect}>
            Connect Spotify
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/70">Music</label>

      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 bg-white/5 rounded-lg p-2"
            >
              <img
                src={track.album.images[track.album.images.length - 1]?.url}
                alt=""
                className="w-10 h-10 rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{track.name}</p>
                <p className="text-xs text-white/40 truncate">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </div>
              <button
                onClick={() => removeTrack(track.id)}
                className="p-1 hover:bg-white/10 rounded cursor-pointer"
              >
                <X size={14} className="text-white/40" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected.length < maxTracks && (
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a song..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white
                placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {loading && (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/5 p-1">
              {results.map((track) => {
                const isSelected = selected.some((t) => t.id === track.id)
                return (
                  <button
                    key={track.id}
                    onClick={() => addTrack(track)}
                    disabled={isSelected}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer
                      ${isSelected ? 'opacity-40' : 'hover:bg-white/5'}`}
                  >
                    <img
                      src={
                        track.album.images[track.album.images.length - 1]?.url
                      }
                      alt=""
                      className="w-9 h-9 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {track.name}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {track.artists.map((a) => a.name).join(', ')}
                      </p>
                    </div>
                    <Music size={14} className="text-emerald-400 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
