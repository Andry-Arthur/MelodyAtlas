import { Marker } from 'react-map-gl/mapbox'
import { motion } from 'framer-motion'
import { MapPin, Music } from 'lucide-react'
import type { Pin } from '@/types'

interface PinMarkerProps {
  pin: Pin
  onClick: () => void
  isFriend?: boolean
}

export function PinMarker({ pin, onClick, isFriend }: PinMarkerProps) {
  const thumbnail =
    pin.images?.[0]?.url ?? pin.songs?.[0]?.album_art_url ?? null

  const borderColor = isFriend ? 'border-blue-400' : 'border-emerald-400'
  const shadowColor = isFriend
    ? 'shadow-blue-500/30'
    : 'shadow-emerald-500/30'
  const bgColor = isFriend ? 'bg-blue-500' : 'bg-emerald-500'
  const bgBorder = isFriend ? 'border-blue-300' : 'border-emerald-300'
  const arrowColor = isFriend ? 'bg-blue-400' : 'bg-emerald-400'

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
              className={`w-10 h-10 rounded-full border-2 ${borderColor} overflow-hidden shadow-lg ${shadowColor} group-hover:scale-110 transition-transform`}
            >
              <img
                src={thumbnail}
                alt={pin.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full ${bgColor} border-2 ${bgBorder} flex items-center justify-center shadow-lg ${shadowColor} group-hover:scale-110 transition-transform`}
            >
              {pin.songs?.length ? (
                <Music size={16} className="text-white" />
              ) : (
                <MapPin size={16} className="text-white" />
              )}
            </div>
          )}
          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${arrowColor} rotate-45`}
          />
        </div>
      </motion.div>
    </Marker>
  )
}
