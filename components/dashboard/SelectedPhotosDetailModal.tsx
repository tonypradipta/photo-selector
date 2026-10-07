'use client'

import { useState, useEffect } from 'react'
import {
  X, Download, Copy, Check, Sparkles, ArrowRight,
  MessageSquare, Loader2, Image as ImageIcon, FileArchive
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { selectedPhotos, type ProjectData, type SelectionItem, getPhotoPreviewUrl } from '@/lib/api-client'

interface SelectedPhotosDetailModalProps {
  projectId: string | number
  onClose: () => void
  onStatusUpdated?: () => void
  toast: (msg: string, type?: 'error' | 'success' | 'info') => void
}

export function SelectedPhotosDetailModal({
  projectId,
  onClose,
  onStatusUpdated,
  toast,
}: SelectedPhotosDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<ProjectData | null>(null)
  const [selections, setSelections] = useState<SelectionItem[]>([])
  const [copied, setCopied] = useState(false)
  const [startingEdit, setStartingEdit] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [filterWithNotesOnly, setFilterWithNotesOnly] = useState(false)
  const [selectedPhotoForPreview, setSelectedPhotoForPreview] = useState<SelectionItem | null>(null)
  const [delimiter, setDelimiter] = useState<'comma' | 'space' | 'newline'>('comma')

  useEffect(() => {
    loadDetails()
  }, [projectId])

  async function loadDetails() {
    setLoading(true)
    try {
      const res = await selectedPhotos.get(projectId)
      setProject(res.project)
      setSelections(res.selections)
    } catch (err: any) {
      toast(err.message || 'Gagal memuat detail foto terpilih', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleStartEditing() {
    setStartingEdit(true)
    try {
      const res = await selectedPhotos.startEditing(projectId)
      toast(res.message || 'Project berhasil dipindahkan ke tahap Editing!', 'success')
      setProject(res.project)
      if (onStatusUpdated) onStatusUpdated()
      loadDetails()
    } catch (err: any) {
      toast(err.message || 'Gagal mengubah status ke editing', 'error')
    } finally {
      setStartingEdit(false)
    }
  }

  function handleCopyFileList() {
    if (!selections.length) return
    const fileNames = selections.map((s) => s.photo?.file_name).filter(Boolean)
    const sep = delimiter === 'space' ? ' ' : delimiter === 'newline' ? '\n' : ', '
    const text = fileNames.join(sep)
    navigator.clipboard?.writeText(text)
    setCopied(true)
    toast(`Berhasil menyalin ${fileNames.length} nama file ke clipboard!`, 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownloadZip() {
    if (!selections.length) return
    setDownloadingZip(true)
    setDownloadProgress(0)

    try {
      toast('Menyiapkan file ZIP foto pilihan...', 'info')
      const zip = new JSZip()
      const folderName = `${project?.name || 'Project'}_Foto_Terpilih`
      const imgFolder = zip.folder(folderName) || zip

      // Single summary text file inside ZIP containing filenames and client notes
      let notesSummary = `FOTO TERPILIH - ${project?.name || 'Project'}\n`
      notesSummary += `Klien: ${project?.client_name || '-'}\n`
      notesSummary += `Total Foto: ${selections.length}\n`
      notesSummary += `=========================================\n\n`

      let completedCount = 0
      const total = selections.length

      for (let i = 0; i < selections.length; i++) {
        const item = selections[i]
        const photo = item.photo
        const fileName = photo?.file_name || `foto_${i + 1}.jpg`
        const code = photo?.photo_code ? ` [Code: ${photo.photo_code}]` : ''
        const note = item.client_note ? `\n   Catatan: "${item.client_note}"` : ''

        notesSummary += `${i + 1}. ${fileName}${code}${note}\n`

        // Fetch photo blob
        const photoUrl = photo?.drive_thumbnail_url?.replace(/=s\d+.*$/, '=s1600') ||
                         (photo ? getPhotoPreviewUrl(photo.id) : null)

        if (photoUrl) {
          try {
            const resp = await fetch(photoUrl)
            if (resp.ok) {
              const blob = await resp.blob()
              imgFolder.file(fileName, blob)
            }
          } catch (e) {
            console.error(`Gagal mengunduh gambar ${fileName}:`, e)
          }
        }

        completedCount++
        setDownloadProgress(Math.round((completedCount / total) * 100))
      }

      imgFolder.file('Daftar_dan_Catatan_Klien.txt', notesSummary)

      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setDownloadProgress(Math.round(metadata.percent))
      })

      const zipName = `${(project?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_')}_Foto_Terpilih.zip`
      saveAs(content, zipName)

      toast(`File ZIP ${zipName} berhasil diunduh!`, 'success')
    } catch (err: any) {
      toast('Gagal mengunduh foto ZIP: ' + (err.message || 'Terjadi kesalahan'), 'error')
    } finally {
      setDownloadingZip(false)
      setDownloadProgress(0)
    }
  }

  const displayedSelections = filterWithNotesOnly
    ? selections.filter((s) => Boolean(s.client_note && s.client_note.trim() !== ''))
    : selections

  const notesCount = selections.filter((s) => Boolean(s.client_note && s.client_note.trim() !== '')).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-modal-backdrop">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-modal-dialog">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-brand-100 bg-gradient-to-r from-brand-50/80 via-white to-aqua-100/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow shrink-0">
              <ImageIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-semibold font-heading text-slate-900 leading-normal">
                  {loading ? 'Memuat Foto Terpilih...' : project?.name}
                </h2>
                {project && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body shrink-0 ${
                      project.status === 'completed'
                        ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                        : 'bg-amber-100 text-amber-700 border border-amber-300'
                    }`}
                  >
                    {project.status === 'completed' ? 'Selesai' : 'Sedang Diedit'}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-normal font-body text-slate-500 truncate">
                Klien: <span className="text-slate-800 font-medium">{project?.client_name || '...'}</span> • Total{' '}
                <span className="text-brand-600 font-medium">{selections.length}</span> foto dipilih
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Toolbar & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50/80 border-b border-slate-200/80 text-xs">
          {/* Filter controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {notesCount > 0 && (
              <button
                onClick={() => setFilterWithNotesOnly(!filterWithNotesOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition ${
                  filterWithNotesOnly
                    ? 'border-amber-400 bg-amber-50 text-amber-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare size={13} className={filterWithNotesOnly ? 'text-amber-600' : 'text-slate-400'} />
                <span>Hanya yang ada Catatan ({notesCount})</span>
              </button>
            )}
          </div>


          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy File Names Button */}
            <button
              onClick={handleCopyFileList}
              disabled={loading || !selections.length}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-soft text-brand-700 font-bold transition shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-50"
              title="Salin daftar nama file foto terpilih ke clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin!' : 'Copy File Names'}</span>
            </button>

            {/* Download Foto ZIP Button */}
            <button
              onClick={handleDownloadZip}
              disabled={loading || !selections.length || downloadingZip}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-gradient bg-[length:200%_100%] bg-left text-white font-bold shadow-glow transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:transform-none"
              title="Unduh seluruh foto terpilih secara otomatis dalam bentuk file ZIP"
            >
              {downloadingZip ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Mengunduh ZIP ({downloadProgress}%)...</span>
                </>
              ) : (
                <>
                  <FileArchive size={14} />
                  <span>Download Foto (.ZIP)</span>
                </>
              )}
            </button>

            {project && project.status === 'selected' && (
              <button
                onClick={handleStartEditing}
                disabled={startingEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold shadow-2xs transition active:scale-[0.98] disabled:opacity-50"
              >
                {startingEdit ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>Mulai Editing</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Photo Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-sm font-medium">Memuat data foto...</p>
            </div>
          ) : displayedSelections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <ImageIcon size={48} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada foto yang cocok dengan filter</p>
              <p className="text-xs text-slate-400 mt-1">Coba nonaktifkan filter catatan untuk melihat semua foto terpilih.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedSelections.map((selection, idx) => {
                const photo = selection.photo
                const thumb = photo?.drive_thumbnail_url || (photo ? getPhotoPreviewUrl(photo.id) : '')
                const hasNote = Boolean(selection.client_note && selection.client_note.trim() !== '')

                return (
                  <div
                    key={selection.id}
                    onClick={() => setSelectedPhotoForPreview(selection)}
                    className={`group relative flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-blue-300 smooth-card animate-card-enter stagger-${(idx % 12) + 1} cursor-pointer overflow-hidden`}
                  >
                    {/* Thumbnail box */}
                    <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={photo?.file_name || 'Foto'}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-slate-300">
                          <ImageIcon size={28} />
                        </div>
                      )}

                      {/* Photo index badge */}
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/70 backdrop-blur-xs text-[10px] font-bold text-white">
                        #{idx + 1}
                      </span>

                      {/* Status indicator */}
                      <span
                        className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          selection.edit_status === 'ready'
                            ? 'bg-emerald-600 text-white'
                            : selection.edit_status === 'editing'
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {selection.edit_status === 'ready'
                          ? 'Siap'
                          : selection.edit_status === 'editing'
                          ? 'Edit'
                          : 'Dipilih'}
                      </span>
                    </div>

                    {/* Metadata & Notes */}
                    <div className="p-2.5 flex flex-col gap-1">
                      <p className="text-xs font-medium font-body text-slate-800 truncate" title={photo?.file_name}>
                        {photo?.file_name || 'Foto Tanpa Nama'}
                      </p>
                      {photo?.photo_code && (
                        <p className="text-[10.5px] font-medium font-body text-slate-400 truncate">
                          Code: {photo.photo_code}
                        </p>
                      )}

                      {/* Client Note badge */}
                      {hasNote && (
                        <div className="mt-1 flex items-start gap-1 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight">
                          <MessageSquare size={12} className="shrink-0 mt-0.5 text-amber-600" />
                          <p className="line-clamp-2 italic font-medium">"{selection.client_note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white text-xs text-slate-500">
          <span>Klik foto untuk melihat ukuran penuh dan catatan lengkap.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Single Photo Lightbox Preview */}
      {selectedPhotoForPreview && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedPhotoForPreview(null)}
        >
          <div
            className="relative flex flex-col max-w-4xl max-h-[90vh] bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <div>
                <p className="text-sm font-semibold">{selectedPhotoForPreview.photo?.file_name}</p>
                <p className="text-xs text-slate-400">Kode: {selectedPhotoForPreview.photo?.photo_code || '-'}</p>
              </div>
              <button
                onClick={() => setSelectedPhotoForPreview(null)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative flex items-center justify-center bg-black/40 p-2 overflow-hidden max-h-[65vh]">
              <img
                src={
                  selectedPhotoForPreview.photo?.drive_thumbnail_url?.replace(/=s\d+.*$/, '=s1600') ||
                  getPhotoPreviewUrl(selectedPhotoForPreview.photo_id)
                }
                alt={selectedPhotoForPreview.photo?.file_name || 'Preview'}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {selectedPhotoForPreview.client_note && (
              <div className="p-4 bg-amber-950/40 border-t border-amber-900/50 text-amber-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-300">
                  <MessageSquare size={14} />
                  <span>Catatan Khusus dari Klien:</span>
                </div>
                <p className="text-[13px] leading-relaxed italic bg-black/30 p-2.5 rounded-lg border border-amber-800/40">
                  "{selectedPhotoForPreview.client_note}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
