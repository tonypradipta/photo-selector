'use client'

// ──────────────────────────────────────────────
// Delete Confirm Modal
// ──────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteProject } from '@/app/actions/projects'
import type { ProjectData } from '@/lib/projects'
import { useLanguage } from '@/lib/language-context'

export function DeleteModal({ project, onClose, onDeleted, toast }: {
  project: ProjectData
  onClose: () => void
  onDeleted: (deletedProject?: ProjectData) => void
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const { t } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result.error) { setError(result.error); return }
      toast(t('projectDeletedSuccess'), 'info')
      onDeleted(project)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-modal-backdrop" role="dialog" aria-modal="true">
      <div className="w-full max-w-[420px] rounded-[24px] border border-rose-200 bg-white p-6 sm:p-7 shadow-2xl animate-modal-dialog">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-[#0f172a]">{t('deleteModalTitle', { name: project.name })}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          {t('deleteModalDesc')}
        </p>
        {error && <p className="mt-3 text-[12px] font-medium text-rose-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="bg-brand-50 text-brand-700 border border-brand-200 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition shadow-sm"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{isPending ? t('deleting') : t('btnConfirmDelete')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
