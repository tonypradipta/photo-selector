'use client'

import { useState, useEffect } from 'react'
import {
  Download, Lock, Sparkles, MessageCircle, Check,
  AlertCircle, Image as ImageIcon,
  Loader2, X, ChevronLeft, ChevronRight, ShieldCheck,
  Calendar, Eye
} from 'lucide-react'
import { publicDelivery, type PublicDeliveryResponse } from '@/lib/api-client'
import { useLanguage } from '@/lib/language-context'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

interface ClientDeliveryGalleryProps {
  token: string
}

export function ClientDeliveryGallery({ token }: ClientDeliveryGalleryProps) {
  const { language, t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PublicDeliveryResponse | null>(null)

  // PIN state
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [verifyingPin, setVerifyingPin] = useState(false)

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [downloadingZip, setDownloadingZip] = useState(false)

  useEffect(() => {
    loadDelivery()
  }, [token])

  async function loadDelivery() {
    setLoading(true)
    setError(null)
    try {
      const res = await publicDelivery.getByToken(token)
      setData(res)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat halaman delivery. Link mungkin tidak valid atau sudah kedaluwarsa.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault()
    if (!pinInput.trim()) {
      setPinError('Silakan masukkan PIN')
      return
    }
    setVerifyingPin(true)
    setPinError(null)
    try {
      await publicDelivery.verifyPin(token, pinInput.trim())
      // Reload delivery data now that PIN cookie is set
      await loadDelivery()
    } catch (err: any) {
      setPinError(err.message || 'PIN yang Anda masukkan salah.')
    } finally {
      setVerifyingPin(false)
    }
  }

  function handleDownloadZip() {
    if (!data?.delivery?.zip_download_url) return
    setDownloadingZip(true)
    window.location.href = data.delivery.zip_download_url
    setTimeout(() => setDownloadingZip(false), 3000)
  }

  const photos = data?.photos || []
  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-page-bg text-slate-700 p-4">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-xs sm:text-sm font-bold tracking-tight">{language === 'id' ? 'Memuat galeri foto Anda...' : 'Loading your photo gallery...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-page-bg p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{language === 'id' ? 'Akses Tidak Tersedia' : 'Access Unavailable'}</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{error}</p>
        </div>
      </div>
    )
  }

  // PIN Lock Screen
  if (data?.delivery?.is_pin_protected && !data.delivery.unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-4 text-white">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30 mx-auto mb-4 shadow-inner">
            <Lock size={28} />
          </div>

          <div className="text-center mb-6">
            <span className="text-[11px] font-medium font-body text-blue-300 uppercase tracking-widest">
              {data.project.studio_name || 'Studio'}
            </span>
            <h1 className="text-xl font-bold font-heading mt-1 text-white tracking-tight">
              {data.project.name}
            </h1>
            <p className="text-xs font-normal font-body text-slate-300 mt-1">
              {language === 'id' ? 'Untuk' : 'For'} <b className="font-semibold text-white">{data.project.client_name}</b>
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-200 text-center">
                {language === 'id' ? 'Masukkan PIN untuk Membuka:' : 'Enter PIN to Unlock:'}
              </label>
              <input
                type="password"
                maxLength={12}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN"
                autoFocus
                className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-2xl text-center text-lg font-mono tracking-widest text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-4 focus:ring-brand-400/40 focus:border-blue-400 transition"
              />
              {pinError && (
                <p className="text-xs text-rose-300 text-center mt-1 font-semibold">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifyingPin || !pinInput.trim()}
              className="w-full py-3.5 px-4 bg-brand-gradient bg-[length:200%_100%] bg-left hover:bg-right text-white font-semibold font-body text-xs sm:text-sm rounded-xl shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyingPin ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span>{language === 'id' ? 'Buka Galeri Foto' : 'Unlock Photo Gallery'}</span>
            </button>
          </form>

          {data.project.whatsapp_number && (
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <a
                href={`https://wa.me/${data.project.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition"
              >
                <MessageCircle size={14} />
                <span>{language === 'id' ? 'Lupa PIN? Hubungi Fotografer' : 'Forgot PIN? Contact Photographer'}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Client Delivery Portal View
  return (
    <div className="min-h-screen bg-page-bg text-slate-800 pb-16">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-blue-100 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block truncate">
                {data?.project.studio_name || 'Dokumentasi Foto'}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {data?.project.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />

            {/* Quick Action: Download ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip || photos.length === 0}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left hover:bg-right text-white text-xs sm:text-sm font-bold shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              {downloadingZip ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>{t('downloadAllBtn')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Intro Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium font-body backdrop-blur-xs mb-3">
              <Check size={13} strokeWidth={2.5} />
              <span>{t('deliveryGalleryTitle')}</span>
            </span>
            <h2 className="text-xl sm:text-3xl font-bold font-heading tracking-tight">
              {language === 'id' ? `Halo, Kak ${data?.project.client_name}! 📸✨` : `Hello, ${data?.project.client_name}! 📸✨`}
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-normal font-body text-blue-100 leading-relaxed">
              {t('deliveryGalleryDesc')}
            </p>

            {data?.delivery?.notes && (
              <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-blue-50">
                <p className="font-semibold text-white mb-0.5">{language === 'id' ? 'Catatan dari Fotografer:' : 'Notes from Photographer:'}</p>
                <p className="italic">"{data.delivery.notes}"</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-blue-100 border-t border-white/15 pt-4">
            <span>{language === 'id' ? 'Total Foto:' : 'Total Photos:'} <b className="text-white">{photos.length} {t('photosCount')}</b></span>
            {data?.delivery?.expires_at && (
              <span className="flex items-center gap-1 text-amber-200">
                <Calendar size={13} />
                <span>{language === 'id' ? 'Berlaku hingga:' : 'Valid until:'} {new Date(data.delivery.expires_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Photos Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold font-heading text-slate-900">
            {language === 'id' ? `Daftar Foto Resolusi Penuh (${photos.length})` : `Full Resolution Photos (${photos.length})`}
          </h3>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 text-center p-6">
            <ImageIcon size={48} className="text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">{t('noPhotosFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className={`group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-2xs smooth-card hover:shadow-card-hover hover:border-blue-300 animate-card-enter stagger-${(idx % 12) + 1} overflow-hidden motion-reduce:transition-none motion-reduce:hover:transform-none`}
              >
                {/* Photo Preview Container */}
                <div
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-4/3 w-full bg-slate-100 cursor-pointer overflow-hidden"
                >
                  <img
                    src={photo.thumbnail_url || photo.download_url}
                    alt={photo.file_name}
                    className="size-full object-cover smooth-zoom group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md">
                      <Eye size={16} />
                    </span>
                  </div>

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/60 backdrop-blur-xs text-[10px] font-bold text-white">
                    #{idx + 1}
                  </span>
                </div>

                {/* Photo Footer */}
                <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium font-body text-slate-800 truncate" title={photo.file_name}>
                      {photo.file_name}
                    </p>
                  </div>

                  <a
                    href={photo.download_url}
                    download={photo.file_name}
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 hover:bg-brand-soft text-brand-700 border border-brand-200 hover:border-brand-400 transition-all shadow-2xs"
                    title={t('downloadPhotoBtn')}
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={20} />
          </button>

          {/* Nav previous */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex - 1)
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Nav next */}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex + 1)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative flex flex-col items-center max-w-5xl max-h-[85vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto.thumbnail_url?.replace(/=s\d+.*$/, '=s1600') || activePhoto.download_url}
              alt={activePhoto.file_name}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Lightbox Toolbar */}
            <div className="mt-4 flex items-center justify-between w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-2.5 text-white text-xs">
              <span className="font-semibold truncate mr-3">{activePhoto.file_name}</span>
              <a
                href={activePhoto.download_url}
                download={activePhoto.file_name}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gradient text-white font-bold shadow-glow hover:shadow-glow-lg transition"
              >
                <Download size={14} />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
