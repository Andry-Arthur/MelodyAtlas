import { Marker } from 'react-map-gl/mapbox'

interface ClusterMarkerProps {
  latitude: number
  longitude: number
  pointCount: number
  onClick: () => void
}

export function ClusterMarker({
  latitude,
  longitude,
  pointCount,
  onClick,
}: ClusterMarkerProps) {
  const size = Math.min(24 + pointCount * 2, 56)

  return (
    <Marker latitude={latitude} longitude={longitude} anchor="center">
      <div
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className="rounded-full bg-emerald-500/80 border-2 border-emerald-300/60 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30"
        style={{ width: size, height: size }}
      >
        <span className="text-white font-bold text-sm">{pointCount}</span>
      </div>
    </Marker>
  )
}
