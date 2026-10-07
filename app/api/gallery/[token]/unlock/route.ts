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
    const response = await fetch(`${apiBase}/api/gallery/${token}/unlock`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    const nextResponse = NextResponse.json(data, { status: response.ok ? 200 : response.status })
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie)
    }
    return nextResponse
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
