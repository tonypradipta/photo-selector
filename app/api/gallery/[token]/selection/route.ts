import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const cookieHeader = request.headers.get('cookie') || ''
    const body = await request.json()
    const apiBase = getApiBaseUrl()
    const payload = {
      photo_id: body.photo_id ?? body.photoId,
      selected: Boolean(body.selected),
    }
    const response = await fetch(`${apiBase}/api/gallery/${token}/selection`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Selection failed' }))
      return NextResponse.json(err, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
