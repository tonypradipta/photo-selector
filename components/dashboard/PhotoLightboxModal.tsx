'use client'

// ──────────────────────────────────────────────
// Photo Lightbox Modal (fullscreen viewer)
// ──────────────────────────────────────────────
import { useEffect } from 'react'
import { Check, ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react'
import { getPhotoFallbackUrl } from '@/lib/api-client'
import type { DrivePhotoItem } from './types'

export function PhotoLightboxModal({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: {
  photos: DrivePhotoItem[]
  currentIndex: number
  onClose: () => void
  onNavigate: (newIndex: number) => void
}) {
  const photo = photos[currentIndex]

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, photos.length, onClose, onNavigate])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-between bg-slate-950/95 p-4 backdrop-blur-md animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      {/* Top bar */}
      <div className="flex w-full items-center justify-between px-2 py-1 text-white">
        <div className="flex items-center gap-3">
          <span className="font-body text-sm font-medium tracking-wide">{photo.photoCode}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-xs font-normal text-slate-300">
            {currentIndex + 1} / {photos.length}
          </span>
          {photo.isSelected && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-body text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
              <Check size={12} /> Dipilih Klien
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Tutup pratinjau"
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Image View */}
      <div className="relative flex flex-1 w-full items-center justify-center overflow-hidden my-2">
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            aria-label="Foto sebelumnya"
            className="absolute left-2 sm:left-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {photo.previewUrl || photo.id ? (
          <img
            src={photo.previewUrl || getPhotoFallbackUrl(photo.id)}
            alt={photo.photoCode}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const fallback = getPhotoFallbackUrl(photo.id)
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback
              }
            }}
            className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageIcon size={48} />
            <p className="text-sm">{photo.fileName}</p>
          </div>
        )}

        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            aria-label="Foto selanjutnya"
            className="absolute right-2 sm:right-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      <div className="text-center font-body text-xs font-normal text-slate-400 pb-2">
        <span>Nama Berkas: <strong className="font-medium text-slate-200">{photo.fileName}</strong></span>
      </div>
    </div>
  )
}
