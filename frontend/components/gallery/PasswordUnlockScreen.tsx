'use client'

// ──────────────────────────────────────────────
// Password Unlock Screen
// ──────────────────────────────────────────────
import { useState } from 'react'
import { AlertCircle, Lock } from 'lucide-react'

export function PasswordUnlockScreen({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/gallery/${token}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Kata sandi salah. Silakan coba lagi.')
      }
    } catch {
      setError('Gagal terhubung ke server. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img
            src="/logo.png"
            alt="Perumda Photo"
            className="size-9 rounded-xl border border-blue-200 bg-white object-contain p-0.5 shadow-2xs"
          />
          <span className="text-base font-bold text-slate-900">
            Perumda Photo
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
            <Lock size={22} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Galeri Dilindungi Kata Sandi
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Masukkan kata sandi yang diberikan oleh fotografer untuk melihat dan memilih foto.
          </p>
          <div className="mt-6 grid gap-1.5">
            <label
              htmlFor="gallery-password"
              className="text-xs font-bold text-slate-800"
            >
              Kata Sandi
            </label>
            <input
              id="gallery-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi galeri"
              className="form-input"
              autoFocus
            />
          </div>
          {error && (
            <div
              role="alert"
              className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-11 w-full rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-xs sm:text-sm font-bold text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            {loading ? 'Memverifikasi…' : 'Buka Galeri'}
          </button>
        </form>
      </div>
    </main>
  )
}
