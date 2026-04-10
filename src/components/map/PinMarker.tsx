import { Marker } from 'react-map-gl/mapbox'
import { motion } from 'framer-motion'
import { MapPin, Music } from 'lucide-react'
import type { Pin } from '@/types'

interface PinMarkerProps {
  pin: Pin
  onClick: () => void
  isFriend?: boolean
  isTagged?: boolean
}

export function PinMarker({ pin, onClick, isFriend, isTagged }: PinMarkerProps) {
  const thumbnail =
    pin.images?.[0]?.url ?? pin.songs?.[0]?.album_art_url ?? null

  const color = isTagged ? 'purple' : isFriend ? 'blue' : 'emerald'

  const colorMap = {
    emerald: {
      border: 'border-emerald-400',
      shadow: 'shadow-emerald-500/30',
      bg: 'bg-emerald-500',
      bgBorder: 'border-emerald-300',
      arrow: 'bg-emerald-400',
    },
    blue: {
      border: 'border-blue-400',
      shadow: 'shadow-blue-500/30',
      bg: 'bg-blue-500',
      bgBorder: 'border-blue-300',
      arrow: 'bg-blue-400',
    },
    purple: {
      border: 'border-purple-400',
      shadow: 'shadow-purple-500/30',
      bg: 'bg-purple-500',
      bgBorder: 'border-purple-300',
      arrow: 'bg-purple-400',
    },
  }

  const c = colorMap[color]

  return (
    <Marker
      longitude={pin.longitude}
      latitude={pin.latitude}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onClick()
      }}
    >
      <motion.div
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: 10 }}
        className="cursor-pointer group"
      >
        <div className="relative">
          {thumbnail ? (
            <div
              className={`w-10 h-10 rounded-full border-2 ${c.border} overflow-hidden shadow-lg ${c.shadow} group-hover:scale-110 transition-transform`}
            >
              <img
                src={thumbnail}
                alt={pin.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full ${c.bg} border-2 ${c.bgBorder} flex items-center justify-center shadow-lg ${c.shadow} group-hover:scale-110 transition-transform`}
            >
              {pin.songs?.length ? (
                <Music size={16} className="text-white" />
              ) : (
                <MapPin size={16} className="text-white" />
              )}
            </div>
          )}
          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${c.arrow} rotate-45`}
          />
        </div>
      </motion.div>
    </Marker>
  )
}
