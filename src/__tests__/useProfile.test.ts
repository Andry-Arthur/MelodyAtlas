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

const { useProfile } = await import('@/hooks/useProfile')

const fakeProfile: Profile = {
  id: 'user-123',
  profile_id: 'testuser42',
  username: 'Test User',
  avatar_url: null,
  bio: 'Hello world',
  date_of_birth: null,
  created_at: new Date().toISOString(),
}

beforeEach(() => {
  mockSupa = createMockSupabase()
})

describe('useProfile - fetchMyProfile', () => {
  it('fetches and sets current user profile', async () => {
    mockSupa._chain._setResolve({ data: fakeProfile, error: null })

    const { result } = renderHook(() => useProfile())

    let profile: Profile | null = null
    await act(async () => {
      profile = await result.current.fetchMyProfile()
    })

    expect(profile).toEqual(fakeProfile)
    expect(result.current.profile).toEqual(fakeProfile)
  })

  it('returns null when not authenticated', async () => {
    mockSupa.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    const { result } = renderHook(() => useProfile())

    let profile: Profile | null = null
    await act(async () => {
      profile = await result.current.fetchMyProfile()
    })

    expect(profile).toBeNull()
  })
})

describe('useProfile - fetchProfile', () => {
  it('fetches profile by profile_id', async () => {
    mockSupa._chain._setResolve({ data: fakeProfile, error: null })

    const { result } = renderHook(() => useProfile())

    let profile: Profile | null = null
    await act(async () => {
      profile = await result.current.fetchProfile('testuser42')
    })

    expect(mockSupa.from).toHaveBeenCalledWith('profiles')
    expect(profile).toEqual(fakeProfile)
  })

  it('returns null on error', async () => {
    mockSupa._chain._setResolve({ data: null, error: { message: 'not found' } })

    const { result } = renderHook(() => useProfile())

    let profile: Profile | null = null
    await act(async () => {
      profile = await result.current.fetchProfile('nonexistent')
    })

    expect(profile).toBeNull()
  })
})

describe('useProfile - updateProfile', () => {
  it('updates and refreshes profile state', async () => {
    const updated = { ...fakeProfile, username: 'New Name' }
    mockSupa._chain._setResolve({ data: updated, error: null })

    const { result } = renderHook(() => useProfile())

    await act(async () => {
      await result.current.updateProfile({ username: 'New Name' })
    })

    expect(result.current.profile?.username).toBe('New Name')
  })

  it('updates date_of_birth and reflects in profile state', async () => {
    const updated = { ...fakeProfile, date_of_birth: '1998-05-20' }
    mockSupa._chain._setResolve({ data: updated, error: null })

    const { result } = renderHook(() => useProfile())

    await act(async () => {
      await result.current.updateProfile({ date_of_birth: '1998-05-20' })
    })

    expect(result.current.profile?.date_of_birth).toBe('1998-05-20')
  })

  it('returns error when not authenticated', async () => {
    mockSupa.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    const { result } = renderHook(() => useProfile())

    let res: { error: unknown }
    await act(async () => {
      res = await result.current.updateProfile({ bio: 'x' })
    })

    expect(res!.error).toBeTruthy()
  })
})

describe('useProfile - uploadAvatar', () => {
  it('uploads file and updates avatar_url', async () => {
    const updated = { ...fakeProfile, avatar_url: 'https://example.com/avatar.png?t=123' }
    mockSupa._chain._setResolve({ data: updated, error: null })

    const { result } = renderHook(() => useProfile())
    const file = new File(['img'], 'avatar.png', { type: 'image/png' })

    await act(async () => {
      await result.current.uploadAvatar(file)
    })

    expect(mockSupa.storage.from).toHaveBeenCalledWith('avatar-images')
    expect(result.current.profile?.avatar_url).toContain('example.com')
  })

  it('returns error on upload failure', async () => {
    mockSupa.storage.from.mockReturnValueOnce({
      upload: vi.fn().mockResolvedValue({ error: { message: 'too large' } }),
      getPublicUrl: vi.fn(),
    })

    const { result } = renderHook(() => useProfile())
    const file = new File(['img'], 'big.png', { type: 'image/png' })

    let res: { error: unknown }
    await act(async () => {
      res = await result.current.uploadAvatar(file)
    })

    expect(res!.error).toBeTruthy()
  })
})
