import { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import Map, { type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import Supercluster from 'supercluster'
import type { BBox } from 'geojson'
import { useAppStore } from '@/store/appStore'
import { PinMarker } from './PinMarker'
import { ClusterMarker } from './ClusterMarker'
import { MapControls } from './MapControls'
import { FriendOverlayToggle } from '@/components/friends/FriendOverlayToggle'
import type { Pin } from '@/types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

interface MapViewProps {
  pins?: Pin[]
  readonly?: boolean
}

export function MapView({ pins: externalPins, readonly }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const {
    filteredPins,
    friendPins,
    showFriendPins,
    isAddingPin,
    flyTo,
    setPendingLocation,
    setSelectedPin,
    setFlyTo,
  } = useAppStore()
  const [zoom, setZoom] = useState(2)
  const [bounds, setBounds] = useState<BBox | null>(null)

  const activePins = externalPins ?? filteredPins
  const friendIdSet = useMemo(
    () => new Set(friendPins.map((p) => p.id)),
    [friendPins]
  )

  const allPins = useMemo(() => {
    if (externalPins) return externalPins
    if (!showFriendPins) return activePins
    return [...activePins, ...friendPins]
  }, [externalPins, activePins, friendPins, showFriendPins])

  const points = useMemo(
    () =>
      allPins.map((pin) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          pin,
          isFriend: friendIdSet.has(pin.id),
          isTagged: !!pin.isTagged,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [pin.longitude, pin.latitude],
        },
      })),
    [allPins, friendIdSet]
  )

  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 16,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    setZoom(map.getZoom())
  }, [])

  useEffect(() => {
    setTimeout(updateBounds, 100)
  }, [updateBounds])

  useEffect(() => {
    if (!flyTo) return
    mapRef.current?.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 12,
      duration: 1200,
    })
    setFlyTo(null)
  }, [flyTo, setFlyTo])

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (!readonly && isAddingPin) {
        setPendingLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
    },
    [readonly, isAddingPin, setPendingLocation]
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
        cursor={!readonly && isAddingPin ? 'crosshair' : 'grab'}
        attributionControl={false}
      >
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates
          const { cluster: isCluster, point_count: pointCount } =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

          const props = cluster.properties as { pin: Pin; isFriend: boolean; isTagged: boolean }
          const pin = props.pin
          return (
            <PinMarker
              key={pin.id}
              pin={pin}
              isFriend={props.isFriend}
              isTagged={props.isTagged}
              onClick={() => handlePinClick(pin)}
            />
          )
        })}
      </Map>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
        <MapControls mapRef={mapRef} />
        {!readonly && <FriendOverlayToggle />}
      </div>
    </div>
  )
}
