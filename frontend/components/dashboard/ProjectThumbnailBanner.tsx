'use client'

// ──────────────────────────────────────────────
// Project Thumbnail Banner
// ──────────────────────────────────────────────
import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function resolveThumbnailSrc(src: string): string {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return `${apiBase}${src.startsWith('/') ? '' : '/'}${src}`
}

function ThumbnailImage({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  const [error, setError] = useState(false)
  const resolved = resolveThumbnailSrc(src)

  if (error || !resolved) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
        <ImageIcon size={18} className="text-slate-600" />
      </div>
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={className || 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'}
    />
  )
}

export function ProjectThumbnailBanner({ thumbnails, photoCount }: { thumbnails?: string[]; photoCount: number }) {
  if (!thumbnails || thumbnails.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] via-[#93c5fd] to-[#60a5fa]">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <ImageIcon size={26} className="text-white/80" />
          <span className="text-[12px] font-medium text-white/90">
            {photoCount > 0 ? `${photoCount} photos synced` : 'No photos synced yet'}
          </span>
        </div>
      </div>
    )
  }

  // 1 photo
  if (thumbnails.length === 1) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-900">
        <ThumbnailImage
          src={thumbnails[0]}
          alt="Thumbnail"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
      </div>
    )
  }

  // 2 photos
  if (thumbnails.length === 2) {
    return (
      <div className="relative grid h-full w-full grid-cols-2 gap-0.5 overflow-hidden bg-slate-900">
        {thumbnails.map((src, i) => (
          <div key={i} className="relative h-full w-full overflow-hidden">
            <ThumbnailImage
              src={src}
              alt={`Thumbnail ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
      </div>
    )
  }

  // 3 photos
  if (thumbnails.length === 3) {
    return (
      <div className="relative grid h-full w-full grid-cols-3 gap-0.5 overflow-hidden bg-slate-900">
        <div className="relative col-span-2 h-full w-full overflow-hidden">
          <ThumbnailImage
            src={thumbnails[0]}
            alt="Thumbnail 1"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="grid h-full w-full grid-rows-2 gap-0.5">
          {thumbnails.slice(1).map((src, i) => (
            <div key={i} className="relative h-full w-full overflow-hidden">
              <ThumbnailImage
                src={src}
                alt={`Thumbnail ${i + 2}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
      </div>
    )
  }

  // 4 photos
  return (
    <div className="relative grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-slate-900">
      {thumbnails.slice(0, 4).map((src, i) => (
        <div key={i} className="relative h-full w-full overflow-hidden">
          <ThumbnailImage
            src={src}
            alt={`Thumbnail ${i + 1}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ))}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/15 to-black/35" />
    </div>
  )
}
