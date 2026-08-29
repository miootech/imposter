'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ImagePlus, Upload, ChevronDown } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { GameButton } from '@/components/game/GameButton'
import { IconRenderer } from '@/components/common/IconRenderer'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'

interface EmojiPickerModalProps {
  open: boolean
  onClose: () => void
  title: string
  currentEmoji: string
  onSelect: (emoji: string) => void
  allowImage?: boolean
}

// Organized emoji categories — collapsible sections
const EMOJI_CATEGORIES: Array<{ name: string; icon: string; emojis: string[] }> = [
  {
    name: 'Tiere', icon: '🦊',
    emojis: ['🦊', '🐱', '🐶', '🦁', '🐼', '🐨', '🐵', '🐸', '🦉', '🦄', '🐉', '🐲', '🦖', '🐙', '🦋', '🐢', '🐧', '🦅', '🐺', '🦝', '🐰', '🐭', '🐹', '🐻', '🐨', '🦘', '🦔', '🐝', '🐛', '🦗'],
  },
  {
    name: 'Essen & Trinken', icon: '🍕',
    emojis: ['🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍪', '🎂', '🍰', '🍦', '🍫', '🍬', '🍭', '🍿', '🥨', '🥐', '☕', '🍵', '🥤', '🍺', '🍷', '🥂', '🍹', '🧃', '🍎', '🍌', '🍓', '🍉', '🥑', '🥕'],
  },
  {
    name: 'Aktivitäten & Sport', icon: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥊', '🎯', '🎮', '🎲', '🃏', '🎼', '🎸', '🎤', '🎧', '🎹', '🥁', '🎬', '🎭', '🎨', '🖌️', '📸', '✍️', '📚', '🧩', '♟️', '🪁'],
  },
  {
    name: 'Natur & Wetter', icon: '🌸',
    emojis: ['🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌿', '🌲', '🌳', '🌴', '🌵', '🍁', '🌊', '⚡', '🔥', '❄️', '🌈', '☀️', '🌙', '⭐', '✨', '💫', '🌪️', '🌋', '🏔️', '⛰️', '🏝️', '🏖️', '🌅', '🌄'],
  },
  {
    name: 'Objekte & Symbole', icon: '💎',
    emojis: ['💎', '👑', '🔮', '🪄', '⚔️', '🛡️', '🏹', '🎯', '🏆', '🥇', '🔑', '🔒', '💡', '🔦', '⏰', '💣', '🧨', '🎁', '🎈', '🎉', '🎊', '💌', '💬', '💭', '🔔', '🎶', '✅', '❌', '❤️', '💔'],
  },
  {
    name: 'Gesichter & Menschen', icon: '😎',
    emojis: ['😎', '🤩', '🥳', '😅', '😂', '🤣', '😭', '😡', '🤔', '🤨', '😮', '😱', '🤡', '👻', '💀', '👽', '🤖', '🦸', '🦹', '🧙', '🧛', '🧟', '🧚', '🧜', '🥷', '👮', '👷', '🤴', '👸', '🦸‍♂️'],
  },
  {
    name: 'Fahrzeuge & Reise', icon: '🚗',
    emojis: ['🚗', '✈️', '🚂', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛵', '🏍️', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚌', '🗺️', '🧭', '📍', '🏕️', '⛺', '🗼', '🗽', '🏰', '🏟️', '🎡', '🎢', '🛣️'],
  },
]

export function EmojiPickerModal({
  open, onClose, title, currentEmoji, onSelect, allowImage = true,
}: EmojiPickerModalProps) {
  const [draft, setDraft] = useState(currentEmoji)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const savedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setDraft(currentEmoji)
      setExpandedCategory(null)
      savedRef.current = false
    }
    prevOpenRef.current = open
  }, [open])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // No max size limit — keep original resolution but cap at 1024 for storage
        const canvas = document.createElement('canvas')
        const maxCap = 1024
        let { width, height } = img
        if (width > height) { if (width > maxCap) { height = (height * maxCap) / width; width = maxCap } }
        else { if (height > maxCap) { width = (width * maxCap) / height; height = maxCap } }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setDraft(dataUrl)
        haptic('success')
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!draft) return
    savedRef.current = true
    haptic('success')
    playSound('vote')
    onSelect(draft)
    onClose()
  }

  const handleClose = () => {
    if (!savedRef.current && draft && draft !== currentEmoji) onSelect(draft)
    savedRef.current = false
    onClose()
  }

  const isImage = typeof draft === 'string' && draft.startsWith('data:image')

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>

        {/* Live preview */}
        <div className="flex flex-col items-center py-3">
          <motion.div
            key={draft}
            initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-primary/10 shadow-sm ring-1 ring-primary/20"
          >
            <IconRenderer icon={draft || '?'} size="text-5xl" rounded />
          </motion.div>
          <p className="mt-2 text-xs text-muted-foreground">Aktuelle Auswahl</p>
        </div>

        {/* Expandable emoji categories */}
        <div className="space-y-1.5">
          {EMOJI_CATEGORIES.map((cat) => {
            const isExpanded = expandedCategory === cat.name
            return (
              <div key={cat.name} className="overflow-hidden rounded-xl bg-muted/30">
                <button
                  onClick={() => {
                    haptic('light')
                    setExpandedCategory(isExpanded ? null : cat.name)
                  }}
                  className="flex w-full items-center gap-2 p-2.5 text-left"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-7 gap-1 p-2 pt-0">
                        {cat.emojis.map((emoji, i) => (
                          <motion.button
                            key={`${emoji}-${i}`}
                            onClick={() => { haptic('light'); setDraft(emoji) }}
                            whileTap={{ scale: 0.88 }}
                            className={cn(
                              'flex aspect-square items-center justify-center rounded-lg text-xl transition-all',
                              draft === emoji ? 'bg-primary/15 ring-2 ring-primary' : 'hover:bg-muted',
                            )}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Image upload */}
        {allowImage && (
          <div className="mt-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              whileTap={{ scale: 0.96 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Upload className="h-4 w-4" />
              Bild hochladen
            </motion.button>
          </div>
        )}

        {/* Save button */}
        <div className="mt-4 flex justify-center">
          <GameButton
            size="lg"
            hapticPattern="heavy"
            soundType="vote"
            onClick={handleSave}
            disabled={!draft}
            className="min-w-[180px] rounded-full"
            leftIcon={<Check className="h-4 w-4" />}
          >
            Speichern
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
