/**
 * API Client - Komunikasi dengan Laravel Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_URL = `${API_BASE}/api`

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function setAuthToken(token?: string) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem('auth_token', token)
    document.cookie = `auth_token=${token}; path=/; max-age=2592000; SameSite=Lax`
  } else {
    localStorage.removeItem('auth_token')
    document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax'
  }
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('auth_token')
    if (local) return local

    const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'))
    return match ? match[2] : null
  }

  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    return cookieStore.get('auth_token')?.value || null
  } catch {
    return null
  }
}

async function csrfCookie() {
  try {
    await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' })
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const allCookies = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
      if (allCookies && !headers['Cookie']) {
        headers['Cookie'] = allCookies
      }
    } catch {}
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    let msg = `HTTP ${response.status}`
    try {
      const d = await response.json()
      msg = d.message || d.error || msg
    } catch {}
    throw new ApiError(response.status, msg)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

// AUTH
export const auth = {
  async login(email: string, password: string) {
    await csrfCookie()
    const res = await request<{ user: UserData; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res.token) {
      setAuthToken(res.token)
    }
    return res
  },
  async logout() {
    try {
      return await request('/auth/logout', { method: 'POST' })
    } finally {
      setAuthToken(undefined)
    }
  },
  async register(data: {
    name: string
    email: string
    password: string
    password_confirmation: string
    full_name?: string
    studio_name?: string
  }) {
    await csrfCookie()
    const res = await request<{ user: UserData; token?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (res.token) {
      setAuthToken(res.token)
    }
    return res
  },
  async getUser(): Promise<UserData | null> {
    try { return await request<UserData>('/auth/user') }
    catch { return null }
  },
  async forgotPassword(email: string) {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  async resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  async updatePassword(data: { password: string; password_confirmation: string }) {
    return request<{ message: string }>('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// PROJECTS
export const projects = {
  async list() { return request<{ data: ProjectData[] }>('/projects') },
  async get(id: string | number) { return request<{ data: ProjectData }>(`/projects/${id}`) },
  async create(data: CreateProjectPayload) {
    return request<{ data: ProjectData; message: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  async update(id: string | number, data: Partial<CreateProjectPayload>) {
    return request<{ data: ProjectData; message: string }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  async delete(id: string | number) {
    return request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' })
  },
  async lock(id: string | number, locked: boolean) {
    return request<{ message: string }>(`/projects/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ locked }),
    })
  },
  async sync(id: string | number) {
    return request<{ success: boolean; synced: number; deactivated: number }>(`/projects/${id}/sync`, {
      method: 'POST',
    })
  },
  async photos(id: string | number) {
    return request<{ project: ProjectData; photos: PhotoData[]; totalCount: number; selectedCount: number }>(`/projects/${id}/photos`)
  },
}

// SELECTED PHOTOS (FOTO TERPILIH)
export const selectedPhotos = {
  async list(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.search) query.set('search', params.search)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request<{ data: ProjectData[]; counts: Record<string, number> }>(`/selected-photos${qs}`)
  },
  async get(id: string | number) {
    return request<{ project: ProjectData; selections: SelectionItem[]; total_selected: number; total_with_notes: number }>(`/selected-photos/${id}`)
  },
  async startEditing(id: string | number) {
    return request<{ message: string; project: ProjectData }>(`/selected-photos/${id}/start-editing`, {
      method: 'POST',
    })
  },
  getExportUrl(id: string | number, format: 'txt' | 'csv' | 'json' = 'txt', delimiter: 'comma' | 'space' | 'newline' = 'comma') {
    return `${API_URL}/selected-photos/${id}/export?format=${format}&delimiter=${delimiter}`
  },
}

// DELIVERY (DELIVERY WORKSPACE)
export const deliveries = {
  async list(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.search) query.set('search', params.search)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request<{ data: ProjectData[]; counts: Record<string, number> }>(`/deliveries${qs}`)
  },
  async get(id: string | number) {
    return request<{
      project: ProjectData
      sync_status: SyncStatusData | null
      active_delivery: DeliveryData | null
      deliveries: DeliveryData[]
      whatsapp_message: string | null
    }>(`/deliveries/${id}`)
  },
  async updateFolder(id: string | number, folderUrl: string) {
    return request<{ message: string; project: ProjectData }>(`/deliveries/${id}/folder`, {
      method: 'PUT',
      body: JSON.stringify({ edited_folder_url: folderUrl }),
    })
  },
  async sync(id: string | number) {
    return request<{ message: string; data: SyncStatusData; project: ProjectData }>(`/deliveries/${id}/sync`, {
      method: 'POST',
    })
  },
  async getSyncStatus(id: string | number) {
    return request<{ data: SyncStatusData }>(`/deliveries/${id}/sync-status`)
  },
  async send(id: string | number, data: { pin?: string; expires_in_days?: number; notes?: string; force?: boolean }) {
    return request<{
      message: string
      delivery: DeliveryData
      delivery_url: string
      whatsapp_message: string
      project: ProjectData
    }>(`/deliveries/${id}/send`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  async revoke(id: string | number, deliveryId: string | number) {
    return request<{ message: string; delivery: DeliveryData }>(`/deliveries/${id}/revoke/${deliveryId}`, {
      method: 'POST',
    })
  },
  async complete(id: string | number) {
    return request<{ message: string; project: ProjectData }>(`/deliveries/${id}/complete`, {
      method: 'POST',
    })
  },
}

// PUBLIC DELIVERY (Client Download Portal)
export const publicDelivery = {
  async getByToken(token: string) {
    return request<PublicDeliveryResponse>(`/delivery/${token}`)
  },
  async verifyPin(token: string, pin: string) {
    return request<{ message: string; unlocked: boolean }>(`/delivery/${token}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    })
  },
}

// PROFILE
export const profile = {
  async get() { return request<{ data: ProfileData }>('/profile') },
  async update(data: Partial<ProfileData>) {
    return request<{ data: ProfileData; message: string }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  async updateSettings(data: { show_branding?: boolean; allow_notes?: boolean; send_reminders?: boolean }) {
    return request<{ message: string }>('/profile/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// GALLERY (client-facing selection)
export const gallery = {
  async getByToken(token: string) {
    return request<{ project: GalleryProject; photos: GalleryPhoto[]; totalCount: number; selectedCount: number }>(`/gallery/${token}`)
  },
  async unlock(token: string, password: string) {
    return request<{ message: string }>(`/gallery/${token}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
  },
  async toggleSelection(token: string, photoId: string | number, selected: boolean) {
    return request<{ success: boolean; selectionCount: number }>(`/gallery/${token}/selection`, {
      method: 'POST',
      body: JSON.stringify({ photo_id: photoId, selected }),
    })
  },
  async submit(token: string, data: { selected_photo_ids: (string | number)[]; client_note?: string }) {
    return request<{ message: string }>(`/gallery/${token}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// Types
export interface UserData { id: number; name: string; email: string; studio_name?: string }
export interface CreateProjectPayload {
  name: string; client_name: string; drive_folder_url: string
  whatsapp_number?: string; max_photos: number; password?: string; protect?: boolean
}
export interface ProjectData {
  id: string | number
  name: string
  client_name: string
  status: string // draft, active, selected, editing, delivered, completed
  client_token: string
  drive_folder_url: string
  drive_folder_id: string
  edited_folder_url?: string | null
  edited_folder_id?: string | null
  whatsapp_number: string | null
  max_photos: number
  selection_locked: boolean
  last_synced_at: string | null
  completed_at: string | null
  editing_started_at?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  photo_count: number
  selected_count: number
  edited_count?: number
  matched_count?: number
  preview_thumbnails?: string[]
  edited_preview_thumbnails?: string[]
  latest_delivery?: DeliveryData | null
}

export interface SelectionItem {
  id: number
  photo_id: number
  client_note?: string | null
  edit_status: string
  created_at: string
  photo?: {
    id: number
    file_name: string
    photo_code: string
    drive_thumbnail_url?: string | null
    drive_file_id: string
  } | null
  edited_photo?: {
    id: number
    file_name: string
    drive_thumbnail_url?: string | null
    drive_file_id: string
  } | null
}

export interface SyncStatusData {
  project_id: number
  synced_at: string | null
  total_selected: number
  total_edited: number
  matched_count: number
  missing_count: number
  extra_count: number
  match_rate: number
  matched: Array<{
    selection_id: number
    photo_id: number
    raw_name: string
    edited_name: string
    normalized_name: string
    drive_file_id: string
    mime_type?: string | null
    thumbnail_url?: string | null
    size_bytes?: number | null
    client_note?: string | null
  }>
  missing: Array<{
    selection_id: number
    photo_id: number
    raw_name: string
    normalized_name: string
    thumbnail_url?: string | null
    client_note?: string | null
  }>
  extra: Array<{
    drive_file_id: string
    edited_name: string
    normalized_name: string
    thumbnail_url?: string | null
    size_bytes?: number | null
  }>
}

export interface DeliveryData {
  id: number
  project_id: number
  delivery_token: string
  status: string
  download_count: number
  last_downloaded_at?: string | null
  expires_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  edited_photos?: Array<{
    id: number
    file_name: string
    drive_thumbnail_url?: string | null
    size_bytes?: number | null
  }>
}

export interface PublicDeliveryResponse {
  delivery: {
    token: string
    is_pin_protected: boolean
    unlocked: boolean
    download_count?: number
    last_downloaded_at?: string | null
    expires_at?: string | null
    notes?: string | null
    zip_download_url?: string
  }
  project: {
    name: string
    client_name: string
    studio_name?: string
    whatsapp_number?: string | null
  }
  photos?: Array<{
    id: number
    file_name: string
    thumbnail_url?: string | null
    mime_type?: string | null
    size_bytes?: number | null
    download_url: string
  }>
  total_photos?: number
}

export interface PhotoData {
  id: string | number; file_name: string; photo_code: string
  preview_url: string | null; sort_order: number; is_selected: boolean
}
export interface ProfileData {
  email?: string; studio_name: string; full_name: string
  location: string; bio: string; whatsapp: string; website: string
  show_branding: boolean; allow_notes: boolean; send_reminders: boolean
}
export interface GalleryProject {
  id: string; name: string; client_name: string
  max_photos: number; status: string; selection_locked: boolean; is_password_protected: boolean
}
export interface GalleryPhoto {
  id: string; file_name: string; photo_code: string
  preview_url: string | null; sort_order: number; is_selected: boolean
}

export function getPhotoPreviewUrl(photoId: string | number, directUrl?: string | null): string {
  if (directUrl && directUrl.trim() !== '') {
    return directUrl
  }
  return `${API_BASE}/api/photos/${photoId}/preview`
}

export function getPhotoFallbackUrl(photoId: string | number): string {
  return `${API_BASE}/api/photos/${photoId}/preview`
}
