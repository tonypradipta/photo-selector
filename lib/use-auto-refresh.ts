/**
 * useAutoRefresh – Real-time polling hook
 *
 * Menjalankan callback refresh secara otomatis:
 *  1. Setiap `intervalMs` milli-detik (default 30 detik)
 *  2. Setiap kali tab/window kembali menjadi visible (user kembali ke tab)
 *  3. Berhenti polling saat tab tidak aktif untuk hemat bandwidth
 */
import { useEffect, useRef, useCallback } from 'react'

interface UseAutoRefreshOptions {
  /** Interval polling dalam milli-detik. Default 30000 (30 detik). */
  intervalMs?: number
  /** Jika false, polling tidak berjalan (pause saat modal terbuka, dll). */
  enabled?: boolean
  /** Callback yang dipanggil saat refresh. */
  onRefresh: () => void | Promise<void>
}

export function useAutoRefresh({
  intervalMs = 30_000,
  enabled = true,
  onRefresh,
}: UseAutoRefreshOptions) {
  const callbackRef = useRef(onRefresh)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Selalu pakai versi terbaru callback tanpa restart interval
  useEffect(() => {
    callbackRef.current = onRefresh
  })

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    stop()
    timerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        callbackRef.current()
      }
    }, intervalMs)
  }, [intervalMs, stop])

  useEffect(() => {
    if (!enabled) {
      stop()
      return
    }

    start()

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        // Langsung refresh saat user kembali ke tab
        callbackRef.current()
        start()
      } else {
        stop()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled, start, stop])
}
