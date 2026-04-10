import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input, TextArea } from '@/components/ui/Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Name" />)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<Input placeholder="Type..." />)
    expect(screen.getByPlaceholderText('Type...')).toBeInTheDocument()
  })

  it('calls onChange on input', () => {
    const handler = vi.fn()
    render(<Input label="Test" onChange={handler} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } })
    expect(handler).toHaveBeenCalled()
  })

  it('passes additional props through', () => {
    render(<Input label="Email" type="email" required />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toBeRequired()
  })
})

describe('TextArea', () => {
  it('renders with label', () => {
    render(<TextArea label="Bio" />)
    expect(screen.getByText('Bio')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<TextArea placeholder="Write here..." />)
    expect(screen.getByPlaceholderText('Write here...')).toBeInTheDocument()
  })

  it('calls onChange on input', () => {
    const handler = vi.fn()
    render(<TextArea label="Notes" onChange={handler} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'text' } })
    expect(handler).toHaveBeenCalled()
  })

  it('respects rows prop', () => {
    render(<TextArea label="Big" rows={5} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })
})
