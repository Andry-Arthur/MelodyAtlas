import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockFetchMyProfile = vi.fn()
const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null })

let mockProfile: {
  id: string
  profile_id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  date_of_birth: string | null
  created_at: string
} | null = null

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: mockProfile,
    loading: false,
    fetchMyProfile: mockFetchMyProfile,
    fetchProfile: vi.fn(),
    updateProfile: mockUpdateProfile,
    uploadAvatar: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

const { OnboardingModal } = await import('@/components/profile/OnboardingModal')

beforeEach(() => {
  mockProfile = null
  mockFetchMyProfile.mockClear()
  mockUpdateProfile.mockClear()
})

describe('OnboardingModal', () => {
  it('renders nothing when profile is null', () => {
    const { container } = render(<OnboardingModal />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when profile has a birthday', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '1998-05-20',
      created_at: new Date().toISOString(),
    }
    const { container } = render(<OnboardingModal />)
    expect(container.querySelector('.fixed')).toBeNull()
  })

  it('opens when profile has no birthday', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test User',
      avatar_url: null,
      bio: null,
      date_of_birth: null,
      created_at: new Date().toISOString(),
    }
    render(<OnboardingModal />)

    expect(screen.getByText('Welcome to MelodyAtlas')).toBeInTheDocument()
    expect(screen.getByText('Display Name')).toBeInTheDocument()
    expect(screen.getByText('Birthday')).toBeInTheDocument()
    expect(screen.getByText('Bio (optional)')).toBeInTheDocument()
  })

  it('pre-fills username from profile', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Pre-filled Name',
      avatar_url: null,
      bio: null,
      date_of_birth: null,
      created_at: new Date().toISOString(),
    }
    render(<OnboardingModal />)

    const nameInput = screen.getByPlaceholderText('Your name')
    expect(nameInput).toHaveValue('Pre-filled Name')
  })

  it('disables save when no birthday is set', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: null,
      created_at: new Date().toISOString(),
    }
    render(<OnboardingModal />)

    expect(screen.getByText('Get Started')).toBeDisabled()
  })

  it('enables save when birthday is provided', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: null,
      created_at: new Date().toISOString(),
    }
    render(<OnboardingModal />)

    const birthdayInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(birthdayInputs[0], { target: { value: '1998-05-20' } })

    expect(screen.getByText('Get Started')).not.toBeDisabled()
  })

  it('calls updateProfile on save with birthday', async () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: null,
      created_at: new Date().toISOString(),
    }
    render(<OnboardingModal />)

    const birthdayInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(birthdayInputs[0], { target: { value: '1998-05-20' } })
    fireEvent.click(screen.getByText('Get Started'))

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ date_of_birth: '1998-05-20' })
      )
    })
  })

  it('closes when Skip is clicked', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: null,
      created_at: new Date().toISOString(),
    }
    render(<OnboardingModal />)

    expect(screen.getByText('Welcome to MelodyAtlas')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Skip'))

    expect(screen.queryByText('Welcome to MelodyAtlas')).not.toBeInTheDocument()
  })

  it('calls fetchMyProfile on mount', () => {
    render(<OnboardingModal />)
    expect(mockFetchMyProfile).toHaveBeenCalled()
  })
})
