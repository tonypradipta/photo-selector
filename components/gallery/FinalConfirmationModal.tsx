'use client'

// ──────────────────────────────────────────────
// Final Confirmation Modal
// ──────────────────────────────────────────────
import { CheckCircle2, Loader2 } from 'lucide-react'

export function FinalConfirmationModal({
  selectedCount,
  codes,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  selectedCount: number
  codes: string[]
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[480px] rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-lg font-semibold font-heading tracking-tight text-slate-900">
          Apakah Anda Yakin?
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm font-normal font-body leading-relaxed text-slate-500">
          Setelah pilihan dikonfirmasi, <strong className="font-semibold text-slate-800">pilihan foto akan dikunci</strong> dan tidak dapat diubah lagi.
        </p>

        <div className="mt-4 rounded-2xl border border-blue-200 bg-brand-soft p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium font-body text-slate-600">Total Foto Dipilih:</span>
            <span className="font-semibold font-body text-blue-700">{selectedCount} foto</span>
          </div>
          <div className="mt-2.5 border-t border-blue-200/60 pt-2">
            <span className="block text-[11px] font-medium font-body uppercase tracking-wider text-blue-700">
              Kode Foto:
            </span>
            <p className="mt-1 max-h-[90px] overflow-y-auto no-scrollbar font-body text-xs font-medium text-slate-800 leading-relaxed">
              {codes.join(', ')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold font-body text-slate-600 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left px-5 text-xs font-semibold font-body text-white shadow-glow hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-[0.98] disabled:opacity-60 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Mengunci Pilihan…</span>
              </>
            ) : (
              <span>Ya, Konfirmasi Pilihan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
