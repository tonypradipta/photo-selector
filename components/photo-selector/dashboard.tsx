'use client'

import { useMemo, useState, useEffect, useCallback, useTransition, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy, ExternalLink, FolderOpen, Image as ImageIcon, Link2, MoreHorizontal,
  Plus, Search, Settings2, Sparkles, Users, Check, ChevronRight, ChevronLeft, X, LockKeyhole,
  LogOut, RefreshCw, Trash2, Edit3, Lock, Unlock, Eye, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react'
import { createProject, updateProject, deleteProject, setProjectLock } from '@/app/actions/projects'
import { saveProfile, saveSettings, changePassword, logout } from '@/app/actions/profile'
import type { ProjectData } from '@/lib/projects'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ProfileDataType {
  email: string
  studioName: string
  fullName: string
  location: string
  bio: string
  whatsapp: string
  website: string
  showBranding: boolean
  allowNotes: boolean
  sendReminders: boolean
}

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
// Field component
// ──────────────────────────────────────────────
function Field({ label, example, help, required, children }: {
  label: string; example?: string; help?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <label className="text-[13px] font-medium text-[#0f172a]">
        {label}{required && <span className="ml-1 text-[#dc2626]">*</span>}
      </label>
      {children}
      {(example || help) && (
        <p className="text-[11px] text-[#64748b]">
          {example && `e.g. ${example}`}{help && example ? ` · ${help}` : help}
        </p>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Stat card
// ──────────────────────────────────────────────
function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[14px] border border-[#bfdbfe]/80 bg-white/80 p-5 shadow-sm backdrop-blur-md hover:shadow-md transition">
      <p className="text-[12px] font-medium text-[#64748b]">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-[28px] font-bold tracking-[-0.04em] text-[#0f172a]">{value}</p>
        <p className="text-[11px] text-[#2563eb] font-medium">{detail}</p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Page heading
// ──────────────────────────────────────────────
function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">{eyebrow}</p>
      <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#0f172a] sm:text-[36px]">{title}</h1>
      <p className="mt-2 text-[14px] text-[#64748b]">{description}</p>
    </div>
  )
}

// ──────────────────────────────────────────────
// Settings card
// ──────────────────────────────────────────────
function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[#bfdbfe]/80 bg-white/85 p-5 shadow-sm backdrop-blur-md sm:p-6">
      <h2 className="text-[16px] font-semibold tracking-[-0.025em] text-[#0f172a]">{title}</h2>
      <p className="mt-1 text-[12px] leading-5 text-[#64748b]">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Settings toggle
// ──────────────────────────────────────────────
function SettingToggle({ title, description, checked, onChange }: {
  title: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-[#e2e8f0] pb-4 last:border-0 last:pb-0">
      <span>
        <span className="block text-[13px] font-medium text-[#0f172a]">{title}</span>
        <span className="mt-1 block text-[12px] leading-5 text-[#64748b]">{description}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#2563eb]" />
    </label>
  )
}

// ──────────────────────────────────────────────
// Project card dropdown menu
// ──────────────────────────────────────────────
function ProjectCardMenu({ project, onEdit, onDelete, onSync, onLock, onCopy, onViewPhotos, appUrl, syncing }: {
  project: ProjectData
  onEdit: () => void
  onDelete: () => void
  onSync: () => void
  onLock: () => void
  onCopy: () => void
  onViewPhotos: () => void
  appUrl: string
  syncing: boolean
}) {
  const [open, setOpen] = useState(false)

  function item(label: string, icon: React.ReactNode, onClick: () => void, danger = false) {
    return (
      <button
        type="button"
        onClick={() => { onClick(); setOpen(false) }}
        className={`flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-[12.5px] font-medium transition ${
          danger
            ? 'text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#b91c1c]'
            : 'text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1d4ed8]'
        }`}
      >
        <span className={danger ? 'text-[#ef4444]' : 'text-[#3b82f6]'}>{icon}</span>
        <span>{label}</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="More project actions"
        onClick={() => setOpen(!open)}
        className="flex size-8 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#eff6ff] hover:text-[#0f172a] transition"
      >
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-[205px] rounded-[12px] border border-[#bfdbfe] bg-white p-1.5 shadow-[0_16px_40px_rgba(30,58,138,0.18)] backdrop-blur-2xl">
            {item('Lihat Semua Foto Drive', <ImageIcon size={14} />, onViewPhotos)}
            {item('Copy client link', <Copy size={14} />, onCopy)}
            {item('Edit project', <Edit3 size={14} />, onEdit)}
            {item(project.selectionLocked ? 'Unlock selection' : 'Lock selection', project.selectionLocked ? <Unlock size={14} /> : <Lock size={14} />, onLock)}
            <a
              href={`/projects/${project.id}`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-[12.5px] font-medium text-[#1e293b] transition hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
            >
              <span className="text-[#3b82f6]"><Users size={14} /></span>
              <span>View selections</span>
            </a>
            <div className="my-1 border-t border-[#e2e8f0]" />
            {item('Hapus Proyek', <Trash2 size={14} />, onDelete, true)}
          </div>
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Project Thumbnail Banner
// ──────────────────────────────────────────────
function ProjectThumbnailBanner({ thumbnails, photoCount }: { thumbnails?: string[]; photoCount: number }) {
  if (!thumbnails || thumbnails.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] via-[#93c5fd] to-[#60a5fa]">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <ImageIcon size={26} className="text-white/80" />
          <span className="text-[12px] font-medium text-white/90">
            {photoCount > 0 ? `${photoCount} photos synced` : 'No photos synced yet'}
          </span>
        </div>
      </div>
    )
  }

  // 1 photo
  if (thumbnails.length === 1) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-900">
        <img
          src={thumbnails[0]}
          alt="Thumbnail"
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
      </div>
    )
  }

  // 2 photos
  if (thumbnails.length === 2) {
    return (
      <div className="relative grid h-full w-full grid-cols-2 gap-0.5 overflow-hidden bg-slate-900">
        {thumbnails.map((src, i) => (
          <div key={i} className="relative h-full w-full overflow-hidden">
            <img
              src={src}
              alt={`Thumbnail ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
      </div>
    )
  }

  // 3 photos
  if (thumbnails.length === 3) {
    return (
      <div className="relative grid h-full w-full grid-cols-3 gap-0.5 overflow-hidden bg-slate-900">
        <div className="relative col-span-2 h-full w-full overflow-hidden">
          <img
            src={thumbnails[0]}
            alt="Thumbnail 1"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="grid h-full w-full grid-rows-2 gap-0.5">
          {thumbnails.slice(1).map((src, i) => (
            <div key={i} className="relative h-full w-full overflow-hidden">
              <img
                src={src}
                alt={`Thumbnail ${i + 2}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
      </div>
    )
  }

  // 4 photos
  return (
    <div className="relative grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-slate-900">
      {thumbnails.slice(0, 4).map((src, i) => (
        <div key={i} className="relative h-full w-full overflow-hidden">
          <img
            src={src}
            alt={`Thumbnail ${i + 1}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ))}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
    </div>
  )
}

// ──────────────────────────────────────────────
// Project Card
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// Project Card
// ──────────────────────────────────────────────
function ProjectCard({ project, onCopy, onEdit, onDelete, onSync, onLock, onViewPhotos, appUrl, syncing }: {
  project: ProjectData
  onCopy: (token: string) => void
  onEdit: (project: ProjectData) => void
  onDelete: (project: ProjectData) => void
  onSync: (project: ProjectData) => void
  onLock: (project: ProjectData) => void
  onViewPhotos: (project: ProjectData) => void
  appUrl: string
  syncing: boolean
}) {
  const progress = project.maxPhotos > 0 ? Math.round((project.selectedCount / project.maxPhotos) * 100) : 0
  const date = new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const statusColors: Record<string, string> = {
    draft: 'text-[#64748b] bg-[#f1f5f9] border-[#cbd5e1]',
    active: 'text-[#1e40af] bg-[#dbeafe] border-[#93c5fd]',
    completed: 'text-[#15803d] bg-[#dcfce7] border-[#86efac]',
    locked: 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]',
  }
  const statusClass = statusColors[project.status] ?? statusColors.draft

  return (
    <article className="group relative rounded-[14px] border border-[#bfdbfe]/80 bg-white/85 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="relative h-[152px] overflow-hidden rounded-t-[14px]">
        {/* Drive photos thumbnail banner */}
        <ProjectThumbnailBanner thumbnails={project.previewThumbnails} photoCount={project.photoCount} />

        {/* Status badge in top-left */}
        <div className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md shadow-xs ${statusClass}`}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </div>

        {/* Photo count pill in bottom-left */}
        {project.photoCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-white shadow-xs backdrop-blur-md border border-white/15">
            <ImageIcon size={12} className="text-blue-300" />
            <span>{project.photoCount} photos</span>
          </div>
        )}

        {/* Open Drive photos pop-up gallery button in bottom-right */}
        <button
          aria-label={`Lihat semua foto ${project.name}`}
          onClick={() => onViewPhotos(project)}
          title="Lihat semua foto Drive dalam pop-up galeri"
          className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/95 text-[#1e40af] shadow-md hover:bg-white hover:scale-105 active:scale-95 transition"
        >
          <ExternalLink size={14} />
        </button>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[16px] font-semibold tracking-[-0.025em] text-[#0f172a]">{project.name}</h3>
            <p className="mt-1 truncate text-[12px] text-[#64748b]">{project.clientName}</p>
          </div>
          <ProjectCardMenu
            project={project}
            onEdit={() => onEdit(project)}
            onDelete={() => onDelete(project)}
            onSync={() => onSync(project)}
            onLock={() => onLock(project)}
            onCopy={() => onCopy(project.clientToken)}
            onViewPhotos={() => onViewPhotos(project)}
            appUrl={appUrl}
            syncing={syncing}
          />
        </div>
        <div className="mt-5 flex items-center justify-between text-[11px] text-[#64748b]">
          <span>{project.photoCount} photos</span>
          <span>{date}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-[#dbeafe]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8]" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] font-medium text-[#2563eb]">
            {project.selectedCount > 0 ? `${project.selectedCount} of ${project.maxPhotos} selected` : 'Not started'}
          </span>
          <button onClick={() => onCopy(project.clientToken)} className="flex items-center gap-1.5 text-[12px] font-medium text-[#1e40af] hover:text-[#2563eb] transition">
            <Copy size={13} /> Share link
          </button>
        </div>
      </div>
    </article>
  )
}

// ──────────────────────────────────────────────
// Drive Photo Item interface
// ──────────────────────────────────────────────
interface DrivePhotoItem {
  id: string
  fileName: string
  photoCode: string
  previewUrl: string | null
  sortOrder: number
  isSelected: boolean
}

// ──────────────────────────────────────────────
// Photo Lightbox Modal
// ──────────────────────────────────────────────
function PhotoLightboxModal({
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
      className="fixed inset-0 z-[70] flex flex-col items-center justify-between bg-slate-950/95 p-4 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Top bar */}
      <div className="flex w-full items-center justify-between px-2 py-1 text-white">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold tracking-wide">{photo.photoCode}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-300">
            {currentIndex + 1} / {photos.length}
          </span>
          {photo.isSelected && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
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

        {photo.previewUrl ? (
          <img
            src={photo.previewUrl}
            alt={photo.photoCode}
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

      {/* Bottom bar */}
      <div className="text-center text-xs text-slate-400 pb-2">
        <span>Nama Berkas: <strong className="text-slate-200">{photo.fileName}</strong></span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Drive Photos Gallery Modal
// ──────────────────────────────────────────────
function DrivePhotosModal({
  project,
  onClose,
  onSync,
  syncing,
  toast,
}: {
  project: ProjectData
  onClose: () => void
  onSync: (p: ProjectData) => Promise<void>
  syncing: boolean
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const [photos, setPhotos] = useState<DrivePhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'selected'>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${project.id}/photos`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal memuat daftar foto.')
      } else {
        setPhotos(data.photos ?? [])
      }
    } catch {
      setError('Gagal terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchesSearch =
        p.photoCode.toLowerCase().includes(query.toLowerCase()) ||
        p.fileName.toLowerCase().includes(query.toLowerCase())
      if (!matchesSearch) return false
      if (tab === 'selected') return p.isSelected
      return true
    })
  }, [photos, query, tab])

  const selectedCount = useMemo(() => photos.filter((p) => p.isSelected).length, [photos])

  async function handleSyncInsideModal() {
    await onSync(project)
    await loadPhotos()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[92vh] w-full max-w-[1240px] flex-col overflow-hidden rounded-[20px] border border-[#bfdbfe] bg-white/98 shadow-[0_25px_80px_rgba(30,58,138,0.22)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex flex-col gap-4 border-b border-[#e2e8f0] bg-white/90 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[#2563eb] shadow-xs">
              <FolderOpen size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[18px] font-bold tracking-[-0.025em] text-[#0f172a]">
                  {project.name}
                </h2>
                <span className="rounded-full bg-[#eff6ff] border border-[#bfdbfe] px-2.5 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">
                  {project.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[12px] text-[#64748b]">
                Klien: <span className="font-medium text-[#0f172a]">{project.clientName}</span> ·{' '}
                <span className="text-[#2563eb] font-semibold">{photos.length} foto</span> dari Google Drive
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Open Google Drive button */}
            {project.driveLink && (
              <a
                href={project.driveLink}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 items-center gap-1.5 rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12px] font-medium text-[#334155] shadow-xs hover:bg-[#f8fafc] hover:text-[#0f172a] transition"
              >
                <FolderOpen size={14} className="text-[#2563eb]" />
                <span>Buka Google Drive</span>
                <ExternalLink size={12} className="text-[#94a3b8]" />
              </a>
            )}

            {/* Open Client Gallery */}
            <button
              onClick={() => window.open(`/select/${project.clientToken}`, '_blank')}
              className="flex h-9 items-center gap-1.5 rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] px-3 text-[12px] font-medium text-[#1e40af] shadow-xs hover:bg-[#dbeafe] transition"
            >
              <Users size={14} />
              <span>Buka Galeri Klien</span>
              <ExternalLink size={12} />
            </button>

            {/* Sync Photos Button */}
            <button
              onClick={handleSyncInsideModal}
              disabled={syncing}
              className="flex h-9 items-center gap-1.5 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-3.5 text-[12px] font-medium text-white shadow-xs hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-60 transition"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Menyinkronkan…' : 'Sinkron Drive'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="flex size-9 items-center justify-center rounded-full text-[#64748b] hover:bg-[#eff6ff] hover:text-[#0f172a] transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-[#e2e8f0] bg-[#f8fafc]/80 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('all')}
              className={`rounded-[7px] px-3 py-1.5 text-[12px] font-medium transition ${
                tab === 'all'
                  ? 'bg-white font-semibold text-[#1e40af] shadow-xs border border-[#bfdbfe]'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Semua Foto ({photos.length})
            </button>
            <button
              onClick={() => setTab('selected')}
              className={`flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[12px] font-medium transition ${
                tab === 'selected'
                  ? 'bg-emerald-50 font-semibold text-[#15803d] shadow-xs border border-[#bbf7d0]'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <CheckCircle2 size={13} className={tab === 'selected' ? 'text-[#16a34a]' : ''} />
              <span>Dipilih Klien ({selectedCount} / {project.maxPhotos})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode foto (cth: IMG_9029)..."
              className="h-8.5 w-full rounded-[8px] border border-[#cbd5e1] bg-white pl-9 pr-3 text-[12px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>
        </div>

        {/* Photo Grid / Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-[#64748b]">
              <Loader2 size={32} className="animate-spin text-[#2563eb]" />
              <p className="text-[13px] font-medium">Memuat foto dari Google Drive…</p>
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle size={36} className="text-[#dc2626]" />
              <p className="text-[14px] font-medium text-[#0f172a]">{error}</p>
              <button
                onClick={loadPhotos}
                className="mt-2 rounded-[8px] bg-[#2563eb] px-4 py-2 text-[12px] font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center text-[#64748b]">
              <ImageIcon size={40} className="text-[#cbd5e1]" />
              <p className="text-[14px] font-medium text-[#0f172a]">
                {photos.length === 0
                  ? 'Belum ada foto yang disinkronkan'
                  : 'Tidak ada foto yang cocok dengan pencarian'}
              </p>
              <p className="text-[12px] text-[#94a3b8]">
                {photos.length === 0
                  ? 'Klik tombol "Sinkron Drive" untuk mengimpor foto dari Google Drive.'
                  : 'Coba ubah kata kunci pencarian Anda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className="group relative cursor-pointer overflow-hidden rounded-[12px] border border-[#bfdbfe]/80 bg-slate-100 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#3b82f6]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                    {photo.previewUrl ? (
                      <img
                        src={photo.previewUrl}
                        alt={photo.photoCode}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd]">
                        <span className="font-mono text-[11px] font-semibold text-[#1e40af]">
                          {photo.photoCode}
                        </span>
                      </div>
                    )}

                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex size-9 items-center justify-center rounded-full bg-white/90 text-[#0f172a] shadow-md">
                        <Eye size={18} />
                      </div>
                    </div>

                    {/* Selected Badge */}
                    {photo.isSelected && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-[#16a34a] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        <Check size={11} /> Dipilih
                      </div>
                    )}

                    {/* Photo Code Badge */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-[6px] bg-slate-950/75 px-2 py-1 backdrop-blur-xs">
                      <span className="truncate font-mono text-[10px] font-medium text-white">
                        {photo.photoCode}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-white px-6 py-3 text-[12px] text-[#64748b]">
          <span>
            Menampilkan <strong className="text-[#0f172a]">{filteredPhotos.length}</strong> dari{' '}
            <strong className="text-[#0f172a]">{photos.length}</strong> foto
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#cbd5e1] bg-white px-4 py-1.5 text-[12px] font-medium text-[#475569] hover:bg-[#f1f5f9] transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightboxModal
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(i) => setLightboxIndex(i)}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// New / Edit Project Modal
// ──────────────────────────────────────────────
function ProjectModal({ editing, onClose, onCreated, onUpdated, onDelete, toast }: {
  editing: ProjectData | null
  onClose: () => void
  onCreated: (token: string, projectId?: string) => void
  onUpdated: () => void
  onDelete?: (project: ProjectData) => void
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const isEdit = !!editing
  const [form, setForm] = useState({
    name: editing?.name ?? '',
    clientName: editing?.clientName ?? '',
    driveLink: editing?.driveLink ?? '',
    whatsapp: editing?.whatsappNumber ?? '',
    maxPhotos: String(editing?.maxPhotos ?? 20),
    protect: false,
    password: '',
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData()
    fd.set('name', form.name)
    fd.set('clientName', form.clientName)
    fd.set('driveLink', form.driveLink)
    fd.set('whatsapp', form.whatsapp)
    fd.set('maxPhotos', form.maxPhotos)
    fd.set('protect', String(form.protect))
    fd.set('password', form.password)

    startTransition(async () => {
      if (isEdit && editing) {
        const result = await updateProject(editing.id, { error: '', success: false }, fd)
        if (result.error) { setError(result.error); return }
        toast('Project updated successfully!', 'success')
        onUpdated()
      } else {
        const result = await createProject({ error: '', success: false }, fd)
        if (result.error) { setError(result.error); return }
        toast('Proyek dibuat! Menyinkronkan foto dari Google Drive…', 'info')
        onCreated(result.clientToken ?? '', result.projectId)
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 px-4 py-6 backdrop-blur-[3px]" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto no-scrollbar rounded-[16px] border border-[#bfdbfe] bg-white/95 p-6 shadow-[0_24px_80px_rgba(37,99,235,0.18)] backdrop-blur-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Workspace</p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-[#0f172a]">{isEdit ? 'Edit project' : 'New project'}</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#64748b]">
              {isEdit ? 'Update project details below.' : 'Create a gallery and invite your client to choose their photos.'}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-[#64748b] hover:bg-[#eff6ff] hover:text-[#0f172a]">
            <X size={17} />
          </button>
        </div>

        <div className="mt-7 grid gap-5">
          <Field label="Project Name" example="Wedding Andi & Sarah" required>
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Wedding Andi & Sarah" className="form-input" />
          </Field>
          <Field label="Client Name" example="Andi & Sarah" required>
            <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Andi & Sarah" className="form-input" />
          </Field>
          <Field label="Google Drive Folder Link" example="https://drive.google.com/drive/folders/xxxxx" required help="Share this folder with the Google Service Account email configured on the server.">
            <input type="url" value={form.driveLink} onChange={(e) => setForm({ ...form, driveLink: e.target.value })} placeholder="https://drive.google.com/drive/folders/xxxxx" className="form-input" />
          </Field>
          <Field label="Photographer WhatsApp Number" example="628123456789" help="Use country code without + symbol.">
            <input inputMode="numeric" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="628123456789" className="form-input" />
          </Field>
          <Field label="Maximum Photo Selection" example="20" required help="Maximum photos the client can select.">
            <input type="number" min="1" value={form.maxPhotos} onChange={(e) => setForm({ ...form, maxPhotos: e.target.value })} placeholder="20" className="form-input" />
          </Field>
          <div className="rounded-[10px] border border-[#bfdbfe] bg-[#f0f7ff]/70 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={form.protect} onChange={(e) => setForm({ ...form, protect: e.target.checked })} className="size-4 accent-[#2563eb]" />
              <span className="flex items-center gap-2 text-[13px] font-medium text-[#1e293b]">
                <LockKeyhole size={15} className="text-[#3b82f6]" /> Protect gallery with password
              </span>
            </label>
            {form.protect && (
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter a gallery password" className="form-input mt-3" />
            )}
          </div>
        </div>

        {error && <p role="alert" className="mt-4 text-[12px] font-medium text-[#dc2626]">{error}</p>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isEdit && editing ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onDelete?.(editing)
              }}
              className="flex items-center justify-center gap-1.5 h-10 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 text-[13px] font-medium text-[#dc2626] hover:bg-[#fee2e2] transition"
            >
              <Trash2 size={14} />
              <span>Hapus Proyek</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-[8px] px-4 text-[13px] font-medium text-[#64748b] hover:bg-[#eff6ff] hover:text-[#1e293b]">Batal</button>
            <button disabled={isPending} type="submit" className="h-10 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-5 text-[13px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:cursor-not-allowed disabled:opacity-60">
              {isPending ? (isEdit ? 'Menyimpan…' : 'Membuat…') : isEdit ? 'Simpan Perubahan' : 'Buat Proyek'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────
// Delete Confirm Modal
// ──────────────────────────────────────────────
function DeleteModal({ project, onClose, onDeleted, toast }: {
  project: ProjectData
  onClose: () => void
  onDeleted: () => void
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result.error) { setError(result.error); return }
      toast('Proyek berhasil dihapus.', 'info')
      onDeleted()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 px-4 backdrop-blur-[3px]" role="dialog" aria-modal="true">
      <div className="w-full max-w-[420px] rounded-[16px] border border-[#fecaca] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
          <Trash2 size={20} />
        </div>
        <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0f172a]">Hapus "{project.name}"?</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
          Tindakan ini akan menghapus proyek secara permanen, beserta seluruh foto yang tersinkron dan pilihan foto klien. Tindakan ini tidak dapat dibatalkan.
        </p>
        {error && <p className="mt-3 text-[12px] font-medium text-[#dc2626]">{error}</p>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={isPending} className="rounded-[8px] border border-[#bfdbfe] bg-white px-4 py-2 text-[13px] font-medium text-[#64748b] hover:bg-[#eff6ff]">Batal</button>
          <button type="button" onClick={handleDelete} disabled={isPending} className="flex items-center gap-1.5 rounded-[8px] bg-[#dc2626] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#b91c1c] disabled:opacity-60 transition shadow-sm">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{isPending ? 'Menghapus…' : 'Ya, Hapus Proyek'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Clients View (Cards with Total Synced Photos)
// ──────────────────────────────────────────────
function ClientsView({
  projects,
  onViewPhotos,
}: {
  projects: ProjectData[]
  onViewPhotos: (project: ProjectData) => void
}) {
  const router = useRouter()
  return (
    <section>
      <PageHeading
        eyebrow="Workspace"
        title="Clients"
        description="Pantau daftar klien, total foto yang tersinkron dari Google Drive, dan progres pemilihan foto."
      />
      {projects.length === 0 ? (
        <div className="mt-8 rounded-[12px] border border-dashed border-[#93c5fd] bg-white/50 py-16 text-center text-sm text-[#64748b]">
          Belum ada klien. Buat proyek baru untuk menambahkan klien pertama Anda.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const initials =
              project.clientName
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'CL'
            const progress =
              project.maxPhotos > 0
                ? Math.round((project.selectedCount / project.maxPhotos) * 100)
                : 0

            const statusColors: Record<string, string> = {
              draft: 'text-[#64748b] bg-[#f1f5f9] border-[#cbd5e1]',
              active: 'text-[#1e40af] bg-[#dbeafe] border-[#93c5fd]',
              completed: 'text-[#15803d] bg-[#dcfce7] border-[#86efac]',
              locked: 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]',
            }
            const statusClass = statusColors[project.status] ?? statusColors.draft

            return (
              <div
                key={project.id}
                className="group flex flex-col justify-between rounded-[16px] border border-[#bfdbfe]/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-[#60a5fa] hover:shadow-md"
              >
                <div>
                  {/* Client Info & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#93c5fd] text-[13px] font-bold text-[#1e40af] shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-[16px] font-bold tracking-[-0.02em] text-[#0f172a]">
                          {project.clientName}
                        </h3>
                        <p className="truncate text-[12px] text-[#64748b]">{project.name}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusClass}`}
                    >
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>

                  {/* Stats Box: Total Synced & Selection Count */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-[12px] border border-[#dbeafe]/80 bg-[#f8fafc] p-3.5">
                    <div>
                      <p className="text-[11px] font-medium text-[#64748b]">Total Synced</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[15px] font-bold text-[#2563eb]">
                        <ImageIcon size={15} className="text-[#3b82f6]" />
                        <span>{project.photoCount} foto</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#64748b]">Foto Dipilih</p>
                      <p className="mt-1 text-[15px] font-bold text-[#0f172a]">
                        {project.selectedCount}{' '}
                        <span className="text-[11px] font-normal text-[#64748b]">
                          / {project.maxPhotos}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Selection Progress Bar */}
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[#64748b]">
                      <span>Progres Seleksi</span>
                      <span className="font-semibold text-[#2563eb]">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 flex items-center gap-2 border-t border-[#f1f5f9] pt-4">
                  <button
                    onClick={() => onViewPhotos(project)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] py-2 text-[12px] font-medium text-[#1e40af] shadow-xs transition hover:bg-[#dbeafe]"
                  >
                    <FolderOpen size={13} />
                    <span>Foto Drive</span>
                  </button>
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] py-2 text-[12px] font-medium text-white shadow-xs transition hover:from-[#1d4ed8] hover:to-[#0369a1]"
                  >
                    <span>Detail</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ──────────────────────────────────────────────
// Change Password Modal
// ──────────────────────────────────────────────
function ChangePasswordModal({ onClose, toast }: {
  onClose: () => void
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await changePassword({ error: '', success: false }, fd)
      if (result.error) { setError(result.error); return }
      toast('Password updated successfully!', 'success')
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 px-4 backdrop-blur-[3px]" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px] rounded-[16px] border border-[#bfdbfe] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#0f172a]">Change password</h3>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-[#64748b] hover:bg-[#eff6ff]"><X size={16} /></button>
        </div>
        <div className="grid gap-4">
          <Field label="New password">
            <input type="password" name="newPassword" required minLength={8} placeholder="At least 8 characters" className="form-input" />
          </Field>
          <Field label="Confirm new password">
            <input type="password" name="confirmPassword" required placeholder="Repeat new password" className="form-input" />
          </Field>
        </div>
        {error && <p role="alert" className="mt-3 text-[12px] font-medium text-[#dc2626]">{error}</p>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[#bfdbfe] bg-white px-4 py-2 text-[12px] font-medium text-[#64748b] hover:bg-[#eff6ff]">Cancel</button>
          <button type="submit" disabled={isPending} className="rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-4 py-2 text-[12px] font-medium text-white shadow-md disabled:opacity-60">
            {isPending ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────
// Profile View
// ──────────────────────────────────────────────
function ProfileView({ profile, userEmail, toast }: {
  profile: ProfileDataType
  userEmail: string
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const [draft, setDraft] = useState({ ...profile, email: userEmail })
  const [isPending, startTransition] = useTransition()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [logoutPending, setLogoutPending] = useState(false)

  const initials = draft.studioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  function save() {
    const fd = new FormData()
    fd.set('studioName', draft.studioName)
    fd.set('fullName', draft.fullName)
    fd.set('location', draft.location)
    fd.set('bio', draft.bio)
    fd.set('whatsapp', draft.whatsapp)
    fd.set('website', draft.website)

    startTransition(async () => {
      const result = await saveProfile({ error: '', success: false }, fd)
      if (result.error) { toast(result.error, 'error'); return }
      toast('Profile saved!', 'success')
    })
  }

  async function handleLogout() {
    setLogoutPending(true)
    await logout()
    window.location.href = '/login'
  }

  return (
    <section>
      <PageHeading eyebrow="Account" title="Profile" description="Manage the photographer profile shown across your workspace." />
      <div className="mt-8 grid max-w-[860px] gap-5">
        <div className="rounded-[14px] border border-[#bfdbfe]/80 bg-white/85 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd] text-[24px] font-semibold tracking-[-0.04em] text-[#1e40af] shadow-inner">
              {initials}
            </div>
            <div>
              <p className="text-[18px] font-semibold tracking-[-0.03em] text-[#0f172a]">{draft.studioName || 'Your Studio'}</p>
              <p className="mt-1 text-[13px] text-[#64748b]">Photographer{draft.location ? ` · ${draft.location}` : ''}</p>
            </div>
          </div>
        </div>

        <SettingsCard title="Personal details" description="These details help clients recognize your studio and contact you.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Studio name" example="Alex Studio">
              <input value={draft.studioName} onChange={(e) => setDraft({ ...draft, studioName: e.target.value })} className="form-input" />
            </Field>
            <Field label="Full name" example="Alex Santoso">
              <input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} className="form-input" />
            </Field>
            <Field label="Email address" help="Your account email. Cannot be changed here.">
              <input type="email" value={draft.email} readOnly className="form-input opacity-60 cursor-not-allowed" />
            </Field>
            <Field label="Location" example="Jakarta, Indonesia">
              <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="form-input" />
            </Field>
          </div>
          <div className="mt-5">
            <Field label="Short bio" example="Wedding photographer based in Jakarta">
              <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="form-input min-h-[88px] resize-y py-3" />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard title="Contact preferences" description="Choose how clients can reach you after submitting their selections.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp number" example="628123456789">
              <input value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} className="form-input" />
            </Field>
            <Field label="Website" example="https://alexstudio.com">
              <input type="url" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://alexstudio.com" className="form-input" />
            </Field>
          </div>
        </SettingsCard>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button type="button" onClick={save} disabled={isPending} className="flex items-center gap-2 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-5 py-2.5 text-[12px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-60 transition">
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isPending ? 'Saving…' : 'Save profile'}
          </button>
          <button type="button" onClick={() => setShowChangePassword(true)} className="flex items-center gap-2 rounded-[8px] border border-[#bfdbfe] bg-white px-4 py-2.5 text-[12px] font-medium text-[#1e40af] hover:bg-[#eff6ff] transition">
            Change password
          </button>
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 rounded-[8px] border border-[#fecaca] bg-white px-4 py-2.5 text-[12px] font-medium text-[#dc2626] transition hover:border-[#f87171] hover:bg-[#fef2f2]">
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} toast={toast} />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 px-4 backdrop-blur-[3px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-[400px] rounded-[16px] border border-[#bfdbfe] bg-white p-6 shadow-xl">
            <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
              <LogOut size={18} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#0f172a]">Log out of Perumda Photo Selector?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">You will be signed out of your account session on this device.</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="rounded-[8px] border border-[#bfdbfe] bg-white px-4 py-2 text-[12px] font-medium text-[#64748b] hover:bg-[#eff6ff]">Cancel</button>
              <button type="button" onClick={handleLogout} disabled={logoutPending} className="rounded-[8px] bg-[#dc2626] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#b91c1c] disabled:opacity-60">
                {logoutPending ? 'Signing out…' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ──────────────────────────────────────────────
// Settings View
// ──────────────────────────────────────────────
function SettingsView({ profile, toast }: {
  profile: ProfileDataType
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const [settings, setSettings] = useState({
    showBranding: profile.showBranding,
    allowNotes: profile.allowNotes,
    sendReminders: profile.sendReminders,
  })
  const [isPending, startTransition] = useTransition()

  function save() {
    const fd = new FormData()
    fd.set('showBranding', String(settings.showBranding))
    fd.set('allowNotes', String(settings.allowNotes))
    fd.set('sendReminders', String(settings.sendReminders))

    startTransition(async () => {
      const result = await saveSettings({ error: '', success: false }, fd)
      if (result.error) { toast(result.error, 'error'); return }
      toast('Settings saved!', 'success')
    })
  }

  return (
    <section>
      <PageHeading eyebrow="Workspace" title="Settings" description="Manage your gallery preferences and security." />
      <div className="mt-8 grid max-w-[860px] gap-5">
        <SettingsCard title="Gallery preferences" description="Set the defaults for new client selection galleries.">
          <div className="grid gap-4">
            <SettingToggle title="Show photographer branding" description="Display your studio name in the client gallery." checked={settings.showBranding} onChange={(v) => setSettings({ ...settings, showBranding: v })} />
            <SettingToggle title="Allow client notes" description="Let clients add a note to their selected photos." checked={settings.allowNotes} onChange={(v) => setSettings({ ...settings, allowNotes: v })} />
            <SettingToggle title="Send selection reminders" description="Keep clients moving with friendly reminder links." checked={settings.sendReminders} onChange={(v) => setSettings({ ...settings, sendReminders: v })} />
          </div>
        </SettingsCard>
        <button type="button" onClick={save} disabled={isPending} className="flex w-fit items-center gap-2 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-4 py-2.5 text-[12px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-60 transition">
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Main Dashboard
// ──────────────────────────────────────────────
interface DashboardProps {
  initialProjects: ProjectData[]
  userEmail: string
  initialProfile: ProfileDataType | null
}

export function PhotoSelectorDashboard({ initialProjects, userEmail, initialProfile }: DashboardProps) {
  const router = useRouter()
  const [active, setActive] = useState('Projects')
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects)
  const [copied, setCopied] = useState(false)
  const [lastCopiedToken, setLastCopiedToken] = useState<string | null>(
    initialProjects[0]?.clientToken ?? null
  )
  const [showNewProject, setShowNewProject] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectData | null>(null)
  const [viewingPhotosProject, setViewingPhotosProject] = useState<ProjectData | null>(null)
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? ''

  const profile: ProfileDataType = initialProfile ?? {
    email: userEmail,
    studioName: '',
    fullName: '',
    location: '',
    bio: '',
    whatsapp: '',
    website: '',
    showBranding: true,
    allowNotes: true,
    sendReminders: false,
  }

  const filtered = useMemo(
    () => projects.filter((p) => `${p.name} ${p.clientName}`.toLowerCase().includes(query.toLowerCase())),
    [projects, query]
  )

  const profileInitials = profile.studioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  function showToast(message: string, type: 'error' | 'success' | 'info' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  function copyLink(token: string) {
    const url = `${appUrl}/select/${token}`
    navigator.clipboard?.writeText(url)
    setLastCopiedToken(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function copyLastLink() {
    if (lastCopiedToken) copyLink(lastCopiedToken)
    else if (projects[0]) copyLink(projects[0].clientToken)
  }

  async function syncProject(project: ProjectData) {
    setSyncingProjectId(project.id)
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
      setSyncingProjectId(null)
    }
  }

  async function toggleLock(project: ProjectData) {
    const result = await setProjectLock(project.id, !project.selectionLocked)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast(project.selectionLocked ? 'Selection unlocked.' : 'Selection locked.', 'success')
      router.refresh()
    }
  }

  // Stats
  const activeCount = projects.filter((p) => p.status === 'active').length
  const totalSelected = projects.reduce((t, p) => t + p.selectedCount, 0)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.fullName.split(' ')[0] || profile.studioName.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] text-[#0f172a]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Drive Photos View Pop-up Modal */}
      {viewingPhotosProject && (
        <DrivePhotosModal
          project={viewingPhotosProject}
          onClose={() => setViewingPhotosProject(null)}
          onSync={syncProject}
          syncing={syncingProjectId === viewingPhotosProject.id}
          toast={showToast}
        />
      )}

      {/* New / Edit Project modal */}
      {(showNewProject || editingProject) && (
        <ProjectModal
          editing={editingProject}
          onClose={() => { setShowNewProject(false); setEditingProject(null) }}
          onCreated={async (token, newProjectId) => {
            setLastCopiedToken(token)
            router.refresh()
            if (newProjectId) {
              setSyncingProjectId(newProjectId)
              try {
                const res = await fetch(`/api/projects/${newProjectId}/sync`, { method: 'POST' })
                const data = await res.json() as { error?: string; synced?: number }
                if (!res.ok) {
                  showToast(data.error ?? 'Gagal menyinkronkan foto dari Drive.', 'error')
                } else {
                  showToast(`Berhasil menyinkronkan ${data.synced} foto dari Google Drive!`, 'success')
                  router.refresh()
                }
              } catch {
                showToast('Proyek berhasil dibuat. Anda dapat menyinkronkan foto secara manual dari menu.', 'info')
              } finally {
                setSyncingProjectId(null)
              }
            }
          }}
          onUpdated={() => router.refresh()}
          onDelete={(p) => setDeletingProject(p)}
          toast={showToast}
        />
      )}

      {/* Delete confirm modal */}
      {deletingProject && (
        <DeleteModal
          project={deletingProject}
          onClose={() => setDeletingProject(null)}
          onDeleted={() => router.refresh()}
          toast={showToast}
        />
      )}

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[238px] flex-col border-r border-[#bfdbfe]/70 bg-white/70 px-5 py-7 shadow-[4px_0_24px_rgba(59,130,246,0.04)] backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <img src="/logo.png" alt="Perumda Photo Selector" className="size-8 object-contain rounded-[8px] bg-white p-0.5 shadow-sm border border-[#bfdbfe]/50" />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">Perumda Photo Selector</span>
        </div>
        <nav className="mt-12 flex flex-col gap-1.5" aria-label="Main navigation">
          {(['Projects', 'Clients'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`flex h-10 items-center gap-3 rounded-[8px] px-3 text-left text-[13px] transition ${
                active === item
                  ? 'border border-[#bfdbfe]/60 bg-gradient-to-r from-[#dbeafe] to-[#e0f2fe] font-semibold text-[#1d4ed8] shadow-sm'
                  : 'text-[#64748b] hover:bg-[#e0f2fe]/60 hover:text-[#1e40af]'
              }`}
            >
              <span className={active === item ? 'text-[#2563eb]' : 'text-[#64748b]'}>
                {item === 'Projects' ? (
                  <FolderOpen size={16} strokeWidth={1.8} />
                ) : (
                  <Users size={16} strokeWidth={1.8} />
                )}
              </span>
              {item}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1.5">
          <button onClick={() => setActive('Settings')} className={`flex h-10 items-center gap-3 rounded-[8px] px-3 text-[13px] transition ${active === 'Settings' ? 'border border-[#bfdbfe]/60 bg-gradient-to-r from-[#dbeafe] to-[#e0f2fe] font-semibold text-[#1d4ed8] shadow-sm' : 'text-[#64748b] hover:bg-[#e0f2fe]/60 hover:text-[#1e40af]'}`}>
            <Settings2 size={16} strokeWidth={1.8} /> Settings
          </button>
          <button onClick={() => setActive('Profile')} className={`mt-4 flex items-center gap-3 border-t border-[#dbeafe] pt-5 text-left transition ${active === 'Profile' ? 'text-[#1d4ed8]' : 'text-[#1e293b]'}`} aria-label="Open profile">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd] text-[11px] font-semibold text-[#1e40af] shadow-xs">{profileInitials}</div>
            <div>
              <p className="text-[12px] font-medium text-[#0f172a]">{profile.studioName || userEmail}</p>
              <p className="text-[11px] text-[#64748b]">Photographer</p>
            </div>
            <MoreHorizontal className="ml-auto text-[#94a3b8]" size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-[238px]">
        <header className="flex h-[72px] items-center justify-between border-b border-[#bfdbfe]/70 bg-white/60 px-6 backdrop-blur-xl sm:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/logo.png" alt="Perumda Photo Selector" className="size-7 object-contain rounded-[6px] bg-white p-0.5 shadow-sm border border-[#bfdbfe]/50" />
            <span className="text-sm font-semibold text-[#0f172a]">Perumda Photo Selector</span>
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-[#64748b] lg:flex">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <span className="font-medium text-[#1d4ed8]">{active}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLastLink} className="hidden h-9 items-center gap-2 rounded-[8px] border border-[#bfdbfe] bg-white/90 px-3 text-[12px] font-medium text-[#1e40af] shadow-sm hover:bg-[#eff6ff] sm:flex">
              {copied ? <Check size={14} /> : <Link2 size={14} />}
              {copied ? 'Copied' : 'Copy last link'}
            </button>
            <button onClick={() => setShowNewProject(true)} className="flex h-9 items-center gap-2 rounded-[8px] bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#0284c7] px-3.5 text-[12px] font-medium text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] transition-all">
              <Plus size={15} /> New project
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1180px] px-6 py-9 sm:px-10 lg:px-12">
          {active === 'Clients' ? (
            <ClientsView projects={projects} onViewPhotos={setViewingPhotosProject} />
          ) : active === 'Settings' ? (
            <SettingsView profile={profile} toast={showToast} />
          ) : active === 'Profile' ? (
            <ProfileView profile={profile} userEmail={userEmail} toast={showToast} />
          ) : (
            <>
              {/* Dashboard header */}
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">{today}</p>
                  <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#0f172a] sm:text-[36px]">
                    {greeting}, {firstName}
                  </h1>
                  <p className="mt-2 text-[14px] text-[#64748b]">Here&apos;s what&apos;s happening with your selections.</p>
                </div>
                {projects.filter(p => p.status === 'active' && p.photoCount > 0 && p.selectedCount === 0).length > 0 && (
                  <div className="flex items-center gap-2 rounded-[10px] border border-[#93c5fd] bg-gradient-to-r from-white/90 to-[#e0f2fe]/90 px-3.5 py-2 text-[12px] font-medium text-[#1e40af] shadow-sm backdrop-blur">
                    <Sparkles size={14} className="text-[#2563eb]" />
                    {projects.filter(p => p.status === 'active' && p.photoCount > 0 && p.selectedCount === 0).length} projects awaiting client activity
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <Stat label="Active projects" value={String(activeCount)} detail="Awaiting client activity" />
                <Stat label="Photos selected" value={String(totalSelected)} detail="Across all projects" />
                <Stat label="Client activity" value={String(projects.length)} detail="Projects created" />
              </div>

              {/* Projects header */}
              <div className="mt-11 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.025em] text-[#0f172a]">Your projects</h2>
                  <p className="mt-1 text-[13px] text-[#64748b]">Manage galleries and review client selections.</p>
                </div>
                <div className="relative w-full sm:w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60a5fa]" size={15} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" className="h-9 w-full rounded-[8px] border border-[#bfdbfe] bg-white/90 pl-9 pr-3 text-[12px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#60a5fa]/25" />
                </div>
              </div>

              {/* Project grid */}
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {filtered.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onCopy={copyLink}
                    onEdit={setEditingProject}
                    onDelete={setDeletingProject}
                    onSync={syncProject}
                    onLock={toggleLock}
                    onViewPhotos={setViewingPhotosProject}
                    appUrl={appUrl}
                    syncing={syncingProjectId === project.id}
                  />
                ))}
              </div>

              {filtered.length === 0 && projects.length > 0 && (
                <div className="mt-5 rounded-[12px] border border-dashed border-[#93c5fd] bg-white/50 py-16 text-center text-sm text-[#64748b]">
                  No projects match your search.
                </div>
              )}

              {projects.length === 0 && (
                <div className="mt-5 rounded-[12px] border border-dashed border-[#93c5fd] bg-white/50 py-16 text-center">
                  <p className="text-[14px] font-medium text-[#64748b]">No projects yet.</p>
                  <button onClick={() => setShowNewProject(true)} className="mt-4 flex items-center gap-2 mx-auto rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-4 py-2.5 text-[12px] font-medium text-white shadow-md">
                    <Plus size={14} /> Create your first project
                  </button>
                </div>
              )}

              {/* Last link callout */}
              {projects.length > 0 && lastCopiedToken && (
                <div className="mt-12 flex flex-col gap-4 rounded-[12px] border border-[#bfdbfe] bg-gradient-to-r from-[#dbeafe]/80 via-[#e0f2fe]/90 to-[#eff6ff] px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-[8px] bg-white text-[#2563eb] shadow-xs">
                      <Link2 size={17} className="text-[#2563eb]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0f172a]">Your client link is ready to share</p>
                      <p className="mt-0.5 text-[12px] text-[#64748b]">
                        {projects[0]?.clientName} · {projects[0]?.selectedCount} of {projects[0]?.maxPhotos} photos selected
                      </p>
                    </div>
                  </div>
                  <button onClick={copyLastLink} className="flex h-9 items-center justify-center gap-2 rounded-[8px] bg-white px-3.5 text-[12px] font-medium text-[#1e40af] shadow-sm ring-1 ring-[#bfdbfe] hover:bg-[#eff6ff] transition">
                    <Copy size={14} />{copied ? 'Copied to clipboard' : 'Copy link'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default PhotoSelectorDashboard
