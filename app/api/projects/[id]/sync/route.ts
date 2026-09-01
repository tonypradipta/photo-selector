import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listDrivePhotos, downloadDriveFile, checkFolderAccess } from '@/lib/google-drive'
import { derivePhotoCode } from '@/lib/validation'

export async function POST(
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

    // Verify project ownership
    const admin = createAdminClient()
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, owner_id, drive_folder_id, drive_folder_url, status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (project.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check Drive folder accessibility
    const folderAccess = await checkFolderAccess(project.drive_folder_id)
    if (!folderAccess.accessible) {
      return NextResponse.json({ error: folderAccess.error }, { status: 422 })
    }

    // Ensure gallery-previews bucket exists
    try {
      const { data: buckets } = await admin.storage.listBuckets()
      const hasBucket = (buckets ?? []).some((b: { name: string; id: string }) => b.name === 'gallery-previews' || b.id === 'gallery-previews')
      if (!hasBucket) {
        await admin.storage.createBucket('gallery-previews', { public: false })
      }
    } catch (bucketErr) {
      console.warn('Bucket check/create notice:', bucketErr)
    }

    // List photos from Google Drive
    const drivePhotos = await listDrivePhotos(project.drive_folder_id)

    if (drivePhotos.length === 0) {
      return NextResponse.json({
        error: 'No images found in the Drive folder. Make sure the folder contains images and is shared with the Service Account.',
      }, { status: 422 })
    }

    // Get existing photos for this project
    const { data: existingPhotos } = await admin
      .from('photos')
      .select('id, drive_file_id, preview_path')
      .eq('project_id', projectId)

    const existingMap = new Map(
      (existingPhotos ?? []).map((p: { id: string; drive_file_id: string; preview_path: string | null }) => [
        p.drive_file_id,
        p,
      ])
    )

    const driveFileIds = new Set(drivePhotos.map((p) => p.id))

    // Mark photos no longer in Drive as inactive
    const toDeactivate = (existingPhotos ?? [])
      .filter((p: { drive_file_id: string }) => !driveFileIds.has(p.drive_file_id))
      .map((p: { id: string }) => p.id)

    if (toDeactivate.length > 0) {
      await admin
        .from('photos')
        .update({ active: false })
        .in('id', toDeactivate)
    }

    let synced = 0

    for (let i = 0; i < drivePhotos.length; i++) {
      const photo = drivePhotos[i]
      const photoCode = derivePhotoCode(photo.name)
      const previewStoragePath = `${user.id}/${projectId}/${photo.id}.jpg`

      // Upload preview to Supabase Storage if not already there
      const existing = existingMap.get(photo.id)
      if (!existing?.preview_path) {
        try {
          let previewBuffer: Buffer

          if (photo.thumbnailLink) {
            // Use Google Drive thumbnail (fast)
            const thumbUrl = photo.thumbnailLink.replace('=s220', '=s800')
            const thumbRes = await fetch(thumbUrl)
            if (thumbRes.ok) {
              previewBuffer = Buffer.from(await thumbRes.arrayBuffer())
            } else {
              // Fall back to downloading the file via the API
              const raw = await downloadDriveFile(photo.id)
              previewBuffer = await sharp(raw)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 82 })
                .toBuffer()
            }
          } else {
            const raw = await downloadDriveFile(photo.id)
            previewBuffer = await sharp(raw)
              .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 82 })
              .toBuffer()
          }

          await admin.storage
            .from('gallery-previews')
            .upload(previewStoragePath, previewBuffer, {
              contentType: 'image/jpeg',
              upsert: true,
            })
        } catch (storageErr) {
          console.warn(`Failed to upload preview for ${photo.id}:`, storageErr)
          // Non-fatal — proceed with sync, preview_path will remain null
        }
      }

      // Upsert photo record
      await admin.from('photos').upsert(
        {
          project_id: projectId,
          drive_file_id: photo.id,
          file_name: photo.name,
          photo_code: photoCode,
          mime_type: photo.mimeType,
          preview_path: previewStoragePath,
          drive_modified_time: photo.modifiedTime,
          width: photo.width,
          height: photo.height,
          sort_order: i,
          active: true,
        },
        { onConflict: 'project_id,drive_file_id' }
      )

      synced++
    }

    // Update project status to 'active' if it was 'draft'
    const newStatus = project.status === 'draft' ? 'active' : project.status
    await admin
      .from('projects')
      .update({
        last_synced_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      synced,
      deactivated: toDeactivate.length,
    })
  } catch (err) {
    console.error('Sync error:', err)
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred during sync.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
