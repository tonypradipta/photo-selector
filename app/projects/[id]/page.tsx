import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ProjectDetailClient from './project-detail-client'

export const dynamic = 'force-dynamic'

export interface SelectedPhoto {
  id: string
  fileName: string
  photoCode: string
  previewUrl: string | null
  selectedAt: string
}

export interface ProjectDetail {
  id: string
  name: string
  clientName: string
  status: string
  clientToken: string
  driveLink: string
  whatsappNumber: string | null
  maxPhotos: number
  selectionLocked: boolean
  lastSyncedAt: string | null
  completedAt: string | null
  createdAt: string
  photoCount: number
  selectedCount: number
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Verify authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()

  // Load project and verify ownership
  const { data: project, error: projectError } = await admin
    .from('projects')
    .select(`
      id, name, client_name, status, client_token,
      drive_folder_url, whatsapp_number, max_photos,
      selection_locked, last_synced_at, completed_at, created_at
    `)
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // Load active photos count
  const { count: photoCount } = await admin
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)
    .eq('active', true)

  // Load selections with photo details
  const { data: selectionsRaw } = await admin
    .from('selections')
    .select(`
      id,
      selected_at,
      photos!inner(id, file_name, photo_code, preview_path)
    `)
    .eq('project_id', id)
    .order('selected_at', { ascending: true })

  // Generate signed URLs for selected photo previews
  const selectedPhotos: SelectedPhoto[] = []
  if (selectionsRaw) {
    for (const sel of selectionsRaw) {
      const photoRaw = Array.isArray(sel.photos) ? sel.photos[0] : sel.photos
      const photo = photoRaw as unknown as {
        id: string
        file_name: string
        photo_code: string
        preview_path: string | null
      } | null
      if (!photo) continue
      let previewUrl: string | null = null
      if (photo.preview_path) {
        const { data: signed } = await admin.storage
          .from('gallery-previews')
          .createSignedUrl(photo.preview_path, 7200)
        previewUrl = signed?.signedUrl ?? null
      }
      selectedPhotos.push({
        id: photo.id,
        fileName: photo.file_name,
        photoCode: photo.photo_code,
        previewUrl,
        selectedAt: sel.selected_at,
      })
    }
  }

  const projectDetail: ProjectDetail = {
    id: project.id,
    name: project.name,
    clientName: project.client_name,
    status: project.status,
    clientToken: project.client_token,
    driveLink: project.drive_folder_url,
    whatsappNumber: project.whatsapp_number,
    maxPhotos: project.max_photos,
    selectionLocked: project.selection_locked,
    lastSyncedAt: project.last_synced_at,
    completedAt: project.completed_at,
    createdAt: project.created_at,
    photoCount: photoCount ?? 0,
    selectedCount: selectedPhotos.length,
  }

  return (
    <ProjectDetailClient
      project={projectDetail}
      selectedPhotos={selectedPhotos}
    />
  )
}
