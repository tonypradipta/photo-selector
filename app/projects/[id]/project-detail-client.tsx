'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Check, Copy, ExternalLink, Lock, Unlock, RefreshCw,
  AlertCircle, Loader2, Camera, Calendar, Users, Image as ImageIcon,
  MessageCircle, ClipboardList
} from 'lucide-react'
import { setProjectLock } from '@/app/actions/projects'
import type { ProjectDetail, SelectedPhoto } from './page'

// ──────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'error' | 'success' | 'info' }) {
  const colors = {
    error: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
    success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]',
    info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  }
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[12px] font-medium shadow-lg backdrop-blur-xl ${colors[type]}`}>
      {type === 'error' && <AlertCircle size={14} className="shrink-0" />}
      {type === 'success' && <Check size={14} className="shrink-0" />}
      {message}
    </div>
  )
}

// ──────────────────────────────────────────────
// Status badge
// ──────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'text-[#64748b] bg-[#f1f5f9] border-[#cbd5e1]',
    active: 'text-[#1e40af] bg-[#dbeafe] border-[#93c5fd]',
    completed: 'text-[#15803d] bg-[#dcfce7] border-[#86efac]',
    locked: 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]',
  }
  const cls = map[status] ?? map.draft
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function ProjectDetailClient({
  project,
  selectedPhotos,
}: {
  project: ProjectDetail
  selectedPhotos: SelectedPhoto[]
}) {
  const router = useRouter()
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lockPending, startLockTransition] = useTransition()

  const appUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? ''
  const galleryUrl = `${appUrl}/select/${project.clientToken}`

  function showToast(message: string, type: 'error' | 'success' | 'info' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  function copyGalleryLink() {
    navigator.clipboard?.writeText(galleryUrl)
    showToast('Gallery link copied!', 'success')
  }

  function copyCodes(separator: '\n' | ', ') {
    const codes = selectedPhotos.map((p) => p.photoCode)
    navigator.clipboard?.writeText(codes.join(separator))
    showToast(separator === '\n' ? 'Photo codes copied!' : 'Comma-separated codes copied!', 'success')
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/sync`, { method: 'POST' })
      const data = await res.json() as { error?: string; synced?: number; deactivated?: number }
      if (!res.ok) {
        showToast(data.error ?? 'Sync failed.', 'error')
      } else {
        showToast(`Synced ${data.synced} photos.`, 'success')
        router.refresh()
      }
    } catch {
      showToast('Connection error during sync.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  function handleToggleLock() {
    startLockTransition(async () => {
      const result = await setProjectLock(project.id, !project.selectionLocked)
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast(project.selectionLocked ? 'Selection unlocked.' : 'Selection locked and gallery is now read-only.', 'success')
        router.refresh()
      }
    })
  }

  function openWhatsApp() {
    if (!project.whatsappNumber) {
      showToast('No WhatsApp number configured for this project.', 'error')
      return
    }
    const codes = selectedPhotos.map((p) => p.photoCode)
    const message =
      `Halo Kak,\n\n` +
      `Foto pilihan untuk project:\n` +
      `*${project.name}*\n` +
      `Client: ${project.clientName}\n` +
      `Total foto dipilih: ${codes.length} dari ${project.maxPhotos}\n\n` +
      `Kode foto:\n${codes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n` +
      `Terima kasih.`
    let number = project.whatsappNumber.replace(/\D/g, '')
    if (number.startsWith('0')) {
      number = '62' + number.slice(1)
    }
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const progress = project.maxPhotos > 0
    ? Math.round((project.selectedCount / project.maxPhotos) * 100)
    : 0

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] text-[#0f172a]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <header className="flex h-[68px] items-center justify-between border-b border-[#bfdbfe]/70 bg-white/60 px-6 backdrop-blur-xl sm:px-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[13px] font-medium text-[#64748b] hover:text-[#1e40af] transition"
        >
          <ArrowLeft size={15} />
          Back to projects
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex h-9 items-center gap-2 rounded-[8px] border border-[#bfdbfe] bg-white/90 px-3 text-[12px] font-medium text-[#1e40af] shadow-sm hover:bg-[#eff6ff] disabled:opacity-60 transition"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync photos'}
          </button>

          <button
            onClick={() => window.open(galleryUrl, '_blank')}
            className="flex h-9 items-center gap-2 rounded-[8px] border border-[#bfdbfe] bg-white/90 px-3 text-[12px] font-medium text-[#1e40af] shadow-sm hover:bg-[#eff6ff] transition"
          >
            <ExternalLink size={14} />
            Open gallery
          </button>

          <button
            onClick={handleToggleLock}
            disabled={lockPending}
            className={`flex h-9 items-center gap-2 rounded-[8px] px-4 text-[12px] font-medium text-white shadow-md transition disabled:opacity-60 ${
              project.selectionLocked
                ? 'bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b]'
                : 'bg-gradient-to-r from-[#2563eb] to-[#0284c7] hover:from-[#1d4ed8] hover:to-[#0369a1]'
            }`}
          >
            {lockPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : project.selectionLocked ? (
              <Unlock size={14} />
            ) : (
              <Lock size={14} />
            )}
            {project.selectionLocked ? 'Unlock selection' : 'Lock selection'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
        {/* Project name + meta */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <StatusBadge status={project.status} />
              {project.selectionLocked && (
                <span className="flex items-center gap-1 rounded-full border border-[#fecaca] bg-[#fef2f2] px-2.5 py-0.5 text-[10px] font-semibold text-[#dc2626]">
                  <Lock size={10} /> Locked
                </span>
              )}
            </div>
            <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#0f172a] sm:text-[34px]">
              {project.name}
            </h1>
            <p className="mt-1 text-[14px] text-[#64748b]">{project.clientName}</p>
          </div>

          {/* Copy + share */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyGalleryLink}
              className="flex h-9 items-center gap-1.5 rounded-[8px] border border-[#bfdbfe] bg-white px-3 text-[12px] font-medium text-[#1e40af] hover:bg-[#eff6ff] transition"
            >
              <Copy size={13} /> Copy link
            </button>
            {project.whatsappNumber && (
              <button
                onClick={openWhatsApp}
                className="flex h-9 items-center gap-1.5 rounded-[8px] bg-gradient-to-r from-[#16a34a] to-[#15803d] px-3 text-[12px] font-medium text-white hover:from-[#15803d] hover:to-[#166534] transition"
              >
                <MessageCircle size={13} /> WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <ImageIcon size={18} className="text-[#2563eb]" />, label: 'Photos synced', value: String(project.photoCount) },
            { icon: <Check size={18} className="text-[#16a34a]" />, label: 'Photos selected', value: `${project.selectedCount} / ${project.maxPhotos}` },
            { icon: <Calendar size={18} className="text-[#7c3aed]" />, label: 'Created', value: formatDate(project.createdAt) },
            { icon: <Camera size={18} className="text-[#0284c7]" />, label: 'Last synced', value: project.lastSyncedAt ? formatDate(project.lastSyncedAt) : 'Never' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="rounded-[14px] border border-[#bfdbfe]/80 bg-white/85 p-5 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex size-9 items-center justify-center rounded-[8px] bg-[#f0f7ff]">
                {icon}
              </div>
              <p className="text-[11px] font-medium text-[#64748b]">{label}</p>
              <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[#0f172a]">{value}</p>
            </div>
          ))}
        </div>

        {/* Selection progress */}
        {project.photoCount > 0 && (
          <div className="mb-8 rounded-[14px] border border-[#bfdbfe]/80 bg-white/85 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-[#0f172a]">Selection progress</p>
              <p className="text-[13px] font-semibold text-[#2563eb]">{progress}%</p>
            </div>
            <div className="h-2 rounded-full bg-[#dbeafe]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#64748b]">
              {project.selectedCount} of {project.maxPhotos} photos selected
              {project.completedAt && ` · Submitted ${formatDate(project.completedAt)}`}
            </p>
          </div>
        )}

        {/* Selected photos */}
        <div className="rounded-[14px] border border-[#bfdbfe]/80 bg-white/85 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbeafe] px-6 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-[#2563eb]" />
              <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">
                Selected photos
              </h2>
              {selectedPhotos.length > 0 && (
                <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-semibold text-[#1e40af]">
                  {selectedPhotos.length}
                </span>
              )}
            </div>
            {selectedPhotos.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyCodes('\n')}
                  className="flex items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1e40af] hover:bg-[#eff6ff] transition"
                >
                  <Copy size={12} /> Copy codes
                </button>
                <button
                  onClick={() => copyCodes(', ')}
                  className="flex items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1e40af] hover:bg-[#eff6ff] transition"
                >
                  <Copy size={12} /> Copy CSV
                </button>
              </div>
            )}
          </div>

          {selectedPhotos.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#f0f7ff]">
                <Users size={20} className="text-[#64748b]" />
              </div>
              <p className="text-[14px] font-medium text-[#64748b]">No photos selected yet</p>
              <p className="mt-1 text-[12px] text-[#94a3b8]">
                {project.photoCount === 0
                  ? 'Sync photos from Google Drive first, then share the gallery link with your client.'
                  : 'Share the gallery link with your client so they can start selecting photos.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={copyGalleryLink}
                  className="flex items-center gap-1.5 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-4 py-2 text-[12px] font-medium text-white shadow-md"
                >
                  <Copy size={13} /> Copy gallery link
                </button>
                {project.photoCount === 0 && (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-1.5 rounded-[8px] border border-[#bfdbfe] bg-white px-4 py-2 text-[12px] font-medium text-[#1e40af] hover:bg-[#eff6ff] transition disabled:opacity-60"
                  >
                    <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                    Sync photos first
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Photo grid */}
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {selectedPhotos.map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-[10px] border border-[#bfdbfe]/80 bg-white shadow-xs">
                    {photo.previewUrl ? (
                      <img
                        src={photo.previewUrl}
                        alt={photo.photoCode}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-square w-full bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd] flex items-center justify-center">
                        <span className="font-mono text-[10px] text-[#1e40af]">{photo.photoCode}</span>
                      </div>
                    )}
                    <div className="px-2 py-1.5">
                      <p className="truncate font-mono text-[10px] font-semibold text-[#1e40af]">{photo.photoCode}</p>
                      <p className="truncate text-[9px] text-[#94a3b8]">{photo.fileName}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo codes list */}
              <div className="border-t border-[#dbeafe] px-6 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
                  All photo codes
                </p>
                <p className="font-mono text-[12px] leading-7 text-[#0f172a] break-all">
                  {selectedPhotos.map((p) => p.photoCode).join(' · ')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Drive link */}
        <div className="mt-5 flex items-center justify-between rounded-[12px] border border-[#bfdbfe]/80 bg-white/70 px-5 py-4 shadow-xs">
          <div>
            <p className="text-[12px] font-semibold text-[#0f172a]">Google Drive folder</p>
            <p className="mt-0.5 truncate text-[11px] text-[#64748b] max-w-[340px]">{project.driveLink}</p>
          </div>
          <a
            href={project.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8] transition"
          >
            Open <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}
