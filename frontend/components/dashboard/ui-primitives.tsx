// ──────────────────────────────────────────────
// Toast Notification
// ──────────────────────────────────────────────
import { AlertCircle, Check } from 'lucide-react'

export function Toast({ message, type }: { message: string; type: 'error' | 'success' | 'info' }) {
  const colors = {
    error: 'border-rose-200 bg-rose-50/95 text-rose-700 shadow-rose-500/10',
    success: 'border-emerald-200 bg-emerald-50/95 text-emerald-800 shadow-emerald-500/10',
    info: 'border-blue-200 bg-blue-50/95 text-blue-800 shadow-blue-500/10',
  }
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-xl animate-fade-in-down ${colors[type]}`}>
      {type === 'error' && <AlertCircle size={16} className="shrink-0 text-rose-600" />}
      {type === 'success' && <Check size={16} className="shrink-0 text-emerald-600" />}
      <span>{message}</span>
    </div>
  )
}

// ──────────────────────────────────────────────
// Field component (form label wrapper)
// ──────────────────────────────────────────────
export function Field({ label, example, help, required, children }: {
  label: string; example?: string; help?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium font-body text-slate-800">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {(example || help) && (
        <p className="text-[11px] font-normal font-body text-slate-500">
          {example}{help && example ? ` · ${help}` : help}
        </p>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Page heading
// ──────────────────────────────────────────────
export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="animate-fade-in-down">
      <p className="mb-1 text-xs font-medium font-body uppercase tracking-wider text-blue-600">{eyebrow}</p>
      <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1.5 text-xs sm:text-sm font-normal font-body text-slate-500">{description}</p>
    </div>
  )
}

// ──────────────────────────────────────────────
// Settings card wrapper
// ──────────────────────────────────────────────
export function SettingsCard({ title, description, children, className = '' }: { title: string; description: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-blue-200 smooth-card ${className}`}>
      <h2 className="text-base font-semibold font-heading tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 text-xs font-normal font-body leading-relaxed text-slate-500">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Settings toggle row
// ──────────────────────────────────────────────
export function SettingToggle({ title, description, checked, onChange }: {
  title: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0 group transition-colors">
      <span>
        <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-blue-600 rounded cursor-pointer transition-transform active:scale-90"
      />
    </label>
  )
}

// ──────────────────────────────────────────────
// Stat card
// ──────────────────────────────────────────────
export function Stat({ label, value, detail, className = '' }: { label: string; value: string; detail: string; className?: string }) {
  return (
    <div className={`flex flex-col justify-between rounded-[20px] border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs smooth-card hover:border-blue-300 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:transform-none ${className}`}>
      <p className="text-xs font-bold text-slate-900">{label}</p>
      <div className="mt-2.5 flex flex-col gap-1.5 sm:mt-3">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-600 leading-none">{value}</p>
        <p className="text-[11px] sm:text-xs font-bold text-slate-900 leading-snug">{detail}</p>
      </div>
    </div>
  )
}
