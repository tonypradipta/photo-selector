import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjects, getProfileData } from '@/lib/projects'
import { PhotoSelectorDashboard } from '@/components/photo-selector/dashboard'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [projects, profileData] = await Promise.all([
    getProjects(),
    getProfileData(),
  ])

  return (
    <PhotoSelectorDashboard
      initialProjects={projects}
      userEmail={user.email ?? ''}
      initialProfile={profileData}
    />
  )
}
