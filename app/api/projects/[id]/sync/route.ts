import { NextRequest, NextResponse } from 'next/server'
import { laravelAuthHeaders, laravelBaseUrl } from '@/lib/laravel-proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const response = await fetch(`${laravelBaseUrl()}/api/projects/${projectId}/sync`, {
      method: 'POST',
      headers: laravelAuthHeaders(request, { 'Content-Type': 'application/json' }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Sync failed' }))
      return NextResponse.json(err, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Sync failed', message: 'Sync failed' }, { status: 500 })
  }
}
