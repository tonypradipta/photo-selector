'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Image, Search, Filter, FolderOpen, ArrowRight, Download,
  CheckCircle2, Clock, Check, Send, AlertCircle, RefreshCw, MessageSquare
} from 'lucide-react'
import { selectedPhotos, type ProjectData, getPhotoPreviewUrl } from '@/lib/api-client'
import { SelectedPhotosDetailModal } from './SelectedPhotosDetailModal'
import { useLanguage } from '@/lib/language-context'
import { getStatusStyle } from '@/lib/status-styles'
import { useAutoRefresh } from '@/lib/use-auto-refresh'

interface SelectedPhotosViewProps {
  onOpenDeliveryWorkspace?: (projectId: string | number) => void
  toast: (msg: string, type?: 'error' | 'success' | 'info') => void
}

function SafePreviewImage({ src }: { src?: string | null }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="flex size-full items-center justify-center text-slate-300">
        <Image size={14} />
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

export function SelectedPhotosView({
  onOpenDeliveryWorkspace,
  toast,
}: SelectedPhotosViewProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDetailProjectId, setActiveDetailProjectId] = useState<string | number | null>(null)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  useEffect(() => {
    loadProjects()
  }, [selectedStatus])

  // Auto-refresh: polling tiap 30 detik, pause saat detail modal terbuka
  useAutoRefresh({
    intervalMs: 30_000,
    enabled: !activeDetailProjectId,
    onRefresh: async () => {
      try {
        setIsAutoRefreshing(true)
        const res = await selectedPhotos.list({
          status: selectedStatus === 'all' ? undefined : selectedStatus,
        })
        setProjects(res.data)
        setCounts(res.counts)
        setLastRefreshed(new Date())
      } catch {
        // silent fail
      } finally {
        setIsAutoRefreshing(false)
      }
    },
  })

  async function loadProjects() {
    setLoading(true)
    try {
      const res = await selectedPhotos.list({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchQuery || undefined,
      })
      setProjects(res.data)
      setCounts(res.counts)
    } catch (err: any) {
      toast(err.message || 'Gagal memuat daftar foto terpilih', 'error')
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

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3.5 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Detail Modal */}
      {activeDetailProjectId && (
        <SelectedPhotosDetailModal
          projectId={activeDetailProjectId}
          onClose={() => setActiveDetailProjectId(null)}
          onStatusUpdated={() => loadProjects()}
          toast={toast}
        />
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Image size={18} />
            </div>
            <h1 className="text-2xl font-bold font-heading tracking-tight text-slate-900">{t('selectedPhotosTitle')}</h1>
          </div>
          <p className="mt-1 text-sm font-normal font-body text-slate-500">
            {t('selectedPhotosDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadProjects()}
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
            { id: 'all', label: t('tabAll'), count: counts.all || 0 },
            { id: 'editing', label: t('tabInEditing'), count: counts.editing || 0 },
            { id: 'completed', label: t('tabCompleted'), count: counts.completed || 0 },
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
            <div key={i} className="h-64 rounded-2xl bg-white/70 border border-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 text-center p-6 shadow-2xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-3">
            <Image size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('noSelectedProjects')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project, idx) => {
            const isCompleted = project.status === 'completed'
            const thumbs = project.preview_thumbnails || []
            const statusKey = isCompleted ? 'completed' : 'editing'

            return (
              <div
                key={project.id}
                className={`group flex flex-col bg-white border border-slate-200 rounded-[20px] smooth-card hover:border-blue-300 hover:shadow-card-hover animate-card-enter stagger-${(idx % 8) + 1} motion-reduce:transition-none motion-reduce:hover:transform-none overflow-hidden`}
              >
                {/* Card Top / Thumbnail strip */}
                <div className="relative p-4 pb-2 bg-gradient-to-b from-brand-50/40 to-transparent">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
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

                  {/* Thumbnail Previews */}
                  <div className="grid grid-cols-4 gap-1.5 h-20 rounded-xl overflow-hidden bg-slate-100 p-1 border border-slate-200/70">
                    {[0, 1, 2, 3].map((idx) => {
                      const src = thumbs[idx]
                      return (
                        <div key={idx} className="relative size-full bg-slate-200 rounded-lg overflow-hidden">
                          <SafePreviewImage src={src} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Card Body & Stats */}
                <div className="px-4 py-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{t('photosSelected')}:</span>
                    <span className="font-bold text-slate-800">
                      {project.selected_count} <span className="text-slate-400 font-normal">/ {project.max_photos} {t('quota')}</span>
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setActiveDetailProjectId(project.id)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-xl px-3 text-xs font-semibold font-body transition-all duration-200 hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none"
                    >
                      <Download size={13} />
                      <span>{t('viewDetailPhotos')}</span>
                    </button>

                    {onOpenDeliveryWorkspace && (
                      <button
                        onClick={() => onOpenDeliveryWorkspace(project.id)}
                        className="h-9 flex items-center justify-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 text-xs font-semibold font-body transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none"
                        title={t('openDeliveryWorkspace')}
                      >
                        <Send size={13} />
                        <span>{t('btnDelivery')}</span>
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
