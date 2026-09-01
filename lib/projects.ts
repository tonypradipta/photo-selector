import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  previewThumbnails?: string[]
}

export async function getProjects(): Promise<ProjectData[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        client_name,
        status,
        client_token,
        drive_folder_url,
        drive_folder_id,
        whatsapp_number,
        max_photos,
        selection_locked,
        last_synced_at,
        completed_at,
        created_at,
        updated_at,
        photos(id, active, preview_path, sort_order),
        selections(id)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    const projectThumbnailPathsMap = new Map<string, string[]>()
    const allPathsToSign: string[] = []

    data.forEach((p: Record<string, unknown>) => {
      const photos = (p.photos as Array<{ id: string; active: boolean; preview_path: string | null; sort_order?: number }>) ?? []
      const activePhotos = photos
        .filter((ph) => ph.active && ph.preview_path)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .slice(0, 4)
      const paths = activePhotos.map((ph) => ph.preview_path as string)
      projectThumbnailPathsMap.set(p.id as string, paths)
      allPathsToSign.push(...paths)
    })

    const signedUrlMap = new Map<string, string>()
    if (allPathsToSign.length > 0) {
      try {
        const admin = createAdminClient()
        const { data: signedData } = await admin.storage
          .from('gallery-previews')
          .createSignedUrls(allPathsToSign, 7200)

        if (signedData) {
          signedData.forEach((s) => {
            if (s.signedUrl && s.path) {
              signedUrlMap.set(s.path, s.signedUrl)
            }
          })
        }
      } catch (signErr) {
        console.error('Error generating thumbnail preview signed URLs:', signErr)
      }
    }

    return data.map((p: Record<string, unknown>) => {
      const photos = (p.photos as Array<{ id: string; active: boolean }>) ?? []
      const selections = (p.selections as Array<{ id: string }>) ?? []
      const paths = projectThumbnailPathsMap.get(p.id as string) ?? []
      const previewThumbnails = paths.map((path) => signedUrlMap.get(path)).filter(Boolean) as string[]

      return {
        id: p.id as string,
        name: p.name as string,
        clientName: p.client_name as string,
        status: p.status as string,
        clientToken: p.client_token as string,
        driveLink: p.drive_folder_url as string,
        driveFolderId: p.drive_folder_id as string,
        whatsappNumber: p.whatsapp_number as string | null,
        maxPhotos: p.max_photos as number,
        selectionLocked: p.selection_locked as boolean,
        lastSyncedAt: p.last_synced_at as string | null,
        completedAt: p.completed_at as string | null,
        createdAt: p.created_at as string,
        updatedAt: p.updated_at as string,
        photoCount: photos.filter((ph) => ph.active).length,
        selectedCount: selections.length,
        previewThumbnails,
      }
    })
  } catch {
    return []
  }
}

export async function getProjectById(id: string): Promise<ProjectData | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, name, client_name, status, client_token,
        drive_folder_url, drive_folder_id, whatsapp_number,
        max_photos, selection_locked, last_synced_at,
        completed_at, created_at, updated_at,
        photos(id, active, preview_path, sort_order),
        selections(id)
      `)
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (error || !data) return null

    const p = data as Record<string, unknown>
    const photos = (p.photos as Array<{ id: string; active: boolean; preview_path: string | null; sort_order?: number }>) ?? []
    const selections = (p.selections as Array<{ id: string }>) ?? []

    const activePhotos = photos
      .filter((ph) => ph.active && ph.preview_path)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .slice(0, 4)
    const paths = activePhotos.map((ph) => ph.preview_path as string)

    let previewThumbnails: string[] = []
    if (paths.length > 0) {
      try {
        const admin = createAdminClient()
        const { data: signedData } = await admin.storage
          .from('gallery-previews')
          .createSignedUrls(paths, 7200)
        if (signedData) {
          previewThumbnails = signedData.map((s) => s.signedUrl).filter(Boolean) as string[]
        }
      } catch (signErr) {
        console.error('Error generating project preview thumbnails:', signErr)
      }
    }

    return {
      id: p.id as string,
      name: p.name as string,
      clientName: p.client_name as string,
      status: p.status as string,
      clientToken: p.client_token as string,
      driveLink: p.drive_folder_url as string,
      driveFolderId: p.drive_folder_id as string,
      whatsappNumber: p.whatsapp_number as string | null,
      maxPhotos: p.max_photos as number,
      selectionLocked: p.selection_locked as boolean,
      lastSyncedAt: p.last_synced_at as string | null,
      completedAt: p.completed_at as string | null,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
      photoCount: photos.filter((ph) => ph.active).length,
      selectedCount: selections.length,
      previewThumbnails,
    }
  } catch {
    return null
  }
}

export async function getProfileData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('studio_name, full_name, location, bio, whatsapp, website, show_branding, allow_notes, send_reminders')
      .eq('id', user.id)
      .single()

    return {
      email: user.email ?? '',
      studioName: data?.studio_name ?? '',
      fullName: data?.full_name ?? '',
      location: data?.location ?? '',
      bio: data?.bio ?? '',
      whatsapp: data?.whatsapp ?? '',
      website: data?.website ?? '',
      showBranding: data?.show_branding ?? true,
      allowNotes: data?.allow_notes ?? true,
      sendReminders: data?.send_reminders ?? false,
    }
  } catch {
    return null
  }
}
