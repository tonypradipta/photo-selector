import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGalleryAccess } from '@/lib/gallery-access'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const admin = createAdminClient()

    // Look up the project by token (server-side only)
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, max_photos, selection_locked, gallery_password_hash, status')
      .eq('client_token', token)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Check password protection
    if (project.gallery_password_hash) {
      const accessGranted = await verifyGalleryAccess(request, token)
      if (!accessGranted) {
        return NextResponse.json({ error: 'Gallery is password protected' }, { status: 403 })
      }
    }

    // Check if locked
    if (project.selection_locked || project.status === 'completed' || project.status === 'locked') {
      return NextResponse.json({ error: 'Pilihan foto sudah dikunci dan tidak dapat diubah.' }, { status: 423 })
    }

    const body = await request.json() as { photoId: string; selected: boolean }
    const { photoId, selected } = body

    if (!photoId || typeof selected !== 'boolean') {
      return NextResponse.json({ error: 'Format permintaan tidak valid' }, { status: 400 })
    }

    // Verify photo belongs to this project and is active
    const { data: photo } = await admin
      .from('photos')
      .select('id, active')
      .eq('id', photoId)
      .eq('project_id', project.id)
      .single()

    if (!photo || !photo.active) {
      return NextResponse.json({ error: 'Foto tidak ditemukan atau sudah tidak aktif' }, { status: 404 })
    }

    if (selected) {
      // Check max selections BEFORE inserting (server enforced)
      const { count } = await admin
        .from('selections')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)

      if ((count ?? 0) >= project.max_photos) {
        return NextResponse.json(
          { error: `Anda sudah mencapai batas maksimal ${project.max_photos} foto.` },
          { status: 422 }
        )
      }

      // Upsert the selection
      const { error: selError } = await admin
        .from('selections')
        .upsert(
          { project_id: project.id, photo_id: photoId },
          { onConflict: 'project_id,photo_id' }
        )

      if (selError) {
        return NextResponse.json({ error: 'Failed to save selection' }, { status: 500 })
      }
    } else {
      // Remove the selection
      const { error: delError } = await admin
        .from('selections')
        .delete()
        .eq('project_id', project.id)
        .eq('photo_id', photoId)

      if (delError) {
        return NextResponse.json({ error: 'Failed to remove selection' }, { status: 500 })
      }
    }

    // Return updated count
    const { count: newCount } = await admin
      .from('selections')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)

    return NextResponse.json({ success: true, selectionCount: newCount ?? 0 })
  } catch (err) {
    console.error('Selection error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
