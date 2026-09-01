'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  Check, ChevronLeft, ChevronRight, Copy, Heart,
  Lock, Search, X, AlertCircle, MessageCircle, Loader2,
  CheckCircle2, Image as ImageIcon, Eye, ArrowRight, Sparkles
} from 'lucide-react'
import type { GalleryPhoto, GalleryProject } from '@/app/select/[token]/page'

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
    `Pilihan sudah saya konfirmasi melalui Perumda Photo Selector.\n\n` +
    `Terima kasih.`
  )
}

// ──────────────────────────────────────────────
// Password Unlock Screen
// ──────────────────────────────────────────────
function PasswordUnlockScreen({ token }: { token: string }) {
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
    <main className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img
            src="/logo.png"
            alt="Perumda Photo Selector"
            className="size-9 rounded-[8px] border border-[#bfdbfe]/50 bg-white object-contain p-0.5 shadow-sm"
          />
          <span className="text-[16px] font-semibold text-[#0f172a]">
            Perumda Photo Selector
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-[16px] border border-[#bfdbfe] bg-white/95 p-8 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl"
        >
          <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[#2563eb]">
            <Lock size={22} />
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0f172a]">
            Galeri Dilindungi Kata Sandi
          </h1>
          <p className="mt-1.5 text-[13px] text-[#64748b]">
            Masukkan kata sandi yang diberikan oleh fotografer untuk melihat dan memilih foto.
          </p>
          <div className="mt-6 grid gap-1.5">
            <label
              htmlFor="gallery-password"
              className="text-[13px] font-medium text-[#0f172a]"
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
              className="mt-3 flex items-center gap-2 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#dc2626]"
            >
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 h-10 w-full rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-60 transition"
          >
            {loading ? 'Memverifikasi…' : 'Buka Galeri'}
          </button>
        </form>
      </div>
    </main>
  )
}

// ──────────────────────────────────────────────
// Toast Notification
// ──────────────────────────────────────────────
function Toast({
  message,
  type,
}: {
  message: string
  type: 'error' | 'success' | 'info'
}) {
  const colors = {
    error: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
    success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]',
    info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  }
  return (
    <div
      className={`fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[12.5px] font-medium shadow-xl backdrop-blur-xl ${colors[type]} animate-in fade-in slide-in-from-top-2 duration-150`}
    >
      {type === 'error' && <AlertCircle size={15} className="shrink-0" />}
      {type === 'success' && <CheckCircle2 size={15} className="shrink-0" />}
      <span>{message}</span>
    </div>
  )
}

