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
    <main className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Perumda Photo" className="size-10 rounded-xl border border-blue-200 bg-white object-contain p-1 shadow-2xs" />
            <span className="text-lg font-bold tracking-tight text-slate-900">Perumda Photo</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
                <Check size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Password updated!</h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">Redirecting you to the dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set new password</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">Choose a strong password for your account.</p>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-1.5">
                  <label htmlFor="new-password" className="text-xs font-bold text-slate-800">New password</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="new-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="form-input has-icon-left has-icon-right" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="confirm-password" className="text-xs font-bold text-slate-800">Confirm password</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="confirm-password" type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your new password" className="form-input has-icon-left" />
                  </div>
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-xs sm:text-sm font-bold text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
