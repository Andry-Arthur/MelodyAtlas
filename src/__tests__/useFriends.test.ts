import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createMockSupabase, type MockSupabase } from './mocks/supabase'
import type { Profile } from '@/types'

let mockSupa: MockSupabase

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return mockSupa
  },
}))

const { useFriends } = await import('@/hooks/useFriends')

const fakeProfile: Profile = {
  id: 'user-456',
  profile_id: 'frienduser',
  username: 'Friend',
  avatar_url: null,
  bio: null,
  created_at: new Date().toISOString(),
}

const fakeFriendship = {
  id: 'fs-1',
  requester_id: 'user-123',
  addressee_id: 'user-456',
  status: 'accepted' as const,
  created_at: new Date().toISOString(),
  requester: fakeProfile,
  addressee: fakeProfile,
}

beforeEach(() => {
  mockSupa = createMockSupabase()
})

describe('useFriends - fetchFriends', () => {
  it('fetches accepted friendships', async () => {
    mockSupa._chain._setResolve({ data: [fakeFriendship], error: null })

    const { result } = renderHook(() => useFriends())
    await act(() => result.current.fetchFriends())

    expect(result.current.friends).toHaveLength(1)
    expect(result.current.friends[0].status).toBe('accepted')
  })

  it('does not fetch when not authenticated', async () => {
    mockSupa.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    const { result } = renderHook(() => useFriends())
    await act(() => result.current.fetchFriends())

    expect(result.current.friends).toHaveLength(0)
  })
})

describe('useFriends - fetchRequests', () => {
  it('fetches pending incoming requests', async () => {
    const pending = { ...fakeFriendship, status: 'pending' as const }
    mockSupa._chain._setResolve({ data: [pending], error: null })

    const { result } = renderHook(() => useFriends())
    await act(() => result.current.fetchRequests())

    expect(result.current.requests).toHaveLength(1)
    expect(result.current.requests[0].status).toBe('pending')
  })
})

describe('useFriends - sendRequest', () => {
  it('inserts a friendship record', async () => {
    mockSupa._chain._setResolve({ data: null, error: null })

    const { result } = renderHook(() => useFriends())

    let res: { error: unknown }
    await act(async () => {
      res = await result.current.sendRequest('user-456')
    })

    expect(mockSupa.from).toHaveBeenCalledWith('friendships')
    expect(res!.error).toBeNull()
  })

  it('returns error when not authenticated', async () => {
    mockSupa.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    const { result } = renderHook(() => useFriends())

    let res: { error: unknown }
    await act(async () => {
      res = await result.current.sendRequest('user-456')
    })

    expect(res!.error).toBeTruthy()
  })
})

describe('useFriends - acceptRequest', () => {
  it('updates friendship status to accepted', async () => {
    mockSupa._chain._setResolve({ data: null, error: null })

    const { result } = renderHook(() => useFriends())

    const { error } = await act(() => result.current.acceptRequest('fs-1'))

    expect(error).toBeNull()
  })
})

describe('useFriends - declineRequest', () => {
  it('updates friendship status to declined', async () => {
    mockSupa._chain._setResolve({ data: null, error: null })

    const { result } = renderHook(() => useFriends())

    const { error } = await act(() => result.current.declineRequest('fs-1'))

    expect(error).toBeNull()
  })
})

describe('useFriends - removeFriend', () => {
  it('deletes friendship and refreshes', async () => {
    mockSupa._chain._setResolve({ data: null, error: null })

    const { result } = renderHook(() => useFriends())

    const { error } = await act(() => result.current.removeFriend('fs-1'))

    expect(error).toBeNull()
  })
})

describe('useFriends - searchUsers', () => {
  it('searches profiles by profile_id', async () => {
    mockSupa._chain._setResolve({ data: [fakeProfile], error: null })

    const { result } = renderHook(() => useFriends())

    let results: Profile[] = []
    await act(async () => {
      results = await result.current.searchUsers('friend')
    })

    expect(results).toHaveLength(1)
    expect(results[0].profile_id).toBe('frienduser')
  })

  it('returns empty array for blank query', async () => {
    const { result } = renderHook(() => useFriends())

    let results: Profile[] = []
    await act(async () => {
      results = await result.current.searchUsers('   ')
    })

    expect(results).toEqual([])
  })
})
