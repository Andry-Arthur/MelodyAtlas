import { Marker } from 'react-map-gl/mapbox'
import { motion } from 'framer-motion'
import { MapPin, Music } from 'lucide-react'
import type { Pin } from '@/types'

interface PinMarkerProps {
  pin: Pin
  onClick: () => void
}

export function PinMarker({ pin, onClick }: PinMarkerProps) {
  const thumbnail =
    pin.images?.[0]?.url ?? pin.songs?.[0]?.album_art_url ?? null

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
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 overflow-hidden shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <img
                src={thumbnail}
                alt={pin.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              {pin.songs?.length ? (
                <Music size={16} className="text-white" />
              ) : (
                <MapPin size={16} className="text-white" />
              )}
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rotate-45" />
        </div>
      </motion.div>
    </Marker>
  )
}
