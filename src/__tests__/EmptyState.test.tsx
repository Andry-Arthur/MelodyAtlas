import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAppStore } from '@/store/appStore'
import { EmptyState } from '@/components/map/EmptyState'

beforeEach(() => {
  useAppStore.setState({ pins: [], isAddingPin: false })
})

describe('EmptyState', () => {
  it('renders when no pins and not adding', () => {
    render(<EmptyState />)
    expect(screen.getByText(/Your map is empty/)).toBeInTheDocument()
    expect(screen.getByText('Add Memory')).toBeInTheDocument()
  })

  it('does not render when there are pins', () => {
    useAppStore.setState({
      pins: [
        {
          id: '1',
          user_id: 'u',
          latitude: 0,
          longitude: 0,
          title: 'X',
          description: '',
          pin_date: '2025-01-01',
          created_at: new Date().toISOString(),
        },
      ],
    })
    render(<EmptyState />)
    expect(screen.queryByText(/Your map is empty/)).not.toBeInTheDocument()
  })

  it('does not render when adding a pin', () => {
    useAppStore.setState({ isAddingPin: true })
    render(<EmptyState />)
    expect(screen.queryByText(/Your map is empty/)).not.toBeInTheDocument()
  })
})
