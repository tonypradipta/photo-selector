'use client'

// ──────────────────────────────────────────────
// New / Edit Project Modal
// ──────────────────────────────────────────────
import { useState, useTransition, useRef, useEffect } from 'react'
import { LockKeyhole, Trash2, X, ChevronDown, Check } from 'lucide-react'
import { createProject, updateProject, deleteProject } from '@/app/actions/projects'
import type { ProjectData } from '@/lib/projects'
import { Field } from './ui-primitives'
import { useLanguage } from '@/lib/language-context'

const CLIENT_OPTIONS = [
  'Direktur Utama',
  'Direktur Teknik',
  'Direktur Umum',
  'Satuan Pengawas Intern (SPI)',
  'Sekretaris Perusahaan',
  'Bidang Penelitian dan Pengembangan',
  'Subbidang Renstra dan Pengembangan Bisnis',
  'Subbidang Pengembangan dan Teknologi Sistem Informasi',
  'Bidang Produksi',
  'Subbidang Produksi',
  'Subbidang Mekanikal & Elektrikal',
  'Subbidang Laboratorium',
  'Bidang Transmisi dan Distribusi',
  'Subbidang Pengendalian Kehilangan Air',
  'Subbidang Meter Air',
  'Subbidang Rencana Pengamanan Air Minum',
  'Bidang Perencana Teknik',
  'Subbidang Perencana Teknik',
  'Subbidang Pengawasan',
  'Bidang Hubungan Pelanggan',
  'Subbidang Pelanggan',
  'Subbidang Sambungan Baru',
  'Subbidang Pembaca Meter',
  'Bidang Keuangan',
  'Subbidang Kas & Penagihan',
  'Subbidang Anggaran dan Aset',
  'Subbidang Akuntansi',
  'Bidang Umum',
  'Subbidang Gudang & Administrasi Pengadaan',
  'Subbidang Kepegawaian',
  'Subbidang Rumah Tangga & Pengamanan',
  'Subbidang Pengawasan Intern Administrasi & Keuangan',
  'Subbidang Pengawasan Intern Teknik & TSI',
  'Subbidang Humas & Pengelolaan Informasi Dokumentasi',
  'Subbidang Sekretariat & Protokol',
  'Subbidang Hukum dan Tata Kelola',
  'Kantor Cabang Busungbiu',
  'Kantor Cabang Lovina',
  'Kantor Cabang Seririt',
  'Kantor Cabang Kubutambahan',
  'Kantor Cabang Gerokgak',
  'Unit Sambirenteng',
  'Unit Pancasari',
]

function SearchableClientSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (val: string) => void
  options: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Split value by comma to get selected items array
  const selectedItems = value.split(',').map((s) => s.trim()).filter(Boolean)

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (opt: string) => {
    let newSelected = [...selectedItems]
    if (newSelected.includes(opt)) {
      newSelected = newSelected.filter((i) => i !== opt)
    } else {
      newSelected.push(opt)
    }
    onChange(newSelected.join(', '))
    setSearchTerm('')
  }

  const handleRemove = (opt: string) => {
    const newSelected = selectedItems.filter((i) => i !== opt)
    onChange(newSelected.join(', '))
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault()
      const newTag = searchTerm.trim()
      if (!selectedItems.includes(newTag)) {
        onChange([...selectedItems, newTag].join(', '))
      }
      setSearchTerm('')
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="relative flex min-h-[42px] !h-auto w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 pr-14 text-xs font-medium text-slate-800 shadow-2xs outline-none transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100/60 hover:border-slate-300 cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedItems.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50/90 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs transition-all hover:bg-blue-100/80"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(item)
              }}
              className="rounded-md p-0.5 text-blue-500 hover:bg-blue-200/60 hover:text-blue-800 transition-colors"
              title="Hapus"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedItems.length === 0 ? 'Cari atau ketik Client Name...' : 'Tambah klien...'}
          className="flex-1 min-w-[120px] bg-transparent py-0.5 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 border-none focus:ring-0"
        />

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-slate-400">
          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Hapus semua"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
            className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-600 transition"
            tabIndex={-1}
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = selectedItems.includes(opt)
              return (
                <li
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  {isSelected && <Check size={14} className="text-blue-600 shrink-0 ml-auto" />}
                </li>
              )
            })
          ) : (
            <li className="px-3 py-2.5 text-xs text-slate-400 italic">
              Tidak ada opsi yang cocok. Tekan Enter untuk menambah nama custom.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export function ProjectModal({ editing, onClose, onCreated, onUpdated, onDelete, toast }: {
  editing: ProjectData | null
  onClose: () => void
  onCreated: (token: string, projectId?: string, newProject?: ProjectData) => void
  onUpdated: (updatedProject?: ProjectData) => void
  onDelete?: (project: ProjectData) => void
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const { t } = useLanguage()
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
        toast(t('projectUpdatedSuccess'), 'success')
        onUpdated(result.project)
      } else {
        const result = await createProject({ error: '', success: false }, fd)
        if (result.error) { setError(result.error); return }
        toast(t('projectCreatedSyncing'), 'info')
        onCreated(result.clientToken ?? '', result.projectId, result.project)
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6 backdrop-blur-md animate-modal-backdrop" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="max-h-[84vh] sm:max-h-[88vh] w-full max-w-[540px] overflow-y-auto rounded-[24px] border border-brand-200 bg-white p-5 sm:p-8 shadow-[0_25px_70px_rgba(15,23,42,0.35)] backdrop-blur-2xl animate-modal-dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">{t('workspace')}</p>
            <h2 className="mt-1 text-[20px] sm:text-[24px] font-bold tracking-[-0.03em] text-[#0f172a]">
              {isEdit ? t('modalEditProjectTitle') : t('modalNewProjectTitle')}
            </h2>
            <p className="mt-1 text-[12px] sm:text-[13px] leading-5 text-slate-500">
              {isEdit ? t('modalEditProjectDesc') : t('modalNewProjectDesc')}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition">
            <X size={17} />
          </button>
        </div>

        <div className="mt-7 grid gap-5">
          <Field label={t('fieldProjectName')} required>
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Foto Rapat" className="form-input" />
          </Field>
          <Field label={t('fieldClientName')} required>
            <SearchableClientSelect
              value={form.clientName}
              onChange={(val) => setForm({ ...form, clientName: val })}
              options={CLIENT_OPTIONS}
            />
          </Field>
          <Field label={t('fieldDriveLink')} required help={t('fieldDriveLinkHelp')}>
            <input type="url" value={form.driveLink} onChange={(e) => setForm({ ...form, driveLink: e.target.value })} placeholder="https://drive.google.com/drive/folders/xxxxx" className="form-input" />
          </Field>
          <Field label={t('fieldWhatsapp')} help={t('fieldWhatsappHelp')}>
            <input inputMode="numeric" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="628123456789" className="form-input" />
          </Field>
          <Field label={t('fieldMaxPhotos')} required help={t('fieldMaxPhotosHelp')}>
            <input type="number" min="1" value={form.maxPhotos} onChange={(e) => setForm({ ...form, maxPhotos: e.target.value })} placeholder="20" className="form-input" />
          </Field>
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={form.protect} onChange={(e) => setForm({ ...form, protect: e.target.checked })} className="size-4 accent-brand-600" />
              <span className="flex items-center gap-2 text-[13px] font-medium text-slate-800">
                <LockKeyhole size={15} className="text-brand-500" /> {t('protectWithPassword')}
              </span>
            </label>
            {form.protect && (
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t('enterPasswordPlaceholder')} className="form-input mt-3" />
            )}
          </div>
        </div>

        {error && <p role="alert" className="mt-4 text-[12px] font-medium text-rose-600">{error}</p>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isEdit && editing ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onDelete?.(editing)
              }}
              className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
            >
              <Trash2 size={14} />
              <span>{t('delete')}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-50 text-brand-700 border border-brand-200 rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-200 hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              {t('cancel')}
            </button>
            <button
              disabled={isPending}
              type="submit"
              className="bg-brand-gradient bg-[length:200%_100%] bg-left text-white rounded-xl px-5 py-2.5 text-xs sm:text-sm font-medium shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40 motion-reduce:transition-none motion-reduce:hover:transform-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (isEdit ? t('saving') : t('creating')) : isEdit ? t('btnSaveProject') : t('btnCreateProject')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
