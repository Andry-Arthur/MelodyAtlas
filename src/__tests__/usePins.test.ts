import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createMockSupabase, type MockSupabase } from './mocks/supabase'
import { useAppStore } from '@/store/appStore'
import type { Pin } from '@/types'

let mockSupa: MockSupabase

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return mockSupa
  },
}))

const { usePins } = await import('@/hooks/usePins')

const fakePin: Pin = {
  id: 'pin-1',
  user_id: 'user-123',
  latitude: 40.7,
  longitude: -74.0,
  title: 'NYC Memory',
  description: 'A great day',
  pin_date: '2025-06-15',
  created_at: new Date().toISOString(),
  images: [],
  songs: [],
}

beforeEach(() => {
  mockSupa = createMockSupabase()
  useAppStore.setState({ pins: [], filteredPins: [], selectedPin: null })
})

describe('usePins - fetchPins', () => {
  it('fetches pins and sets them in the store', async () => {
    const pins = [fakePin, { ...fakePin, id: 'pin-2', title: 'Second' }]
    mockSupa._chain._setResolve({ data: pins, error: null })

    const { result } = renderHook(() => usePins())
    await act(() => result.current.fetchPins())

    expect(mockSupa.from).toHaveBeenCalledWith('pins')
    expect(useAppStore.getState().pins).toHaveLength(2)
    expect(useAppStore.getState().filteredPins).toHaveLength(2)
  })

  it('does not update store on error', async () => {
    mockSupa._chain._setResolve({ data: null, error: { message: 'DB error' } })

    const { result } = renderHook(() => usePins())
    const { error } = await act(() => result.current.fetchPins())

    expect(error?.message).toBe('DB error')
    expect(useAppStore.getState().pins).toHaveLength(0)
  })
})

describe('usePins - createPin', () => {
  it('inserts pin and adds to store on success', async () => {
    const dbPin = {
      id: 'new-pin',
      user_id: 'user-123',
      latitude: 51.5,
      longitude: -0.1,
      title: 'London',
      description: '',
      pin_date: '2025-07-01',
      created_at: new Date().toISOString(),
    }
    mockSupa._chain._setResolve({ data: dbPin, error: null })

    const { result } = renderHook(() => usePins())
    let res: Awaited<ReturnType<typeof result.current.createPin>>

    await act(async () => {
      res = await result.current.createPin(
        {
          latitude: 51.5,
          longitude: -0.1,
          title: 'London',
          description: '',
          pin_date: '2025-07-01',
        },
        [],
        []
      )
    })

    expect(res!.error).toBeNull()
    expect(res!.pin?.id).toBe('new-pin')
    expect(useAppStore.getState().pins).toHaveLength(1)
    expect(useAppStore.getState().pins[0].title).toBe('London')
  })

  it('returns error when not authenticated', async () => {
    mockSupa.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
    })

    const { result } = renderHook(() => usePins())
    let res: Awaited<ReturnType<typeof result.current.createPin>>

    await act(async () => {
      res = await result.current.createPin(
        { latitude: 0, longitude: 0, title: 'X', description: '', pin_date: '2025-01-01' },
        [], []
      )
    })

    expect(res!.error).toBeTruthy()
    expect(useAppStore.getState().pins).toHaveLength(0)
  })

  it('returns error when DB insert fails', async () => {
    mockSupa._chain._setResolve({ data: null, error: { message: 'Insert failed' } })

    const { result } = renderHook(() => usePins())
    let res: Awaited<ReturnType<typeof result.current.createPin>>

    await act(async () => {
      res = await result.current.createPin(
        { latitude: 0, longitude: 0, title: 'X', description: '', pin_date: '2025-01-01' },
        [], []
      )
    })

    expect(res!.error).toBeTruthy()
    expect(useAppStore.getState().pins).toHaveLength(0)
  })
})

describe('usePins - deletePin', () => {
  it('deletes pin and removes from store on success', async () => {
    useAppStore.setState({ pins: [fakePin], filteredPins: [fakePin] })
    mockSupa._chain._setResolve({ data: null, error: null })

    const { result } = renderHook(() => usePins())
    await act(() => result.current.deletePin(fakePin))

    expect(useAppStore.getState().pins).toHaveLength(0)
  })

  it('keeps pin in store when delete fails', async () => {
    useAppStore.setState({ pins: [fakePin], filteredPins: [fakePin] })
    mockSupa._chain._setResolve({ data: null, error: { message: 'fail' } })

    const { result } = renderHook(() => usePins())
    const { error } = await act(() => result.current.deletePin(fakePin))

    expect(error).toBeTruthy()
    expect(useAppStore.getState().pins).toHaveLength(1)
  })
})
