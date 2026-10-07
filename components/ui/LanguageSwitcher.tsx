'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export function LanguageSwitcher({
  variant = 'button',
  className = '',
}: {
  variant?: 'button' | 'dropdown' | 'toggle'
  className?: string
}) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (variant === 'toggle') {
    return (
      <div className={`inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('id')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
            language === 'id'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Bahasa Indonesia"
        >
          <span className="text-[11px]">🇮🇩</span>
          <span>ID</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
            language === 'en'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="English"
        >
          <span className="text-[11px]">🇬🇧</span>
          <span>EN</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pilih Bahasa / Select Language"
        className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 px-3 text-xs font-bold hover:bg-brand-soft hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-xs transition-all motion-reduce:transition-none motion-reduce:hover:transform-none"
      >
        <Globe size={14} className="text-blue-600" />
        <span className="font-bold uppercase tracking-wider">{language}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-blue-500/10 backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Pilih Bahasa / Language
          </div>
          <button
            type="button"
            onClick={() => {
              setLanguage('id')
              setIsOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all ${
              language === 'id'
                ? 'bg-brand-soft text-blue-700 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🇮🇩</span>
              <span>Bahasa Indonesia</span>
            </div>
            {language === 'id' && <Check size={14} className="text-blue-600" strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setLanguage('en')
              setIsOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-brand-soft text-blue-700 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🇬🇧</span>
              <span>English</span>
            </div>
            {language === 'en' && <Check size={14} className="text-blue-600" strokeWidth={2.5} />}
          </button>
        </div>
      )}
    </div>
  )
}
