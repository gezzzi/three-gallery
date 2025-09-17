'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Language, getTranslation, TranslationKeys } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ja')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // ローカルストレージから言語設定を読み込み
    const stored = localStorage.getItem('display_settings')
    if (stored) {
      try {
        const settings = JSON.parse(stored)
        if (settings.language === 'ja' || settings.language === 'en') {
          setLanguage(settings.language)
        }
      } catch (e) {
        console.error('Failed to parse display settings:', e)
      }
    }
  }, [])

  const updateLanguage = (newLang: Language) => {
    setLanguage(newLang)
    // ローカルストレージに保存
    const stored = localStorage.getItem('display_settings')
    const settings = stored ? JSON.parse(stored) : {}
    settings.language = newLang
    localStorage.setItem('display_settings', JSON.stringify(settings))
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: updateLanguage,
        t: getTranslation(language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // デフォルト値を返す（プロバイダーがない場合）
    return {
      language: 'ja' as Language,
      setLanguage: () => {},
      t: getTranslation('ja'),
    }
  }
  return context
}