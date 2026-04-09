import { MapPinPlus, LogOut, Music } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useAuth } from '@/hooks/useAuth'
import { useSpotify } from '@/hooks/useSpotify'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { isAddingPin, setIsAddingPin, setPendingLocation } = useAppStore()
  const { signOut } = useAuth()
  const { connected, connect, disconnect } = useSpotify()

  const handleToggleAdd = () => {
    if (isAddingPin) {
      setIsAddingPin(false)
      setPendingLocation(null)
    } else {
      setIsAddingPin(true)
    }
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-center justify-between p-4">
        <div className="pointer-events-auto">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Melody<span className="text-emerald-400">Atlas</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
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
            variant={isAddingPin ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleToggleAdd}
          >
            <span className="flex items-center gap-1.5">
              <MapPinPlus size={14} />
              {isAddingPin ? 'Click map...' : 'Add Memory'}
            </span>
          </Button>

          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut size={14} />
          </Button>
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
