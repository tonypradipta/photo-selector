'use client'

// ──────────────────────────────────────────────
// Drive Photos Modal (pop-up gallery of all synced photos)
// ──────────────────────────────────────────────
import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  AlertCircle, Check, CheckCircle2, Eye, ExternalLink,
  FolderOpen, Image as ImageIcon, Loader2, RefreshCw,
  Search, Users, X
} from 'lucide-react'
import type { ProjectData } from '@/lib/projects'
import { ApiError, projects as projectsApi, getPhotoFallbackUrl } from '@/lib/api-client'
import type { DrivePhotoItem } from './types'
import { PhotoLightboxModal } from './PhotoLightboxModal'
import { useLanguage } from '@/lib/language-context'

export function DrivePhotosModal({
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
  const { t } = useLanguage()
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
      const data = await projectsApi.photos(project.id)
      const photos = (data.photos ?? []).map((photo) => ({
        id: String(photo.id),
        fileName: photo.file_name,
        photoCode: photo.photo_code,
        previewUrl: photo.preview_url,
        sortOrder: photo.sort_order,
        isSelected: photo.is_selected,
      }))
      setPhotos(photos)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal terhubung ke server.')
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-md animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[92vh] w-full max-w-[1240px] flex-col overflow-hidden rounded-[24px] border border-brand-200 bg-white/98 shadow-[0_25px_80px_rgba(30,58,138,0.22)] backdrop-blur-2xl animate-modal-dialog">
        {/* Modal Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white/90 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-avatar text-brand-700 shadow-xs">
              <FolderOpen size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[18px] font-bold tracking-[-0.025em] text-[#0f172a]">
                  {project.name}
                </h2>
                <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[10.5px] font-semibold text-brand-700">
                  {project.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[12px] text-slate-500">
                {t('fieldClientName')}: <span className="font-medium text-slate-800">{project.clientName}</span> ·{' '}
                <span className="text-brand-600 font-semibold">{photos.length} {t('photosCount')}</span> dari Google Drive
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {project.driveLink && (
              <a
                href={project.driveLink}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <FolderOpen size={14} className="text-brand-600" />
                <span>Google Drive</span>
                <ExternalLink size={12} className="text-slate-400" />
              </a>
            )}

            <button
              onClick={() => window.open(`/select/${project.clientToken}`, '_blank')}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 px-3 text-[12px] font-medium hover:bg-brand-soft hover:border-brand-400 transition"
            >
              <Users size={14} />
              <span>{t('openClientGallery')}</span>
              <ExternalLink size={12} />
            </button>

            <button
              onClick={handleSyncInsideModal}
              disabled={syncing}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left px-4 text-[12px] font-medium text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-60 transition-all duration-500 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? t('syncingDrive') : t('syncDrivePhotos')}</span>
            </button>

            <button
              onClick={onClose}
              aria-label={t('close')}
              className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('all')}
              className={`rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition ${tab === 'all'
                ? 'bg-white font-semibold text-brand-700 shadow-xs border border-brand-200'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {t('tabAllPhotos')} ({photos.length})
            </button>
            <button
              onClick={() => setTab('selected')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition ${tab === 'selected'
                ? 'bg-emerald-50 font-semibold text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CheckCircle2 size={13} className={tab === 'selected' ? 'text-emerald-600' : ''} />
              <span>{t('tabSelectedPhotos')} ({selectedCount} / {project.maxPhotos})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPhotosPlaceholder')}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-400/20"
            />
          </div>
        </div>

        {/* Photo Grid / Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={32} className="animate-spin text-brand-600" />
              <p className="text-[13px] font-medium">{t('syncingDrive')}</p>
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle size={36} className="text-rose-600" />
              <p className="text-[14px] font-medium text-slate-900">{error}</p>
              <button
                onClick={loadPhotos}
                className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-[12px] font-medium text-white shadow-sm hover:bg-brand-700"
              >
                {t('refresh')}
              </button>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center text-slate-500">
              <ImageIcon size={40} className="text-slate-300" />
              <p className="text-[14px] font-medium text-slate-900">
                {t('noPhotosFound')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs smooth-card hover:shadow-card-hover hover:border-brand-400 animate-card-enter stagger-${(index % 12) + 1}`}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
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
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-avatar">
                        <span className="font-mono text-[11px] font-semibold text-brand-800">
                          {photo.photoCode}
                        </span>
                      </div>
                    )}

                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md">
                        <Eye size={18} />
                      </div>
                    </div>

                    {/* Selected Badge */}
                    {photo.isSelected && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        <Check size={11} /> {t('photosSelected')}
                      </div>
                    )}

                    {/* Photo Code Badge */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg bg-slate-950/75 px-2 py-1 backdrop-blur-xs">
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
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3 text-[12px] text-slate-500">
          <span>
            {filteredPhotos.length} / {photos.length} {t('photosCount')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            {t('close')}
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
