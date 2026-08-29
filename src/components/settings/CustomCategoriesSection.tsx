'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, X, Check, ChevronDown } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameButton } from '@/components/game/GameButton'
import { EmojiPickerModal } from '@/components/common/EmojiPickerModal'
import {
  listCustomCategories,
  createCustomCategory,
  deleteCustomCategory,
  updateCustomCategory,
  canCreateCustomCategory,
  MAX_CUSTOM_CATS,
  MAX_WORDS,
} from '@/lib/repositories/categoryRepository'
import { CATALOG } from '@/lib/game/content/catalog'
import type { CustomCategoryRecord } from '@/lib/db/localDb'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { IconRenderer } from '@/components/common/IconRenderer'
import { cn } from '@/lib/utils'

interface WordEntry {
  text: string
  hint: string
}

export function CustomCategoriesSection() {
  const [customCats, setCustomCats] = useState<CustomCategoryRecord[]>([])
  const [canCreate, setCanCreate] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [allCatsOpen, setAllCatsOpen] = useState(false)

  const refresh = async () => {
    const [cats, allowed] = await Promise.all([listCustomCategories(), canCreateCustomCategory()])
    setCustomCats(cats)
    setCanCreate(allowed)
  }

  useEffect(() => { refresh() }, [])

  const handleCreate = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteCustomCategory(id)
    haptic('warning')
    await refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Kategorien
        </h2>
        {canCreate && (
          <GameButton
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { haptic('medium'); handleCreate() }}
          >
            Neu
          </GameButton>
        )}
      </div>

      {/* Pill button to view all categories */}
      <button
        onClick={() => { haptic('light'); setAllCatsOpen(true) }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-muted py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70"
      >
        <span>Alle Kategorien ansehen</span>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{CATALOG.length}</span>
      </button>

      {/* Custom categories */}
      {customCats.length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">
            Eigene ({customCats.length}/{MAX_CUSTOM_CATS})
          </p>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {customCats.map(cat => (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-muted text-xl">
                    <IconRenderer icon={cat.icon} size={40} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{cat.displayName}</p>
                    <p className="text-xs text-muted-foreground">{cat.words.length} Wörter</p>
                  </div>
                  <button
                    onClick={() => { haptic('light'); handleEdit(cat.id) }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { haptic('warning'); handleDelete(cat.id) }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {!canCreate && customCats.length === 0 && (
        <p className="text-xs text-muted-foreground">Maximum erreicht ({MAX_CUSTOM_CATS}).</p>
      )}

      {/* All Categories Modal */}
      <AllCategoriesModal open={allCatsOpen} onClose={() => setAllCatsOpen(false)} />

      {/* Category Editor Modal */}
      <CategoryEditorModal
        open={editorOpen}
        editingId={editingId}
        existingCats={customCats}
        onClose={() => setEditorOpen(false)}
        onSaved={async () => { setEditorOpen(false); await refresh() }}
      />
    </motion.div>
  )
}

// ============================================================================
// All Categories Modal — shows 50 built-in categories as color-coded cards
// ============================================================================

function AllCategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Color palette for category cards — cycles through role-themed colors
  const CARD_COLORS = [
    'var(--crewmate)', 'var(--detective)', 'var(--impostor)', 'var(--accomplice)', 'var(--jester)',
  ]

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alle Kategorien</DialogTitle>
          <DialogDescription>{CATALOG.length} vorinstallierte Kategorien</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2.5 py-2">
          {CATALOG.map((cat, idx) => {
            const color = CARD_COLORS[idx % CARD_COLORS.length]
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 8%, var(--card))`,
                  border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                  <IconRenderer icon={cat.icon} size={48} />
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">{cat.displayName}</p>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                  {cat.words.length} Wörter
                </span>
              </motion.div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Category Editor Modal
// ============================================================================

function CategoryEditorModal({
  open,
  editingId,
  existingCats,
  onClose,
  onSaved,
}: {
  open: boolean
  editingId: string | null
  existingCats: CustomCategoryRecord[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [words, setWords] = useState<WordEntry[]>([{ text: '', hint: '' }])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Load existing category for editing
  useEffect(() => {
    if (open && editingId) {
      const cat = existingCats.find(c => c.id === editingId)
      if (cat) {
        setName(cat.displayName)
        setIcon(cat.icon)
        setWords(cat.words.map(w => ({ text: w.text, hint: w.hint })))
      }
    } else if (open && !editingId) {
      setName('')
      setIcon('📦')
      setWords([{ text: '', hint: '' }])
    }
    setError(null)
  }, [open, editingId, existingCats])

  const addWord = () => {
    if (words.length >= MAX_WORDS) {
      setError(`Maximal ${MAX_WORDS} Wörter.`)
      return
    }
    setWords([...words, { text: '', hint: '' }])
  }

  const updateWord = (idx: number, field: 'text' | 'hint', value: string) => {
    const next = [...words]
    next[idx] = { ...next[idx], [field]: value }
    setWords(next)
  }

  const removeWord = (idx: number) => {
    if (words.length <= 1) return
    setWords(words.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setError(null)
    if (!name.trim()) { setError('Bitte einen Namen eingeben.'); return }
    const validWords = words.filter(w => w.text.trim() && w.hint.trim())
    if (validWords.length < 5) { setError('Mindestens 5 Wörter mit Hinweisen nötig.'); return }

    setSaving(true)
    try {
      if (editingId) {
        await updateCustomCategory(editingId, { displayName: name.trim(), icon, words: validWords })
      } else {
        await createCustomCategory(name.trim(), icon, validWords)
      }
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
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Kategorie bearbeiten' : 'Neue Kategorie'}</DialogTitle>
            <DialogDescription>
              Bis zu {MAX_WORDS} Wörter. Jedes Wort braucht einen Hinweis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name + Icon — big touch targets */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { haptic('light'); setIconPickerOpen(true) }}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-3xl ring-1 ring-border"
              >
                <IconRenderer icon={icon} size={56} />
              </button>
              <div className="flex-1">
                <Label htmlFor="cat-name" className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Name</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="z.B. Meine Freunde"
                  maxLength={32}
                  className="h-12 text-base"
                />
              </div>
            </div>

            {/* Words list — bigger, cleaner cards */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Wörter ({words.length}/{MAX_WORDS})
                </span>
                <button
                  onClick={() => { haptic('light'); addWord() }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <Plus className="h-4 w-4" /> Hinzufügen
                </button>
              </div>
              <div className="max-h-[45vh] space-y-2.5 overflow-y-auto pr-1">
                {words.map((w, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2"
                  >
                    <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={w.text}
                        onChange={e => updateWord(idx, 'text', e.target.value)}
                        placeholder={`Wort ${idx + 1}`}
                        maxLength={32}
                        className="h-11 text-base"
                      />
                      <Input
                        value={w.hint}
                        onChange={e => updateWord(idx, 'hint', e.target.value)}
                        placeholder="Hinweis für dieses Wort"
                        maxLength={32}
                        className="h-11 text-base"
                      />
                    </div>
                    {words.length > 1 && (
                      <button
                        onClick={() => { haptic('light'); removeWord(idx) }}
                        className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-3">
            <GameButton variant="ghost" fullWidth onClick={onClose}>Abbrechen</GameButton>
            <GameButton fullWidth onClick={handleSave} loading={saving}>Speichern</GameButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Icon picker for category */}
      <EmojiPickerModal
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        title="Kategorie-Icon"
        currentEmoji={icon}
        onSelect={(emoji) => setIcon(emoji)}
      />
    </>
  )
}
