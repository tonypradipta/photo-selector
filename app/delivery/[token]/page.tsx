import { ClientDeliveryGallery } from '@/components/delivery/ClientDeliveryGallery'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Download Foto Hasil Edit - Perumda Photo',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return <ClientDeliveryGallery token={token} />
}
