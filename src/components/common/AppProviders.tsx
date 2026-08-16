'use client'

import { ThemeProvider } from 'next-themes'
import { useEffect } from 'react'
import { usePreferencesStore } from '@/stores/preferencesStore'

/**
 * ThemeBridge: keeps next-themes in sync with our preferences store.
 * The preferences store is the source of truth (persists to localStorage),
 * next-themes just toggles the `dark` class on <html>.
 */
export function ThemeBridge() {
  const theme = usePreferencesStore(s => s.theme)
  const hydrate = usePreferencesStore(s => s.hydrate)
  const setTheme = usePreferencesStore(s => s.setTheme)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Sync preferences store theme → next-themes (via DOM class)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  // Allow next-themes-style attribute switching without actually using next-themes'
  // internal state — we drive everything from our store.
  // Expose a no-op setter so consumers can still call setTheme.
  void setTheme

  return null
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
      <ThemeBridge />
      {children}
    </ThemeProvider>
  )
}
