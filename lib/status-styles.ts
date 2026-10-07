// ──────────────────────────────────────────────
// Centralized Status Styles Mapping
// ──────────────────────────────────────────────

export const statusStyles: Record<string, string> = {
  active: 'bg-sky-100 text-sky-700 border-sky-300',
  selected: 'bg-violet-100 text-violet-700 border-violet-300',
  editing: 'bg-amber-100 text-amber-700 border-amber-300',
  delivered: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  locked: 'bg-rose-100 text-rose-700 border-rose-300',
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
}

export function getStatusStyle(status: string): string {
  const key = status?.toLowerCase() || 'draft'
  return statusStyles[key] || statusStyles.draft
}
