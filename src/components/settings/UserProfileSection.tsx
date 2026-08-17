'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { GameButton } from '@/components/game/GameButton'
import { CustomEmojiInput } from '@/components/common/CustomEmojiInput'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'

const PROFILE_EMOJI_PALETTE = [
  '🦊', '🐱', '🐶', '🦁', '🐼', '🐨', '🐵', '🐸',
  '🦉', '🦄', '🐉', '🤖', '👽', '👻', '🤡', '🥷',
  '👑', '🦸', '🦹', '🎮', '🎧', '🎸', '⚽', '🍕',
  '🌟', '🔥', '⚡', '💎', '🎯', '🎭',
]

export function UserProfileSection() {
  const username = usePreferencesStore(s => s.username)
  const userEmoji = usePreferencesStore(s => s.userEmoji)
  const setUsername = usePreferencesStore(s => s.setUsername)
  const setUserEmoji = usePreferencesStore(s => s.setUserEmoji)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(username)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(username)
  }, [username, editing])

  const handleSave = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== username) {
      setUsername(trimmed)
      haptic('success')
      playSound('vote')
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(username)
    setEditing(false)
    haptic('light')
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Mein Profil
        </h2>

        <div className="relative overflow-hidden rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
          {/* Decorative blob */}
          <motion.div
            className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative flex items-center gap-4">
            {/* Profile emoji */}
            <motion.button
              onClick={() => {
                haptic('medium')
                playSound('tap')
                setEmojiPickerOpen(true)
              }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl shadow-sm ring-2 ring-primary/20"
              aria-label="Profil-Emoji ändern"
            >
              {userEmoji}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border">
                <Pencil className="h-3 w-3" />
              </span>
            </motion.button>

            {/* Username */}
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSave()
                      else if (e.key === 'Escape') handleCancel()
                    }}
                    maxLength={20}
                    placeholder="Dein Name"
                    className="h-9"
                  />
                  <button
                    onClick={handleSave}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground"
                    aria-label="Speichern"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
                    aria-label="Abbrechen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    haptic('light')
                    setEditing(true)
                  }}
                  className="group flex w-full items-center gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-foreground">
                      {username || 'Tippen zum Festlegen'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {username ? 'Gerätebesitzer · 👑 Haupt-User' : 'Wird zu neuen Gruppen auto-hinzugefügt'}
                    </p>
                  </div>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Emoji Picker Dialog */}
      <Dialog open={emojiPickerOpen} onOpenChange={v => !v && setEmojiPickerOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profil-Emoji</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-2">
            {PROFILE_EMOJI_PALETTE.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => {
                  setUserEmoji(emoji)
                  haptic('success')
                  playSound('vote')
                  setEmojiPickerOpen(false)
                }}
                className={cn(
                  'flex h-12 items-center justify-center rounded-xl text-2xl transition-all',
                  userEmoji === emoji
                    ? 'bg-primary/15 ring-2 ring-primary'
                    : 'bg-muted hover:bg-muted/70',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Custom emoji input — type/paste a single emoji */}
          <div className="mt-3">
            <CustomEmojiInput
              currentEmoji={userEmoji}
              onSelect={(emoji) => {
                setUserEmoji(emoji)
                haptic('success')
                playSound('vote')
                setEmojiPickerOpen(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Suppress unused warning
void GameButton
