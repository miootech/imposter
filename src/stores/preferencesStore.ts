/**
 * Preferences Store (Zustand)
 * ---------------------------
 * Reactive access to user preferences. Persists to localStorage on every change.
 * Hydrates from localStorage on first client render.
 */

import { create } from 'zustand'
import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type Preferences,
} from '../lib/preferences/preferences'
import type { GameMode, RoleId } from '../lib/game/models'

interface PreferencesState extends Preferences {
  hydrated: boolean
  hydrate: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setSoundEnabled: (enabled: boolean) => void
  setHapticsEnabled: (enabled: boolean) => void
  setRoleEmoji: (role: RoleId, emoji: string) => void
  setLastUsedGroupId: (id: string | null) => void
  setLastUsedCategoryId: (id: string | null) => void
  setLastUsedMode: (mode: GameMode) => void
  setUsername: (name: string) => void
  setUserEmoji: (emoji: string) => void
  setGradientTimerBg: (enabled: boolean) => void
  reset: () => void
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...defaultPreferences(),
  hydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return
    const prefs = loadPreferences()
    set({ ...prefs, hydrated: true })
  },

  setTheme: (theme) => {
    set({ theme })
    savePreferences(get())
  },
  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled })
    savePreferences(get())
  },
  setHapticsEnabled: (enabled) => {
    set({ hapticsEnabled: enabled })
    savePreferences(get())
  },
  setRoleEmoji: (role, emoji) => {
    set({
      roleEmojis: { ...get().roleEmojis, [role]: emoji },
    })
    savePreferences(get())
  },
  setLastUsedGroupId: (id) => {
    set({ lastUsedGroupId: id })
    savePreferences(get())
  },
  setLastUsedCategoryId: (id) => {
    set({ lastUsedCategoryId: id })
    savePreferences(get())
  },
  setLastUsedMode: (mode) => {
    set({ lastUsedMode: mode })
    savePreferences(get())
  },
  setUsername: (name) => {
    set({ username: name })
    savePreferences(get())
  },
  setUserEmoji: (emoji) => {
    set({ userEmoji: emoji })
    savePreferences(get())
  },
  setGradientTimerBg: (enabled) => {
    set({ gradientTimerBg: enabled })
    savePreferences(get())
  },
  reset: () => {
    const def = defaultPreferences()
    set({ ...def, hydrated: true })
    savePreferences(get())
  },
}))
