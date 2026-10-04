/**
 * lib/projects.ts
 * Server-side helpers - now calls Laravel REST API instead of Supabase
 */
import { projects as projectsApi, ProjectData as ApiProjectData } from '@/lib/api-client'

export interface ProjectData {
  id: string
  name: string
  clientName: string
  status: string
  clientToken: string
  driveLink: string
  driveFolderId: string
  whatsappNumber: string | null
  maxPhotos: number
  selectionLocked: boolean
  lastSyncedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  photoCount: number
  selectedCount: number
  editedCount?: number
  previewThumbnails?: string[]
}

function mapProject(p: ApiProjectData): ProjectData {
  return {
    id: String(p.id),
    name: p.name,
    clientName: p.client_name,
    status: p.status,
    clientToken: p.client_token,
    driveLink: p.drive_folder_url,
    driveFolderId: p.drive_folder_id,
    whatsappNumber: p.whatsapp_number,
    maxPhotos: p.max_photos,
    selectionLocked: p.selection_locked,
    lastSyncedAt: p.last_synced_at,
    completedAt: p.completed_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    photoCount: p.photo_count,
    selectedCount: p.selected_count,
    editedCount: p.edited_count ?? 0,
    previewThumbnails: p.preview_thumbnails ?? [],
  }
}

export async function getProjects(): Promise<ProjectData[]> {
  try {
    const res = await projectsApi.list()
    return (res.data ?? []).map(mapProject)
  } catch {
    return []
  }
}

export async function getProjectById(id: string): Promise<ProjectData | null> {
  try {
    const res = await projectsApi.get(id)
    if (!res.data) return null
    return mapProject(res.data)
  } catch {
    return null
  }
}

export async function getProfileData() {
  try {
    const { profile } = await import('@/lib/api-client')
    const res = await profile.get()
    if (!res.data) return null
    const d = res.data
    return {
      email: d.email ?? '',
      studioName: d.studio_name ?? '',
      fullName: d.full_name ?? '',
      location: d.location ?? '',
      bio: d.bio ?? '',
      whatsapp: d.whatsapp ?? '',
      website: d.website ?? '',
      showBranding: d.show_branding ?? true,
      allowNotes: d.allow_notes ?? true,
      sendReminders: d.send_reminders ?? false,
    }
  } catch {
    return null
  }
}
