'use client'

import { useState, useEffect } from 'react'
import {
  X, Send, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle,
  Link2, Copy, Check, Lock, Calendar, MessageSquare, Loader2,
  ExternalLink, ChevronRight, CheckCircle, Clock, ShieldCheck,
  FolderSync, ArrowRight, FileCheck, Layers
} from 'lucide-react'
import {
  deliveries, type ProjectData, type SyncStatusData,
  type DeliveryData, getPhotoPreviewUrl
} from '@/lib/api-client'

interface DeliveryWorkspaceModalProps {
  projectId: string | number
  onClose: () => void
  onUpdated?: () => void
  toast: (msg: string, type?: 'error' | 'success' | 'info') => void
}

export function DeliveryWorkspaceModal({
  projectId,
  onClose,
  onUpdated,
  toast,
}: DeliveryWorkspaceModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(true)
  const [savingFolder, setSavingFolder] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [sending, setSending] = useState(false)
  const [completing, setCompleting] = useState(false)

  const [project, setProject] = useState<ProjectData | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null)
  const [activeDelivery, setActiveDelivery] = useState<DeliveryData | null>(null)
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>('')

  // Form states
  const [editedFolderUrl, setEditedFolderUrl] = useState('')
  const [pin, setPin] = useState('')
  const [expiryDays, setExpiryDays] = useState(30)
  const [notes, setNotes] = useState('')
  const [forceSend, setForceSend] = useState(false)

  // Copy states
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedWa, setCopiedWa] = useState(false)

  useEffect(() => {
    loadWorkspace()
  }, [projectId])

  async function loadWorkspace() {
    setLoading(true)
    try {
      const res = await deliveries.get(projectId)
      setProject(res.project)
      setSyncStatus(res.sync_status)
      setActiveDelivery(res.active_delivery)
      if (res.whatsapp_message) setWhatsappTemplate(res.whatsapp_message)
      if (res.project.edited_folder_url) setEditedFolderUrl(res.project.edited_folder_url)

      // Auto decide initial step based on strict sequence
      const hasFolder = Boolean(res.project.edited_folder_url || res.project.edited_folder_id)
      const hasSynced = Boolean(res.sync_status)

      if (res.active_delivery) {
        setStep(3)
      } else if (hasFolder && hasSynced) {
        setStep(2)
      } else if (hasFolder) {
        setStep(2)
      } else {
        setStep(1)
      }
    } catch (err: any) {
      toast(err.message || 'Gagal memuat workspace delivery', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Strict sequence checks
  const isStep1Done = Boolean(project?.edited_folder_url || project?.edited_folder_id)
  const isStep2Done = isStep1Done && Boolean(syncStatus && (syncStatus.matched_count > 0 || syncStatus.total_selected > 0))

  function canAccessStep(targetStep: 1 | 2 | 3): boolean {
    if (targetStep === 1) return true
    if (targetStep === 2) return isStep1Done
    if (targetStep === 3) return isStep1Done && isStep2Done
    return false
  }

  function handleStepClick(targetStep: 1 | 2 | 3) {
    if (targetStep === 1) {
      setStep(1)
      return
    }
    if (targetStep === 2) {
      if (!isStep1Done) {
        toast('Proses 1 belum dilakukan! Silakan hubungkan folder Google Drive terlebih dahulu.', 'error')
        return
      }
      setStep(2)
      return
    }
    if (targetStep === 3) {
      if (!isStep1Done) {
        toast('Proses 1 belum dilakukan! Silakan hubungkan folder Google Drive terlebih dahulu.', 'error')
        return
      }
      if (!isStep2Done) {
        toast('Proses 2 belum dilakukan! Silakan lakukan sinkronisasi file terlebih dahulu.', 'error')
        return
      }
      setStep(3)
      return
    }
  }

  async function handleSaveFolder() {
    if (!editedFolderUrl.trim()) {
      toast('Masukkan link folder Google Drive hasil edit', 'error')
      return
    }
    setSavingFolder(true)
    try {
      const res = await deliveries.updateFolder(projectId, editedFolderUrl.trim())
      toast(res.message || 'Folder hasil edit berhasil disimpan!', 'success')
      setProject(res.project)
      setStep(2)
      // Automatically trigger sync after connecting folder
      handleSyncFolder()
    } catch (err: any) {
      toast(err.message || 'Gagal menyimpan folder Google Drive', 'error')
    } finally {
      setSavingFolder(false)
    }
  }

  async function handleSyncFolder() {
    setSyncing(true)
    try {
      const res = await deliveries.sync(projectId)
      toast(res.message || 'Sinkronisasi foto edit berhasil!', 'success')
      setSyncStatus(res.data)
      setProject(res.project)
      if (onUpdated) onUpdated()
    } catch (err: any) {
      toast(err.message || 'Gagal menyinkronkan folder edit', 'error')
    } finally {
      setSyncing(false)
    }
  }

  async function handleCreateDelivery() {
    setSending(true)
    try {
      const res = await deliveries.send(projectId, {
        pin: pin.trim() || undefined,
        expires_in_days: expiryDays,
        notes: notes.trim() || undefined,
        force: forceSend,
      })
      toast(res.message || 'Link Delivery berhasil dibuat!', 'success')
      setActiveDelivery(res.delivery)
      setWhatsappTemplate(res.whatsapp_message)
      setProject(res.project)
      setStep(3)
      if (onUpdated) onUpdated()
    } catch (err: any) {
      toast(err.message || 'Gagal membuat link delivery', 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleMarkComplete() {
    setCompleting(true)
    try {
      const res = await deliveries.complete(projectId)
      toast(res.message || 'Project berhasil ditandai Selesai!', 'success')
      setProject(res.project)
      if (onUpdated) onUpdated()
    } catch (err: any) {
      toast(err.message || 'Gagal menyelesaikan project', 'error')
    } finally {
      setCompleting(false)
    }
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const deliveryUrl = activeDelivery ? `${appUrl}/delivery/${activeDelivery.delivery_token}` : ''

  function copyDeliveryLink() {
    if (!deliveryUrl) return
    navigator.clipboard?.writeText(deliveryUrl)
    setCopiedLink(true)
    toast('Link delivery berhasil disalin ke clipboard!', 'success')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function copyWhatsappMessage() {
    if (!whatsappTemplate) return
    navigator.clipboard?.writeText(whatsappTemplate)
    setCopiedWa(true)
    toast('Pesan WhatsApp berhasil disalin ke clipboard!', 'success')
    setTimeout(() => setCopiedWa(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-modal-backdrop">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-modal-dialog">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-brand-100 bg-gradient-to-r from-brand-50/80 via-white to-aqua-100/40">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Send size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {loading ? 'Memuat Workspace...' : `Hasil Edit: ${project?.name}`}
                </h2>
                {project && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${project.status === 'delivered'
                        ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                        : project.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}
                  >
                    {project.status === 'delivered'
                      ? 'Terkirim'
                      : project.status === 'completed'
                        ? 'Selesai'
                        : 'Proses Edit'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Klien: <span className="text-slate-800 font-semibold">{project?.client_name || '...'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-8.5 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3-Step Stepper Header with Sequential Lock */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/80 text-xs">
          {[
            { num: 1, title: 'Hubungkan Folder', desc: 'Google Drive Edit' },
            { num: 2, title: 'Sync & Cocokkan', desc: 'Verifikasi File' },
            { num: 3, title: 'Kirim ke Klien', desc: 'Link & WhatsApp' },
          ].map((s) => {
            const allowed = canAccessStep(s.num as any)
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => handleStepClick(s.num as any)}
                title={!allowed ? `Selesaikan Proses ${s.num - 1} terlebih dahulu` : s.title}
                className={`flex items-center gap-3 p-3.5 text-left border-b-2 transition ${step === s.num
                    ? 'border-brand-600 bg-white font-bold text-brand-700 shadow-2xs'
                    : allowed
                      ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed bg-slate-100/40'
                  }`}
              >
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step === s.num
                      ? 'bg-brand-600 text-white'
                      : !allowed
                        ? 'bg-slate-200 text-slate-400'
                        : step > s.num
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  {!allowed ? (
                    <Lock size={11} className="text-slate-400" />
                  ) : step > s.num ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    s.num
                  )}
                </div>
                <div className="hidden sm:block truncate">
                  <p className={`font-semibold truncate ${!allowed ? 'text-slate-400' : 'text-slate-800'}`}>{s.title}</p>
                  <p className="text-[11px] text-slate-400 font-normal truncate">{s.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-sm font-medium">Memuat data delivery workspace...</p>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Connect Folder */
            <div className="flex flex-col gap-5 max-w-2xl mx-auto py-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-4">
                <div className="flex items-center gap-3 text-blue-600 font-semibold text-sm">
                  <FolderSync size={18} />
                  <span>Folder Google Drive Hasil Edit</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Masukkan URL folder Google Drive tempat Anda menyimpan file foto yang telah diedit (misal folder "02_Hasil_Edit" atau "Edited_Final").
                </p>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">Link Folder Google Drive (Edit):</label>
                  <input
                    type="url"
                    value={editedFolderUrl}
                    onChange={(e) => setEditedFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Tips: Pastikan folder sudah dibagikan (Viewer) ke Service Account atau Publik.
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={handleSaveFolder}
                    disabled={savingFolder || !editedFolderUrl.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-white text-xs font-semibold shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:transform-none"
                  >
                    {savingFolder ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    <span>Simpan & Lanjut ke Pencocokan</span>
                  </button>
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            /* STEP 2: Sync & Match Verification */
            <div className="flex flex-col gap-5">
              {/* Summary match banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Status Pencocokan File (Auto-Matcher)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sistem otomatis mencocokkan nama file edit (e.g. <span className="font-mono text-brand-600 font-semibold">IMG_001_edited.jpg</span>) dengan pilihan raw (<span className="font-mono text-slate-700">IMG_001.CR3</span>).
                  </p>
                </div>

                <button
                  onClick={handleSyncFolder}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-50 hover:bg-brand-soft text-brand-700 text-xs font-semibold rounded-xl border border-brand-200 shadow-2xs transition disabled:opacity-50"
                >
                  <RefreshCw size={13} className={syncing ? 'animate-spin text-brand-600' : ''} />
                  <span>{syncing ? 'Sedang Sinkronisasi...' : 'Sync Ulang Google Drive'}</span>
                </button>
              </div>

              {/* Stats Counters */}
              {syncStatus && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-medium text-slate-400">Total Foto Dipilih:</span>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{syncStatus.total_selected} foto</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                    <span className="text-[11px] font-medium text-emerald-600">Cocok (Matched):</span>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">{syncStatus.matched_count} foto</p>
                  </div>
                  <div className={`p-4 rounded-xl border shadow-2xs ${syncStatus.missing_count > 0 ? 'border-amber-300 bg-amber-50/40' : 'bg-white border-slate-200'}`}>
                    <span className={`text-[11px] font-medium ${syncStatus.missing_count > 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                      Belum Ada Hasil Edit:
                    </span>
                    <p className={`text-lg font-bold mt-0.5 ${syncStatus.missing_count > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                      {syncStatus.missing_count} foto
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-medium text-slate-400">Tingkat Kecocokan:</span>
                    <p className="text-lg font-bold text-brand-600 mt-0.5">{syncStatus.match_rate}%</p>
                  </div>
                </div>
              )}

              {/* Missing Photos Warning */}
              {syncStatus && syncStatus.missing_count > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span>Perhatian: Ada {syncStatus.missing_count} foto terpilih yang belum ditemukan di folder edit Google Drive</span>
                  </div>
                  <p className="text-amber-700 leading-relaxed">
                    Daftar foto yang belum ada hasil editnya:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {syncStatus.missing.map((m) => (
                      <span key={m.selection_id} className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-mono text-[11px] font-semibold border border-amber-300">
                        {m.raw_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Photos Preview Table / Grid */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Foto yang Siap Dikirim ({syncStatus?.matched_count || 0})
                </h4>

                {syncStatus && syncStatus.matched.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {syncStatus.matched.map((m) => (
                      <div key={m.selection_id} className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 p-2 overflow-hidden text-[11px]">
                        <div className="relative aspect-4/3 w-full bg-slate-200 rounded-lg overflow-hidden mb-1.5">
                          {m.thumbnail_url ? (
                            <img src={m.thumbnail_url} alt={m.edited_name} className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center text-slate-400">
                              <FileCheck size={16} />
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">
                            Matched
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 truncate" title={m.edited_name}>
                          {m.edited_name}
                        </p>
                        <p className="text-slate-400 text-[10px] truncate" title={m.raw_name}>
                          Raw: {m.raw_name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Belum ada foto yang cocok. Pastikan foto di folder Google Drive memiliki nama yang mirip dengan nama foto aslinya.
                  </p>
                )}
              </div>

              {/* Step 2 Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Kembali ke Folder Drive
                </button>

                <button
                  onClick={() => {
                    if (!isStep2Done) {
                      toast('Lakukan sinkronisasi & pencocokan file terlebih dahulu!', 'error')
                      return
                    }
                    setStep(3)
                  }}
                  disabled={!isStep2Done}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-white text-xs font-semibold shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <span>Lanjut ke Pengiriman Link</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 3: Send & Share */
            <div className="flex flex-col gap-5 max-w-2xl mx-auto py-2">
              {/* Delivery Configuration Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-4">
                <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
                  <ShieldCheck size={18} />
                  <span>Konfigurasi Link Delivery Klien</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Lock size={13} className="text-slate-400" />
                      <span>PIN Akses (Opsional):</span>
                    </label>
                    <input
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Contoh: 123456"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                    />
                    <p className="text-[10.5px] text-slate-400">Kosongkan jika tidak ingin proteksi PIN.</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Masa Berlaku Link (Hari):</span>
                    </label>
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                    >
                      <option value={7}>7 Hari</option>
                      <option value={14}>14 Hari</option>
                      <option value={30}>30 Hari (1 Bulan)</option>
                      <option value={90}>90 Hari (3 Bulan)</option>
                      <option value={365}>365 Hari (1 Tahun)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-slate-400" />
                    <span>Catatan untuk Klien (Opsional):</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Terima kasih sudah mempercayakan momen spesial Anda kepada kami..."
                    rows={2}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                </div>

                {/* Warning if missing photos exist */}
                {syncStatus && syncStatus.missing_count > 0 && (
                  <label className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceSend}
                      onChange={(e) => setForceSend(e.target.checked)}
                      className="mt-0.5 size-4 accent-amber-600 rounded"
                    />
                    <span>
                      Tetap buat link pengiriman meskipun masih ada <b>{syncStatus.missing_count} foto</b> yang belum ditemukan hasil editnya.
                    </span>
                  </label>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCreateDelivery}
                    disabled={sending || (Boolean(syncStatus && syncStatus.missing_count > 0) && !forceSend)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-white text-xs font-bold shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:transform-none"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{activeDelivery ? 'Perbarui Link Delivery' : 'Buat & Generate Link Delivery'}</span>
                  </button>
                </div>
              </div>

              {/* Delivery Share Link & WhatsApp Section */}
              {activeDelivery && (
                <div className="bg-white p-6 rounded-2xl border border-emerald-200 bg-emerald-50/10 shadow-2xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <CheckCircle size={18} />
                      <span>Link Delivery Siap Dikirikan ke Klien</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Link Aktif
                    </span>
                  </div>

                  {/* Delivery URL Box */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={deliveryUrl}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                    />
                    <button
                      onClick={copyDeliveryLink}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-2xs"
                    >
                      {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedLink ? 'Tersalin' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={deliveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8.5 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                      title="Buka Halaman Client Delivery"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>

                  {/* Formatted WhatsApp Message */}
                  {whatsappTemplate && (
                    <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-emerald-600" />
                          <span>Template Pesan WhatsApp Klien:</span>
                        </label>
                        <button
                          onClick={copyWhatsappMessage}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          {copiedWa ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedWa ? 'Tersalin!' : 'Copy Pesan WhatsApp'}</span>
                        </button>
                      </div>

                      <pre className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                        {whatsappTemplate}
                      </pre>
                    </div>
                  )}

                  {/* Mark Project Complete Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400">
                      Jika klien sudah selesai mengunduh foto, Anda bisa menandai project Selesai (Completed).
                    </p>
                    <button
                      onClick={handleMarkComplete}
                      disabled={completing || project?.status === 'completed'}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition disabled:opacity-50"
                    >
                      {completing ? <Loader2 size={13} className="animate-spin" /> : project?.status === 'completed' ? 'Project Telah Selesai' : 'Tandai Selesai (Completed)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white text-xs text-slate-500">
          <span>Delivery Workspace • Perumda Photo</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
