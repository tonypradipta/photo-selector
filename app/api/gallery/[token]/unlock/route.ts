import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { signGalleryToken, GALLERY_COOKIE_NAME, GALLERY_COOKIE_MAX_AGE } from '@/lib/gallery-access'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const admin = createAdminClient()

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, gallery_password_hash')
      .eq('client_token', token)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (!project.gallery_password_hash) {
      return NextResponse.json({ error: 'This gallery is not password protected' }, { status: 400 })
    }

    const body = await request.json() as { password: string }
    if (!body.password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const valid = await bcrypt.compare(body.password, project.gallery_password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Create signed access cookie specific to this gallery token
    const cookieValue = await signGalleryToken(token)

    const response = NextResponse.json({ success: true })
    response.cookies.set(GALLERY_COOKIE_NAME(token), cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: GALLERY_COOKIE_MAX_AGE,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Gallery unlock error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
