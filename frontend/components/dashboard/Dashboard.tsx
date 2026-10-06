'use client'

// ──────────────────────────────────────────────
// Main Dashboard Orchestrator
// ──────────────────────────────────────────────
import { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, ChevronRight, FolderOpen, Image, Link2,
  LogOut, Menu, MoreHorizontal, Plus, Search,
  Settings2, Users, X, Send, Layers,
  CheckCircle2, Wifi
} from 'lucide-react'
import { ApiError, auth, projects as projectsApi } from '@/lib/api-client'
import { setProjectLock } from '@/app/actions/projects'
import type { ProjectData } from '@/lib/projects'
import type { ProfileDataType } from './types'
import { useAutoRefresh } from '@/lib/use-auto-refresh'

import { Toast, Stat } from './ui-primitives'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'
import { DeleteModal } from './DeleteModal'
import { DrivePhotosModal } from './DrivePhotosModal'
import { ClientsView } from './ClientsView'
import { ProfileView } from './ProfileView'
import { SettingsView } from './SettingsView'
import { SelectedPhotosView } from './SelectedPhotosView'
import { DeliveryView } from './DeliveryView'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useLanguage } from '@/lib/language-context'

interface DashboardProps {
  initialProjects: ProjectData[]
  userEmail: string
  initialProfile: ProfileDataType | null
}

