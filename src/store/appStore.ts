import { create } from 'zustand'
import type { Pin } from '@/types'

interface AppState {
  pins: Pin[]
  filteredPins: Pin[]
  selectedPin: Pin | null
  isAddingPin: boolean
  pendingLocation: { lat: number; lng: number } | null
  dateRange: [Date, Date] | null
  timelineValue: [Date, Date] | null

  setPins: (pins: Pin[]) => void
  setFilteredPins: (pins: Pin[]) => void
  setSelectedPin: (pin: Pin | null) => void
  setIsAddingPin: (v: boolean) => void
  setPendingLocation: (loc: { lat: number; lng: number } | null) => void
  setDateRange: (range: [Date, Date] | null) => void
  setTimelineValue: (range: [Date, Date] | null) => void
  addPin: (pin: Pin) => void
  updatePin: (pin: Pin) => void
  removePin: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  pins: [],
  filteredPins: [],
  selectedPin: null,
  isAddingPin: false,
  pendingLocation: null,
  dateRange: null,
  timelineValue: null,

  setPins: (pins) => set({ pins, filteredPins: pins }),
  setFilteredPins: (filteredPins) => {
    // #region agent log
    fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'appStore.ts:setFilteredPins',message:'setFilteredPins called',data:{newFilteredCount:filteredPins.length,stack:new Error().stack?.split('\\n').slice(1,4).map(s=>s.trim())},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    set({ filteredPins })
  },
  setSelectedPin: (selectedPin) => set({ selectedPin }),
  setIsAddingPin: (isAddingPin) => set({ isAddingPin }),
  setPendingLocation: (pendingLocation) => set({ pendingLocation }),
  setDateRange: (dateRange) => set({ dateRange }),
  setTimelineValue: (timelineValue) => set({ timelineValue }),

  addPin: (pin) => {
    const pins = [...get().pins, pin]
    // #region agent log
    fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'appStore.ts:addPin',message:'store addPin called',data:{newPinCount:pins.length,addedPinId:pin.id,addedLat:pin.latitude,addedLng:pin.longitude},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    set({ pins, filteredPins: pins })
  },
  updatePin: (pin) => {
    const pins = get().pins.map((p) => (p.id === pin.id ? pin : p))
    set({ pins, filteredPins: pins })
  },
  removePin: (id) => {
    const pins = get().pins.filter((p) => p.id !== id)
    set({ pins, filteredPins: pins })
  },
}))
