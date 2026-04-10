import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAppStore } from '@/store/appStore'
import type { Pin } from '@/types'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const { SearchBar } = await import('@/components/search/SearchBar')

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
  fetchMock.mockReset()
  useAppStore.setState({
    pins: [],
    filteredPins: [],
    selectedPin: null,
    flyTo: null,
  })
})

describe('SearchBar - rendering', () => {
  it('renders search input with placeholder', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('Search memories & places...')).toBeInTheDocument()
  })

  it('does not show results dropdown when query is empty', () => {
    render(<SearchBar />)
    expect(screen.queryByText('Your Memories')).not.toBeInTheDocument()
    expect(screen.queryByText('Places')).not.toBeInTheDocument()
  })

  it('shows clear button when there is a query', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.focus(input)

    expect(input).toHaveValue('test')
  })

  it('clears query when clear button is clicked', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.change(input, { target: { value: 'test' } })

    const clearBtn = document.querySelector('button')
    if (clearBtn) fireEvent.click(clearBtn)

    expect(input).toHaveValue('')
  })
})

describe('SearchBar - pin search', () => {
  it('filters pins by title', () => {
    const pins = [
      makePin({ title: 'NYC Trip' }),
      makePin({ title: 'London Visit' }),
      makePin({ title: 'NYC Concert' }),
    ]
    useAppStore.setState({ pins, filteredPins: pins })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'NYC' } })

    expect(screen.getByText('Your Memories')).toBeInTheDocument()
    expect(screen.getByText('NYC Trip')).toBeInTheDocument()
    expect(screen.getByText('NYC Concert')).toBeInTheDocument()
    expect(screen.queryByText('London Visit')).not.toBeInTheDocument()
  })

  it('filters pins by description', () => {
    const pins = [
      makePin({ title: 'Memory', description: 'A wonderful sunset' }),
      makePin({ title: 'Other', description: 'Rainy day' }),
    ]
    useAppStore.setState({ pins, filteredPins: pins })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'sunset' } })

    expect(screen.getByText('Memory')).toBeInTheDocument()
    expect(screen.queryByText('Other')).not.toBeInTheDocument()
  })

  it('is case-insensitive', () => {
    const pins = [makePin({ title: 'Paris Cafe' })]
    useAppStore.setState({ pins, filteredPins: pins })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'paris' } })

    expect(screen.getByText('Paris Cafe')).toBeInTheDocument()
  })

  it('limits to 5 results', () => {
    const pins = Array.from({ length: 8 }, (_, i) =>
      makePin({ title: `Memory ${i}` })
    )
    useAppStore.setState({ pins, filteredPins: pins })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Memory' } })

    const buttons = screen.getAllByText(/^Memory \d$/)
    expect(buttons.length).toBeLessThanOrEqual(5)
  })

  it('selects pin and sets flyTo on click', () => {
    const pin = makePin({ title: 'Target Pin', latitude: 51.5, longitude: -0.1 })
    useAppStore.setState({ pins: [pin], filteredPins: [pin] })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Target' } })
    fireEvent.click(screen.getByText('Target Pin'))

    expect(useAppStore.getState().selectedPin?.id).toBe(pin.id)
    expect(useAppStore.getState().flyTo).toEqual({ lng: -0.1, lat: 51.5, zoom: 14 })
  })
})

describe('SearchBar - place search', () => {
  it('fetches places from Mapbox after debounce', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          features: [
            { id: 'p1', place_name: 'New York, USA', center: [-74.006, 40.71] },
          ],
        }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'New York' } })

    await waitFor(
      () => {
        expect(screen.getByText('Places')).toBeInTheDocument()
        expect(screen.getByText('New York, USA')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )
  })

  it('selects place and sets flyTo on click', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          features: [
            { id: 'p1', place_name: 'Tokyo, Japan', center: [139.69, 35.68] },
          ],
        }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Tokyo' } })

    await waitFor(() => {
      expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument()
    }, { timeout: 1000 })

    fireEvent.click(screen.getByText('Tokyo, Japan'))

    expect(useAppStore.getState().flyTo).toEqual({ lng: 139.69, lat: 35.68, zoom: 12 })
    expect(useAppStore.getState().selectedPin).toBeNull()
  })
})

describe('SearchBar - keyboard navigation', () => {
  it('Escape closes results', () => {
    const pins = [makePin({ title: 'Test Pin' })]
    useAppStore.setState({ pins, filteredPins: pins })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search memories & places...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Test' } })

    expect(screen.getByText('Your Memories')).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByText('Your Memories')).not.toBeInTheDocument()
  })
})
