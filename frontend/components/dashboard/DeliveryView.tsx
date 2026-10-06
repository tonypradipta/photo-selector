'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Send, Search, Filter, FolderOpen, ArrowRight, Download,
  CheckCircle2, Clock, Check, RefreshCw, ExternalLink, Link2, Copy, Sparkles, Image as ImageIcon
} from 'lucide-react'
import { deliveries, type ProjectData } from '@/lib/api-client'
import { DeliveryWorkspaceModal } from './DeliveryWorkspaceModal'
import { useLanguage } from '@/lib/language-context'
import { getStatusStyle } from '@/lib/status-styles'

interface DeliveryViewProps {
  initialOpenProjectId?: string | number | null
  toast: (msg: string, type?: 'error' | 'success' | 'info') => void
}

function SafePreviewImage({ src }: { src?: string | null }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="flex size-full items-center justify-center text-slate-300">
        <Sparkles size={14} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className="size-full object-cover"
      onError={() => setError(true)}
    />
  )
}

export function DeliveryView({
  initialOpenProjectId,
  toast,
}: DeliveryViewProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeWorkspaceProjectId, setActiveWorkspaceProjectId] = useState<string | number | null>(
    initialOpenProjectId || null
  )
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    if (initialOpenProjectId) {
      setActiveWorkspaceProjectId(initialOpenProjectId)
    }
  }, [initialOpenProjectId])

  useEffect(() => {
    loadDeliveries()
  }, [selectedStatus])

  async function loadDeliveries() {
    setLoading(true)
    try {
      const res = await deliveries.list({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchQuery || undefined,
      })
      setProjects(res.data)
      setCounts(res.counts)
    } catch (err: any) {
      toast(err.message || 'Gagal memuat data delivery', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.client_name.toLowerCase().includes(q)
    )
  }, [projects, searchQuery])

  function handleCopyDeliveryLink(token: string) {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${appUrl}/delivery/${token}`
    navigator.clipboard?.writeText(url)
    setCopiedToken(token)
    toast(t('copied'), 'success')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3.5 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Workspace Modal */}
      {activeWorkspaceProjectId && (
        <DeliveryWorkspaceModal
          projectId={activeWorkspaceProjectId}
          onClose={() => setActiveWorkspaceProjectId(null)}
          onUpdated={() => loadDeliveries()}
          toast={toast}
        />
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Send size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('deliveryTitle')}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t('deliveryDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadDeliveries()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-soft shadow-2xs transition"
            title={t('refresh')}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-brand-600' : ''} />
            <span>{t('refresh')}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-brand-100 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: t('deliveryTabAll'), count: counts.all || 0 },
            { id: 'editing', label: t('stepEditing'), count: counts.editing || 0 },
            { id: 'completed', label: t('deliveryTabDelivered'), count: counts.completed || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-body whitespace-nowrap transition-all duration-200 ${
                selectedStatus === tab.id
                  ? 'bg-brand-soft text-brand-700 font-semibold shadow-[inset_3px_0_0_#2563EB]'
                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium font-body ${
                  selectedStatus === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-100 text-brand-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchSelectedPlaceholder')}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-400/20"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 rounded-2xl bg-white/70 border border-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 text-center p-6 shadow-2xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-3">
            <Send size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('noProjectsYet')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project, idx) => {
            const isCompleted = project.status === 'completed'
            const hasActiveDelivery = Boolean(project.latest_delivery && project.latest_delivery.status === 'active')
            const deliveryToken = project.latest_delivery?.delivery_token
            const statusKey = isCompleted ? 'completed' : 'editing'

            return (
              <div
                key={project.id}
                className={`group flex flex-col bg-white border border-slate-200 rounded-[20px] smooth-card hover:border-blue-300 hover:shadow-card-hover animate-card-enter stagger-${(idx % 8) + 1} motion-reduce:transition-none motion-reduce:hover:transform-none overflow-hidden`}
              >
                {/* Card Top */}
                <div className="p-4 bg-gradient-to-b from-brand-50/40 to-transparent border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[11px] font-medium font-body text-brand-600 uppercase tracking-wider"
                        title={project.client_name}
                      >
                        {project.client_name}
                      </span>
                      <h3 className="text-base font-semibold font-heading text-slate-900 truncate" title={project.name}>
                        {project.name}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body ${getStatusStyle(statusKey)}`}
                    >
                      {isCompleted ? t('statusCompleted') : t('statusEditing')}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3 flex-1 flex flex-col justify-between text-xs">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">{t('photosSelected')}:</span>
                      <span className="font-bold text-slate-800">{project.selected_count} {t('photosCount')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">{t('syncEditedDrive')}:</span>
                      <span className={`font-semibold ${project.edited_count && project.edited_count > 0 ? 'text-brand-600' : 'text-slate-400'}`}>
                        {project.edited_count ? `${project.edited_count} ${t('photosCount')}` : '-'}
                      </span>
                    </div>

                    {/* Preview Foto Hasil Edit (Uniform proportional height) */}
                    <div className="p-1.5 bg-slate-100/70 rounded-2xl border border-slate-200/60 my-1">
                      {project.edited_count && project.edited_count > 0 && (project.edited_preview_thumbnails || []).length > 0 ? (
                        <div className="grid grid-cols-4 gap-1.5 h-20">
                          {[0, 1, 2, 3].map((idx) => {
                            const thumbs = project.edited_preview_thumbnails || []
                            const src = thumbs[idx]
                            return (
                              <div key={idx} className="relative size-full bg-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                                <SafePreviewImage src={src} />
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="h-20 flex flex-col items-center justify-center gap-1 text-slate-400">
                          <ImageIcon size={18} className="text-slate-300" />
                          <span className="text-[10.5px] font-normal font-body text-slate-400">Belum ada foto edit</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1 min-h-[26px]">
                      {hasActiveDelivery ? (
                        <>
                          <span className="text-slate-500 font-medium">{t('copyDeliveryLink')}:</span>
                          <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 size={12} />
                            <span>Link Aktif</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 font-normal">{t('deliveryGalleryTitle')}:</span>
                          <span className="text-slate-400 text-[11px]">Belum dibuat</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setActiveWorkspaceProjectId(project.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-white text-xs font-semibold shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:transform-none"
                    >
                      <Send size={13} />
                      <span>{t('openDeliveryWorkspace')}</span>
                    </button>

                    {hasActiveDelivery && deliveryToken && (
                      <button
                        onClick={() => handleCopyDeliveryLink(deliveryToken)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-[0.98] transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
                        title={t('copyDeliveryLink')}
                      >
                        {copiedToken === deliveryToken ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedToken === deliveryToken ? t('copied') : t('copyLink')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

