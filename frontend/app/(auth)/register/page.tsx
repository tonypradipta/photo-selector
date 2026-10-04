'use client'

import { useState } from 'react'
import { auth } from '@/lib/api-client'
import { Lock, Mail, Eye, EyeOff, User, Building2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [studioName, setStudioName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail.endsWith('@thb.id')) {
      setError('Alamat email harus menggunakan domain @thb.id (contoh: nama@thb.id).')
      return
    }

    const hasMinLen = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasMinLen || !hasUpper || !hasLower || !hasNumber) {
      setError('Kata sandi harus minimal 8 karakter dan mengombinasikan huruf besar, huruf kecil, serta angka.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    try {
      await auth.register({
        name: fullName.trim(),
        full_name: fullName.trim(),
        studio_name: studioName.trim(),
        email: trimmedEmail,
        password,
        password_confirmation: confirmPassword,
      })
      setSuccess(true)
      setTimeout(() => { window.location.href = '/' }, 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('already') || msg.includes('taken')) {
        setError('Email ini sudah terdaftar. Silakan masuk ke akun Anda.')
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak terduga.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Perumda Photo Selector" className="size-10 rounded-xl border border-blue-200 bg-white object-contain p-1 shadow-2xs" />
            <span className="text-lg font-bold tracking-tight text-slate-900">Perumda Photo Selector</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500">Daftar akun fotografer & studio baru</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Pendaftaran Berhasil!</h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">Akun Anda berhasil dibuat. Mengarahkan ke dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Akun Baru</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">Lengkapi informasi di bawah untuk mulai mengelola galeri foto Anda.</p>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-1.5">
                  <label htmlFor="fullName" className="text-xs font-bold text-slate-800">Nama Lengkap</label>
                  <div className="relative flex items-center">
                    <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Anda" className="form-input has-icon-left" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="studioName" className="text-xs font-bold text-slate-800">Nama Studio / Brand</label>
                  <div className="relative flex items-center">
                    <Building2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="studioName" type="text" required value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="contoh: Humas Perumdam" className="form-input has-icon-left" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-800">Alamat Email</label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="humaspdam@thb.id" className="form-input has-icon-left" />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Hanya email dengan domain <span className="font-bold text-slate-700">@thb.id</span> yang dapat digunakan
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-slate-800">Kata Sandi</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="form-input has-icon-left has-icon-right" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Minimal 8 karakter, kombinasi huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9)
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-800">Konfirmasi Kata Sandi</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi" className="form-input has-icon-left" />
                  </div>
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-xs sm:text-sm font-bold text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none">
                {loading ? 'Mendaftarkan akun…' : <><span>Daftar Sekarang</span><ArrowRight size={15} /></>}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400 font-medium">Sudah punya akun?</span></div>
              </div>

              <a href="/login" className="flex h-11 w-full items-center justify-center rounded-xl bg-brand-50 text-brand-700 border border-brand-200 text-xs sm:text-sm font-bold hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs transition-all motion-reduce:transition-none motion-reduce:hover:transform-none">
                Masuk ke Akun
              </a>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Perumda Photo Selector · Khusus fotografer & studio</p>
      </div>
    </main>
  )
}
