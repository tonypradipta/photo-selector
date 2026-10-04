// ──────────────────────────────────────────────
// Shared types for Gallery components
// ──────────────────────────────────────────────

export interface GalleryPhoto {
  id: string
  fileName: string
  photoCode: string
  previewUrl: string | null
  sortOrder: number
}

export interface GalleryProject {
  id: string
  name: string
  clientName: string
  studioName: string | null
  maxPhotos: number
  isLocked: boolean
  isCompleted: boolean
  whatsappNumber: string | null
  isPasswordProtected: boolean
}
