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
  setFilteredPins: (filteredPins) => set({ filteredPins }),
  setSelectedPin: (selectedPin) => set({ selectedPin }),
  setIsAddingPin: (isAddingPin) => set({ isAddingPin }),
  setPendingLocation: (pendingLocation) => set({ pendingLocation }),
  setDateRange: (dateRange) => set({ dateRange }),
  setTimelineValue: (timelineValue) => set({ timelineValue }),

  addPin: (pin) => {
    const pins = [...get().pins, pin]
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
