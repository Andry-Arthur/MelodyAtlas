import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAppStore } from '@/store/appStore'
import type { Pin } from '@/types'

const mockDeletePin = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner-1' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}))

vi.mock('@/hooks/usePins', () => ({
  usePins: () => ({
    fetchPins: vi.fn(),
    createPin: vi.fn(),
    deletePin: mockDeletePin,
    updatePin: vi.fn(),
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'owner-1', email: 'test@test.com' },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  }),
}))

const { PinDetail } = await import('@/components/pins/PinDetail')

const basePin: Pin = {
  id: 'pin-1',
  user_id: 'owner-1',
  latitude: 40.7,
  longitude: -74.0,
  title: 'Concert in Central Park',
  description: 'An unforgettable evening',
  pin_date: '2025-06-15',
  created_at: new Date().toISOString(),
  images: [],
  songs: [],
  tags: [],
}

beforeEach(() => {
  mockDeletePin.mockClear()
  useAppStore.setState({ selectedPin: null })
})

describe('PinDetail - rendering', () => {
  it('returns null when no pin is selected', () => {
    const { container } = render(<PinDetail />)
    expect(container.innerHTML).toBe('')
  })

  it('renders pin title and date', () => {
    useAppStore.setState({ selectedPin: basePin })
    render(<PinDetail />)

    expect(screen.getByText('Concert in Central Park')).toBeInTheDocument()
    expect(screen.getByText('Jun 15, 2025')).toBeInTheDocument()
  })

  it('renders description when present', () => {
    useAppStore.setState({ selectedPin: basePin })
    render(<PinDetail />)

    expect(screen.getByText('An unforgettable evening')).toBeInTheDocument()
  })

  it('does not render description section when null', () => {
    useAppStore.setState({
      selectedPin: { ...basePin, description: null },
    })
    render(<PinDetail />)

    expect(screen.queryByText('An unforgettable evening')).not.toBeInTheDocument()
  })

  it('closes when X button is clicked', () => {
    useAppStore.setState({ selectedPin: basePin })
    render(<PinDetail />)

    const closeButtons = screen.getAllByRole('button')
    const xBtn = closeButtons.find((btn) =>
      btn.querySelector('.lucide-x')
    )
    if (xBtn) fireEvent.click(xBtn)

    expect(useAppStore.getState().selectedPin).toBeNull()
  })
})

describe('PinDetail - tagged friends', () => {
  it('does not show tags section when no tags', () => {
    useAppStore.setState({ selectedPin: basePin })
    render(<PinDetail />)

    expect(screen.queryByText('With:')).not.toBeInTheDocument()
  })

  it('shows "With:" label and tagged friends', () => {
    useAppStore.setState({
      selectedPin: {
        ...basePin,
        tags: [
          {
            id: 'tag-1',
            pin_id: 'pin-1',
            tagged_user_id: 'friend-1',
            created_at: new Date().toISOString(),
            profile: {
              id: 'friend-1',
              profile_id: 'alice',
              username: 'Alice',
              avatar_url: null,
              bio: null,
              date_of_birth: null,
              created_at: new Date().toISOString(),
            },
          },
          {
            id: 'tag-2',
            pin_id: 'pin-1',
            tagged_user_id: 'friend-2',
            created_at: new Date().toISOString(),
            profile: {
              id: 'friend-2',
              profile_id: 'bob',
              username: 'Bob',
              avatar_url: 'https://example.com/bob.jpg',
              bio: null,
              date_of_birth: null,
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    })
    render(<PinDetail />)

    expect(screen.getByText('With:')).toBeInTheDocument()
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
  })

  it('links tagged friends to their profile pages', () => {
    useAppStore.setState({
      selectedPin: {
        ...basePin,
        tags: [
          {
            id: 'tag-1',
            pin_id: 'pin-1',
            tagged_user_id: 'friend-1',
            created_at: new Date().toISOString(),
            profile: {
              id: 'friend-1',
              profile_id: 'alice',
              username: 'Alice',
              avatar_url: null,
              bio: null,
              date_of_birth: null,
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    })
    render(<PinDetail />)

    const link = screen.getByText('@alice').closest('a')
    expect(link).toHaveAttribute('href', '/u/alice')
  })

  it('renders avatar image when available', () => {
    useAppStore.setState({
      selectedPin: {
        ...basePin,
        tags: [
          {
            id: 'tag-1',
            pin_id: 'pin-1',
            tagged_user_id: 'friend-2',
            created_at: new Date().toISOString(),
            profile: {
              id: 'friend-2',
              profile_id: 'bob',
              username: 'Bob',
              avatar_url: 'https://example.com/bob.jpg',
              bio: null,
              date_of_birth: null,
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    })
    render(<PinDetail />)

    const imgs = document.querySelectorAll('img[src="https://example.com/bob.jpg"]')
    expect(imgs.length).toBe(1)
  })
})

describe('PinDetail - owner actions', () => {
  it('shows delete button for the pin owner', () => {
    useAppStore.setState({ selectedPin: basePin })
    render(<PinDetail />)

    expect(screen.getByText('Delete Memory')).toBeInTheDocument()
  })

  it('hides delete button for non-owners', () => {
    useAppStore.setState({
      selectedPin: { ...basePin, user_id: 'someone-else' },
    })
    render(<PinDetail />)

    expect(screen.queryByText('Delete Memory')).not.toBeInTheDocument()
  })

  it('calls deletePin and clears selection on delete', async () => {
    useAppStore.setState({ selectedPin: basePin })
    render(<PinDetail />)

    fireEvent.click(screen.getByText('Delete Memory'))

    await waitFor(() => {
      expect(mockDeletePin).toHaveBeenCalledWith(basePin)
      expect(useAppStore.getState().selectedPin).toBeNull()
    })
  })
})
