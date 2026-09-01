import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import SelectGalleryClient from '@/components/photo-selector/select-gallery-client'
import { ImageOff } from 'lucide-react'

export const dynamic = 'force-dynamic'

export interface GalleryPhoto {
  id: string
  fileName: string
  photoCode: string
  previewUrl: string | null
  sortOrder: number
}

export interface GalleryProject {
  id: string
  name: string
  clientName: string
  studioName: string | null
  maxPhotos: number
  isLocked: boolean
  isCompleted: boolean
  whatsappNumber: string | null
  isPasswordProtected: boolean
}

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

  const admin = createAdminClient()

  // Load project by token — server-side only
  const { data: project, error } = await admin
    .from('projects')
    .select(`
      id, owner_id, name, client_name, max_photos, selection_locked,
      status, gallery_password_hash, whatsapp_number
    `)
    .eq('client_token', token)
    .single()

  if (error || !project) {
    return <GalleryNotFound />
  }

  // Load studio name from owner's profile
  let studioName: string | null = null
  if (project.owner_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('studio_name')
      .eq('id', project.owner_id)
      .single()
    studioName = profile?.studio_name ?? null
  }

  // Check password protection
  const isPasswordProtected = !!project.gallery_password_hash
  let accessGranted = !isPasswordProtected

  if (isPasswordProtected) {
    // Check cookie server-side using the incoming request cookies
    const cookieStore = await cookies()
    const cookieName = `gallery_access_${token}`
    const cookieValue = cookieStore.get(cookieName)?.value

    if (cookieValue) {
      // Verify the HMAC without the NextRequest wrapper
      try {
        const { createHmac } = await import('crypto')
        const secret = process.env.GALLERY_ACCESS_SECRET ?? ''
        const parts = cookieValue.split(':')
        if (parts.length === 2) {
          const [encodedToken, providedHmac] = parts
          const decodedToken = Buffer.from(encodedToken, 'base64url').toString('utf8')
          if (decodedToken === token) {
            const expectedHmac = createHmac('sha256', secret).update(token).digest('base64url')
            if (providedHmac === expectedHmac) {
              accessGranted = true
            }
          }
        }
      } catch {
        accessGranted = false
      }
    }
  }

  // Load active photos
  const { data: photosRaw } = await admin
    .from('photos')
    .select('id, file_name, photo_code, preview_path, sort_order')
    .eq('project_id', project.id)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  // Generate signed preview URLs (valid 2 hours)
  const photos: GalleryPhoto[] = []
  if (accessGranted && photosRaw) {
    for (const p of photosRaw) {
      let previewUrl: string | null = null
      if (p.preview_path) {
        const { data: signed } = await admin.storage
          .from('gallery-previews')
          .createSignedUrl(p.preview_path, 7200)
        previewUrl = signed?.signedUrl ?? null
      }
      photos.push({
        id: p.id,
        fileName: p.file_name,
        photoCode: p.photo_code,
        previewUrl,
        sortOrder: p.sort_order,
      })
    }
  }

  // Load current selections
  const selectedPhotoIds: string[] = []
  if (accessGranted) {
    const { data: selections } = await admin
      .from('selections')
      .select('photo_id')
      .eq('project_id', project.id)

    if (selections) {
      for (const s of selections) {
        selectedPhotoIds.push(s.photo_id)
      }
    }
  }

  // Sanitized project info — NEVER send owner_id, password_hash, or service role info
  const galleryProject: GalleryProject = {
    id: project.id,
    name: project.name,
    clientName: project.client_name,
    studioName,
    maxPhotos: project.max_photos,
    isLocked: project.selection_locked || project.status === 'completed' || project.status === 'locked',
    isCompleted: project.status === 'completed',
    whatsappNumber: project.whatsapp_number,
    isPasswordProtected,
  }

  return (
    <SelectGalleryClient
      token={token}
      project={galleryProject}
      photos={photos}
      initialSelectedIds={selectedPhotoIds}
      accessGranted={accessGranted}
    />
  )
}
