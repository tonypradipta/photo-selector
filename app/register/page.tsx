'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Kata sandi harus minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin) : ''
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
          data: {
            full_name: fullName.trim(),
            studio_name: studioName.trim(),
          },
        },
      })

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setError('Email ini sudah terdaftar. Silakan masuk ke akun Anda.')
        } else if (authError.message.toLowerCase().includes('password')) {
          setError('Kata sandi harus minimal 6 karakter.')
        } else if (authError.message.toLowerCase().includes('invalid')) {
          setError('Alamat email tidak valid. Silakan periksa kembali.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      // If user is returned and session exists immediately
      if (data.session && data.user) {
        // Upsert profile
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            studio_name: studioName.trim(),
            updated_at: new Date().toISOString(),
          })
        } catch {}

        // Redirect to dashboard
        window.location.href = '/'
        return
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        setRegisteredEmail(email.trim())
        setRequiresConfirmation(true)
      } else {
        window.location.href = '/'
      }
    } catch {
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px]">
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
          <p className="text-[13px] text-[#64748b]">Daftar akun fotografer & studio baru</p>
        </div>

        {/* Card */}
        <div className="rounded-[16px] border border-[#bfdbfe] bg-white/95 p-8 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl">
          {requiresConfirmation ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[#2563eb]">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0f172a]">
                Pendaftaran Berhasil!
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
                Kami telah mengirimkan tautan konfirmasi ke <strong>{registeredEmail}</strong>. Silakan periksa inbox email Anda untuk mengaktifkan akun.
              </p>
              <a
                href="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 h-10 w-full rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] transition"
              >
                Kembali ke Halaman Masuk
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#0f172a]">
                Buat Akun Baru
              </h1>
              <p className="mt-1 text-[13px] text-[#64748b]">
                Lengkapi informasi di bawah untuk mulai mengelola galeri foto Anda.
              </p>

              <div className="mt-6 grid gap-4">
                {/* Full Name */}
                <div className="grid gap-1.5">
                  <label htmlFor="fullName" className="text-[13px] font-medium text-[#0f172a]">
                    Nama Lengkap
                  </label>
                  <div className="relative flex items-center">
                    <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Anda"
                      className="form-input has-icon-left"
                    />
                  </div>
                </div>

                {/* Studio Name */}
                <div className="grid gap-1.5">
                  <label htmlFor="studioName" className="text-[13px] font-medium text-[#0f172a]">
                    Nama Studio / Brand
                  </label>
                  <div className="relative flex items-center">
                    <Building2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
                    <input
                      id="studioName"
                      type="text"
                      required
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="contoh: Lumina Photography"
                      className="form-input has-icon-left"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="grid gap-1.5">
                  <label htmlFor="email" className="text-[13px] font-medium text-[#0f172a]">
                    Alamat Email
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
                      placeholder="studio@anda.com"
                      className="form-input has-icon-left"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid gap-1.5">
                  <label htmlFor="password" className="text-[13px] font-medium text-[#0f172a]">
                    Kata Sandi
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
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

                {/* Confirm Password */}
                <div className="grid gap-1.5">
                  <label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#0f172a]">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="form-input has-icon-left"
                    />
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
                className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:cursor-not-allowed disabled:opacity-60 transition"
              >
                {loading ? 'Mendaftarkan akun…' : (
                  <>
                    <span>Daftar Sekarang</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e2e8f0]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white/95 px-2 text-[#94a3b8]">Sudah punya akun?</span>
                </div>
              </div>

              <a
                href="/login"
                className="flex h-10 w-full items-center justify-center rounded-[8px] border border-[#bfdbfe] bg-white text-[13px] font-medium text-[#2563eb] hover:bg-[#eff6ff] transition"
              >
                Masuk ke Akun
              </a>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-[#94a3b8]">
          Perumda Photo Selector · Khusus fotografer & studio
        </p>
      </div>
    </main>
  )
}
