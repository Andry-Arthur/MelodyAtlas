import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createMockSupabase, type MockSupabase } from './mocks/supabase'

let mockSupa: MockSupabase

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return mockSupa
  },
}))

const { useAuth } = await import('@/hooks/useAuth')

beforeEach(() => {
  mockSupa = createMockSupabase()
})

describe('useAuth - signUp', () => {
  it('calls supabase signUp with credentials', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signUp('test@test.com', 'password123')
    })

    expect(mockSupa.auth.signUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    })
  })

  it('returns error from supabase', async () => {
    mockSupa.auth.signUp.mockResolvedValueOnce({
      error: { message: 'Email taken' },
    })

    const { result } = renderHook(() => useAuth())

    let res: { error: unknown }
    await act(async () => {
      res = await result.current.signUp('taken@test.com', 'pw')
    })

    expect(res!.error).toBeTruthy()
  })
})

describe('useAuth - signIn', () => {
  it('calls supabase signInWithPassword', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signIn('test@test.com', 'password123')
    })

    expect(mockSupa.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    })
  })
})

describe('useAuth - OAuth providers', () => {
  it('signInWithGoogle calls signInWithOAuth with google', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockSupa.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })

  it('signInWithFacebook calls signInWithOAuth with facebook', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signInWithFacebook()
    })

    expect(mockSupa.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'facebook' })
    )
  })

  it('signInWithSpotify calls signInWithOAuth with spotify', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signInWithSpotify()
    })

    expect(mockSupa.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'spotify' })
    )
  })
})

describe('useAuth - signOut', () => {
  it('calls supabase signOut', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSupa.auth.signOut).toHaveBeenCalled()
  })
})
