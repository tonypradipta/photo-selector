import { NextRequest, NextResponse } from 'next/server'
import { laravelAuthHeaders, laravelBaseUrl } from '@/lib/laravel-proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const response = await fetch(`${laravelBaseUrl()}/api/projects/${projectId}/photos`, {
      headers: laravelAuthHeaders(request),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error' }))
      return NextResponse.json(err, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (err) {
    console.error('Error fetching project photos:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
