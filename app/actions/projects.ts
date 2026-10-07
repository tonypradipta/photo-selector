'use server'

import { revalidatePath } from 'next/cache'
import { projects as projectsApi } from '@/lib/api-client'
import { createProjectSchema, updateProjectSchema, extractDriveFolderId } from '@/lib/validation'

// ──────────────────────────────────────────────
// CREATE PROJECT
// ──────────────────────────────────────────────
export async function createProject(
  _prevState: { error: string; success: boolean; projectId?: string },
  formData: FormData
): Promise<{ error: string; success: boolean; projectId?: string; clientToken?: string; project?: any }> {
  try {
    const raw = {
      name: formData.get('name') as string,
      clientName: formData.get('clientName') as string,
      driveLink: formData.get('driveLink') as string,
      whatsapp: (formData.get('whatsapp') as string) || '',
      maxPhotos: formData.get('maxPhotos') as string,
      protect: formData.get('protect') === 'true',
      password: (formData.get('password') as string) || '',
    }

    const parsed = createProjectSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message, success: false }
    }

    const { name, clientName, driveLink, whatsapp, maxPhotos, protect, password } = parsed.data

    const res = await projectsApi.create({
      name,
      client_name: clientName,
      drive_folder_url: driveLink,
      whatsapp_number: whatsapp || undefined,
      max_photos: maxPhotos,
      protect,
      password: protect && password ? password : undefined,
    })

    revalidatePath('/')
    const projectData = {
      id: String(res.data.id),
      name: res.data.name,
      clientName: res.data.client_name,
      status: res.data.status,
      clientToken: res.data.client_token,
      driveLink: res.data.drive_folder_url,
      driveFolderId: res.data.drive_folder_id,
      whatsappNumber: res.data.whatsapp_number,
      maxPhotos: res.data.max_photos,
      selectionLocked: res.data.selection_locked,
      lastSyncedAt: res.data.last_synced_at,
      completedAt: res.data.completed_at,
      createdAt: res.data.created_at,
      updatedAt: res.data.updated_at,
      photoCount: res.data.photo_count ?? 0,
      selectedCount: res.data.selected_count ?? 0,
      editedCount: res.data.edited_count ?? 0,
      previewThumbnails: res.data.preview_thumbnails ?? [],
    }
    return {
      error: '',
      success: true,
      projectId: String(res.data.id),
      clientToken: res.data.client_token,
      project: projectData,
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
      success: false,
    }
  }
}

// ──────────────────────────────────────────────
// UPDATE PROJECT
// ──────────────────────────────────────────────
export async function updateProject(
  projectId: string,
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean; project?: any }> {
  try {
    const raw = {
      name: formData.get('name') as string,
      clientName: formData.get('clientName') as string,
      driveLink: formData.get('driveLink') as string,
      whatsapp: (formData.get('whatsapp') as string) || '',
      maxPhotos: formData.get('maxPhotos') as string,
      protect: formData.get('protect') === 'true',
      password: (formData.get('password') as string) || '',
    }

    const parsed = updateProjectSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.errors[0].message, success: false }

    const { name, clientName, driveLink, whatsapp, maxPhotos, protect, password } = parsed.data

    const res = await projectsApi.update(projectId, {
      name,
      client_name: clientName,
      drive_folder_url: driveLink,
      whatsapp_number: whatsapp || undefined,
      max_photos: maxPhotos,
      protect,
      password: protect && password ? password : undefined,
    })

    revalidatePath('/')
    const updatedProject = res.data ? {
      id: String(res.data.id),
      name: res.data.name,
      clientName: res.data.client_name,
      status: res.data.status,
      clientToken: res.data.client_token,
      driveLink: res.data.drive_folder_url,
      driveFolderId: res.data.drive_folder_id,
      whatsappNumber: res.data.whatsapp_number,
      maxPhotos: res.data.max_photos,
      selectionLocked: res.data.selection_locked,
      lastSyncedAt: res.data.last_synced_at,
      completedAt: res.data.completed_at,
      createdAt: res.data.created_at,
      updatedAt: res.data.updated_at,
      photoCount: res.data.photo_count ?? 0,
      selectedCount: res.data.selected_count ?? 0,
      editedCount: res.data.edited_count ?? 0,
      previewThumbnails: res.data.preview_thumbnails ?? [],
    } : undefined

    return { error: '', success: true, project: updatedProject }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unexpected error.',
      success: false,
    }
  }
}

// ──────────────────────────────────────────────
// DELETE PROJECT
// ──────────────────────────────────────────────
export async function deleteProject(projectId: string): Promise<{ error: string; success: boolean }> {
  try {
    await projectsApi.delete(projectId)
    revalidatePath('/')
    return { error: '', success: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unexpected error.',
      success: false,
    }
  }
}

// ──────────────────────────────────────────────
// LOCK / UNLOCK SELECTION
// ──────────────────────────────────────────────
export async function setProjectLock(
  projectId: string,
  locked: boolean
): Promise<{ error: string; success: boolean }> {
  try {
    await projectsApi.lock(projectId, locked)
    revalidatePath('/')
    revalidatePath(`/projects/${projectId}`)
    return { error: '', success: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unexpected error.',
      success: false,
    }
  }
}
