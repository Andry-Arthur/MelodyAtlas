import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react'
import { Search, MapPin, Navigation, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { Pin } from '@/types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

interface PlaceResult {
  id: string
  place_name: string
  center: [number, number]
}

export function SearchBar() {
  const { pins, setSelectedPin, setFlyTo } = useAppStore()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [prevQuery, setPrevQuery] = useState(query)

  const pinResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return pins
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
      )
      .slice(0, 5)
  }, [pins, query])

  const fetchPlaces = useCallback(
    async (q: string) => {
      if (!q.trim() || !MAPBOX_TOKEN) {
        setPlaces([])
        return
      }
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            q
          )}.json?access_token=${MAPBOX_TOKEN}&limit=5`
        )
        if (!res.ok) return
        const data = await res.json()
        setPlaces(
          (data.features ?? []).map((f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          }))
        )
      } catch {
        setPlaces([])
      }
    },
    []
  )

  if (prevQuery !== query) {
    setPrevQuery(query)
    setActiveIdx(-1)
    if (!query.trim()) {
      setPlaces([])
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) return
    debounceRef.current = setTimeout(() => fetchPlaces(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, fetchPlaces])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectPin = useCallback(
    (pin: Pin) => {
      setSelectedPin(pin)
      setFlyTo({ lng: pin.longitude, lat: pin.latitude, zoom: 14 })
      setQuery('')
      setFocused(false)
    },
    [setSelectedPin, setFlyTo]
  )

  const selectPlace = useCallback(
    (place: PlaceResult) => {
      setFlyTo({ lng: place.center[0], lat: place.center[1], zoom: 12 })
      setQuery('')
      setFocused(false)
    },
    [setFlyTo]
  )

  const totalResults = pinResults.length + places.length
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, totalResults - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault()
        if (activeIdx < pinResults.length) {
          selectPin(pinResults[activeIdx])
        } else {
          selectPlace(places[activeIdx - pinResults.length])
        }
      } else if (e.key === 'Escape') {
        setFocused(false)
      }
    },
    [totalResults, activeIdx, pinResults, places, selectPin, selectPlace]
  )

  const showResults = focused && query.trim().length > 0 && totalResults > 0

  return (
    <div
      ref={containerRef}
      className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[min(90vw,420px)]"
    >
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search memories & places..."
          className="w-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl
            pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-white/30
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xl"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setPlaces([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <X size={14} className="text-white/40" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="mt-1.5 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {pinResults.length > 0 && (
            <div>
              <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                Your Memories
              </p>
              {pinResults.map((pin, i) => (
                <button
                  key={pin.id}
                  onClick={() => selectPin(pin)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer
                    ${activeIdx === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <MapPin size={14} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{pin.title}</p>
                    {pin.description && (
                      <p className="text-xs text-white/30 truncate">{pin.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {places.length > 0 && (
            <div>
              {pinResults.length > 0 && (
                <div className="border-t border-white/5" />
              )}
              <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                Places
              </p>
              {places.map((place, i) => {
                const idx = pinResults.length + i
                return (
                  <button
                    key={place.id}
                    onClick={() => selectPlace(place)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer
                      ${activeIdx === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <Navigation size={14} className="text-blue-400 shrink-0" />
                    <p className="text-sm text-white/80 truncate">
                      {place.place_name}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
