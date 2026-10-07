'use client'

// ──────────────────────────────────────────────
// Project Card
// ──────────────────────────────────────────────
import { Copy, ExternalLink, Image as ImageIcon } from 'lucide-react'
import type { ProjectData } from '@/lib/projects'
import { ProjectThumbnailBanner } from './ProjectThumbnailBanner'
import { ProjectCardMenu } from './ProjectCardMenu'
import { useLanguage } from '@/lib/language-context'
import { getStatusStyle } from '@/lib/status-styles'

export function ProjectCard({ project, onCopy, onEdit, onDelete, onSync, onLock, onViewPhotos, appUrl, syncing, isMenuOpen, onMenuToggle, className = '' }: {
  project: ProjectData
  onCopy: (token: string) => void
  onEdit: (project: ProjectData) => void
  onDelete: (project: ProjectData) => void
  onSync: (project: ProjectData) => void
  onLock: (project: ProjectData) => void
  onViewPhotos: (project: ProjectData) => void
  appUrl: string
  syncing: boolean
  isMenuOpen: boolean
  onMenuToggle: (open: boolean) => void
  className?: string
}) {
  const { language, t } = useLanguage()
  const progress = project.maxPhotos > 0 ? Math.round((project.selectedCount / project.maxPhotos) * 100) : 0
  const date = new Date(project.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
    <article className={`group relative bg-white border border-slate-200 rounded-2xl sm:rounded-[20px] shadow-xs smooth-card hover:border-blue-300 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:transform-none ${
      isMenuOpen ? 'z-30 ring-2 ring-brand-500/30' : 'z-10'
    } ${className}`}>
      <div className="relative h-[132px] sm:h-[152px] overflow-hidden rounded-t-[15px] sm:rounded-t-[19px]">
        {/* Drive photos thumbnail banner */}
        <ProjectThumbnailBanner thumbnails={project.previewThumbnails} photoCount={project.photoCount} />

        {/* Status badge in top-left */}
        <div className={`absolute left-2.5 top-2.5 sm:left-3 sm:top-3 rounded-full border px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[10.5px] font-medium font-body backdrop-blur-md shadow-xs ${getStatusStyle(project.status)}`}>
          {badgeText}
        </div>

        {/* Photo count pill in bottom-left */}
        {project.photoCount > 0 && (
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 rounded-full bg-slate-950/70 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10.5px] sm:text-[11px] font-medium text-white shadow-xs backdrop-blur-md border border-white/15">
            <ImageIcon size={12} className="text-aqua-400" />
            <span>{project.photoCount} {t('photosCount')}</span>
          </div>
        )}

        {/* Open Drive photos pop-up gallery button in bottom-right */}
        <button
          aria-label={`Lihat semua foto ${project.name}`}
          onClick={() => onViewPhotos(project)}
          title={t('seeAllDrivePhotos')}
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 flex size-7 sm:size-8 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-md hover:bg-white hover:scale-105 active:scale-95 transition"
        >
          <ExternalLink size={13} className="sm:hidden" />
          <ExternalLink size={14} className="hidden sm:block" />
        </button>
      </div>
      <div className="p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14.5px] sm:text-[16px] font-semibold font-heading tracking-[-0.025em] text-slate-900">{project.name}</h3>
            <p className="mt-0.5 truncate text-[11.5px] sm:text-[12px] font-normal font-body text-slate-500">{project.clientName}</p>
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
            open={isMenuOpen}
            onToggleOpen={onMenuToggle}
          />
        </div>

        {/* Info row */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between text-[11px] sm:text-[11.5px] font-normal font-body text-slate-500">
          <span className="font-medium text-slate-600">{project.photoCount} {t('photosSynced')}</span>
          <span>{date}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-1.5 sm:mt-2 h-1.5 sm:h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-progress transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bottom actions row */}
        <div className="mt-3 sm:mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 min-w-0">
          <span className="truncate text-[11px] sm:text-[12px] font-medium font-body text-brand-600 min-w-0 flex-1">
            {project.selectedCount > 0 ? `${project.selectedCount} ${t('fromQuotaSelected', { max: project.maxPhotos })}` : t('noPhotosSelectedYet')}
          </span>
          <button
            onClick={() => onCopy(project.clientToken)}
            className="flex shrink-0 items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-semibold font-body text-brand-700 hover:text-brand-500 transition-colors"
          >
            <Copy size={12} className="shrink-0 sm:hidden" />
            <Copy size={13} className="shrink-0 hidden sm:block" />
            <span className="whitespace-nowrap">{t('shareLink')}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

