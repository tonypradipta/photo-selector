'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      if (errorParam) {
        setError(decodeURIComponent(errorParam))
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        const msg = authError.message.toLowerCase()
        if (msg.includes('invalid login credentials')) {
          setError('Email atau kata sandi salah. Silakan coba lagi.')
        } else if (msg.includes('email not confirmed')) {
          setError('Email belum dikonfirmasi. Silakan periksa inbox email Anda untuk memverifikasi akun.')
        } else if (msg.includes('too many requests')) {
          setError('Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      // Redirect to dashboard (middleware / proxy handles the rest)
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') ?? '/'
      window.location.href = next
    } catch {
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Perumda Photo Selector"
              className="size-10 rounded-[10px] border border-[#bfdbfe]/50 bg-white object-contain p-1 shadow-sm"
            />
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              Perumda Photo Selector
            </span>
          </div>
          <p className="text-[13px] text-[#64748b]">Sign in to your photographer workspace</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[16px] border border-[#bfdbfe] bg-white/95 p-8 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl"
        >
          <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#0f172a]">
            Welcome back
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Enter your credentials to continue.
          </p>

          <div className="mt-7 grid gap-4">
            {/* Email */}
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-[#0f172a]">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
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
                <label htmlFor="password" className="text-[13px] font-medium text-[#0f172a]">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8] hover:text-[#0f172a] transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#dc2626]">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-10 w-full rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/95 px-2 text-[#94a3b8]">Don&apos;t have an account?</span>
            </div>
          </div>

          <a
            href="/register"
            className="flex h-10 w-full items-center justify-center rounded-[8px] border border-[#bfdbfe] bg-white text-[13px] font-medium text-[#2563eb] hover:bg-[#eff6ff] transition"
          >
            Create account
          </a>
        </form>

        <p className="mt-6 text-center text-[12px] text-[#94a3b8]">
          Perumda Photo Selector · For photographers only
        </p>
      </div>
    </main>
  )
}
