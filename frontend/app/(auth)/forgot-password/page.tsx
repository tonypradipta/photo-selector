'use client'

import { useState } from 'react'
import { auth } from '@/lib/api-client'
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
      await auth.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak terduga.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Perumda Photo Selector" className="size-10 rounded-xl border border-blue-200 bg-white object-contain p-1 shadow-2xs" />
            <span className="text-lg font-bold tracking-tight text-slate-900">Perumda Photo Selector</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
                <Check size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Check your email</h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
                We sent a password reset link to <strong className="text-slate-800">{email}</strong>. Check your inbox and follow the link.
              </p>
              <a href="/login" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                <ArrowLeft size={14} /> Back to sign in
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset your password</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">Enter your account email and we will send you a reset link.</p>

              <div className="mt-6 grid gap-1.5">
                <label htmlFor="email" className="text-xs font-bold text-slate-800">Email address</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@yourstudio.com" className="form-input has-icon-left" />
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-xs sm:text-sm font-bold text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <a href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
                <ArrowLeft size={14} /> Back to sign in
              </a>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
