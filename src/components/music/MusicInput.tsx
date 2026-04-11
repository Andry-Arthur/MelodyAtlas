import { useState, useCallback } from 'react'
import { Link2, Search, X, Music, Loader2 } from 'lucide-react'
import { SpotifySearch } from '@/components/spotify/SpotifySearch'
import { resolveMusic, getPlatformLabel, getPlatformColor } from '@/lib/platforms'
import type { SpotifyTrack, MusicLink } from '@/types'

interface MusicInputProps {
  spotifyTracks: SpotifyTrack[]
  musicLinks: MusicLink[]
  onSpotifyChange: (tracks: SpotifyTrack[]) => void
  onLinksChange: (links: MusicLink[]) => void
  maxItems?: number
}

export function MusicInput({
  spotifyTracks,
  musicLinks,
  onSpotifyChange,
  onLinksChange,
  maxItems = 3,
}: MusicInputProps) {
  const [tab, setTab] = useState<'search' | 'link'>('link')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalItems = spotifyTracks.length + musicLinks.length

  const handlePasteLink = useCallback(async () => {
    if (!url.trim()) return
    setError('')
    setLoading(true)

    const result = await resolveMusic(url.trim())
    if (!result) {
      setError(
        'Unsupported URL. Paste a link from Spotify, YouTube, Apple Music, SoundCloud, Bandcamp, Deezer, or Tidal.'
      )
      setLoading(false)
      return
    }

    if (musicLinks.some((l) => l.embedUrl === result.embedUrl)) {
      setError('This link is already added.')
      setLoading(false)
      return
    }

    onLinksChange([
      ...musicLinks,
      {
        platform: result.platform,
        platformUrl: url.trim(),
        embedUrl: result.embedUrl,
        title: result.title,
        artist: result.artist,
        thumbnail: result.thumbnail,
      },
    ])
    setUrl('')
    setLoading(false)
  }, [url, musicLinks, onLinksChange])

  const removeLink = useCallback(
    (index: number) => {
      onLinksChange(musicLinks.filter((_, i) => i !== index))
    },
    [musicLinks, onLinksChange]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/70">Music</label>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setTab('link')}
            className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              tab === 'link'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <span className="flex items-center gap-1">
              <Link2 size={12} />
              Paste Link
            </span>
          </button>
          <button
            onClick={() => setTab('search')}
            className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              tab === 'search'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <span className="flex items-center gap-1">
              <Search size={12} />
              Spotify Search
            </span>
          </button>
        </div>
      </div>

      {musicLinks.length > 0 && (
        <div className="space-y-2">
          {musicLinks.map((link, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 rounded-lg p-2"
            >
              {link.thumbnail ? (
                <img
                  src={link.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ backgroundColor: getPlatformColor(link.platform) + '20' }}
                >
                  <Music size={16} style={{ color: getPlatformColor(link.platform) }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{link.title}</p>
                <p className="text-xs text-white/40 truncate">
                  {link.artist ? `${link.artist} · ` : ''}
                  {getPlatformLabel(link.platform)}
                </p>
              </div>
              <button
                onClick={() => removeLink(i)}
                className="p-1 hover:bg-white/10 rounded cursor-pointer"
              >
                <X size={14} className="text-white/40" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'link' && totalItems < maxItems && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handlePasteLink()
                }
              }}
              placeholder="Paste a Spotify, YouTube, Apple Music, SoundCloud, Bandcamp, Deezer, or Tidal link..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              onClick={handlePasteLink}
              disabled={loading || !url.trim()}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Add'
              )}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <p className="text-[10px] text-white/25">
            Spotify, YouTube, Apple Music, SoundCloud, Bandcamp, Deezer, and Tidal share links are supported.
          </p>
        </div>
      )}

      {tab === 'search' && totalItems < maxItems && (
        <SpotifySearch
          selected={spotifyTracks}
          onSelect={onSpotifyChange}
          maxTracks={maxItems - musicLinks.length}
        />
      )}
    </div>
  )
}
