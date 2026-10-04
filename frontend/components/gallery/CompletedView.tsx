'use client'

// ──────────────────────────────────────────────
// Completed / Success State View
// ──────────────────────────────────────────────
import { ArrowRight, Check, CheckCircle2, Clock, Copy, Lock, MessageCircle } from 'lucide-react'
import { getPhotoFallbackUrl } from '@/lib/api-client'
import type { GalleryPhoto, GalleryProject } from './types'
import { Toast } from './Toast'
import { useLanguage } from '@/lib/language-context'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

interface Props {
  project: GalleryProject
  selectedCodes: string[]
  selectedPhotosList: GalleryPhoto[]
  toast: { message: string; type: 'error' | 'success' | 'info' } | null
  onCopyAllCodes: () => void
  onOpenWhatsApp: () => void
}

export function CompletedView({
  project,
  selectedCodes,
  selectedPhotosList,
  toast,
  onCopyAllCodes,
  onOpenWhatsApp,
}: Props) {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-page-bg text-slate-800 pb-16">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-blue-100 bg-white/85 px-4 backdrop-blur-xl sm:px-10 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.png"
            alt="Perumda Photo Selector"
            className="size-8 rounded-xl border border-blue-200 bg-white object-contain p-0.5 shadow-2xs shrink-0"
          />
          <span className="hidden text-sm font-bold text-slate-900 sm:inline truncate">
            {project.studioName || 'Perumda Photo Selector'}
          </span>
          <span className="hidden text-slate-300 sm:inline">/</span>
          <span className="text-xs sm:text-sm font-bold text-blue-600 truncate">
            {project.clientName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />

          <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 shadow-2xs">
            <Lock size={12} className="shrink-0" />
            <span>{t('statusLocked')}</span>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <div className="mx-auto max-w-[720px] px-4 py-10 text-center sm:px-8 sm:py-16">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-brand-gradient bg-[length:200%_100%] bg-left text-white shadow-glow">
          <Check size={32} strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Pilihan Foto Berhasil Dikirim!
        </h1>

        <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-xs">
          <span className="relative flex size-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </span>
          <span>Pilihan Terkonfirmasi</span>
        </div>

        <p className="mx-auto mt-3 max-w-[500px] text-xs sm:text-sm leading-relaxed text-slate-500">
          Terima kasih, <strong className="text-slate-800">{project.clientName}</strong>. Anda telah memilih{' '}
          <strong className="text-blue-600">{selectedCodes.length} foto</strong>. Pilihan Anda telah berhasil dikirim ke fotografer.
        </p>

        {/* Photo codes box */}
        <div className="mx-auto mt-8 max-w-[540px] rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 text-left shadow-card-hover backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Project: {project.name}
              </p>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {selectedCodes.length} Foto Terpilih
              </p>
            </div>
          </div>

          <div className="mt-4 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin">
            <div className="grid grid-cols-2 gap-2">
              {selectedCodes.map((code, idx) => (
                <div
                  key={code}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 transition hover:border-blue-200 hover:bg-brand-soft"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                    {idx + 1}
                  </span>
                  <span className="truncate font-mono text-xs font-bold text-slate-800">
                    {code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={onCopyAllCodes}
              className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 px-4 text-xs font-bold hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <Copy size={15} />
              <span>Salin Semua Kode Foto</span>
            </button>

            <button
              onClick={onOpenWhatsApp}
              className="group relative flex w-full items-center justify-center gap-2.5 h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 px-5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <MessageCircle size={18} className="fill-white/20 text-white shrink-0" />
              <span>
                {project.whatsappNumber
                  ? `Kirim Pilihan ke WhatsApp Fotografer`
                  : 'Kirim Pilihan ke WhatsApp Fotografer'}
              </span>
              <ArrowRight size={15} className="ml-0.5 opacity-80 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>
        </div>

        {/* Thumbnail preview */}
        {selectedPhotosList.length > 0 && (
          <div className="mt-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Pratinjau Foto Pilihan
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
              {selectedPhotosList.map((p) => (
                <div
                  key={p.id}
                  className="group relative aspect-3/4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-card-hover hover:border-blue-300 hover:-translate-y-1 transition-all duration-300"
                >
                  {p.previewUrl || p.id ? (
                    <img
                      src={p.previewUrl || getPhotoFallbackUrl(p.id)}
                      alt={p.photoCode}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const fallback = getPhotoFallbackUrl(p.id)
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback
                        }
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-avatar">
                      <span className="font-mono text-[10px] font-bold text-white">
                        {p.photoCode}
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 rounded-md bg-slate-900/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-xs">
                    {p.photoCode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
