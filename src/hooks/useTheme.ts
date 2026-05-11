import { useEffect } from 'react'
import { useStore } from '../store'
import type { Theme } from '../types'
import type { Locale } from '../i18n/locales'

const THEME_KEY = 'md-reader-theme'
const LOCALE_KEY = 'md-reader-locale'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useThemeInit(): void {
  const setTheme = useStore((s) => s.setTheme)
  const setLocale = useStore((s) => s.setLocale)

  useEffect(() => {
    chrome.storage.local.get([THEME_KEY, LOCALE_KEY], (result) => {
      const savedTheme = result[THEME_KEY] as Theme | undefined
      const theme = savedTheme ?? getSystemTheme()
      setTheme(theme)
      applyTheme(theme)

      const savedLocale = result[LOCALE_KEY] as Locale | undefined
      if (savedLocale) setLocale(savedLocale)
    })
  }, [setTheme, setLocale])
}

export function useThemeToggle(): () => void {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  return () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    chrome.storage.local.set({ [THEME_KEY]: next })
  }
}

export function useLocaleToggle(): () => void {
  const locale = useStore((s) => s.locale)
  const setLocale = useStore((s) => s.setLocale)

  return () => {
    const next: Locale = locale === 'zh' ? 'en' : 'zh'
    setLocale(next)
    chrome.storage.local.set({ [LOCALE_KEY]: next })
  }
}
