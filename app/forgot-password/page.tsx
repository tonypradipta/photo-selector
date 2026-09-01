'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, Check, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin) : ''
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${appUrl}/auth/callback?next=/update-password` }
      )

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Perumda Photo Selector" className="size-10 rounded-[10px] border border-[#bfdbfe]/50 bg-white object-contain p-1 shadow-sm" />
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#0f172a]">Perumda Photo Selector</span>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#bfdbfe] bg-white/95 p-8 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe]">
                <Check size={22} className="text-[#2563eb]" />
              </div>
              <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0f172a]">Check your email</h1>
              <p className="mt-2 text-[13px] leading-6 text-[#64748b]">
                We sent a password reset link to <strong>{email}</strong>.
                Check your inbox and follow the link to reset your password.
              </p>
              <a
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                <ArrowLeft size={13} /> Back to sign in
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#0f172a]">Reset your password</h1>
              <p className="mt-1 text-[13px] text-[#64748b]">
                Enter your account email and we'll send you a reset link.
              </p>

              <div className="mt-7 grid gap-1.5">
                <label htmlFor="email" className="text-[13px] font-medium text-[#0f172a]">Email address</label>
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

              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#dc2626]">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-10 w-full rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-60 transition"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <a href="/login" className="mt-4 flex items-center justify-center gap-2 text-[12px] font-medium text-[#64748b] hover:text-[#0f172a]">
                <ArrowLeft size={13} /> Back to sign in
              </a>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
