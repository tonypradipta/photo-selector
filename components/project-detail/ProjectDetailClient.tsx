'use client'

// ──────────────────────────────────────────────
// Project Detail Client Component
// ──────────────────────────────────────────────
import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Check, Copy, ExternalLink, Lock, Unlock, RefreshCw,
  AlertCircle, Loader2, Camera, Calendar, Users, Image as ImageIcon,
  MessageCircle, ClipboardList, FileArchive
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { setProjectLock } from '@/app/actions/projects'
import { ApiError, projects as projectsApi } from '@/lib/api-client'
import type { ProjectDetail, SelectedPhoto } from '@/app/projects/[id]/page'
import { useLanguage } from '@/lib/language-context'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { getStatusStyle } from '@/lib/status-styles'
import { useAutoRefresh } from '@/lib/use-auto-refresh'

// ──────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'error' | 'success' | 'info' }) {
  const colors = {
    error: 'border-rose-200 bg-rose-50/95 text-rose-700 shadow-rose-500/10',
    success: 'border-emerald-200 bg-emerald-50/95 text-emerald-800 shadow-emerald-500/10',
    info: 'border-blue-200 bg-blue-50/95 text-blue-800 shadow-blue-500/10',
  }
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 ${colors[type]}`}>
      {type === 'error' && <AlertCircle size={16} className="shrink-0 text-rose-600" />}
      {type === 'success' && <Check size={16} className="shrink-0 text-emerald-600" />}
      <span>{message}</span>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function ProjectDetailClient({
  project: initialProject,
  selectedPhotos,
}: {
  project: ProjectDetail
  selectedPhotos: SelectedPhoto[]
}) {
  const { language, t } = useLanguage()
  const router = useRouter()
  const [project, setProject] = useState<ProjectDetail>(initialProject)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lockPending, startLockTransition] = useTransition()
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? ''
  const galleryUrl = `${appUrl}/select/${project.clientToken}`
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [liveSelectedPhotos, setLiveSelectedPhotos] = useState<SelectedPhoto[]>(selectedPhotos)

  // Auto-refresh: polling tiap 20 detik untuk tangkap aktivitas klien
  useAutoRefresh({
    intervalMs: 20_000,
    enabled: !syncing,
    onRefresh: useCallback(async () => {
      try {
        setIsAutoRefreshing(true)
        const res = await projectsApi.photos(project.id)
        if (res && res.project) {
          const p = res.project
          setProject((prev) => ({
            ...prev,
            photoCount: res.totalCount ?? res.photos.length,
            selectedCount: res.selectedCount ?? res.photos.filter((ph: any) => ph.is_selected).length,
            lastSyncedAt: p.last_synced_at,
            status: p.status ?? prev.status,
          }))
          // Update daftar foto terpilih jika ada perubahan
          const selected: SelectedPhoto[] = res.photos
            .filter((ph: any) => ph.is_selected)
            .map((ph: any) => ({
              id: ph.id,
              photoCode: ph.photo_code,
              fileName: ph.file_name,
              previewUrl: ph.preview_url,
              selectedAt: ph.selected_at ?? ph.updated_at ?? new Date().toISOString(),
            }))
          setLiveSelectedPhotos((prev) =>
            prev.length !== selected.length ||
            selected.some((s: any, i: number) => prev[i]?.id !== s.id)
              ? selected
              : prev
          )
          setLastRefreshed(new Date())
        }
      } catch {
        // silent fail
      } finally {
        setIsAutoRefreshing(false)
      }
    }, [project.id, syncing]),
  })

  function showToast(message: string, type: 'error' | 'success' | 'info' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  function copyGalleryLink() {
    navigator.clipboard?.writeText(galleryUrl)
    showToast(t('copied'), 'success')
  }

  function copyFileNames() {
    const fileNames = liveSelectedPhotos.map((p) => p.fileName).filter(Boolean)
    navigator.clipboard?.writeText(fileNames.join(', '))
    showToast(`Berhasil menyalin ${fileNames.length} nama file!`, 'success')
  }

  async function handleDownloadZip() {
    if (!liveSelectedPhotos.length) return
    setDownloadingZip(true)
    setDownloadProgress(0)

    try {
      showToast('Menyiapkan file ZIP foto pilihan...', 'info')
      const zip = new JSZip()
      const folderName = `${project.name}_Foto_Terpilih`
      const imgFolder = zip.folder(folderName) || zip

      let summary = `FOTO TERPILIH - ${project.name}\nClient: ${project.clientName}\nTotal: ${liveSelectedPhotos.length} foto\n\n`

      let count = 0
      for (let i = 0; i < liveSelectedPhotos.length; i++) {
        const item = liveSelectedPhotos[i]
        summary += `${i + 1}. ${item.fileName} (Code: ${item.photoCode})\n`

        if (item.previewUrl) {
          try {
            const res = await fetch(item.previewUrl)
            if (res.ok) {
              const blob = await res.blob()
              imgFolder.file(item.fileName || `foto_${i + 1}.jpg`, blob)
            }
          } catch (e) {
            console.error('Download err:', e)
          }
        }
        count++
        setDownloadProgress(Math.round((count / liveSelectedPhotos.length) * 100))
      }

      imgFolder.file('Daftar_Foto.txt', summary)
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Foto_Terpilih.zip`)
      showToast('File ZIP foto berhasil diunduh!', 'success')
    } catch (err: any) {
      showToast('Gagal mengunduh ZIP: ' + (err.message || 'Terjadi kesalahan'), 'error')
    } finally {
      setDownloadingZip(false)
      setDownloadProgress(0)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const data = await projectsApi.sync(project.id)
      showToast(`Tersinkronkan ${data.synced} foto.`, 'success')
      try {
        const res = await projectsApi.photos(project.id)
        if (res && res.project) {
          const p = res.project
          setProject((prev) => ({
            ...prev,
            photoCount: res.totalCount ?? res.photos.length,
            selectedCount: res.selectedCount ?? res.photos.filter((ph) => ph.is_selected).length,
            lastSyncedAt: p.last_synced_at,
          }))
        }
      } catch {}
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Koneksi bermasalah saat sinkronisasi.'
      showToast(message, 'error')
    } finally {
      setSyncing(false)
    }
  }

  function handleToggleLock() {
    const nextLocked = !project.selectionLocked
    setProject((prev) => ({
      ...prev,
      selectionLocked: nextLocked,
      status: nextLocked ? 'locked' : prev.status === 'locked' ? 'active' : prev.status,
    }))

    startLockTransition(async () => {
      const result = await setProjectLock(project.id, nextLocked)
      if (result.error) {
        setProject((prev) => ({ ...prev, selectionLocked: project.selectionLocked }))
        showToast(result.error, 'error')
      } else {
        showToast(nextLocked ? 'Galeri berhasil dikunci.' : 'Galeri berhasil dibuka.', 'success')
      }
    })
  }

  function openWhatsApp() {
    if (!project.whatsappNumber) {
      showToast('No WhatsApp number configured.', 'error')
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
    iso ? new Date(iso).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'

  const statusInfo = getStatusStyle(project.status)
  const badgeText =
    project.status === 'active'
      ? t('statusActive')
      : project.status === 'completed'
      ? t('statusCompleted')
      : project.status === 'locked'
      ? t('statusLocked')
      : project.status === 'editing'
      ? t('statusEditing')
      : t('statusDraft')

  return (
    <div className="min-h-screen bg-page-bg text-slate-800">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 sm:h-[72px] items-center justify-between border-b border-blue-100 bg-white/85 px-4 backdrop-blur-xl sm:px-10 shadow-2xs">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} />
          <span>{t('backToDashboard')}</span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <button
            onClick={handleSync}
            disabled={syncing}
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 px-3 text-xs font-bold hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? t('syncingDrive') : t('syncGoogleDriveBtn')}</span>
          </button>

          <button
            onClick={() => window.open(galleryUrl, '_blank')}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 px-3 text-xs font-bold hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">{t('openClientGallery')}</span>
            <span className="sm:hidden">Galeri</span>
          </button>

          <button
            onClick={handleToggleLock}
            disabled={lockPending}
            className={`flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg active:scale-[0.98] transition-all disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:transform-none ${
              project.selectionLocked
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800'
                : 'bg-brand-gradient bg-[length:200%_100%] bg-left hover:bg-right hover:-translate-y-0.5'
            }`}
          >
            {lockPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : project.selectionLocked ? (
              <Unlock size={13} />
            ) : (
              <Lock size={13} />
            )}
            <span>{project.selectionLocked ? t('unlockGalleryBtn') : t('lockGalleryBtn')}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1140px] px-4 py-6 sm:px-10 sm:py-10">
        {/* Project name + meta */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-body ${statusInfo}`}>
                {badgeText}
              </span>
              {project.selectionLocked && (
                <span className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium font-body text-rose-700">
                  <Lock size={11} /> {t('statusLocked')}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900">
              {project.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-normal font-body text-slate-500">{project.clientName}</p>
          </div>

          {/* Copy + share */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyGalleryLink}
              className="flex flex-1 sm:flex-initial justify-center h-9 items-center gap-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 px-3.5 text-xs font-bold hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <Copy size={13} /> {t('copyLink')}
            </button>
            {project.whatsappNumber && (
              <button
                onClick={openWhatsApp}
                className="flex flex-1 sm:flex-initial justify-center h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-green-700 hover:-translate-y-0.5 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
              >
                <MessageCircle size={14} className="fill-white/20 text-white" /> WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: <ImageIcon size={18} className="text-blue-600" />, label: t('totalSyncedRaw'), value: `${project.photoCount} ${t('photosCount')}` },
            { icon: <Check size={18} className="text-emerald-600" />, label: t('photosSelected'), value: `${project.selectedCount} / ${project.maxPhotos}` },
            { icon: <Calendar size={18} className="text-indigo-600" />, label: 'Created', value: formatDate(project.createdAt) },
            { icon: <Camera size={18} className="text-sky-600" />, label: 'Last synced', value: project.lastSyncedAt ? formatDate(project.lastSyncedAt) : 'Never' },
          ].map(({ icon, label, value }, idx) => (
            <div key={label} className={`rounded-[20px] border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs smooth-card hover:border-blue-300 hover:shadow-card-hover animate-card-enter stagger-${idx + 1} motion-reduce:transition-none motion-reduce:hover:transform-none`}>
              <div className="mb-2 sm:mb-3 flex size-9 items-center justify-center rounded-xl bg-blue-50">
                {icon}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">{label}</p>
              <p className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Selection progress */}
        {project.photoCount > 0 && (
          <div className="mb-6 sm:mb-8 rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-2xs smooth-card animate-card-enter stagger-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs sm:text-sm font-bold text-slate-900">{t('progressQuota')}</p>
              <p className="text-xs sm:text-sm font-extrabold text-blue-600">{progress}%</p>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-progress transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {project.selectedCount} {t('fromQuotaSelected', { max: project.maxPhotos })}
            </p>
          </div>
        )}

        {/* Selected photos */}
        <div className="rounded-[20px] border border-slate-200/90 bg-white shadow-2xs overflow-hidden animate-card-enter stagger-6">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900">
                {t('selectedPhotosTitle')}
              </h2>
              {liveSelectedPhotos.length > 0 && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  {liveSelectedPhotos.length}
                </span>
              )}
            </div>
            {liveSelectedPhotos.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={copyFileNames}
                  className="flex items-center gap-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1.5 text-xs font-bold hover:bg-brand-soft hover:border-brand-400 active:scale-95 transition"
                  title="Copy File Names"
                >
                  <Copy size={12} /> Copy File Names
                </button>
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-white px-3.5 py-1.5 text-xs font-bold shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-95 transition-all disabled:opacity-50"
                  title="Unduh seluruh foto terpilih dalam bentuk ZIP"
                >
                  {downloadingZip ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>ZIP ({downloadProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <FileArchive size={13} />
                      <span>Download Foto (.ZIP)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {liveSelectedPhotos.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-slate-400">
                <Users size={22} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">{t('noPhotosSelectedYet')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:p-5">
              {liveSelectedPhotos.map((photo, idx) => (
                <div key={photo.id} className={`overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs smooth-card hover:shadow-card-hover hover:border-blue-300 animate-card-enter stagger-${(idx % 12) + 1} motion-reduce:transition-none motion-reduce:hover:transform-none`}>
                  {photo.previewUrl ? (
                    <img
                      src={photo.previewUrl}
                      alt={photo.photoCode}
                      className="aspect-square w-full object-cover smooth-zoom hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-square w-full bg-avatar flex items-center justify-center">
                      <span className="font-body text-[11px] font-medium text-white">{photo.photoCode}</span>
                    </div>
                  )}
                  <div className="px-2.5 py-2">
                    <p className="truncate font-body text-[11px] font-medium text-blue-700">{photo.photoCode}</p>
                    <p className="truncate font-body text-[10px] font-medium text-slate-400">{photo.fileName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
