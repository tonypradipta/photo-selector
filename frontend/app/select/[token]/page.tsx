import { cookies } from 'next/headers'
import SelectGalleryClient from '@/components/gallery'
import { ImageOff } from 'lucide-react'
import type { GalleryPhoto, GalleryProject } from '@/components/gallery/types'
export type { GalleryPhoto, GalleryProject }

export const dynamic = 'force-dynamic'

function GalleryNotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#e2eeff] to-[#edf5ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px] text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src="/logo.png" alt="Perumda Photo Selector" className="size-10 rounded-[10px] border border-[#bfdbfe]/50 bg-white object-contain p-1 shadow-sm" />
          <span className="text-[17px] font-semibold text-[#0f172a]">Perumda Photo Selector</span>
        </div>
        <div className="rounded-[16px] border border-[#bfdbfe] bg-white/95 p-8 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
            <ImageOff size={28} />
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-[#0f172a]">Gallery Tidak Ditemukan</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
            Tautan galeri yang Anda buka tidak valid atau telah dihapus oleh fotografer. Silakan hubungi fotografer Anda untuk mendapatkan tautan yang benar.
          </p>
        </div>
        <p className="mt-6 text-[12px] text-[#94a3b8]">Perumda Photo Selector · Platform Pemilihan Foto Klien</p>
      </div>
    </main>
  )
}

export default async function SelectGalleryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')

    const res = await fetch(`${apiBase}/api/gallery/${token}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Cookie: cookieHeader,
      },
    })

    if (res.status === 404) {
      return <GalleryNotFound />
    }

    const data = await res.json()
    const p = data.project

    if (!p) {
      return <GalleryNotFound />
    }

    const accessGranted = res.status !== 403

    const galleryProject: GalleryProject = {
      id: String(p.id),
      name: p.name,
      clientName: p.client_name,
      studioName: p.studio_name ?? null,
      maxPhotos: p.max_photos ?? 20,
      isLocked: p.selection_locked || p.status === 'completed' || p.status === 'locked',
      isCompleted: p.status === 'completed',
      whatsappNumber: p.whatsapp_number ?? null,
      isPasswordProtected: Boolean(p.is_password_protected),
    }

    const photos: GalleryPhoto[] = (data.photos || []).map((ph: {
      id: string | number
      file_name: string
      photo_code: string
      preview_url: string | null
      sort_order?: number
    }) => ({
      id: String(ph.id),
      fileName: ph.file_name,
      photoCode: ph.photo_code,
      previewUrl: ph.preview_url,
      sortOrder: ph.sort_order ?? 0,
    }))

    const initialSelectedIds: string[] = (data.photos || [])
      .filter((ph: { is_selected?: boolean }) => ph.is_selected)
      .map((ph: { id: string | number }) => String(ph.id))

    return (
      <SelectGalleryClient
        token={token}
        project={galleryProject}
        photos={photos}
        initialSelectedIds={initialSelectedIds}
        accessGranted={accessGranted}
      />
    )
  } catch {
    return <GalleryNotFound />
  }
}

