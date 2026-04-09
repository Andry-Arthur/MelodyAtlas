import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Music, Image } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-zinc-950 to-purple-900/30" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Melody<span className="text-emerald-400">Atlas</span>
          </h1>
          <p className="text-xl text-white/50 mb-12">
            Pin your memories across the world
          </p>
          <div className="flex items-center justify-center gap-8 text-white/40">
            <div className="flex flex-col items-center gap-2">
              <MapPin size={28} />
              <span className="text-sm">Places</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Image size={28} />
              <span className="text-sm">Photos</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Music size={28} />
              <span className="text-sm">Music</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Melody<span className="text-emerald-400">Atlas</span>
            </h1>
            <p className="text-white/50 mt-2">
              Pin your memories across the world
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-6">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Loading...'
                : isSignUp
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-zinc-950 text-white/40">or</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={signInWithGoogle}
          >
            Continue with Google
          </Button>

          <p className="text-center text-white/40 text-sm mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
