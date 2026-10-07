import { redirect } from 'next/navigation'
import { auth } from '@/lib/api-client'
import { getProjects, getProfileData } from '@/lib/projects'
import { PhotoSelectorDashboard } from '@/components/dashboard'

export default async function Home() {
  const user = await auth.getUser()

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