// ──────────────────────────────────────────────
// Review Selection Modal
// ──────────────────────────────────────────────
function ReviewSelectionModal({
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/50 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto no-scrollbar rounded-[16px] border border-[#bfdbfe] bg-white/98 p-6 shadow-[0_24px_80px_rgba(37,99,235,0.18)] backdrop-blur-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0f172a]">
              Foto Pilihan Anda
            </h2>
            <p className="mt-1 text-[13px] text-[#64748b]">
              {selectedIds.size} dari maksimal {project.maxPhotos} foto dipilih. Anda dapat menghapus foto sebelum konfirmasi final.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 items-center justify-center rounded-full text-[#64748b] hover:bg-[#eff6ff] hover:text-[#0f172a] transition"
          >
            <X size={17} />
          </button>
        </div>

        {/* Selected Photo Grid */}
        {selectedPhotos.length > 0 ? (
          <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4 max-h-[340px] overflow-y-auto no-scrollbar p-1">
            {selectedPhotos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-[3/4] overflow-hidden rounded-[10px] border border-[#bfdbfe]/80 bg-slate-100 shadow-xs"
              >
                {p.previewUrl ? (
                  <img
                    src={p.previewUrl}
                    alt={p.photoCode}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd]">
                    <span className="font-mono text-[10px] text-[#1e40af]">
                      {p.photoCode}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 rounded bg-[#0f172a]/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur-xs">
                  {p.photoCode}
                </span>
                {!project.isLocked && (
                  <button
                    onClick={() => onDeselect(p.id)}
                    title="Batalkan pilihan foto ini"
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-[#dc2626]/90 text-white shadow-md hover:bg-[#b91c1c] transition"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[12px] border border-dashed border-[#bfdbfe] py-12 text-center text-[13px] text-[#64748b]">
            Belum ada foto yang dipilih. Silakan pilih foto dari galeri terlebih dahulu.
          </div>
        )}

        {/* Photo Codes Summary */}
        {codes.length > 0 && (
          <div className="mt-5 rounded-[10px] border border-[#bfdbfe] bg-[#f0f7ff]/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#2563eb]">
                Daftar Kode Foto ({codes.length})
              </span>
              <button
                onClick={copyCodes}
                className="flex items-center gap-1 text-[11px] font-medium text-[#2563eb] hover:text-[#1d4ed8] transition"
              >
                <Copy size={12} />
                <span>Salin Kode</span>
              </button>
            </div>
            <p className="mt-2 font-mono text-[12px] leading-relaxed text-[#0f172a]">
              {codes.join(' · ')}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
          <button
            onClick={onClose}
            className="h-10 rounded-[8px] border border-[#bfdbfe] bg-white px-4 text-[13px] font-medium text-[#64748b] hover:bg-[#eff6ff] hover:text-[#1e293b] transition"
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
              className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-5 text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-50 transition"
            >
              <span>Selesaikan Pilihan</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Final Confirmation Modal
// ──────────────────────────────────────────────
function FinalConfirmationModal({
  selectedCount,
  codes,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  selectedCount: number
  codes: string[]
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/50 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[480px] rounded-[16px] border border-[#bfdbfe] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-7">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[#2563eb]">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-[19px] font-semibold tracking-[-0.03em] text-[#0f172a]">
          Apakah Anda Yakin?
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
          Setelah pilihan dikonfirmasi, <strong>pilihan foto akan dikunci</strong> dan tidak dapat diubah lagi.
        </p>

        <div className="mt-4 rounded-[10px] border border-[#bfdbfe] bg-[#f0f7ff]/70 p-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#64748b]">Total Foto Dipilih:</span>
            <span className="font-semibold text-[#1e40af]">{selectedCount} foto</span>
          </div>
          <div className="mt-2.5 border-t border-[#dbeafe] pt-2.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2563eb]">
              Kode Foto:
            </span>
            <p className="mt-1 max-h-[100px] overflow-y-auto no-scrollbar font-mono text-[12px] text-[#0f172a] leading-5">
              {codes.join(', ')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-[8px] border border-[#bfdbfe] bg-white px-4 text-[13px] font-medium text-[#64748b] hover:bg-[#eff6ff] transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-5 text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-60 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Mengunci Pilihan…</span>
              </>
            ) : (
              <span>Ya, Konfirmasi Pilihan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Client Gallery Component
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

  // Password Unlock Gate
  if (!accessGranted) {
    return <PasswordUnlockScreen token={token} />
  }

  // Filter + Search calculation
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

  // Keyboard navigation for Lightbox
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

  // Select / Deselect Photo Handler
  async function toggleSelection(photoId: string) {
    if (project.isLocked || isCompleted) {
      showToast('Pilihan foto pada galeri ini sudah dikunci.', 'error')
      return
    }

    const isCurrentlySelected = selectedIds.has(photoId)

    if (!isCurrentlySelected && selectedIds.size >= project.maxPhotos) {
      showToast(
        `Anda sudah mencapai batas maksimal ${project.maxPhotos} foto.`,
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

  // Final Confirmation Submit Handler
  async function handleFinalSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/gallery/${token}/submit`, {
        method: 'POST',
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

  function openWhatsApp() {
    if (!project.whatsappNumber) {
      showToast('Nomor WhatsApp fotografer belum dikonfigurasi.', 'error')
      return
    }
    const cleanNumber = normalizeWhatsappNumber(project.whatsappNumber)
    const text = generateWhatsAppMessage(
      project.name,
      project.clientName,
      selectedCodes
    )
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  function copyAllCodes() {
    navigator.clipboard?.writeText(selectedCodes.join('\n'))
    showToast('Kode foto berhasil disalin ke clipboard!', 'success')
  }

  // ──────────────────────────────────────────────
  // SUCCESS / FINAL STATE VIEW
  // ──────────────────────────────────────────────
  if (isCompleted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] text-[#0f172a]">
        {toast && <Toast message={toast.message} type={toast.type} />}

        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-[#bfdbfe]/70 bg-white/80 px-5 backdrop-blur-xl sm:px-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Perumda Photo Selector"
              className="size-8 rounded-[8px] border border-[#bfdbfe]/50 bg-white object-contain p-0.5 shadow-sm"
            />
            <span className="text-[14px] font-semibold text-[#0f172a]">
              {project.studioName || 'Perumda Photo Selector'}
            </span>
            <span className="text-[#94a3b8]">/</span>
            <span className="text-[13px] font-medium text-[#2563eb]">
              {project.clientName}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[11px] font-semibold text-[#16a34a]">
            <CheckCircle2 size={13} />
            <span>Pilihan Selesai &amp; Dikunci</span>
          </div>
        </header>

        {/* Content Container */}
        <div className="mx-auto max-w-[720px] px-5 py-12 text-center sm:px-8 sm:py-16">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#93c5fd] text-[#2563eb] shadow-lg shadow-blue-500/15">
            <Check size={32} />
          </div>

          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#0f172a] sm:text-[38px]">
            Pilihan Foto Berhasil Dikirim!
          </h1>
          <p className="mx-auto mt-3 max-w-[500px] text-[14px] leading-relaxed text-[#64748b]">
            Terima kasih, <strong>{project.clientName}</strong>. Anda telah memilih{' '}
            <strong className="text-[#0f172a]">{selectedCodes.length} foto</strong>. Pilihan Anda sudah dikunci dan tidak dapat diubah.
          </p>

          {/* Photo codes box */}
          <div className="mx-auto mt-8 max-w-[520px] rounded-[16px] border border-[#bfdbfe] bg-white/95 p-6 text-left shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#2563eb]">
                  Project: {project.name}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold text-[#0f172a]">
                  {selectedCodes.length} Foto Terpilih
                </p>
              </div>
              <span className="rounded-full bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-0.5 text-[11px] font-medium text-[#16a34a]">
                Final
              </span>
            </div>

            <div className="mt-4 max-h-[160px] overflow-y-auto no-scrollbar">
              <ol className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[12.5px] text-[#1e293b]">
                {selectedCodes.map((code, idx) => (
                  <li key={code} className="flex items-center gap-1.5">
                    <span className="text-[#94a3b8] w-5 text-right text-[11px]">{idx + 1}.</span>
                    <span className="font-semibold text-[#0f172a]">{code}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              {project.whatsappNumber && (
                <button
                  onClick={openWhatsApp}
                  className="flex flex-1 items-center justify-center gap-2 h-11 rounded-[8px] bg-gradient-to-r from-[#16a34a] to-[#15803d] px-4 text-[13px] font-semibold text-white shadow-md shadow-green-600/20 hover:from-[#15803d] hover:to-[#166534] transition"
                >
                  <MessageCircle size={16} />
                  <span>Kirim ke Photographer via WhatsApp</span>
                </button>
              )}
              <button
                onClick={copyAllCodes}
                className="flex items-center justify-center gap-1.5 h-11 rounded-[8px] border border-[#bfdbfe] bg-white px-4 text-[13px] font-medium text-[#1e40af] hover:bg-[#eff6ff] transition shadow-xs"
              >
                <Copy size={14} />
                <span>Salin Kode</span>
              </button>
            </div>
          </div>

          {/* Thumbnail preview */}
          {selectedPhotosList.length > 0 && (
            <div className="mt-10">
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">
                Pratinjau Foto Pilihan
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                {selectedPhotosList.map((p) => (
                  <div
                    key={p.id}
                    className="group relative aspect-[3/4] overflow-hidden rounded-[10px] border border-[#bfdbfe]/80 bg-slate-100 shadow-xs"
                  >
                    {p.previewUrl ? (
                      <img
                        src={p.previewUrl}
                        alt={p.photoCode}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd]">
                        <span className="font-mono text-[10px] text-[#1e40af]">
                          {p.photoCode}
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-[#0f172a]/75 px-1 py-0.5 font-mono text-[9px] text-white">
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

  // ──────────────────────────────────────────────
  // ACTIVE GALLERY SELECTION VIEW
  // ──────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] text-[#0f172a] pb-28">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-[#bfdbfe]/70 bg-white/80 px-5 backdrop-blur-xl sm:px-10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Perumda Photo Selector"
            className="size-8 rounded-[8px] border border-[#bfdbfe]/50 bg-white object-contain p-0.5 shadow-sm"
          />
          <span className="hidden text-[14px] font-semibold text-[#0f172a] sm:inline">
            {project.studioName || 'Perumda Photo Selector'}
          </span>
          <span className="hidden text-[#94a3b8] sm:inline">/</span>
          <span className="text-[13px] font-medium text-[#2563eb]">
            {project.clientName}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {project.isLocked ? (
            <span className="flex items-center gap-1 rounded-full border border-[#fecaca] bg-[#fef2f2] px-3 py-1 text-[11px] font-semibold text-[#dc2626]">
              <Lock size={12} /> Terkunci
            </span>
          ) : (
            <span className="hidden items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-[11px] font-medium text-[#1d4ed8] sm:flex">
              <Sparkles size={12} />
              <span>Pilihan Aman &amp; Privat</span>
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 sm:py-12">
        {/* Hero Section */}
        <div className="mx-auto max-w-[680px] text-center">
          {project.studioName && (
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              {project.studioName}
            </p>
          )}
          <h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#0f172a] sm:text-[44px]">
            {project.name}
          </h1>
          <p className="mx-auto mt-3 max-w-[500px] text-[14px] leading-relaxed text-[#64748b]">
            Pilih foto favorit Anda untuk hasil pemotretan ini. Anda dapat mengubah pilihan kapan saja sebelum dikonfirmasi.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-white/90 px-4 py-1.5 text-[12.5px] font-semibold text-[#1e40af] shadow-xs">
            <span>{selectedCount} dari maksimal {project.maxPhotos} foto dipilih</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3.5 border-y border-[#bfdbfe]/80 py-3.5 sm:flex-row">
          <div className="flex items-center gap-1 rounded-[10px] border border-[#bfdbfe]/70 bg-white/80 p-1 shadow-xs">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-medium transition ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Semua Foto ({photos.length})
            </button>
            <button
              onClick={() => setFilter('selected')}
              className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-medium transition ${
                filter === 'selected'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Foto Dipilih ({selectedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-[240px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode foto..."
              className="h-9 w-full rounded-[8px] border border-[#bfdbfe] bg-white/95 pl-9 pr-8 text-[12.5px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#60a5fa]/25"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
          {visiblePhotos.map((photo) => {
            const isSelected = selectedIds.has(photo.id)
            const isPending = pendingId === photo.id

            return (
              <div
                key={photo.id}
                onClick={() => setLightbox(photo.id)}
                className={`group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[14px] border bg-white/90 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 ${
                  isSelected
                    ? 'border-[#2563eb] ring-2 ring-[#2563eb] ring-offset-2'
                    : 'border-[#bfdbfe]/80'
                }`}
              >
                {photo.previewUrl ? (
                  <img
                    src={photo.previewUrl}
                    alt={photo.photoCode}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd]">
                    <span className="font-mono text-[11px] text-[#1e40af]">
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
                  className={`absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full shadow-md transition ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-white scale-105'
                      : 'border border-white/80 bg-white/85 text-[#64748b] hover:bg-white hover:text-[#2563eb]'
                  }`}
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin text-[#2563eb]" />
                  ) : isSelected ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    <Heart size={16} />
                  )}
                </button>

                {/* Photo code badge */}
                <div className="absolute bottom-2.5 left-2.5 rounded-md bg-[#0f172a]/75 px-2 py-0.5 font-mono text-[11px] font-semibold text-white backdrop-blur-xs">
                  {photo.photoCode}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {visiblePhotos.length === 0 && (
          <div className="mt-12 rounded-[16px] border border-dashed border-[#93c5fd] bg-white/60 py-16 text-center text-[13px] text-[#64748b]">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon size={32} className="text-[#93c5fd]" />
                <p className="font-semibold text-[#0f172a]">Foto belum tersedia</p>
                <p className="text-[12.5px]">Photographer belum menyinkronkan foto untuk project ini.</p>
              </div>
            ) : (
              <p>Tidak ada foto yang cocok dengan pencarian "{search}".</p>
            )}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* STICKY BOTTOM BAR                              */}
      {/* ────────────────────────────────────────────── */}
      <div className="fixed bottom-5 left-1/2 z-30 flex w-[calc(100%-28px)] max-w-[560px] -translate-x-1/2 items-center justify-between gap-3 rounded-[16px] border border-[#3b82f6]/40 bg-[#0f172a]/95 px-4 py-3 text-white shadow-2xl backdrop-blur-2xl sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-white">
            {selectedCount} / {project.maxPhotos} foto dipilih
          </p>
          <p className="truncate text-[11px] text-slate-400">
            {project.isLocked
              ? 'Pilihan galeri sudah dikunci'
              : 'Dapat diubah sebelum konfirmasi'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="h-9.5 rounded-[8px] border border-white/20 bg-white/10 px-3 text-[12.5px] font-medium text-white hover:bg-white/20 transition"
          >
            Lihat Pilihan
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={selectedCount === 0 || project.isLocked}
            className="flex h-9.5 items-center gap-1.5 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#38bdf8] px-4 text-[12.5px] font-semibold text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0ea5e9] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Check size={14} />
            <span>Selesaikan</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* FULLSCREEN LIGHTBOX                            */}
      {/* ────────────────────────────────────────────── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#070d19]/95 p-4 backdrop-blur-md"
          role="dialog"
          aria-label="Photo preview"
        >
          {/* Close button */}
          <button
            onClick={() => setLightbox(null)}
            aria-label="Tutup pratinjau"
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X size={20} />
          </button>

          {/* Previous button */}
          {lightboxIndex > 0 && (
            <button
              onClick={() => setLightbox(visiblePhotos[lightboxIndex - 1].id)}
              aria-label="Foto sebelumnya"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:left-6"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Large Image */}
          <div className="flex max-h-[82vh] max-w-[88vw] flex-col items-center justify-center">
            {lightboxPhoto.previewUrl ? (
              <img
                src={lightboxPhoto.previewUrl}
                alt={`Foto ${lightboxPhoto.photoCode}`}
                className="max-h-[75vh] max-w-full rounded-[12px] object-contain shadow-2xl"
              />
            ) : (
              <div className="flex size-72 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd]">
                <span className="font-mono text-[16px] font-semibold text-[#1e40af]">
                  {lightboxPhoto.photoCode}
                </span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-md bg-white/10 px-3 py-1 font-mono text-[12px] font-semibold text-white">
                {lightboxPhoto.photoCode}
              </span>
              <span className="text-[12px] text-slate-400">
                {lightboxIndex + 1} dari {visiblePhotos.length}
              </span>
            </div>
          </div>

          {/* Next button */}
          {lightboxIndex < visiblePhotos.length - 1 && (
            <button
              onClick={() => setLightbox(visiblePhotos[lightboxIndex + 1].id)}
              aria-label="Foto selanjutnya"
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
              className={`absolute bottom-6 flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold shadow-xl transition ${
                selectedIds.has(lightboxPhoto.id)
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-white shadow-blue-500/30'
                  : 'bg-white text-[#0f172a] hover:bg-slate-100'
              }`}
            >
              {selectedIds.has(lightboxPhoto.id) ? (
                <>
                  <Check size={16} />
                  <span>Sudah Dipilih</span>
                </>
              ) : (
                <>
                  <Heart size={16} />
                  <span>Pilih Foto Ini</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────── */}
      {/* REVIEW SELECTION MODAL                         */}
      {/* ────────────────────────────────────────────── */}
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

      {/* ────────────────────────────────────────────── */}
      {/* FINAL CONFIRMATION MODAL                       */}
      {/* ────────────────────────────────────────────── */}
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
