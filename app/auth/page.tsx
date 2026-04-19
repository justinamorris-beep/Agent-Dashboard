'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
      else setMessage({ type: 'success', text: 'Check your email to confirm your account.' })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: 'Invalid email or password.' })
      else router.push('/')
    }
    setLoading(false)
  }

  async function handleMagicLink() {
    if (!email) { setMessage({ type: 'error', text: 'Enter your email first.' }); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) setMessage({ type: 'error', text: error.message })
    else setMessage({ type: 'success', text: 'Magic link sent — check your inbox.' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kw-black px-4">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="font-condensed text-6xl font-black text-kw-red italic leading-none">kw</span>
          <div className="text-left">
            <p className="text-white font-condensed font-bold text-xl leading-tight tracking-wide">KELLER WILLIAMS</p>
            <p className="text-gray-400 font-condensed font-semibold text-sm tracking-widest">ARIZONA LIVING REALTY</p>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4 tracking-widest uppercase">Agent Dashboard</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
        <h1 className="text-xl font-bold mb-6 text-kw-black">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-kw-red transition-colors"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-kw-red transition-colors"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-kw py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Send magic link
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-kw-red font-semibold hover:underline">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      <p className="text-gray-600 text-xs mt-8">
        Need access? Contact your market center administrator.
      </p>
    </div>
  )
}
