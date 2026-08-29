'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Type } from 'lucide-react'
import { haptic } from '@/lib/game/services/haptics'
import { cn } from '@/lib/utils'

interface CustomEmojiInputProps {
  /** Currently selected emoji (from palette or custom) */
  currentEmoji: string
  /** Called when the user enters a valid single emoji/character */
  onSelect: (emoji: string) => void
}

/**
 * CustomEmojiInput
 * ----------------
 * Allows the user to type/paste a single emoji as their custom icon.
 * Validates that the input is exactly 1 grapheme cluster (handles surrogate
 * pairs and ZWJ emoji sequences like 🏳️‍🌈).
 *
 * Used in:
 *   - UserProfileSection (profile emoji)
 *   - SettingsScreen role icon pickers
 */
export function CustomEmojiInput({ currentEmoji, onSelect }: CustomEmojiInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Bitte ein Zeichen eingeben.')
      return
    }
    // Use Intl.Segmenter to count grapheme clusters (handles emoji + ZWJ)
    let count = 1
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
      count = [...segmenter.segment(trimmed)].length
    } catch {
      // Fallback: use Array.from for surrogate pairs (less accurate but works for most emoji)
      count = Array.from(trimmed).length
    }

    if (count !== 1) {
      setError('Nur ein einzelnes Zeichen erlaubt.')
      haptic('error')
      return
    }

    setError(null)
    haptic('success')
    onSelect(trimmed)
    setValue('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-muted/40 p-3 ring-1 ring-border"
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Type className="h-3 w-3" />
        Eigenes Emoji
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => {
            setValue(e.target.value)
            setError(null)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="z.B. 🦄"
          maxLength={8}
          className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ lineHeight: 1 }}
        />
        <button
          onClick={handleSubmit}
          className={cn(
            'rounded-xl px-4 text-sm font-semibold transition-colors',
            value.trim()
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          Setzen
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {currentEmoji && !error && (
        <p className="mt-2 text-xs text-muted-foreground">
          Aktuell: <span className="text-lg">{currentEmoji}</span>
        </p>
      )}
    </motion.div>
  )
}
