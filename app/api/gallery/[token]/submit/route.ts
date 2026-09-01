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

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, selection_locked, gallery_password_hash, status, max_photos')
      .eq('client_token', token)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (project.gallery_password_hash) {
      const accessGranted = await verifyGalleryAccess(request, token)
      if (!accessGranted) {
        return NextResponse.json({ error: 'Gallery is password protected' }, { status: 403 })
      }
    }

    if (project.selection_locked) {
      return NextResponse.json({ error: 'Selection is locked and cannot be submitted' }, { status: 423 })
    }

    // Update project status to completed and lock selections permanently
    const { error: updateError } = await admin
      .from('projects')
      .update({
        status: 'completed',
        selection_locked: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', project.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to submit selection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
