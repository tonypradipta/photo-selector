'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { profileSchema, settingsSchema } from '@/lib/validation'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { user, supabase }
}

// ──────────────────────────────────────────────
// SAVE PROFILE
// ──────────────────────────────────────────────
export async function saveProfile(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  try {
    const { user } = await getAuthenticatedUser()

    const raw = {
      studioName: formData.get('studioName') as string,
      fullName: formData.get('fullName') as string,
      location: formData.get('location') as string,
      bio: formData.get('bio') as string,
      whatsapp: formData.get('whatsapp') as string,
      website: formData.get('website') as string,
    }

    const parsed = profileSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message, success: false }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('profiles').upsert(
      {
        id: user.id,
        studio_name: parsed.data.studioName,
        full_name: parsed.data.fullName,
        location: parsed.data.location,
        bio: parsed.data.bio,
        whatsapp: parsed.data.whatsapp,
        website: parsed.data.website,
      },
      { onConflict: 'id' }
    )

    if (error) return { error: 'Failed to save profile. Please try again.', success: false }

    revalidatePath('/')
    return { error: '', success: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unexpected error.',
      success: false,
    }
  }
}

// ──────────────────────────────────────────────
// SAVE SETTINGS
// ──────────────────────────────────────────────
export async function saveSettings(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  try {
    const { user } = await getAuthenticatedUser()

    const raw = {
      showBranding: formData.get('showBranding') === 'true',
      allowNotes: formData.get('allowNotes') === 'true',
      sendReminders: formData.get('sendReminders') === 'true',
    }

    const parsed = settingsSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: 'Invalid settings.', success: false }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('profiles').upsert(
      {
        id: user.id,
        show_branding: parsed.data.showBranding,
        allow_notes: parsed.data.allowNotes,
        send_reminders: parsed.data.sendReminders,
      },
      { onConflict: 'id' }
    )

    if (error) return { error: 'Failed to save settings.', success: false }

    revalidatePath('/')
    return { error: '', success: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unexpected error.',
      success: false,
    }
  }
}

// ──────────────────────────────────────────────
// CHANGE PASSWORD
// ──────────────────────────────────────────────
export async function changePassword(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  try {
    const { supabase } = await getAuthenticatedUser()

    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!newPassword || newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters.', success: false }
    }
    if (newPassword !== confirmPassword) {
      return { error: 'Passwords do not match.', success: false }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message, success: false }

    return { error: '', success: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unexpected error.',
      success: false,
    }
  }
}

// ──────────────────────────────────────────────
// LOGOUT
// ──────────────────────────────────────────────
export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
