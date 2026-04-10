import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAppStore } from '@/store/appStore'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

vi.mock('@/hooks/useSpotify', () => ({
  useSpotify: () => ({
    results: [],
    loading: false,
    connected: false,
    searchTracks: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshConnectionStatus: vi.fn(),
  }),
}))

const { Header } = await import('@/components/layout/Header')

beforeEach(() => {
  useAppStore.setState({
    isAddingPin: false,
    pendingLocation: null,
    friendsPanelOpen: false,
    editProfileOpen: false,
  })
})

describe('Header', () => {
  it('renders app title', () => {
    render(<Header />)
    expect(screen.getByText('Melody')).toBeInTheDocument()
    expect(screen.getByText('Atlas')).toBeInTheDocument()
  })

  it('renders "Add Memory" button', () => {
    render(<Header />)
    expect(screen.getByText('Add Memory')).toBeInTheDocument()
  })

  it('renders "Connect Spotify" button when disconnected', () => {
    render(<Header />)
    expect(screen.getByText('Connect Spotify')).toBeInTheDocument()
  })

  it('renders "Friends" button', () => {
    render(<Header />)
    expect(screen.getByText('Friends')).toBeInTheDocument()
  })

  it('toggles adding pin state when "Add Memory" is clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByText('Add Memory'))
    expect(useAppStore.getState().isAddingPin).toBe(true)
  })

  it('shows "Click map..." when in adding mode', () => {
    useAppStore.setState({ isAddingPin: true })
    render(<Header />)
    expect(screen.getByText('Click map...')).toBeInTheDocument()
  })

  it('shows instruction banner when adding pin', () => {
    useAppStore.setState({ isAddingPin: true })
    render(<Header />)
    expect(
      screen.getByText('Click anywhere on the map to place your memory')
    ).toBeInTheDocument()
  })

  it('opens friends panel when Friends is clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByText('Friends'))
    expect(useAppStore.getState().friendsPanelOpen).toBe(true)
  })
})
