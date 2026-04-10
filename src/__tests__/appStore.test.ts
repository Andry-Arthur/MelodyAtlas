import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store/appStore'
import type { Pin, Profile } from '../types'

function makePin(overrides: Partial<Pin> = {}): Pin {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    latitude: 40.7128,
    longitude: -74.006,
    title: 'Test Pin',
    description: null,
    pin_date: '2025-01-01',
    created_at: new Date().toISOString(),
    images: [],
    songs: [],
    ...overrides,
  }
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: crypto.randomUUID(),
    profile_id: 'testuser',
    username: 'Test User',
    avatar_url: null,
    bio: null,
    date_of_birth: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  useAppStore.setState({
    pins: [],
    filteredPins: [],
    selectedPin: null,
    isAddingPin: false,
    pendingLocation: null,
    dateRange: null,
    timelineValue: null,
    friends: [],
    friendPins: [],
    showFriendPins: false,
    friendsPanelOpen: false,
    editProfileOpen: false,
    flyTo: null,
  })
})

describe('appStore - pin management', () => {
  it('setPins updates both pins and filteredPins', () => {
    const pins = [makePin(), makePin()]
    useAppStore.getState().setPins(pins)

    expect(useAppStore.getState().pins).toHaveLength(2)
    expect(useAppStore.getState().filteredPins).toHaveLength(2)
    expect(useAppStore.getState().pins).toBe(useAppStore.getState().filteredPins)
  })

  it('addPin appends to both pins and filteredPins', () => {
    const pin1 = makePin({ title: 'First' })
    const pin2 = makePin({ title: 'Second' })

    useAppStore.getState().setPins([pin1])
    useAppStore.getState().addPin(pin2)

    expect(useAppStore.getState().pins).toHaveLength(2)
    expect(useAppStore.getState().filteredPins).toHaveLength(2)
    expect(useAppStore.getState().pins[1].title).toBe('Second')
  })

  it('updatePin replaces matching pin by id', () => {
    const pin = makePin({ title: 'Original' })
    useAppStore.getState().setPins([pin])

    const updated = { ...pin, title: 'Updated' }
    useAppStore.getState().updatePin(updated)

    expect(useAppStore.getState().pins[0].title).toBe('Updated')
    expect(useAppStore.getState().filteredPins[0].title).toBe('Updated')
  })

  it('updatePin does not affect other pins', () => {
    const pin1 = makePin({ title: 'Keep' })
    const pin2 = makePin({ title: 'Change' })
    useAppStore.getState().setPins([pin1, pin2])

    useAppStore.getState().updatePin({ ...pin2, title: 'Changed' })

    expect(useAppStore.getState().pins[0].title).toBe('Keep')
    expect(useAppStore.getState().pins[1].title).toBe('Changed')
  })

  it('removePin filters out matching pin by id', () => {
    const pin1 = makePin()
    const pin2 = makePin()
    useAppStore.getState().setPins([pin1, pin2])

    useAppStore.getState().removePin(pin1.id)

    expect(useAppStore.getState().pins).toHaveLength(1)
    expect(useAppStore.getState().pins[0].id).toBe(pin2.id)
    expect(useAppStore.getState().filteredPins).toHaveLength(1)
  })

  it('removePin with non-existent id does nothing', () => {
    const pin = makePin()
    useAppStore.getState().setPins([pin])

    useAppStore.getState().removePin('non-existent')

    expect(useAppStore.getState().pins).toHaveLength(1)
  })
})

