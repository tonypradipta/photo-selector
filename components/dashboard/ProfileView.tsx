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
          <button type="button" onClick={onClose} className="h-10 flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-xs font-semibold font-body text-brand-700 hover:bg-brand-soft hover:border-brand-400 transition">{t('cancel')}</button>
          <button type="submit" disabled={isPending} className="h-10 flex items-center justify-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left px-5 text-xs font-semibold font-body text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-60 transition-all">
            {isPending && <Loader2 size={13} className="animate-spin" />}
            <span>{isPending ? t('updating') : t('changePasswordTitle')}</span>
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
        <div className="rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-blue-200 smooth-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-avatar text-xl sm:text-2xl font-bold font-heading text-brand-800 shadow-inner shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-base sm:text-lg font-semibold font-heading text-slate-900">{draft.studioName || 'Studio'}</p>
              <p className="mt-0.5 text-xs font-normal font-body text-slate-500">{t('photographer')}{draft.location ? ` · ${draft.location}` : ''}</p>
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button type="button" onClick={save} disabled={isPending} className="h-10 flex items-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left px-5 text-xs font-semibold font-body text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-60 transition-all">
            {isPending && <Loader2 size={13} className="animate-spin" />}
            <span>{isPending ? t('saving') : t('save')}</span>
          </button>
          <button type="button" onClick={() => setShowChangePassword(true)} className="h-10 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-xs font-semibold font-body text-brand-700 hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-2xs">
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
