import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Verify project ownership
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, owner_id, name, client_name, drive_folder_url, client_token, max_photos, status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Load active photos
    const { data: photosRaw, error: photosError } = await admin
      .from('photos')
      .select('id, file_name, photo_code, preview_path, sort_order')
      .eq('project_id', projectId)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (photosError) {
      return NextResponse.json({ error: 'Failed to load photos' }, { status: 500 })
    }

    // Load selections
    const { data: selectionsRaw } = await admin
      .from('selections')
      .select('photo_id')
      .eq('project_id', projectId)

    const selectedSet = new Set((selectionsRaw ?? []).map((s: { photo_id: string }) => s.photo_id))

    // Generate signed URLs in batch
    const previewPaths = (photosRaw ?? [])
      .map((p: { preview_path: string | null }) => p.preview_path)
      .filter(Boolean) as string[]

    const signedUrlMap = new Map<string, string>()
    if (previewPaths.length > 0) {
      const { data: signedData } = await admin.storage
        .from('gallery-previews')
        .createSignedUrls(previewPaths, 7200)

      if (signedData) {
        signedData.forEach((s) => {
          if (s.signedUrl && s.path) {
            signedUrlMap.set(s.path, s.signedUrl)
          }
        })
      }
    }

    const photos = (photosRaw ?? []).map((p: { id: string; file_name: string; photo_code: string; preview_path: string | null; sort_order: number }) => ({
      id: p.id,
      fileName: p.file_name,
      photoCode: p.photo_code,
      previewUrl: p.preview_path ? signedUrlMap.get(p.preview_path) ?? null : null,
      sortOrder: p.sort_order,
      isSelected: selectedSet.has(p.id),
    }))

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.client_name,
        driveFolderUrl: project.drive_folder_url,
        clientToken: project.client_token,
        maxPhotos: project.max_photos,
        status: project.status,
      },
      photos,
      totalCount: photos.length,
      selectedCount: selectedSet.size,
    })
  } catch (err) {
    console.error('Error fetching project photos:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
