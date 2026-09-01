// Server-only module — NEVER import this in Client Components
// Uses Google Drive API v3 with a Service Account

import { google } from 'googleapis'

export interface DrivePhoto {
  id: string
  name: string
  mimeType: string
  modifiedTime: string | null
  thumbnailLink: string | null
  width: number | null
  height: number | null
}

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_PRIVATE_KEY
  const projectId = process.env.GOOGLE_PROJECT_ID

  if (!email || !rawKey || !projectId) {
    throw new Error(
      'Missing Google Service Account credentials. ' +
      'Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_PROJECT_ID.'
    )
  }

  // Support escaped newlines and strip surrounding quotes in environment variables
  const privateKey = rawKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
      project_id: projectId,
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  return google.drive({ version: 'v3', auth })
}

/**
 * List all image files inside a Google Drive folder.
 * The folder must be shared with the Service Account email.
 * Handles pagination automatically.
 */
export async function listDrivePhotos(folderId: string): Promise<DrivePhoto[]> {
  const drive = getDriveClient()
  const photos: DrivePhoto[] = []
  let pageToken: string | undefined = undefined

  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, thumbnailLink, imageMediaMetadata)',
      pageSize: 200,
      pageToken,
    })

    const files = res.data.files ?? []
    for (const file of files) {
      if (!file.id || !file.name) continue
      photos.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType ?? 'image/jpeg',
        modifiedTime: file.modifiedTime ?? null,
        thumbnailLink: file.thumbnailLink ?? null,
        width: (file.imageMediaMetadata as { width?: number } | undefined)?.width ?? null,
        height: (file.imageMediaMetadata as { height?: number } | undefined)?.height ?? null,
      })
    }

    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  return photos
}

/**
 * Download a file from Google Drive and return as a Buffer.
 * Used as fallback when thumbnail is unavailable.
 */
export async function downloadDriveFile(fileId: string): Promise<Buffer> {
  const drive = getDriveClient()
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )
  return Buffer.from(res.data as ArrayBuffer)
}

/**
 * Check if a folder is accessible to the service account.
 */
export async function checkFolderAccess(folderId: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    const drive = getDriveClient()
    await drive.files.get({
      fileId: folderId,
      fields: 'id, name',
    })
    return { accessible: true }
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string }
    if (error.code === 404) {
      return { accessible: false, error: 'Folder not found. Check the folder ID or share it with the Service Account.' }
    }
    if (error.code === 403) {
      return { accessible: false, error: 'Access denied. Share the folder with your Google Service Account email.' }
    }
    return { accessible: false, error: String(error.message ?? 'Unknown Google Drive error') }
  }
}
