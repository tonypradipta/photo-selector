'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createProjectSchema,
  updateProjectSchema,
  extractDriveFolderId,
} from '@/lib/validation'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { user, supabase }
}

function generateClientToken(): string {
  return randomBytes(16).toString('base64url')
}

// ──────────────────────────────────────────────
// CREATE PROJECT
// ──────────────────────────────────────────────
export async function createProject(
  _prevState: { error: string; success: boolean; projectId?: string },
  formData: FormData
): Promise<{ error: string; success: boolean; projectId?: string; clientToken?: string }> {
  try {
    const { user } = await getAuthenticatedUser()

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
      return {
        error: parsed.error.errors[0].message,
        success: false,
      }
    }

    const { name, clientName, driveLink, whatsapp, maxPhotos, protect, password } =
      parsed.data

    const driveFolderId = extractDriveFolderId(driveLink)!
    const clientToken = generateClientToken()

    let passwordHash: string | null = null
    if (protect && password) {
      passwordHash = await bcrypt.hash(password, 12)
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('projects')
      .insert({
        owner_id: user.id,
        name,
        client_name: clientName,
        drive_folder_url: driveLink,
        drive_folder_id: driveFolderId,
        whatsapp_number: whatsapp || null,
        max_photos: maxPhotos,
        client_token: clientToken,
        gallery_password_hash: passwordHash,
        status: 'draft',
      })
      .select('id, client_token')
      .single()

    if (error) {
      console.error('createProject error:', error)
      return { error: 'Failed to create project. Please try again.', success: false }
    }

    revalidatePath('/')
    return { error: '', success: true, projectId: data.id, clientToken: data.client_token }
  } catch (err) {
    console.error('createProject exception:', err)
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
): Promise<{ error: string; success: boolean }> {
  try {
    const { user } = await getAuthenticatedUser()

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
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message, success: false }
    }

    // Verify ownership
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('projects')
      .select('id, owner_id, gallery_password_hash')
      .eq('id', projectId)
      .single()

    if (!existing || existing.owner_id !== user.id) {
      return { error: 'Project not found or access denied.', success: false }
    }

    const { name, clientName, driveLink, whatsapp, maxPhotos, protect, password } =
      parsed.data

    let passwordHash = existing.gallery_password_hash
    if (protect && password) {
      passwordHash = await bcrypt.hash(password as string, 12)
    } else if (!protect) {
      passwordHash = null
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (clientName) updateData.client_name = clientName
    if (driveLink) {
      updateData.drive_folder_url = driveLink
      updateData.drive_folder_id = extractDriveFolderId(driveLink)
    }
    updateData.whatsapp_number = whatsapp || null
    if (maxPhotos) updateData.max_photos = maxPhotos
    updateData.gallery_password_hash = passwordHash

    const { error } = await admin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('owner_id', user.id)

    if (error) return { error: 'Failed to update project.', success: false }

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
// DELETE PROJECT
// ──────────────────────────────────────────────
export async function deleteProject(
  projectId: string
): Promise<{ error: string; success: boolean }> {
  try {
    const { user } = await getAuthenticatedUser()

    const admin = createAdminClient()

    // Verify ownership before delete
    const { data: existing } = await admin
      .from('projects')
      .select('id, owner_id, drive_folder_id')
      .eq('id', projectId)
      .single()

    if (!existing || existing.owner_id !== user.id) {
      return { error: 'Project not found or access denied.', success: false }
    }

    // Delete preview files from storage
    try {
      const { data: photos } = await admin
        .from('photos')
        .select('preview_path')
        .eq('project_id', projectId)
        .not('preview_path', 'is', null)

      if (photos && photos.length > 0) {
        const paths = photos
          .map((p: { preview_path: string | null }) => p.preview_path)
          .filter(Boolean) as string[]
        if (paths.length > 0) {
          await admin.storage.from('gallery-previews').remove(paths)
        }
      }
    } catch {
      // Non-fatal: proceed with project deletion even if storage cleanup fails
    }

    const { error } = await admin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_id', user.id)

    if (error) return { error: 'Failed to delete project.', success: false }

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
    const { user } = await getAuthenticatedUser()
    const admin = createAdminClient()

    const { error } = await admin
      .from('projects')
      .update({
        selection_locked: locked,
        status: locked ? 'locked' : 'active',
      })
      .eq('id', projectId)
      .eq('owner_id', user.id)

    if (error) return { error: 'Failed to update project lock.', success: false }

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
