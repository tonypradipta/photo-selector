'use client'

// ──────────────────────────────────────────────
// Main Gallery Client Orchestrator
// ──────────────────────────────────────────────
import { useMemo, useState, useEffect } from 'react'
import {
  Check, ChevronLeft, ChevronRight, Clock, Heart,
  Image as ImageIcon, Loader2, Lock, Search,
  Sparkles, X
} from 'lucide-react'
import type { GalleryPhoto, GalleryProject } from './types'
export type { GalleryPhoto, GalleryProject } from './types'
import { getPhotoFallbackUrl } from '@/lib/api-client'
import { useLanguage } from '@/lib/language-context'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

import { Toast } from './Toast'
import { PasswordUnlockScreen } from './PasswordUnlockScreen'
import { ReviewSelectionModal } from './ReviewSelectionModal'
import { FinalConfirmationModal } from './FinalConfirmationModal'
import { CompletedView } from './CompletedView'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function normalizeWhatsappNumber(raw?: string | null): string {
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1)
  }
  return digits
}

function generateWhatsAppMessage(
  projectName: string,
  clientName: string,
  codes: string[]
): string {
  const numberedCodes = codes.map((c, i) => `${i + 1}. ${c}`).join('\n')
  return (
    `Halo Kak,\n\n` +
    `Saya sudah selesai memilih foto untuk project:\n` +
    `*${projectName}*\n\n` +
    `Nama Client:\n` +
    `${clientName}\n\n` +
    `Jumlah Foto:\n` +
    `${codes.length} foto\n\n` +
    `Kode Foto Pilihan:\n` +
    `${numberedCodes}\n\n` +
    `Pilihan sudah saya konfirmasi melalui Perumda Photo.\n\n` +
    `Terima kasih.`
  )
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────
interface Props {
  token: string
  project: GalleryProject
  photos: GalleryPhoto[]
  initialSelectedIds: string[]
  accessGranted: boolean
}

export default function SelectGalleryClient({
  token,
  project,
  photos,
  initialSelectedIds,
  accessGranted,
}: Props) {
  const { t } = useLanguage()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  )
  const [filter, setFilter] = useState<'all' | 'selected'>('all')
  const [search, setSearch] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(project.isCompleted)
  const [toast, setToast] = useState<{
    message: string
    type: 'error' | 'success' | 'info'
  } | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  function showToast(
    message: string,
    type: 'error' | 'success' | 'info' = 'info'
  ) {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Password gate ──
  if (!accessGranted) {
    return <PasswordUnlockScreen token={token} />
  }

  // ── Filter + Search ──
  const visiblePhotos = useMemo(() => {
    let list =
      filter === 'selected'
        ? photos.filter((p) => selectedIds.has(p.id))
        : photos

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.photoCode.toLowerCase().includes(q) ||
          p.fileName.toLowerCase().includes(q)
      )
    }
    return list
  }, [photos, filter, selectedIds, search])

  const lightboxPhoto = lightbox
    ? photos.find((p) => p.id === lightbox) ?? null
    : null
  const lightboxIndex = lightboxPhoto
    ? visiblePhotos.findIndex((p) => p.id === lightbox)
    : -1

  // ── Keyboard navigation for Lightbox ──
  useEffect(() => {
    if (!lightboxPhoto) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLightbox(null)
      } else if (e.key === 'ArrowLeft') {
        if (lightboxIndex > 0) {
          setLightbox(visiblePhotos[lightboxIndex - 1].id)
        }
      } else if (e.key === 'ArrowRight') {
        if (lightboxIndex < visiblePhotos.length - 1) {
          setLightbox(visiblePhotos[lightboxIndex + 1].id)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxPhoto, lightboxIndex, visiblePhotos])

  // ── Select / Deselect Photo Handler ──
  async function toggleSelection(photoId: string) {
    if (project.isLocked || isCompleted) {
      showToast('Pilihan foto pada galeri ini sudah dikunci.', 'error')
      return
    }

    const isCurrentlySelected = selectedIds.has(photoId)

    if (!isCurrentlySelected && selectedIds.size >= project.maxPhotos) {
      showToast(
        t('quotaReachedAlert', { max: project.maxPhotos }),
        'error'
      )
      return
    }

    // Optimistic UI update
    const nextSet = new Set(selectedIds)
    if (isCurrentlySelected) {
      nextSet.delete(photoId)
    } else {
      nextSet.add(photoId)
    }
    setSelectedIds(nextSet)
    setPendingId(photoId)

    try {
      const res = await fetch(`/api/gallery/${token}/selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, selected: !isCurrentlySelected }),
      })

      if (!res.ok) {
        // Rollback
        setSelectedIds(new Set(selectedIds))
        const data = (await res.json()) as { error?: string }
        showToast(data.error ?? 'Gagal menyimpan pilihan foto.', 'error')
      } else {
        if (!isCurrentlySelected) {
          showToast('Foto berhasil ditambahkan ke pilihan', 'success')
        }
      }
    } catch {
      setSelectedIds(new Set(selectedIds))
      showToast('Koneksi internet bermasalah. Silakan coba lagi.', 'error')
    } finally {
      setPendingId(null)
    }
  }

  // ── Final Confirmation Submit ──
  async function handleFinalSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/gallery/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_photo_ids: Array.from(selectedIds),
        }),
      })

      if (res.ok) {
        setIsCompleted(true)
        setShowConfirmModal(false)
        showToast('Pilihan foto Anda berhasil dikonfirmasi!', 'success')
      } else {
        const data = (await res.json()) as { error?: string }
        showToast(
          data.error ?? 'Gagal mengonfirmasi pilihan foto. Silakan coba lagi.',
          'error'
        )
      }
    } catch {
      showToast('Koneksi internet bermasalah. Silakan coba lagi.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCount = selectedIds.size
  const selectedPhotosList = photos.filter((p) => selectedIds.has(p.id))
  const selectedCodes = selectedPhotosList.map((p) => p.photoCode)

  function copyAllCodes() {
    navigator.clipboard?.writeText(selectedCodes.join('\n'))
    showToast(t('copied'), 'success')
  }

  function openWhatsApp() {
    if (!project.whatsappNumber) {
      showToast('Nomor WhatsApp belum dikonfigurasi oleh fotografer.', 'error')
      return
    }
    const message = generateWhatsAppMessage(
      project.name,
      project.clientName,
      selectedCodes
    )
    const phone = normalizeWhatsappNumber(project.whatsappNumber)
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank'
    )
  }

  // ── Completed State ──
  if (isCompleted) {
    return (
      <CompletedView
        project={project}
        selectedCodes={selectedCodes}
        selectedPhotosList={selectedPhotosList}
        toast={toast}
        onCopyAllCodes={copyAllCodes}
        onOpenWhatsApp={openWhatsApp}
      />
    )
  }

  // ── Active Gallery Selection View ──
  return (
    <main className="min-h-screen bg-page-bg text-slate-800 pb-28">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-blue-100 bg-white/85 px-4 backdrop-blur-xl sm:px-10 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src="/logo.png"
            alt="Perumda Photo"
            className="size-8 rounded-xl border border-blue-200 bg-white object-contain p-0.5 shadow-2xs shrink-0"
          />
          <span className="hidden text-sm font-bold text-slate-900 sm:inline truncate">
            {project.studioName || 'Perumda Photo'}
          </span>
          <span className="hidden text-slate-300 sm:inline">/</span>
          <span className="text-xs sm:text-sm font-bold text-blue-600 truncate">
            {project.clientName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />

          {project.isLocked ? (
            <span className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium font-body text-rose-700 shadow-2xs">
              <Lock size={12} /> {t('statusLocked')}
            </span>
          ) : !isCompleted ? (
            <span className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium font-body text-blue-700 shadow-2xs">
              <Sparkles size={12} />
              <span className="hidden sm:inline">Pilihan Aman &amp; Privat</span>
              <span className="sm:hidden">Pilihan Aktif</span>
            </span>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-3.5 py-6 sm:px-8 sm:py-10">
        {/* Hero Section */}
        <div className="mx-auto max-w-[680px] text-center">
          {project.studioName && (
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              {project.studioName}
            </p>
          )}
          <h1 className="mt-1.5 text-2xl sm:text-4xl font-bold font-heading tracking-tight text-slate-900 leading-tight">
            {project.name}
          </h1>
          <p className="mx-auto mt-2 text-xs sm:text-sm font-normal font-body leading-relaxed text-slate-500 max-w-[500px]">
            {t('selectInstruction')}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-medium font-body text-blue-700 shadow-2xs">
            <span>{t('selectedCountOfMax', { selected: selectedCount, max: project.maxPhotos })}</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-y border-blue-100 py-3.5 sm:flex-row">
          <div className="flex w-full sm:w-auto items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-initial text-center rounded-xl px-4 py-2 text-xs font-semibold font-body transition-all ${
                filter === 'all'
                  ? 'bg-brand-gradient bg-[length:200%_100%] bg-left text-white shadow-glow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('tabAllPhotos')} ({photos.length})
            </button>
            <button
              onClick={() => setFilter('selected')}
              className={`flex-1 sm:flex-initial text-center rounded-xl px-4 py-2 text-xs font-semibold font-body transition-all ${
                filter === 'selected'
                  ? 'bg-brand-gradient bg-[length:200%_100%] bg-left text-white shadow-glow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('tabSelectedPhotos')} ({selectedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-[260px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPhotosPlaceholder')}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-4 focus:ring-brand-400/20 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
          {visiblePhotos.map((photo, idx) => {
            const isSelected = selectedIds.has(photo.id)
            const isPending = pendingId === photo.id

            return (
              <div
                key={photo.id}
                onClick={() => setLightbox(photo.id)}
                className={`group relative aspect-3/4 cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-2xs smooth-card hover:border-blue-300 hover:shadow-card-hover animate-card-enter stagger-${(idx % 12) + 1} motion-reduce:transition-none motion-reduce:hover:transform-none ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                    : 'border-slate-200/90'
                }`}
              >
                {photo.previewUrl || photo.id ? (
                  <img
                    src={photo.previewUrl || getPhotoFallbackUrl(photo.id)}
                    alt={photo.photoCode}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const fallback = getPhotoFallbackUrl(photo.id)
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback
                      }
                    }}
                    className="h-full w-full object-cover smooth-zoom group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-avatar">
                    <span className="font-body text-xs font-medium text-white">
                      {photo.photoCode}
                    </span>
                  </div>
                )}

                {/* Selection toggle button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelection(photo.id)
                  }}
                  disabled={project.isLocked}
                  aria-label={`${isSelected ? 'Hapus' : 'Pilih'} foto ${photo.photoCode}`}
                  className={`absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full shadow-md transition-all ${
                    isSelected
                      ? 'bg-brand-gradient text-white scale-105 shadow-glow'
                      : 'border border-white/80 bg-white/90 text-slate-600 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                  ) : isSelected ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <Heart size={15} />
                  )}
                </button>

                {/* Photo code badge */}
                <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 rounded-lg bg-slate-900/80 px-2 py-0.5 font-body text-[11px] font-medium text-white backdrop-blur-xs">
                  {photo.photoCode}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {visiblePhotos.length === 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-blue-200 bg-white/60 py-16 text-center text-xs text-slate-500 px-4">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon size={36} className="text-blue-300" />
                <p className="font-bold text-slate-800 text-sm">{t('noPhotosFound')}</p>
              </div>
            ) : (
              <p className="font-medium">{t('noPhotosFound')}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Bar ── */}
      <div className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-20px)] sm:w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-blue-500/30 bg-slate-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur-2xl">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-sm font-bold text-white">
            {selectedCount} / {project.maxPhotos} {t('photosSelected')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="h-10 rounded-xl border border-white/20 bg-white/10 px-3.5 text-xs font-bold text-white hover:bg-white/20 transition active:scale-[0.98]"
          >
            {t('btnReviewSelection', { count: selectedCount })}
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={selectedCount === 0 || project.isLocked}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left px-4 sm:px-5 text-xs font-bold text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            <Check size={15} strokeWidth={2.5} />
            <span>{t('btnSubmitSelection')}</span>
          </button>
        </div>
      </div>

      {/* ── Fullscreen Lightbox ── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 sm:p-4 backdrop-blur-md"
          role="dialog"
          aria-label="Photo preview"
          onClick={() => setLightbox(null)}
        >

          {lightboxIndex > 0 && (
            <button
              onClick={() => setLightbox(visiblePhotos[lightboxIndex - 1].id)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:left-6"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="flex max-h-[82vh] max-w-[92vw] sm:max-w-[88vw] flex-col items-center justify-center">
            {lightboxPhoto.previewUrl || lightboxPhoto.id ? (
              <img
                src={lightboxPhoto.previewUrl || getPhotoFallbackUrl(lightboxPhoto.id)}
                alt={`Foto ${lightboxPhoto.photoCode}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fallback = getPhotoFallbackUrl(lightboxPhoto.id)
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback
                  }
                }}
                className="max-h-[68vh] sm:max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <div className="flex size-64 items-center justify-center rounded-2xl bg-avatar">
                <span className="font-body text-base font-medium text-white">
                  {lightboxPhoto.photoCode}
                </span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-lg bg-white/10 px-3 py-1 font-body text-xs font-medium text-white">
                {lightboxPhoto.photoCode}
              </span>
              <span className="font-body text-xs font-normal text-slate-400">
                {lightboxIndex + 1} / {visiblePhotos.length}
              </span>
            </div>
          </div>

          {lightboxIndex < visiblePhotos.length - 1 && (
            <button
              onClick={() => setLightbox(visiblePhotos[lightboxIndex + 1].id)}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:right-6"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Bottom select toggle inside Lightbox */}
          {!project.isLocked && (
            <button
              type="button"
              onClick={() => toggleSelection(lightboxPhoto.id)}
              className={`absolute bottom-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold font-body shadow-xl transition-all ${
                selectedIds.has(lightboxPhoto.id)
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {selectedIds.has(lightboxPhoto.id) ? (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span>{t('photosSelected')}</span>
                </>
              ) : (
                <>
                  <Heart size={16} />
                  <span>{t('selectInstruction')}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Review Selection Modal */}
      {showReviewModal && (
        <ReviewSelectionModal
          photos={photos}
          selectedIds={selectedIds}
          project={project}
          onClose={() => setShowReviewModal(false)}
          onOpenConfirm={() => setShowConfirmModal(true)}
          onDeselect={toggleSelection}
          toast={showToast}
        />
      )}

      {/* Final Confirmation Modal */}
      {showConfirmModal && (
        <FinalConfirmationModal
          selectedCount={selectedCount}
          codes={selectedCodes}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  )
}
