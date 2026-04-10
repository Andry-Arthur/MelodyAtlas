import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAppStore } from '@/store/appStore'

const mockCreatePin = vi.fn().mockResolvedValue({ error: null, pin: { id: 'p1' } })

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'url' } }),
      }),
    },
  },
}))

vi.mock('@/hooks/usePins', () => ({
  usePins: () => ({
    fetchPins: vi.fn(),
    createPin: mockCreatePin,
    deletePin: vi.fn(),
    updatePin: vi.fn(),
  }),
}))

vi.mock('@/components/pins/ImageUploader', () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}))

vi.mock('@/components/music/MusicInput', () => ({
  MusicInput: () => <div data-testid="music-input" />,
}))

const { AddPinModal } = await import('@/components/pins/AddPinModal')

beforeEach(() => {
  mockCreatePin.mockClear()
  useAppStore.setState({
    pendingLocation: null,
    isAddingPin: false,
  })
})

describe('AddPinModal', () => {
  it('renders nothing when no pending location', () => {
    const { container } = render(<AddPinModal />)
    expect(container.querySelector('.fixed')).toBeNull()
  })

  it('renders modal content when pending location exists', () => {
    useAppStore.setState({ pendingLocation: { lat: 40.7, lng: -74.0 } })
    render(<AddPinModal />)

    expect(screen.getByText('New Memory')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('shows location coordinates', () => {
    useAppStore.setState({ pendingLocation: { lat: 40.7128, lng: -74.006 } })
    render(<AddPinModal />)

    expect(screen.getByText(/40\.7128/)).toBeInTheDocument()
    expect(screen.getByText(/-74\.0060/)).toBeInTheDocument()
  })

  it('disables save when title is empty', () => {
    useAppStore.setState({ pendingLocation: { lat: 40, lng: -74 } })
    render(<AddPinModal />)

    const saveBtn = screen.getByText('Save Memory')
    expect(saveBtn).toBeDisabled()
  })

  it('enables save when title has text', () => {
    useAppStore.setState({ pendingLocation: { lat: 40, lng: -74 } })
    render(<AddPinModal />)

    const titleInput = screen.getByPlaceholderText('A memorable moment...')
    fireEvent.change(titleInput, { target: { value: 'My trip' } })

    const saveBtn = screen.getByText('Save Memory')
    expect(saveBtn).not.toBeDisabled()
  })

  it('calls createPin and closes modal on save', async () => {
    useAppStore.setState({ pendingLocation: { lat: 40, lng: -74 }, isAddingPin: true })
    render(<AddPinModal />)

    const titleInput = screen.getByPlaceholderText('A memorable moment...')
    fireEvent.change(titleInput, { target: { value: 'My trip' } })

    fireEvent.click(screen.getByText('Save Memory'))

    await waitFor(() => {
      expect(mockCreatePin).toHaveBeenCalledTimes(1)
      expect(mockCreatePin).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 40,
          longitude: -74,
          title: 'My trip',
        }),
        [],
        [],
        []
      )
    })
  })

  it('closes modal when Cancel is clicked', () => {
    useAppStore.setState({ pendingLocation: { lat: 40, lng: -74 }, isAddingPin: true })
    render(<AddPinModal />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(useAppStore.getState().pendingLocation).toBeNull()
    expect(useAppStore.getState().isAddingPin).toBe(false)
  })

  it('renders ImageUploader and MusicInput', () => {
    useAppStore.setState({ pendingLocation: { lat: 40, lng: -74 } })
    render(<AddPinModal />)

    expect(screen.getByTestId('image-uploader')).toBeInTheDocument()
    expect(screen.getByTestId('music-input')).toBeInTheDocument()
  })
})
