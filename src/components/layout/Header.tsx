import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react'
import {
  MapPinPlus,
  Music,
  Search,
  MapPin,
  Navigation,
  Users,
  X,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSpotify } from '@/hooks/useSpotify'
import { useFriends } from '@/hooks/useFriends'
import { Button } from '@/components/ui/Button'
import { ProfileMenu } from '@/components/profile/ProfileMenu'
import type { Pin, Profile } from '@/types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

interface PlaceResult {
  id: string
  place_name: string
  center: [number, number]
}

export function Header() {
  const {
    pins,
    isAddingPin,
    setIsAddingPin,
    setPendingLocation,
    setSelectedPin,
    setFlyTo,
    setFriendsPanelOpen,
  } = useAppStore()
  const { connected, connect, disconnect } = useSpotify()
  const { searchUsers } = useFriends()

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [people, setPeople] = useState<Profile[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
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

  const fetchResults = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setPlaces([])
        setPeople([])
        return
      }

      const users = await searchUsers(q)
      setPeople(users.slice(0, 5))

      if (MAPBOX_TOKEN) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
          )
          if (res.ok) {
            const data = await res.json()
            setPlaces(
              (data.features ?? []).map(
                (f: { id: string; place_name: string; center: [number, number] }) => ({
                  id: f.id,
                  place_name: f.place_name,
                  center: f.center,
                })
              )
            )
          }
        } catch {
          setPlaces([])
        }
      }
    },
    [searchUsers]
  )

  if (prevQuery !== query) {
    setPrevQuery(query)
    setActiveIdx(-1)
    if (!query.trim()) {
      setPlaces([])
      setPeople([])
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) return
    debounceRef.current = setTimeout(() => fetchResults(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, fetchResults])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
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

  const selectPerson = useCallback(
    (p: Profile) => {
      window.location.href = `/u/${p.profile_id}`
    },
    []
  )

  const totalResults = pinResults.length + people.length + places.length
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
        } else if (activeIdx < pinResults.length + people.length) {
          selectPerson(people[activeIdx - pinResults.length])
        } else {
          selectPlace(places[activeIdx - pinResults.length - people.length])
        }
      } else if (e.key === 'Escape') {
        setFocused(false)
      }
    },
    [totalResults, activeIdx, pinResults, people, places, selectPin, selectPerson, selectPlace]
  )

  const showResults = focused && query.trim().length > 0 && totalResults > 0

  const handleToggleAdd = () => {
    if (isAddingPin) {
      setIsAddingPin(false)
      setPendingLocation(null)
    } else {
      setIsAddingPin(true)
    }
  }

  let resultIdx = 0

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-center gap-3 p-4">
        <div className="pointer-events-auto shrink-0">
          <a href="/" className="text-xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
            Melody<span className="text-emerald-400">Atlas</span>
          </a>
        </div>

        <div ref={searchRef} className="flex-1 max-w-md mx-auto pointer-events-auto relative">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search memories, people & places..."
              className="w-full bg-white/5 border border-white/10 rounded-lg
                pl-9 pr-8 py-1.5 text-sm text-white placeholder:text-white/30
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-sm"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setPlaces([])
                  setPeople([])
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
              >
                <X size={13} className="text-white/40" />
              </button>
            )}
          </div>

          {showResults && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
              {pinResults.length > 0 && (
                <div>
                  <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                    Your Memories
                  </p>
                  {pinResults.map((pin) => {
                    const i = resultIdx++
                    return (
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
                    )
                  })}
                </div>
              )}

              {people.length > 0 && (
                <div>
                  {pinResults.length > 0 && <div className="border-t border-white/5" />}
                  <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                    People
                  </p>
                  {people.map((person) => {
                    const i = resultIdx++
                    return (
                      <button
                        key={person.id}
                        onClick={() => selectPerson(person)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer
                          ${activeIdx === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <Users size={14} className="text-purple-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{person.username ?? person.profile_id}</p>
                          <p className="text-xs text-white/30 truncate">@{person.profile_id}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {places.length > 0 && (
                <div>
                  {(pinResults.length > 0 || people.length > 0) && (
                    <div className="border-t border-white/5" />
                  )}
                  <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                    Places
                  </p>
                  {places.map((place) => {
                    const i = resultIdx++
                    return (
                      <button
                        key={place.id}
                        onClick={() => selectPlace(place)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer
                          ${activeIdx === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <Navigation size={14} className="text-blue-400 shrink-0" />
                        <p className="text-sm text-white/80 truncate">{place.place_name}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          <Button
            variant={connected ? 'secondary' : 'ghost'}
            size="sm"
            onClick={connected ? disconnect : connect}
          >
            <span className="flex items-center gap-1.5">
              <Music size={14} />
              {connected ? 'Spotify' : 'Connect Spotify'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFriendsPanelOpen(true)}
          >
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              Friends
            </span>
          </Button>

          <Button
            variant={isAddingPin ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleToggleAdd}
          >
            <span className="flex items-center gap-1.5">
              <MapPinPlus size={14} />
              {isAddingPin ? 'Click map...' : 'Add Memory'}
            </span>
          </Button>

          <ProfileMenu />
        </div>
      </div>

      {isAddingPin && (
        <div className="flex justify-center pointer-events-none">
          <div className="bg-emerald-500/90 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur shadow-lg">
            Click anywhere on the map to place your memory
          </div>
        </div>
      )}
    </header>
  )
}
