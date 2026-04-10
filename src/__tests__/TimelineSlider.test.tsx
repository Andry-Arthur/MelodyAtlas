import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAppStore } from '@/store/appStore'
import type { Pin } from '@/types'

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
    fetchMyProfile: vi.fn(),
    fetchProfile: vi.fn(),
    updateProfile: vi.fn(),
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

const { TimelineSlider } = await import('@/components/timeline/TimelineSlider')

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

beforeEach(() => {
  mockProfile = null
  useAppStore.setState({
    pins: [],
    filteredPins: [],
    dateRange: null,
    timelineValue: null,
  })
})

describe('TimelineSlider - visibility', () => {
  it('renders nothing when no pins and no birthday', () => {
    const { container } = render(<TimelineSlider />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing with only 1 pin and no birthday', () => {
    const pin = makePin()
    useAppStore.setState({ pins: [pin], filteredPins: [pin] })

    const { container } = render(<TimelineSlider />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when birthday is set even with 0 pins', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '1998-05-20',
      created_at: new Date().toISOString(),
    }

    render(<TimelineSlider />)
    expect(screen.getByText('May 1998')).toBeInTheDocument()
  })

  it('renders when birthday is set with 1 pin', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '2000-01-15',
      created_at: new Date().toISOString(),
    }
    const pin = makePin({ pin_date: '2024-06-01' })
    useAppStore.setState({ pins: [pin], filteredPins: [pin] })

    render(<TimelineSlider />)
    expect(screen.getByText('Jan 2000')).toBeInTheDocument()
  })

  it('renders with 2+ pins and no birthday', () => {
    const pins = [
      makePin({ pin_date: '2023-01-01' }),
      makePin({ pin_date: '2025-06-01' }),
    ]
    useAppStore.setState({ pins, filteredPins: pins })

    render(<TimelineSlider />)

    const sliders = document.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBe(2)
  })
})

describe('TimelineSlider - birthday anchoring', () => {
  it('uses birthday as start of range', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '1995-03-10',
      created_at: new Date().toISOString(),
    }

    render(<TimelineSlider />)
    expect(screen.getByText('Mar 1995')).toBeInTheDocument()
  })

  it('shows current date as end of range', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '1990-01-01',
      created_at: new Date().toISOString(),
    }

    render(<TimelineSlider />)

    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const expected = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})

describe('TimelineSlider - play button', () => {
  it('renders play button', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '1998-01-01',
      created_at: new Date().toISOString(),
    }

    render(<TimelineSlider />)
    const playBtn = document.querySelector('.bg-emerald-500')
    expect(playBtn).toBeInTheDocument()
  })
})

describe('TimelineSlider - filtering', () => {
  it('filters pins when slider is moved', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '2000-01-01',
      created_at: new Date().toISOString(),
    }
    const pins = [
      makePin({ pin_date: '2010-06-01' }),
      makePin({ pin_date: '2020-01-01' }),
      makePin({ pin_date: '2025-01-01' }),
    ]
    useAppStore.setState({ pins, filteredPins: pins })

    render(<TimelineSlider />)

    const sliders = document.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBe(2)

    fireEvent.change(sliders[1], { target: { value: '50' } })

    const { filteredPins } = useAppStore.getState()
    expect(filteredPins.length).toBeLessThan(pins.length)
  })

  it('updates dateRange when slider moves', () => {
    mockProfile = {
      id: 'u1',
      profile_id: 'test',
      username: 'Test',
      avatar_url: null,
      bio: null,
      date_of_birth: '2000-01-01',
      created_at: new Date().toISOString(),
    }
    const pins = [makePin({ pin_date: '2020-06-01' })]
    useAppStore.setState({ pins, filteredPins: pins })

    render(<TimelineSlider />)

    const sliders = document.querySelectorAll('input[type="range"]')
    fireEvent.change(sliders[0], { target: { value: '10' } })

    expect(useAppStore.getState().dateRange).not.toBeNull()
  })
})
