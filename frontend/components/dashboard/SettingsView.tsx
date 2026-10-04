'use client'

// ──────────────────────────────────────────────
// Settings View — gallery preferences and language switcher
// ──────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { Loader2, Check } from 'lucide-react'
import { saveSettings } from '@/app/actions/profile'
import type { ProfileDataType } from './types'
import { PageHeading, SettingsCard, SettingToggle } from './ui-primitives'
import { useLanguage } from '@/lib/language-context'

export function SettingsView({ profile, toast }: {
  profile: ProfileDataType
  toast: (msg: string, type: 'error' | 'success' | 'info') => void
}) {
  const { language, setLanguage, t } = useLanguage()
  const [settings, setSettings] = useState({
    showBranding: profile.showBranding,
    allowNotes: profile.allowNotes,
    sendReminders: profile.sendReminders,
  })
  const [isPending, startTransition] = useTransition()

  function save() {
    const fd = new FormData()
    fd.set('showBranding', String(settings.showBranding))
    fd.set('allowNotes', String(settings.allowNotes))
    fd.set('sendReminders', String(settings.sendReminders))

    startTransition(async () => {
      const result = await saveSettings({ error: '', success: false }, fd)
      if (result.error) { toast(result.error, 'error'); return }
      toast(t('settingsSaved'), 'success')
    })
  }

  return (
    <section className="animate-in fade-in duration-200">
      <PageHeading
        eyebrow={t('workspace')}
        title={t('settingsTitle')}
        description={t('settingsDesc')}
      />

      <div className="mt-8 grid max-w-[860px] gap-5">
        {/* Language Selection Card */}
        <SettingsCard
          title={t('languageSettingsTitle')}
          description={t('languageSettingsDesc')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${
                language === 'id'
                  ? 'border-blue-500 bg-brand-soft shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl drop-shadow-xs">🇮🇩</span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">Bahasa Indonesia</p>
                  <p className="text-[11px] sm:text-xs text-slate-500">Bahasa default (Indonesia)</p>
                </div>
              </div>
              {language === 'id' && (
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                  <Check size={14} strokeWidth={2.5} />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${
                language === 'en'
                  ? 'border-blue-500 bg-brand-soft shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl drop-shadow-xs">🇬🇧</span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">English</p>
                  <p className="text-[11px] sm:text-xs text-slate-500">International language (EN)</p>
                </div>
              </div>
              {language === 'en' && (
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                  <Check size={14} strokeWidth={2.5} />
                </div>
              )}
            </button>
          </div>
        </SettingsCard>

        {/* Gallery Preferences Card */}
        <SettingsCard
          title={t('galleryPrefsTitle')}
          description={t('galleryPrefsDesc')}
        >
          <div className="grid gap-4">
            <SettingToggle
              title={t('showBrandingTitle')}
              description={t('showBrandingDesc')}
              checked={settings.showBranding}
              onChange={(v) => setSettings({ ...settings, showBranding: v })}
            />
            <SettingToggle
              title={t('allowNotesTitle')}
              description={t('allowNotesDesc')}
              checked={settings.allowNotes}
              onChange={(v) => setSettings({ ...settings, allowNotes: v })}
            />
            <SettingToggle
              title={t('sendRemindersTitle')}
              description={t('sendRemindersDesc')}
              checked={settings.sendReminders}
              onChange={(v) => setSettings({ ...settings, sendReminders: v })}
            />
          </div>
        </SettingsCard>

        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="flex w-fit items-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] transition-all disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          {isPending && <Loader2 size={15} className="animate-spin" />}
          <span>{isPending ? t('saving') : t('saveSettings')}</span>
        </button>
      </div>
    </section>
  )
}
