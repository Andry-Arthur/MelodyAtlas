import type { RefObject } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import { Plus, Minus, LocateFixed } from 'lucide-react'

interface MapControlsProps {
  mapRef: RefObject<MapRef | null>
}

export function MapControls({ mapRef }: MapControlsProps) {
  return (
    <>
      <button
        onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
        className="w-9 h-9 rounded-lg bg-zinc-900/80 backdrop-blur border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
        className="w-9 h-9 rounded-lg bg-zinc-900/80 backdrop-blur border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={() => {
          navigator.geolocation?.getCurrentPosition(
            (pos) => {
              mapRef.current?.flyTo({
                center: [pos.coords.longitude, pos.coords.latitude],
                zoom: 12,
                duration: 1200,
              })
            },
            undefined,
            { enableHighAccuracy: true }
          )
        }}
        className="w-9 h-9 rounded-lg bg-zinc-900/80 backdrop-blur border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <LocateFixed size={16} />
      </button>
    </>
  )
}
