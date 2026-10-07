import { z } from 'zod'

// ──────────────────────────────────────────────
// Google Drive URL parsing
// ──────────────────────────────────────────────
export function extractDriveFolderId(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()

  // Pattern 1: /folders/ID (with or without /u/0/ etc, query params, etc)
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (folderMatch) return folderMatch[1]

  // Pattern 2: id=ID parameter (e.g. open?id=... or /folders?id=...)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idParamMatch) return idParamMatch[1]

  // Pattern 3: direct ID string (alphanumeric, underscores, hyphens)
  if (/^[a-zA-Z0-9_-]{10,100}$/.test(trimmed) && !trimmed.includes('http')) {
    return trimmed
  }

  return null
}

// ──────────────────────────────────────────────
// Photo code derivation from filename
// ──────────────────────────────────────────────
export function derivePhotoCode(fileName: string): string {
  // Remove extension: DSC_1024.JPG → DSC_1024
  return fileName.replace(/\.[^/.]+$/, '')
}

// ──────────────────────────────────────────────
// WhatsApp number normalization
// ──────────────────────────────────────────────
export function normalizeWhatsapp(raw: string): string {
  return raw.replace(/\D/g, '')
}

// ──────────────────────────────────────────────
// Project creation schema
// ──────────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  clientName: z.string().min(1, 'Client name is required').max(200),
  driveLink: z
    .string()
    .min(1, 'Google Drive folder link is required')
    .refine(
      (url) => extractDriveFolderId(url) !== null,
      'Must be a valid Google Drive folder URL (contains /folders/ID)'
    ),
  whatsapp: z.string().optional().transform((v) => (v ? normalizeWhatsapp(v) : '')),
  maxPhotos: z.coerce.number().int().min(1, 'Maximum photos must be at least 1'),
  protect: z.boolean().optional().default(false),
  password: z.string().optional(),
}).refine(
  (data) => !data.protect || (data.password && data.password.length >= 1),
  { message: 'Password is required when gallery protection is enabled', path: ['password'] }
)

export type CreateProjectInput = z.infer<typeof createProjectSchema>

// ──────────────────────────────────────────────
// Project update schema
// ──────────────────────────────────────────────
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  clientName: z.string().min(1).max(200).optional(),
  driveLink: z
    .string()
    .refine(
      (url) => extractDriveFolderId(url) !== null,
      'Must be a valid Google Drive folder URL'
    )
    .optional(),
  whatsapp: z.string().optional().transform((v) => (v ? normalizeWhatsapp(v) : '')),
  maxPhotos: z.coerce.number().int().min(1).optional(),
  protect: z.boolean().optional(),
  password: z.string().optional(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// ──────────────────────────────────────────────
// Profile schema
// ──────────────────────────────────────────────
export const profileSchema = z.object({
  studioName: z.string().max(200).optional(),
  fullName: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  whatsapp: z.string().optional().transform((v) => (v ? normalizeWhatsapp(v) : '')),
  website: z.string().url().or(z.literal('')).optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

// ──────────────────────────────────────────────
// Settings schema
// ──────────────────────────────────────────────
export const settingsSchema = z.object({
  showBranding: z.boolean(),
  allowNotes: z.boolean(),
  sendReminders: z.boolean(),
})

export type SettingsInput = z.infer<typeof settingsSchema>

// ──────────────────────────────────────────────
// Gallery password unlock schema
// ──────────────────────────────────────────────
export const galleryUnlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})
