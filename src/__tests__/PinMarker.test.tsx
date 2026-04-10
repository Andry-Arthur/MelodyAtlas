import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { Pin } from '@/types'

vi.mock('react-map-gl/mapbox', () => ({
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
}))

const { PinMarker } = await import('@/components/map/PinMarker')

const basePin: Pin = {
  id: 'pin-1',
  user_id: 'u1',
  latitude: 40.7,
  longitude: -74.0,
  title: 'Test Pin',
  description: null,
  pin_date: '2025-01-01',
  created_at: new Date().toISOString(),
  images: [],
  songs: [],
}

describe('PinMarker - color logic', () => {
  it('uses emerald colors by default (own pin)', () => {
    const { container } = render(
      <PinMarker pin={basePin} onClick={vi.fn()} />
    )

    const el = container.innerHTML
    expect(el).toContain('emerald')
    expect(el).not.toContain('purple')
    expect(el).not.toContain('blue')
  })

  it('uses purple colors when isTagged is true', () => {
    const { container } = render(
      <PinMarker pin={basePin} onClick={vi.fn()} isTagged />
    )

    const el = container.innerHTML
    expect(el).toContain('purple')
    expect(el).not.toContain('emerald')
  })

  it('uses blue colors when isFriend is true', () => {
    const { container } = render(
      <PinMarker pin={basePin} onClick={vi.fn()} isFriend />
    )

    const el = container.innerHTML
    expect(el).toContain('blue')
    expect(el).not.toContain('emerald')
  })

  it('isTagged takes priority over isFriend', () => {
    const { container } = render(
      <PinMarker pin={basePin} onClick={vi.fn()} isTagged isFriend />
    )

    const el = container.innerHTML
    expect(el).toContain('purple')
    expect(el).not.toContain('blue')
  })

  it('renders thumbnail image when pin has images', () => {
    const pinWithImage: Pin = {
      ...basePin,
      images: [
        { id: 'img-1', pin_id: 'pin-1', storage_path: 'x', url: 'https://example.com/img.jpg', order_index: 0 },
      ],
    }
    const { container } = render(
      <PinMarker pin={pinWithImage} onClick={vi.fn()} />
    )

    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.getAttribute('src')).toBe('https://example.com/img.jpg')
  })

  it('renders MapPin icon when no thumbnail available', () => {
    const { container } = render(
      <PinMarker pin={basePin} onClick={vi.fn()} />
    )

    expect(container.querySelector('.lucide-map-pin')).toBeTruthy()
  })
})
