'use client'

// ──────────────────────────────────────────────
// Profile View — account info & settings
// ──────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { KeyRound, Loader2, X } from 'lucide-react'
import { saveProfile, changePassword } from '@/app/actions/profile'
import type { ProfileDataType } from './types'
import { Field, PageHeading, SettingsCard } from './ui-primitives'
import { useLanguage } from '@/lib/language-context'

// ──────────────────────────────────────────────
// Change Password Modal (nested inside ProfileView)
// ──────────────────────────────────────────────
function ChangePasswordModal({ onClose, toast }: {
  onClose: () => void
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const { t } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await changePassword({ error: '', success: false }, fd)
      if (result.error) { setError(result.error); return }
      toast(t('passwordUpdatedSuccess'), 'success')
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 px-4 backdrop-blur-[3px]" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px] rounded-[16px] border border-[#bfdbfe] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#0f172a]">{t('changePasswordTitle')}</h3>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-[#64748b] hover:bg-[#eff6ff]"><X size={16} /></button>
        </div>
        <div className="grid gap-4">
          <Field label={t('fieldNewPassword')}>
            <input type="password" name="newPassword" required minLength={8} placeholder="At least 8 characters" className="form-input" />
          </Field>
          <Field label={t('fieldConfirmPassword')}>
            <input type="password" name="confirmPassword" required placeholder="Repeat new password" className="form-input" />
          </Field>
        </div>
        {error && <p role="alert" className="mt-3 text-[12px] font-medium text-[#dc2626]">{error}</p>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[#bfdbfe] bg-white px-4 py-2 text-[12px] font-medium text-[#64748b] hover:bg-[#eff6ff]">{t('cancel')}</button>
          <button type="submit" disabled={isPending} className="rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-4 py-2 text-[12px] font-medium text-white shadow-md disabled:opacity-60">
            {isPending ? t('updating') : t('changePasswordTitle')}
          </button>
        </div>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────
// Profile View
// ──────────────────────────────────────────────
export function ProfileView({ profile, userEmail, toast }: {
  profile: ProfileDataType
  userEmail: string
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState({ ...profile, email: userEmail })
  const [isPending, startTransition] = useTransition()
  const [showChangePassword, setShowChangePassword] = useState(false)

  const initials = draft.studioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  function save() {
    const fd = new FormData()
    fd.set('studioName', draft.studioName)
    fd.set('fullName', draft.fullName)
    fd.set('location', draft.location)
    fd.set('bio', draft.bio)
    fd.set('whatsapp', draft.whatsapp)
    fd.set('website', draft.website)

    startTransition(async () => {
      const result = await saveProfile({ error: '', success: false }, fd)
      if (result.error) { toast(result.error, 'error'); return }
      toast(t('profileSavedSuccess'), 'success')
    })
  }

  return (
    <section>
      <PageHeading eyebrow={t('account')} title={t('profileTitle')} description={t('profileDesc')} />
      <div className="mt-8 grid max-w-[860px] gap-5">
        <div className="rounded-[14px] border border-[#bfdbfe]/80 bg-white/85 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd] text-[24px] font-semibold tracking-[-0.04em] text-[#1e40af] shadow-inner">
              {initials}
            </div>
            <div>
              <p className="text-[18px] font-semibold tracking-[-0.03em] text-[#0f172a]">{draft.studioName || 'Studio'}</p>
              <p className="mt-1 text-[13px] text-[#64748b]">{t('photographer')}{draft.location ? ` · ${draft.location}` : ''}</p>
            </div>
          </div>
        </div>

        <SettingsCard title={t('profileTitle')} description={t('profileDesc')}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('fieldStudioName')} example="Alex Studio">
              <input value={draft.studioName} onChange={(e) => setDraft({ ...draft, studioName: e.target.value })} className="form-input" />
            </Field>
            <Field label={t('fieldFullName')} example="Alex Santoso">
              <input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} className="form-input" />
            </Field>
            <Field label="Email address" help="Your account email. Cannot be changed here.">
              <input type="email" value={draft.email} readOnly className="form-input opacity-60 cursor-not-allowed" />
            </Field>
            <Field label={t('fieldLocation')} example="Jakarta, Indonesia">
              <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="form-input" />
            </Field>
          </div>
          <div className="mt-5">
            <Field label={t('fieldBio')} example="Wedding photographer based in Jakarta">
              <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="form-input min-h-[88px] resize-y py-3" />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard title="Contact preferences" description="Choose how clients can reach you after submitting their selections.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('fieldWhatsapp')} example="628123456789">
              <input value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} className="form-input" />
            </Field>
            <Field label={t('fieldWebsite')} example="https://alexstudio.com">
              <input type="url" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://alexstudio.com" className="form-input" />
            </Field>
          </div>
        </SettingsCard>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button type="button" onClick={save} disabled={isPending} className="flex items-center gap-2 rounded-[8px] bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-5 py-2.5 text-[12px] font-medium text-white shadow-md shadow-blue-500/25 hover:from-[#1d4ed8] hover:to-[#0369a1] disabled:opacity-60 transition">
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isPending ? t('saving') : t('save')}
          </button>
          <button type="button" onClick={() => setShowChangePassword(true)} className="flex items-center gap-2 rounded-[8px] border border-[#bfdbfe] bg-white px-4 py-2.5 text-[12px] font-medium text-[#1e40af] hover:bg-[#eff6ff] hover:border-[#93c5fd] transition shadow-xs">
            <KeyRound size={14} /> {t('changePasswordTitle')}
          </button>
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} toast={toast} />
      )}
    </section>
  )
}