export function PhotoSelectorDashboard({ initialProjects, userEmail, initialProfile }: DashboardProps) {
  const router = useRouter()
  const [active, setActive] = useState<'Projects' | 'Foto Terpilih' | 'Delivery' | 'Clients' | 'Settings' | 'Profile'>('Projects')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null)
  const [deliveryWorkspaceProjectId, setDeliveryWorkspaceProjectId] = useState<string | number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const appUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? ''

  // ── Auto Refresh: ambil ulang data project dari backend ──
  const refreshProjects = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const res = await projectsApi.list()
      if (res && res.data) {
        const fresh: ProjectData[] = res.data.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          clientName: p.client_name,
          status: p.status,
          clientToken: p.client_token,
          driveLink: p.drive_folder_url,
          driveFolderId: p.drive_folder_id,
          whatsappNumber: p.whatsapp_number,
          maxPhotos: p.max_photos,
          selectionLocked: p.selection_locked,
          lastSyncedAt: p.last_synced_at,
          completedAt: p.completed_at,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          photoCount: p.photo_count ?? 0,
          selectedCount: p.selected_count ?? 0,
          editedCount: p.edited_count ?? 0,
          previewThumbnails: p.preview_thumbnails ?? [],
        }))
        // Cek apakah ada perubahan data (berdasarkan updated_at)
        setProjects((prev) => {
          const hasChange = fresh.some((fp) => {
            const old = prev.find((op) => String(op.id) === String(fp.id))
            return !old || old.selectedCount !== fp.selectedCount || old.status !== fp.status || old.updatedAt !== fp.updatedAt
          }) || fresh.length !== prev.length
          return hasChange ? fresh : prev
        })
        setLastRefreshed(new Date())
      }
    } catch {
      // Silent fail – jangan ganggu UX dengan error saat background refresh
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Pause auto-refresh saat ada modal yang terbuka
  const isModalOpen = !!(showNewProject || editingProject || deletingProject || viewingPhotosProject)

  useAutoRefresh({
    intervalMs: 30_000, // polling tiap 30 detik
    enabled: !isModalOpen,
    onRefresh: refreshProjects,
  })

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

  async function handleLogout() {
    try {
      await auth.logout()
    } catch { }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      window.location.href = '/login'
    }
  }

  async function syncProject(project: ProjectData) {
    setSyncingProjectId(String(project.id))
    try {
      const data = await projectsApi.sync(project.id)
      showToast(`Tersinkronkan ${data.synced} foto dari Google Drive.`, 'success')
      try {
        const res = await projectsApi.get(project.id)
        if (res && res.data) {
          const fresh = {
            id: String(res.data.id),
            name: res.data.name,
            clientName: res.data.client_name,
            status: res.data.status,
            clientToken: res.data.client_token,
            driveLink: res.data.drive_folder_url,
            driveFolderId: res.data.drive_folder_id,
            whatsappNumber: res.data.whatsapp_number,
            maxPhotos: res.data.max_photos,
            selectionLocked: res.data.selection_locked,
            lastSyncedAt: res.data.last_synced_at,
            completedAt: res.data.completed_at,
            createdAt: res.data.created_at,
            updatedAt: res.data.updated_at,
            photoCount: res.data.photo_count ?? 0,
            selectedCount: res.data.selected_count ?? 0,
            editedCount: res.data.edited_count ?? 0,
            previewThumbnails: res.data.preview_thumbnails ?? [],
          }
          setProjects((prev) => prev.map((p) => (String(p.id) === String(project.id) ? fresh : p)))
        }
      } catch { }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Koneksi bermasalah saat sinkronisasi.'
      showToast(message, 'error')
    } finally {
      setSyncingProjectId(null)
    }
  }

  async function toggleLock(project: ProjectData) {
    const nextLocked = !project.selectionLocked
    setProjects((prev) =>
      prev.map((p) =>
        String(p.id) === String(project.id)
          ? {
            ...p,
            selectionLocked: nextLocked,
            status: nextLocked ? 'locked' : p.status === 'locked' ? 'active' : p.status,
          }
          : p
      )
    )

    const result = await setProjectLock(project.id, nextLocked)
    if (result.error) {
      setProjects((prev) =>
        prev.map((p) => (String(p.id) === String(project.id) ? { ...p, selectionLocked: project.selectionLocked } : p))
      )
      showToast(result.error, 'error')
    } else {
      showToast(nextLocked ? 'Galeri berhasil dikunci.' : 'Galeri berhasil dibuka.', 'success')
    }
  }

  const { language, t } = useLanguage()

  // Stats & badge counts
  const activeCount = projects.filter((p) => p.status === 'active').length
  const totalSelected = projects.reduce((t, p) => t + p.selectedCount, 0)
  const totalDeliveredPhotos = projects.reduce((t, p) => {
    if (['completed', 'delivered'].includes(p.status)) {
      return t + (p.editedCount && p.editedCount > 0 ? p.editedCount : p.selectedCount)
    }
    return t + (p.editedCount || 0)
  }, 0)
  const selectedBadgeCount = projects.filter((p) => ['selected', 'editing'].includes(p.status) || p.selectedCount > 0).length
  const deliveryBadgeCount = projects.filter((p) => ['editing', 'delivered'].includes(p.status)).length

  const today = new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const greeting = new Date().getHours() < 12
    ? (language === 'id' ? 'Selamat pagi' : 'Good morning')
    : new Date().getHours() < 17
      ? (language === 'id' ? 'Selamat siang' : 'Good afternoon')
      : (language === 'id' ? 'Selamat malam' : 'Good evening')
  const firstName = profile.fullName.split(' ')[0] || profile.studioName.split(' ')[0] || (language === 'id' ? 'Pengguna' : 'there')

  const navItems = [
    { id: 'Projects', label: t('projects'), icon: <FolderOpen size={16} strokeWidth={1.8} />, count: null },
    { id: 'Foto Terpilih', label: t('selectedPhotos'), icon: <Image size={16} strokeWidth={1.8} />, count: selectedBadgeCount },
    { id: 'Delivery', label: t('delivery'), icon: <Send size={16} strokeWidth={1.8} />, count: deliveryBadgeCount },
    { id: 'Clients', label: t('clients'), icon: <Users size={16} strokeWidth={1.8} />, count: null },
  ] as const

  return (
    <div className="min-h-screen bg-page-bg text-[#0f172a]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Drive Photos View Pop-up Modal */}
      {viewingPhotosProject && (
        <DrivePhotosModal
          project={viewingPhotosProject}
          onClose={() => setViewingPhotosProject(null)}
          onSync={syncProject}
          syncing={syncingProjectId === String(viewingPhotosProject.id)}
          toast={showToast}
        />
      )}

      {/* New / Edit Project modal */}
      {(showNewProject || editingProject) && (
        <ProjectModal
          editing={editingProject}
          onClose={() => { setShowNewProject(false); setEditingProject(null) }}
          onCreated={async (token, newProjectId, newProjectData) => {
            setLastCopiedToken(token)
            if (newProjectData) {
              setProjects((prev) => [newProjectData, ...prev])
            }
            if (newProjectId) {
              setSyncingProjectId(String(newProjectId))
              try {
                const data = await projectsApi.sync(newProjectId)
                showToast(`Berhasil menyinkronkan ${data.synced} foto dari Google Drive!`, 'success')
                const freshRes = await projectsApi.get(newProjectId)
                if (freshRes && freshRes.data) {
                  const fresh = {
                    id: String(freshRes.data.id),
                    name: freshRes.data.name,
                    clientName: freshRes.data.client_name,
                    status: freshRes.data.status,
                    clientToken: freshRes.data.client_token,
                    driveLink: freshRes.data.drive_folder_url,
                    driveFolderId: freshRes.data.drive_folder_id,
                    whatsappNumber: freshRes.data.whatsapp_number,
                    maxPhotos: freshRes.data.max_photos,
                    selectionLocked: freshRes.data.selection_locked,
                    lastSyncedAt: freshRes.data.last_synced_at,
                    completedAt: freshRes.data.completed_at,
                    createdAt: freshRes.data.created_at,
                    updatedAt: freshRes.data.updated_at,
                    photoCount: freshRes.data.photo_count ?? 0,
                    selectedCount: freshRes.data.selected_count ?? 0,
                    editedCount: freshRes.data.edited_count ?? 0,
                    previewThumbnails: freshRes.data.preview_thumbnails ?? [],
                  }
                  setProjects((prev) => prev.map((p) => (String(p.id) === String(newProjectId) ? fresh : p)))
                }
              } catch (err) {
                const message = err instanceof ApiError
                  ? err.message
                  : 'Proyek berhasil dibuat. Anda dapat menyinkronkan foto secara manual dari menu.'
                showToast(message, err instanceof ApiError ? 'error' : 'info')
              } finally {
                setSyncingProjectId(null)
              }
            }
          }}
          onUpdated={(updatedProject) => {
            if (updatedProject) {
              setProjects((prev) => prev.map((p) => (String(p.id) === String(updatedProject.id) ? updatedProject : p)))
            }
          }}
          onDelete={(p) => setDeletingProject(p)}
          toast={showToast}
        />
      )}

      {/* Delete confirm modal */}
      {deletingProject && (
        <DeleteModal
          project={deletingProject}
          onClose={() => setDeletingProject(null)}
          onDeleted={(del) => {
            const targetId = del ? del.id : deletingProject.id
            setProjects((prev) => prev.filter((p) => String(p.id) !== String(targetId)))
          }}
          toast={showToast}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 hidden w-[238px] flex-col border-r border-brand-200/70 bg-white/80 px-4 py-7 shadow-[4px_0_24px_rgba(37,99,235,0.06)] backdrop-blur-xl lg:flex z-30">
        <div className="flex items-center gap-2.5 px-2">
          <img src="/logo.png" alt="Perumda Photo" className="size-8 object-contain rounded-xl bg-white p-0.5 shadow-xs border border-brand-200/60" />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">Perumda Photo</span>
        </div>
        <nav className="mt-8 flex flex-col gap-1.5" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id as any)}
                className={`flex h-10 items-center justify-between rounded-xl px-3.5 text-left text-sm transition-all duration-200 motion-reduce:transition-none motion-reduce:hover:transform-none ${isActive
                    ? 'bg-brand-soft text-brand-700 font-medium shadow-[inset_3px_0_0_#2563EB]'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700 hover:translate-x-1'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-brand-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.count !== null && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${isActive ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
                      }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1.5">
          <button
            onClick={() => setActive('Settings')}
            className={`flex h-10 items-center gap-2.5 rounded-xl px-3.5 text-sm transition-all duration-200 motion-reduce:transition-none motion-reduce:hover:transform-none ${active === 'Settings'
                ? 'bg-brand-soft text-brand-700 font-medium shadow-[inset_3px_0_0_#2563EB]'
                : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700 hover:translate-x-1'
              }`}
          >
            <Settings2 size={16} strokeWidth={1.8} />
            <span>{t('settings')}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex h-10 items-center gap-2.5 rounded-xl px-3.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all duration-200"
            title={t('logout')}
          >
            <LogOut size={16} strokeWidth={1.8} />
            <span>{t('logout')}</span>
          </button>
          <button
            onClick={() => setActive('Profile')}
            className={`mt-2 flex items-center gap-3 border-t border-brand-100 pt-4 text-left transition ${active === 'Profile' ? 'text-brand-700' : 'text-slate-800'}`}
            aria-label="Open profile"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-avatar text-brand-800 text-[11px] font-medium shadow-xs">{profileInitials}</div>
            <div className="min-w-0 flex-1 truncate">
              <p className="truncate text-[12px] font-medium text-slate-900">{profile.studioName || userEmail}</p>
              <p className="text-[11px] text-slate-500">{t('photographer')}</p>
            </div>
            <MoreHorizontal className="ml-auto text-slate-400" size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="lg:ml-[238px] pb-12">
        <header className="sticky top-0 z-30 flex h-[64px] sm:h-[72px] items-center justify-between border-b border-brand-200/70 bg-white/80 px-4 backdrop-blur-xl sm:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex size-9 items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-700 shadow-xs hover:bg-brand-50 transition"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Perumda Photo" className="size-7 object-contain rounded-lg bg-white p-0.5 shadow-xs border border-brand-200/60" />
              <span className="text-[13.5px] font-semibold text-slate-900">Perumda Photo</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-slate-500 lg:flex">
            <span>{t('workspace')}</span>
            <ChevronRight size={13} />
            <span className="font-medium text-brand-700">
              {active === 'Projects'
                ? t('projects')
                : active === 'Foto Terpilih'
                  ? t('selectedPhotos')
                  : active === 'Delivery'
                    ? t('delivery')
                    : active === 'Clients'
                      ? t('clients')
                      : active === 'Settings'
                        ? t('settings')
                        : t('profile')}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200"
              title={`Terakhir diperbarui: ${lastRefreshed.toLocaleTimeString('id-ID')}`}
            >
              <span
                className={`size-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]'
                  }`}
              />
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest">
                {isRefreshing ? 'Memperbarui…' : 'Live'}
              </span>
            </div>
            <LanguageSwitcher />
            <button
              onClick={copyLastLink}
              className="hidden sm:inline-flex items-center gap-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(37,99,235,.3)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />}
              <span>{copied ? t('copied') : t('copyLastLink')}</span>
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-brand-gradient bg-[length:200%_100%] bg-left text-white rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <Plus size={15} />
              <span>{t('newProject')}</span>
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sticky top-[64px] sm:top-[72px] z-20 border-b border-brand-200/70 bg-white/95 px-4 py-3 shadow-md backdrop-blur-xl lg:hidden">
            <div className="mb-2 flex items-center justify-between px-1 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">{t('language')}</span>
              <LanguageSwitcher variant="toggle" />
            </div>
            <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
              {[
                { id: 'Projects', label: t('projects'), icon: <FolderOpen size={18} /> },
                { id: 'Foto Terpilih', label: t('selectedPhotos'), icon: <Image size={18} /> },
                { id: 'Delivery', label: t('delivery'), icon: <Send size={18} /> },
                { id: 'Clients', label: t('clients'), icon: <Users size={18} /> },
                { id: 'Settings', label: t('settings'), icon: <Settings2 size={18} /> },
                { id: 'Profile', label: t('profile'), icon: <div className="flex size-5 items-center justify-center rounded-full bg-avatar text-[9px] font-bold text-brand-800">{profileInitials}</div> },
              ].map((tab) => {
                const isActive = active === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActive(tab.id as any)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${isActive
                        ? 'bg-brand-soft text-brand-700 shadow-[inset_3px_0_0_#2563EB]'
                        : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                  >
                    <span className={isActive ? 'text-brand-600' : 'text-slate-500'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-rose-600 hover:bg-rose-50 transition border-t border-brand-100 mt-1 pt-2.5"
              >
                <LogOut size={18} />
                <span>{t('logout')}</span>
              </button>
            </nav>
          </div>
        )}

        <div key={active} className="mx-auto max-w-[1180px] px-4 py-6 sm:px-10 sm:py-9 lg:px-12 animate-tab-switch">
          {active === 'Foto Terpilih' ? (
            <SelectedPhotosView
              onOpenDeliveryWorkspace={(id) => {
                setDeliveryWorkspaceProjectId(id)
                setActive('Delivery')
              }}
              toast={showToast}
            />
          ) : active === 'Delivery' ? (
            <DeliveryView
              initialOpenProjectId={deliveryWorkspaceProjectId}
              toast={showToast}
            />
          ) : active === 'Clients' ? (
            <ClientsView
              projects={projects}
              onViewPhotos={setViewingPhotosProject}
              onOpenSelectedPhotos={(id) => setActive('Foto Terpilih')}
              onOpenDelivery={(id) => {
                setDeliveryWorkspaceProjectId(id)
                setActive('Delivery')
              }}
            />
          ) : active === 'Settings' ? (
            <SettingsView profile={profile} toast={showToast} />
          ) : active === 'Profile' ? (
            <ProfileView profile={profile} userEmail={userEmail} toast={showToast} />
          ) : (
            <>
              {/* Dashboard header */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end animate-fade-in-down">
                <div>
                  <p className="mb-1 text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-600">{today}</p>
                  <h1 className="text-[24px] font-semibold tracking-[-0.045em] text-[#0f172a] sm:text-[34px]">
                    {greeting}, {firstName}
                  </h1>
                  <p className="mt-1 text-[13px] sm:text-[14px] text-slate-500">{t('dashboardSubtitle')}</p>
                </div>
                {projects.filter(p => p.status === 'active' && p.photoCount > 0 && p.selectedCount === 0).length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white/90 px-3.5 py-2 text-[12px] font-medium text-brand-700 shadow-xs backdrop-blur animate-fade-in-scale">
                    <Image size={14} className="text-brand-600 shrink-0" />
                    <span>{projects.filter(p => p.status === 'active' && p.photoCount > 0 && p.selectedCount === 0).length} {t('awaitingClientActivity')}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Stat className="stagger-1 animate-card-enter" label={t('activeProjects')} value={String(activeCount)} detail={t('activeProjectsDetail')} />
                <Stat className="stagger-2 animate-card-enter" label={t('photosSelectedStat')} value={String(totalSelected)} detail={t('photosSelectedDetail')} />
                <Stat className="stagger-3 animate-card-enter" label={t('photosSentStat')} value={String(totalDeliveredPhotos)} detail={t('photosSentDetail')} />
                <Stat className="stagger-4 animate-card-enter" label={t('clientActivityStat')} value={String(projects.length)} detail={t('clientActivityDetail')} />
              </div>

              {/* Projects header */}
              <div className="mt-8 sm:mt-11 flex flex-col justify-between gap-3 sm:flex-row sm:items-center animate-fade-in-down stagger-2">
                <div>
                  <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.025em] text-[#0f172a]">{t('yourProjects')}</h2>
                  <p className="mt-0.5 text-[12px] sm:text-[13px] text-slate-500">{t('manageGalleriesDesc')}</p>
                </div>
                <div className="relative w-full sm:w-[220px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400" size={14} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('searchProjects')}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white/90 pl-9 pr-3.5 text-[12.5px] text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-400/20"
                  />
                </div>
              </div>

              {/* Project grid */}
              <div className="mt-3.5 sm:mt-5 grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((project, idx) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    className={`animate-card-enter stagger-${(idx % 9) + 1}`}
                    onCopy={copyLink}
                    onEdit={setEditingProject}
                    onDelete={setDeletingProject}
                    onSync={syncProject}
                    onLock={toggleLock}
                    onViewPhotos={setViewingPhotosProject}
                    appUrl={appUrl}
                    syncing={syncingProjectId === project.id}
                    isMenuOpen={openMenuProjectId === project.id}
                    onMenuToggle={(open) => setOpenMenuProjectId(open ? project.id : null)}
                  />
                ))}
              </div>

              {filtered.length === 0 && projects.length > 0 && (
                <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-white/60 py-16 text-center text-sm text-slate-500 animate-fade-in-scale">
                  {t('noProjectsMatch')}
                </div>
              )}

              {projects.length === 0 && (
                <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-white/60 py-16 text-center animate-fade-in-scale">
                  <p className="text-[14px] font-medium text-slate-600">{t('noProjectsYet')}</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="mt-4 inline-flex items-center gap-2 mx-auto bg-brand-gradient bg-[length:200%_100%] bg-left text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none"
                  >
                    <Plus size={15} />
                    <span>{t('createFirstProject')}</span>
                  </button>
                </div>
              )}

              {/* Last link callout */}
              {projects.length > 0 && lastCopiedToken && (
                <div className="mt-8 sm:mt-12 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-aqua-100/50 to-brand-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 animate-card-enter stagger-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-xs border border-brand-100">
                      <Link2 size={18} className="text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] sm:text-[13.5px] font-semibold text-[#0f172a]">{t('clientLinkReady')}</p>
                      <p className="truncate text-[11.5px] sm:text-[12px] text-slate-500">
                        {projects[0]?.clientName} · {projects[0]?.selectedCount} {t('ofPhotosSelected', { max: projects[0]?.maxPhotos })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={copyLastLink}
                    className="bg-brand-50 text-brand-700 border border-brand-200 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(37,99,235,.3)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none flex items-center justify-center gap-1.5"
                  >
                    <Check size={13} />
                    <span>{copied ? t('copied') : t('copyLink')}</span>
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
