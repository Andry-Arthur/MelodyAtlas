import { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import Map, { type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import Supercluster from 'supercluster'
import type { BBox } from 'geojson'
import { useAppStore } from '@/store/appStore'
import { PinMarker } from './PinMarker'
import { ClusterMarker } from './ClusterMarker'
import { MapControls } from './MapControls'
import type { Pin } from '@/types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export function MapView() {
  const mapRef = useRef<MapRef>(null)
  const { filteredPins, isAddingPin, setPendingLocation, setSelectedPin } =
    useAppStore()
  const [zoom, setZoom] = useState(2)
  const [bounds, setBounds] = useState<BBox | null>(null)

  const points = useMemo(
    () =>
      filteredPins.map((pin) => ({
        type: 'Feature' as const,
        properties: { cluster: false, pin },
        geometry: {
          type: 'Point' as const,
          coordinates: [pin.longitude, pin.latitude],
        },
      })),
    [filteredPins]
  )

  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 16,
    })
    sc.load(points as any)
    return sc
  }, [points])

  const clusters = useMemo(() => {
    if (!bounds) return []
    return supercluster.getClusters(bounds, Math.floor(zoom))
  }, [supercluster, bounds, zoom])

  const updateBounds = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    setBounds([
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ])
    setZoom(map.getZoom())
  }, [])

  useEffect(() => {
    setTimeout(updateBounds, 100)
  }, [updateBounds])

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (isAddingPin) {
        setPendingLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
    },
    [isAddingPin, setPendingLocation]
  )

  const handlePinClick = useCallback(
    (pin: Pin) => {
      setSelectedPin(pin)
      mapRef.current?.flyTo({
        center: [pin.longitude, pin.latitude],
        zoom: Math.max(zoom, 10),
        duration: 800,
      })
    },
    [setSelectedPin, zoom]
  )

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        20
      )
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: expansionZoom,
        duration: 500,
      })
    },
    [supercluster]
  )

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 2,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onClick={handleClick}
        onMove={updateBounds}
        cursor={isAddingPin ? 'crosshair' : 'grab'}
        attributionControl={false}
      >
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates
          const { cluster: isCluster, point_count: pointCount } =
            cluster.properties as any

          if (isCluster) {
            return (
              <ClusterMarker
                key={`cluster-${cluster.id}`}
                latitude={lat}
                longitude={lng}
                pointCount={pointCount}
                onClick={() =>
                  handleClusterClick(cluster.id as number, lng, lat)
                }
              />
            )
          }

          const pin = (cluster.properties as any).pin as Pin
          return (
            <PinMarker
              key={pin.id}
              pin={pin}
              onClick={() => handlePinClick(pin)}
            />
          )
        })}
      </Map>

      <MapControls mapRef={mapRef} />
    </div>
  )
}
