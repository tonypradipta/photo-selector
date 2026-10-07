'use client'

import { useState } from 'react'
import { auth } from '@/lib/api-client'
import { Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

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
      await auth.updatePassword({ password, password_confirmation: confirmPassword })
      setDone(true)
      setTimeout(() => { window.location.href = '/' }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-100/60 flex items-center justify-center px-4 py-12 overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Dynamic Ambient Blur Orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-400/25 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/4 -right-24 h-[420px] w-[420px] rounded-full bg-sky-300/35 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-indigo-300/25 blur-[90px]" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Top Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <div className="size-11 rounded-2xl bg-white/90 p-1.5 shadow-lg shadow-blue-500/10 border border-white/80 backdrop-blur-md flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Perumda Photo"
                className="size-full object-contain"
              />
            </div>
            <span className="text-xl font-bold font-heading text-slate-900 tracking-tight">
              Perumda Photo
            </span>
          </div>
        </div>

        {/* Translucent Glassmorphic Card */}
        <div className="rounded-[32px] border border-white/80 bg-white/75 p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] backdrop-blur-2xl backdrop-saturate-150 animate-in fade-in zoom-in-95 duration-200">
          {done ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                <Check size={30} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-slate-900">
                Password updated!
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-body">
                Redirecting you to the dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900">
                Set new password
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-normal font-body text-slate-500">
                Choose a strong password with at least 8 characters.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-1.5">
                  <label htmlFor="password" className="text-xs sm:text-[13px] font-semibold font-body text-slate-700">
                    New password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="h-12 w-full rounded-2xl border border-blue-200/80 bg-white/90 px-4 pl-11 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-body shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="z-10 absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="confirmPassword" className="text-xs sm:text-[13px] font-semibold font-body text-slate-700">
                    Confirm new password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="h-12 w-full rounded-2xl border border-blue-200/80 bg-white/90 px-4 pl-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-body shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/15"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-medium font-body text-rose-700 shadow-2xs backdrop-blur-xs">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-[length:200%_100%] bg-left text-xs sm:text-sm font-semibold font-body text-white shadow-lg shadow-blue-500/30 hover:bg-right hover:shadow-blue-500/45 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs font-normal font-body text-slate-500">
          Perumda Photo - For photographers only
        </p>
      </div>
    </main>
  )
}
