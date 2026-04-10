import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    )
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders children when open', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Hello Modal</p>
      </Modal>
    )
    expect(screen.getByText('Hello Modal')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="My Title">
        <p>Body</p>
      </Modal>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    )
    const backdrop = document.querySelector('.bg-black\\/60')
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })
})
