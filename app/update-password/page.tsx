'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Supabase sends the access token in the URL hash after clicking the reset link
  useEffect(() => {
    const supabase = createClient()
    // The session is set automatically from the URL hash by the Supabase client
    supabase.auth.getSession()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setDone(true)
      setTimeout(() => { window.location.href = '/' }, 2500)
    } catch {
      setError('An unexpected error occurred. Please try again.')
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
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe]">
                <Check size={22} className="text-[#2563eb]" />
              </div>
              <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0f172a]">Password updated!</h1>
              <p className="mt-2 text-[13px] text-[#64748b]">Redirecting you to the dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#0f172a]">Set new password</h1>
              <p className="mt-1 text-[13px] text-[#64748b]">Choose a strong password for your account.</p>

              <div className="mt-7 grid gap-4">
                <div className="grid gap-1.5">
                  <label htmlFor="new-password" className="text-[13px] font-medium text-[#0f172a]">New password</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="form-input has-icon-left has-icon-right"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8] hover:text-[#0f172a] transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="confirm-password" className="text-[13px] font-medium text-[#0f172a]">Confirm password</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      className="form-input has-icon-left"
                    />
                  </div>
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
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
