'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/api-client'
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get('error')
      if (errorParam) setError(decodeURIComponent(errorParam))
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await auth.login(email.trim(), password)
      // Redirect to dashboard after successful login
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') ?? '/'
      window.location.href = next
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('401')) {
        setError('Email atau kata sandi salah. Silakan coba lagi.')
      } else if (msg.includes('too many') || msg.includes('429')) {
        setError('Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat.')
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak terduga.')
      }
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Perumda Photo"
              className="size-10 rounded-xl border border-blue-200 bg-white object-contain p-1 shadow-2xs"
            />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Perumda Photo
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500">Sign in to your photographer workspace</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Enter your credentials to continue.
          </p>

          <div className="mt-6 grid gap-4">
            {/* Email */}
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-800">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@yourstudio.com"
                  className="form-input has-icon-left"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-slate-800">
                  Password
                </label>
                <a href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="form-input has-icon-left has-icon-right"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-11 w-full rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-xs sm:text-sm font-bold text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 font-medium">Don&apos;t have an account?</span>
            </div>
          </div>

          <a
            href="/register"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-brand-50 text-brand-700 border border-brand-200 text-xs sm:text-sm font-bold hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            Create account
          </a>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Perumda Photo · For photographers only
        </p>
      </div>
    </main>
  )
}
