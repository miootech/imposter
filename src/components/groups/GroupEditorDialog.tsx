'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameButton } from '@/components/game/GameButton'
import { createGroup, availableGroupIcons, pickGroupColor, countGroups } from '@/lib/repositories/groupRepository'
import { MAX_GROUPS } from '@/lib/game/models'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { EmojiPickerModal } from '@/components/common/EmojiPickerModal'
import { IconRenderer } from '@/components/common/IconRenderer'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GroupEditorDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function GroupEditorDialog({ open, onClose, onSaved }: GroupEditorDialogProps) {
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState(availableGroupIcons()[0])
  const [selectedColor, setSelectedColor] = useState(pickGroupColor(0))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const username = usePreferencesStore(s => s.username)
  const userEmoji = usePreferencesStore(s => s.userEmoji)

  useEffect(() => {
    if (open) {
      // Pre-fill with next available color based on count
      countGroups().then(c => {
        setSelectedIcon(availableGroupIcons()[c % availableGroupIcons().length])
        setSelectedColor(pickGroupColor(c))
      })
      setName('')
      setError(null)
    }
  }, [open])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Bitte einen Namen eingeben.')
      haptic('error')
      return
    }
    setSaving(true)
    try {
      // Pass main user (if set) so the repository auto-adds them as first player
      const mainUser = username.trim()
        ? { username: username.trim(), userEmoji }
        : null
      await createGroup(name.trim(), selectedIcon, selectedColor, mainUser)
      haptic('success')
      playSound('vote')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler.')
      haptic('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Gruppe</DialogTitle>
          <DialogDescription>
            Erstelle eine Gruppe, um Spieler und Punkte zu verwalten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">Gruppenname</Label>
            <Input
              id="group-name"
              autoFocus
              placeholder="z.B. Freunde, WG, Schulklasse"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={32}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { haptic('light'); setIconPickerOpen(true) }}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-2xl ring-1 ring-border"
              >
                <IconRenderer icon={selectedIcon} size={56} />
              </button>
              <p className="text-xs text-muted-foreground">Tippen zum Auswählen</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Farbe</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => {
                const color = pickGroupColor(i)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      haptic('light')
                      setSelectedColor(color)
                    }}
                    className={cn(
                      'h-9 w-9 rounded-full transition-all',
                      selectedColor === color && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                    )}
                    style={{ backgroundColor: color }}
                  />
                )
              })}
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </div>

        <div className="flex gap-3">
          <GameButton variant="ghost" fullWidth onClick={onClose}>
            Abbrechen
          </GameButton>
          <GameButton fullWidth onClick={handleSave} loading={saving}>
            Erstellen
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>

    {/* Group Icon Picker — same 200+ emoji palette + image upload */}
    <EmojiPickerModal
      open={iconPickerOpen}
      onClose={() => setIconPickerOpen(false)}
      title="Gruppen-Icon"
      currentEmoji={selectedIcon}
      onSelect={(emoji) => setSelectedIcon(emoji)}
    />
    </>
  )
}

void MAX_GROUPS
