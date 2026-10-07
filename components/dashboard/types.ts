// ──────────────────────────────────────────────
// Shared types for Dashboard components
// ──────────────────────────────────────────────

export interface ProfileDataType {
  email: string
  studioName: string
  fullName: string
  location: string
  bio: string
  whatsapp: string
  website: string
  showBranding: boolean
  allowNotes: boolean
  sendReminders: boolean
}

export interface DrivePhotoItem {
  id: string
  fileName: string
  photoCode: string
  previewUrl: string | null
  sortOrder: number
  isSelected: boolean
}
