import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { MusicLink } from '@/types'

const resolveMusicMock = vi.fn()

vi.mock('@/lib/platforms', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/platforms')>()
  return {
    ...mod,
    resolveMusic: (...args: Parameters<typeof mod.resolveMusic>) =>
      resolveMusicMock(...args),
  }
})

vi.mock('@/components/spotify/SpotifySearch', () => ({
  SpotifySearch: () => <div data-testid="spotify-search">SpotifySearch</div>,
}))

const { MusicInput } = await import('@/components/music/MusicInput')

function makeLink(overrides: Partial<MusicLink> = {}): MusicLink {
  return {
    platform: 'spotify',
    platformUrl: 'https://open.spotify.com/track/abc',
    embedUrl: 'https://open.spotify.com/embed/track/abc?theme=0',
    title: 'Test Song',
    artist: '',
    thumbnail: '',
    ...overrides,
  }
}

beforeEach(() => {
  resolveMusicMock.mockReset()
})

describe('MusicInput', () => {
  it('renders Paste Link tab by default with updated placeholder', () => {
    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={[]}
        onSpotifyChange={vi.fn()}
        onLinksChange={vi.fn()}
      />
    )

    expect(
      screen.getByPlaceholderText(
        /Paste a Spotify, YouTube, Apple Music, SoundCloud, Bandcamp, Deezer, or Tidal link/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Spotify, YouTube, Apple Music, SoundCloud, Bandcamp, Deezer, and Tidal share links are supported/
      )
    ).toBeInTheDocument()
  })

  it('shows unsupported URL error when resolveMusic returns null', async () => {
    resolveMusicMock.mockResolvedValue(null)

    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={[]}
        onSpotifyChange={vi.fn()}
        onLinksChange={vi.fn()}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://example.com/nope' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(
        screen.getByText(
          /Unsupported URL\. Paste a link from Spotify, YouTube, Apple Music, SoundCloud, Bandcamp, Deezer, or Tidal/
        )
      ).toBeInTheDocument()
    })
  })

  it('adds resolved link and clears input on success', async () => {
    resolveMusicMock.mockResolvedValue({
      platform: 'spotify',
      embedUrl: 'https://open.spotify.com/embed/track/xyz?theme=0',
      title: 'Resolved Title',
      artist: 'Artist',
      thumbnail: 'https://img.example/thumb.jpg',
    })
    const onLinksChange = vi.fn()

    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={[]}
        onSpotifyChange={vi.fn()}
        onLinksChange={onLinksChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, {
      target: {
        value: 'https://open.spotify.com/track/xyz',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(onLinksChange).toHaveBeenCalledWith([
        {
          platform: 'spotify',
          platformUrl: 'https://open.spotify.com/track/xyz',
          embedUrl: 'https://open.spotify.com/embed/track/xyz?theme=0',
          title: 'Resolved Title',
          artist: 'Artist',
          thumbnail: 'https://img.example/thumb.jpg',
        },
      ])
    })
    expect(input).toHaveValue('')
  })

  it('shows error when same embed URL is added twice', async () => {
    resolveMusicMock.mockResolvedValue({
      platform: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/abc',
      title: 'Vid',
      artist: '',
      thumbnail: '',
    })

    const links = [
      makeLink({
        platform: 'youtube',
        embedUrl: 'https://www.youtube.com/embed/abc',
        platformUrl: 'https://youtube.com/watch?v=abc',
      }),
    ]

    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={links}
        onSpotifyChange={vi.fn()}
        onLinksChange={vi.fn()}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://youtu.be/abc' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(screen.getByText('This link is already added.')).toBeInTheDocument()
    })
  })

  it('submits on Enter in the URL field', async () => {
    resolveMusicMock.mockResolvedValue({
      platform: 'tidal',
      embedUrl: 'https://embed.tidal.com/tracks/1',
      title: 'Tidal',
      artist: '',
      thumbnail: '',
    })
    const onLinksChange = vi.fn()

    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={[]}
        onSpotifyChange={vi.fn()}
        onLinksChange={onLinksChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, {
      target: { value: 'https://listen.tidal.com/track/1' },
    })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(onLinksChange).toHaveBeenCalled()
    })
  })

  it('removes a link when remove is clicked', () => {
    const onLinksChange = vi.fn()
    const links = [makeLink({ title: 'One' }), makeLink({ title: 'Two' })]

    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={links}
        onSpotifyChange={vi.fn()}
        onLinksChange={onLinksChange}
      />
    )

    const removeButtons = screen.getAllByRole('button').filter((b) =>
      b.querySelector('.lucide-x')
    )
    fireEvent.click(removeButtons[0])

    expect(onLinksChange).toHaveBeenCalledWith([links[1]])
  })

  it('switches to Spotify Search tab', () => {
    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={[]}
        onSpotifyChange={vi.fn()}
        onLinksChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Spotify Search/i }))
    expect(screen.getByTestId('spotify-search')).toBeInTheDocument()
  })

  it('hides paste row when maxItems reached', () => {
    const links = [makeLink(), makeLink(), makeLink()]
    render(
      <MusicInput
        spotifyTracks={[]}
        musicLinks={links}
        onSpotifyChange={vi.fn()}
        onLinksChange={vi.fn()}
        maxItems={3}
      />
    )

    expect(
      screen.queryByPlaceholderText(/Paste a Spotify/)
    ).not.toBeInTheDocument()
  })
})
