'use client'

// ──────────────────────────────────────────────
// Clients View — grid of client cards with workflow stage indicator
// ──────────────────────────────────────────────
import { useRouter } from 'next/navigation'
import { ChevronRight, FolderOpen, Image as ImageIcon, Send, Users } from 'lucide-react'
import type { ProjectData } from '@/lib/projects'
import { useLanguage } from '@/lib/language-context'
import { getStatusStyle } from '@/lib/status-styles'

export function ClientsView({
  projects,
  onViewPhotos,
  onOpenSelectedPhotos,
  onOpenDelivery,
}: {
  projects: ProjectData[]
  onViewPhotos: (project: ProjectData) => void
  onOpenSelectedPhotos?: (projectId: string | number) => void
  onOpenDelivery?: (projectId: string | number) => void
}) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3.5 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Users size={16} className="sm:hidden" />
              <Users size={18} className="hidden sm:block" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{t('clientsTitle')}</h1>
          </div>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
            {t('clientsDesc')}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 py-12 sm:py-16 text-center text-xs sm:text-sm text-slate-500">
          {t('noClients')}
        </div>
      ) : (
        <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, idx) => {
            const initials =
              project.clientName
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'CL'
            const progress =
              project.maxPhotos > 0
                ? Math.min(100, Math.round((project.selectedCount / project.maxPhotos) * 100))
                : 0

            const isCompleted = project.status === 'completed'
            const isEditing = project.status === 'editing' || (project.selectedCount > 0 && !isCompleted)

            const badgeLabel = isCompleted
              ? t('statusCompleted')
              : isEditing
              ? t('statusEditing')
              : project.status === 'active'
              ? t('statusActive')
              : project.status === 'locked'
              ? t('statusLocked')
              : t('statusDraft')

            const badgeStatusKey = isCompleted
              ? 'completed'
              : isEditing
              ? 'editing'
              : project.status

            return (
              <div
                key={project.id}
                className={`group flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl sm:rounded-[20px] p-4 sm:p-5 smooth-card hover:border-blue-300 hover:shadow-card-hover animate-card-enter stagger-${(idx % 8) + 1} motion-reduce:transition-none motion-reduce:hover:transform-none`}
              >
                <div>
                  {/* Client Info & Status Badge */}
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full bg-avatar text-brand-800 text-[11px] sm:text-[13px] font-medium shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          title={project.clientName}
                          className="truncate text-[14px] sm:text-[15px] font-bold tracking-[-0.02em] text-[#0f172a]"
                        >
                          {project.clientName}
                        </h3>
                        <p title={project.name} className="truncate text-[11px] sm:text-[12px] text-slate-500">
                          {project.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border text-[10.5px] sm:text-xs px-2 sm:px-2.5 py-0.5 font-semibold ${getStatusStyle(badgeStatusKey)}`}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Workflow Stage Stepper Strip */}
                  <div className="mt-3.5 sm:mt-4 flex items-center justify-between bg-slate-50/80 p-2 sm:p-2.5 rounded-xl border border-slate-100 text-[9.5px] sm:text-[10.5px]">
                    <div className="flex items-center gap-1 font-semibold text-brand-700 min-w-0">
                      <span className="flex size-3.5 sm:size-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-[8.5px] sm:text-[9px]">1</span>
                      <span className="truncate">{t('stepSelection')}</span>
                    </div>
                    <ChevronRight size={11} className="text-slate-300 shrink-0" />
                    <div className={`flex items-center gap-1 font-semibold min-w-0 ${isEditing || isCompleted ? 'text-amber-700' : 'text-slate-400'}`}>
                      <span className={`flex size-3.5 sm:size-4 shrink-0 items-center justify-center rounded-full text-[8.5px] sm:text-[9px] ${isEditing || isCompleted ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
                      <span className="truncate">{t('stepEditing')}</span>
                    </div>
                    <ChevronRight size={11} className="text-slate-300 shrink-0" />
                    <div className={`flex items-center gap-1 font-semibold min-w-0 ${isCompleted ? 'text-cyan-700' : 'text-slate-400'}`}>
                      <span className={`flex size-3.5 sm:size-4 shrink-0 items-center justify-center rounded-full text-[8.5px] sm:text-[9px] ${isCompleted ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
                      <span className="truncate">{t('stepDelivery')}</span>
                    </div>
                  </div>

                  {/* Stats Box */}
                  <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl border border-brand-100 bg-brand-50/40 p-2.5 sm:p-3.5">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-500">{t('totalSyncedRaw')}</p>
                      <p className="mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5 text-[13.5px] sm:text-[15px] font-bold text-brand-600">
                        <ImageIcon size={13} className="text-brand-500 sm:hidden" />
                        <ImageIcon size={15} className="text-brand-500 hidden sm:block" />
                        <span>{project.photoCount} {t('photosCount')}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-500">{t('photosSelected')}</p>
                      <p className="mt-0.5 sm:mt-1 text-[13.5px] sm:text-[15px] font-bold text-[#0f172a]">
                        {project.selectedCount}{' '}
                        <span className="text-[10px] sm:text-[11px] font-normal text-slate-500">
                          / {project.maxPhotos} {t('quota')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Selection Progress Bar */}
                  <div className="mt-3 sm:mt-3.5">
                    <div className="mb-1 flex items-center justify-between text-[10.5px] sm:text-[11px] font-medium text-slate-500">
                      <span>{t('progressQuota')}</span>
                      <span className="font-semibold text-brand-600">{progress}%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-progress transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 sm:mt-5 flex items-center gap-1.5 sm:gap-2 border-t border-slate-100 pt-3 sm:pt-4">
                  <button
                    onClick={() => onViewPhotos(project)}
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium transition-all duration-200 hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 active:scale-[0.98]"
                    title={t('tooltipDrivePhotos')}
                  >
                    <FolderOpen size={13} className="shrink-0" />
                    <span className="truncate">{t('btnDrivePhotos')}</span>
                  </button>

                  {onOpenDelivery && (
                    <button
                      onClick={() => onOpenDelivery(project.id)}
                      className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:-translate-y-0.5 active:scale-[0.98]"
                      title={t('tooltipDelivery')}
                    >
                      <Send size={13} className="shrink-0" />
                      <span className="truncate">{t('btnDelivery')}</span>
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="size-8 sm:size-9 shrink-0 flex items-center justify-center bg-brand-gradient bg-[length:200%_100%] bg-left text-white rounded-xl font-medium shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 active:scale-[0.98]"
                    title={t('tooltipProjectDetail')}
                    aria-label={t('tooltipProjectDetail')}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