describe('appStore - selection and UI state', () => {
  it('setSelectedPin stores and clears pin', () => {
    const pin = makePin()
    useAppStore.getState().setSelectedPin(pin)
    expect(useAppStore.getState().selectedPin?.id).toBe(pin.id)

    useAppStore.getState().setSelectedPin(null)
    expect(useAppStore.getState().selectedPin).toBeNull()
  })

  it('setIsAddingPin toggles adding mode', () => {
    useAppStore.getState().setIsAddingPin(true)
    expect(useAppStore.getState().isAddingPin).toBe(true)

    useAppStore.getState().setIsAddingPin(false)
    expect(useAppStore.getState().isAddingPin).toBe(false)
  })

  it('setPendingLocation stores and clears location', () => {
    useAppStore.getState().setPendingLocation({ lat: 51.5, lng: -0.1 })
    expect(useAppStore.getState().pendingLocation).toEqual({ lat: 51.5, lng: -0.1 })

    useAppStore.getState().setPendingLocation(null)
    expect(useAppStore.getState().pendingLocation).toBeNull()
  })

  it('setFilteredPins only updates filteredPins, not pins', () => {
    const allPins = [makePin(), makePin(), makePin()]
    useAppStore.getState().setPins(allPins)

    useAppStore.getState().setFilteredPins([allPins[0]])

    expect(useAppStore.getState().pins).toHaveLength(3)
    expect(useAppStore.getState().filteredPins).toHaveLength(1)
  })
})

describe('appStore - friends state', () => {
  it('setFriends stores friend profiles', () => {
    const profiles = [makeProfile(), makeProfile({ profile_id: 'friend2' })]
    useAppStore.getState().setFriends(profiles)

    expect(useAppStore.getState().friends).toHaveLength(2)
  })

  it('setFriendPins stores friend pins', () => {
    const pins = [makePin(), makePin()]
    useAppStore.getState().setFriendPins(pins)

    expect(useAppStore.getState().friendPins).toHaveLength(2)
  })

  it('toggleFriendPins flips boolean state', () => {
    expect(useAppStore.getState().showFriendPins).toBe(false)

    useAppStore.getState().toggleFriendPins()
    expect(useAppStore.getState().showFriendPins).toBe(true)

    useAppStore.getState().toggleFriendPins()
    expect(useAppStore.getState().showFriendPins).toBe(false)
  })

  it('setFriendsPanelOpen controls panel visibility', () => {
    useAppStore.getState().setFriendsPanelOpen(true)
    expect(useAppStore.getState().friendsPanelOpen).toBe(true)

    useAppStore.getState().setFriendsPanelOpen(false)
    expect(useAppStore.getState().friendsPanelOpen).toBe(false)
  })

  it('setEditProfileOpen controls modal visibility', () => {
    useAppStore.getState().setEditProfileOpen(true)
    expect(useAppStore.getState().editProfileOpen).toBe(true)

    useAppStore.getState().setEditProfileOpen(false)
    expect(useAppStore.getState().editProfileOpen).toBe(false)
  })
})

describe('appStore - date range', () => {
  it('setDateRange stores and clears range', () => {
    const range: [Date, Date] = [new Date('2024-01-01'), new Date('2024-12-31')]
    useAppStore.getState().setDateRange(range)
    expect(useAppStore.getState().dateRange).toEqual(range)

    useAppStore.getState().setDateRange(null)
    expect(useAppStore.getState().dateRange).toBeNull()
  })

  it('setTimelineValue stores and clears value', () => {
    const value: [Date, Date] = [new Date('2024-06-01'), new Date('2024-06-30')]
    useAppStore.getState().setTimelineValue(value)
    expect(useAppStore.getState().timelineValue).toEqual(value)

    useAppStore.getState().setTimelineValue(null)
    expect(useAppStore.getState().timelineValue).toBeNull()
  })
})

describe('appStore - flyTo', () => {
  it('setFlyTo stores a fly-to target', () => {
    useAppStore.getState().setFlyTo({ lng: -73.98, lat: 40.76, zoom: 14 })

    const { flyTo } = useAppStore.getState()
    expect(flyTo).toEqual({ lng: -73.98, lat: 40.76, zoom: 14 })
  })

  it('setFlyTo stores target without zoom', () => {
    useAppStore.getState().setFlyTo({ lng: 2.35, lat: 48.86 })

    const { flyTo } = useAppStore.getState()
    expect(flyTo).toEqual({ lng: 2.35, lat: 48.86 })
    expect(flyTo?.zoom).toBeUndefined()
  })

  it('setFlyTo clears with null', () => {
    useAppStore.getState().setFlyTo({ lng: 0, lat: 0 })
    useAppStore.getState().setFlyTo(null)

    expect(useAppStore.getState().flyTo).toBeNull()
  })

  it('flyTo defaults to null', () => {
    expect(useAppStore.getState().flyTo).toBeNull()
  })
})
