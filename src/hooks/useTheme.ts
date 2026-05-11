import { useEffect } from 'react'
import { useStore } from '../store'
import type { Theme } from '../types'

const STORAGE_KEY = 'md-reader-theme'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useThemeInit(): void {
  const setTheme = useStore((s) => s.setTheme)

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const saved = result[STORAGE_KEY] as Theme | undefined
      const theme = saved ?? getSystemTheme()
      setTheme(theme)
      applyTheme(theme)
    })
  }, [setTheme])
}

export function useThemeToggle(): () => void {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  return () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    chrome.storage.local.set({ [STORAGE_KEY]: next })
  }
}
