'use client'

// ──────────────────────────────────────────────
// Review Selection Modal
// ──────────────────────────────────────────────
import { ArrowRight, Copy, X } from 'lucide-react'
import type { GalleryPhoto, GalleryProject } from './types'

export function ReviewSelectionModal({
  photos,
  selectedIds,
  project,
  onClose,
  onOpenConfirm,
  onDeselect,
  toast,
}: {
  photos: GalleryPhoto[]
  selectedIds: Set<string>
  project: GalleryProject
  onClose: () => void
  onOpenConfirm: () => void
  onDeselect: (id: string) => void
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const selectedPhotos = photos.filter((p) => selectedIds.has(p.id))
  const codes = selectedPhotos.map((p) => p.photoCode)

  function copyCodes() {
    navigator.clipboard?.writeText(codes.join('\n'))
    toast('Kode foto berhasil disalin ke clipboard!', 'success')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto no-scrollbar rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold font-heading tracking-tight text-slate-900">
              Foto Pilihan Anda
            </h2>
            <p className="mt-1 text-xs font-normal font-body text-slate-500">
              {selectedIds.size} dari maksimal {project.maxPhotos} foto dipilih. Anda dapat membatalkan foto sebelum konfirmasi final.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Photo Grid */}
        {selectedPhotos.length > 0 ? (
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 max-h-[300px] sm:max-h-[340px] overflow-y-auto no-scrollbar p-0.5">
            {selectedPhotos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-3/4 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-2xs hover:shadow-card-hover transition-all duration-300"
              >
                {p.previewUrl ? (
                  <img
                    src={p.previewUrl}
                    alt={p.photoCode}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-avatar">
                    <span className="font-body text-xs font-medium text-white">
                      {p.photoCode}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-900/80 px-1.5 py-0.5 font-body text-[10px] font-medium text-white backdrop-blur-xs">
                  {p.photoCode}
                </span>
                {!project.isLocked && (
                  <button
                    onClick={() => onDeselect(p.id)}
                    title="Batalkan pilihan foto ini"
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-md hover:bg-rose-700 transition"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs font-medium text-slate-500">
            Belum ada foto yang dipilih. Silakan pilih foto dari galeri terlebih dahulu.
          </div>
        )}

        {/* Photo Codes Summary */}
        {codes.length > 0 && (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-brand-soft p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-body uppercase tracking-wider text-blue-700">
                Daftar Kode Foto ({codes.length})
              </span>
              <button
                onClick={copyCodes}
                className="flex items-center gap-1 text-xs font-semibold font-body text-blue-600 hover:text-blue-800 transition"
              >
                <Copy size={13} />
                <span>Salin Kode</span>
              </button>
            </div>
            <p className="mt-2 font-body text-xs font-medium leading-relaxed text-slate-800">
              {codes.join(' · ')}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-between sm:items-center">
          <button
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold font-body text-slate-600 hover:bg-slate-50 transition"
          >
            Lanjut Memilih
          </button>
          {!project.isLocked && (
            <button
              onClick={() => {
                onClose()
                onOpenConfirm()
              }}
              disabled={selectedIds.size === 0}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left px-5 text-xs font-semibold font-body text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-50 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <span>Selesaikan Pilihan</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
