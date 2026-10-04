'use client'

// ──────────────────────────────────────────────
// Project Card Menu (dropdown)
// ──────────────────────────────────────────────
import {
  Copy, ExternalLink, Image as ImageIcon, MoreHorizontal,
  Edit3, Lock, Unlock, Trash2, Users
} from 'lucide-react'
import type { ProjectData } from '@/lib/projects'
import { useLanguage } from '@/lib/language-context'

export function ProjectCardMenu({ project, onEdit, onDelete, onSync, onLock, onCopy, onViewPhotos, appUrl, syncing, open, onToggleOpen }: {
  project: ProjectData
  onEdit: () => void
  onDelete: () => void
  onSync: () => void
  onLock: () => void
  onCopy: () => void
  onViewPhotos: () => void
  appUrl: string
  syncing: boolean
  open: boolean
  onToggleOpen: (open: boolean) => void
}) {
  const { t } = useLanguage()

  function item(label: string, icon: React.ReactNode, onClick: () => void, danger = false) {
    return (
      <button
        type="button"
        onClick={() => { onClick(); onToggleOpen(false) }}
        className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium transition ${danger
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
        onClick={() => onToggleOpen(!open)}
        className="flex size-8 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#eff6ff] hover:text-[#0f172a] transition"
      >
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onToggleOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 w-[215px] rounded-[14px] border border-[#bfdbfe] bg-white/98 p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.22)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            {item(t('menuViewDrive'), <ImageIcon size={14} />, onViewPhotos)}
            {item(t('menuCopyLink'), <Copy size={14} />, onCopy)}
            {item(t('menuEditProject'), <Edit3 size={14} />, onEdit)}
            {item(project.selectionLocked ? t('menuUnlockSelection') : t('menuLockSelection'), project.selectionLocked ? <Unlock size={14} /> : <Lock size={14} />, onLock)}
            <a
              href={`/projects/${project.id}`}
              onClick={() => onToggleOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-[#1e293b] transition hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
            >
              <span className="text-[#3b82f6]"><Users size={14} /></span>
              <span>{t('menuViewSelections')}</span>
            </a>
            <div className="my-1 border-t border-[#e2e8f0]" />
            {item(t('menuDeleteProject'), <Trash2 size={14} />, onDelete, true)}
          </div>
        </>
      )}
    </div>
  )
}
