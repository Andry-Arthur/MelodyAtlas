import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { exchangeCodeForToken } from '@/lib/spotify'

export function SpotifyCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      exchangeCodeForToken(code).then(() => {
        navigate('/', { replace: true })
      })
    } else {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Connecting Spotify...</p>
      </div>
    </div>
  )
}
