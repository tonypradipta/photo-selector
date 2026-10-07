// ──────────────────────────────────────────────
// Toast Notification (Gallery)
// ──────────────────────────────────────────────
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function Toast({
  message,
  type,
}: {
  message: string
  type: 'error' | 'success' | 'info'
}) {
  const colors = {
    error: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
    success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]',
    info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  }
  return (
    <div
      className={`fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[12.5px] font-medium shadow-xl backdrop-blur-xl ${colors[type]} animate-in fade-in slide-in-from-top-2 duration-150`}
    >
      {type === 'error' && <AlertCircle size={15} className="shrink-0" />}
      {type === 'success' && <CheckCircle2 size={15} className="shrink-0" />}
      <span>{message}</span>
    </div>
  )
}
