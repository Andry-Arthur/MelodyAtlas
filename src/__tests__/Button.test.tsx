import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Press</Button>)
    fireEvent.click(screen.getByText('Press'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByText('Primary')
    expect(btn.className).toContain('bg-emerald-500')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Sec</Button>)
    const btn = screen.getByText('Sec')
    expect(btn.className).toContain('bg-white/10')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByText('Ghost')
    expect(btn.className).toContain('hover:bg-white/10')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByText('Delete')
    expect(btn.className).toContain('bg-red-500')
  })

  it('applies sm size', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByText('Small')
    expect(btn.className).toContain('text-xs')
  })

  it('applies lg size', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByText('Large')
    expect(btn.className).toContain('text-base')
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>No</Button>)
    fireEvent.click(screen.getByText('No'))
    expect(handler).not.toHaveBeenCalled()
  })
})
