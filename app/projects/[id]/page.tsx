import { notFound, redirect } from 'next/navigation'
import { auth, projects as projectsApi } from '@/lib/api-client'
import ProjectDetailClient from '@/components/project-detail'

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

  const user = await auth.getUser()
  if (!user) {
    redirect('/login')
  }

  try {
    const res = await projectsApi.photos(id)
    if (!res || !res.project) {
      notFound()
    }

    const p = res.project
    const projectDetail: ProjectDetail = {
      id: String(p.id),
      name: p.name,
      clientName: p.client_name,
      status: p.status,
      clientToken: p.client_token,
      driveLink: p.drive_folder_url,
      whatsappNumber: p.whatsapp_number,
      maxPhotos: p.max_photos,
      selectionLocked: p.selection_locked,
      lastSyncedAt: p.last_synced_at,
      completedAt: p.completed_at,
      createdAt: p.created_at,
      photoCount: res.totalCount ?? res.photos.length,
      selectedCount: res.selectedCount ?? res.photos.filter((ph) => ph.is_selected).length,
    }

    const selectedPhotos: SelectedPhoto[] = (res.photos || [])
      .filter((ph) => ph.is_selected)
      .map((ph) => ({
        id: String(ph.id),
        fileName: ph.file_name,
        photoCode: ph.photo_code,
        previewUrl: ph.preview_url,
        selectedAt: '',
      }))

    return (
      <ProjectDetailClient
        project={projectDetail}
        selectedPhotos={selectedPhotos}
      />
    )
  } catch {
    notFound()
  }
}

