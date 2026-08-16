'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, Check } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CATALOG } from '@/lib/game/content/catalog'
import type { Category } from '@/lib/game/models'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'

interface CategorySelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId: string | null
  onSelect: (categoryId: string) => void
}

/**
 * CategorySelectorSheet
 * ---------------------
 * Bottom-sheet category picker that scales gracefully to 100+ categories.
 *
 * Design rationale:
 *  - List layout (not grid): each row shows icon + name + word preview,
 *    making it easy to scan even with many categories
 *  - Search filters by name AND by word text (e.g. typing "Pizza" finds "Essen")
 *  - Staggered fade-in per item (capped delay so 100 items don't take forever)
 *  - Selected category: ring + check badge, animated in with spring
 *  - Drag handle + slide-up animation (shadcn Sheet handles platform specifics)
 *  - Recent / popular section could be added later (architecture supports it)
 */
export function CategorySelectorSheet({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: CategorySelectorSheetProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset search when sheet closes; focus input when it opens
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setQuery(''), 200)
      return () => clearTimeout(t)
    }
    // Delay focus to avoid conflict with sheet animation
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CATALOG
    return CATALOG.filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      // Search inside word texts too — typing "Pizza" should find "Essen"
      c.words.some(w => w.text.toLowerCase().includes(q)),
    )
  }, [query])

  const handleSelect = (cat: Category) => {
    haptic('success')
    playSound('select')
    onSelect(cat.id)
    // Close sheet with small delay so user sees the selection feedback
    setTimeout(() => onOpenChange(false), 200)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[700px] p-0 flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-5 pb-2">
          <SheetTitle className="text-xl">Kategorie wählen</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {filtered.length} von {CATALOG.length} Kategorien
          </SheetDescription>
        </SheetHeader>

        {/* Search bar */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Suche Name oder Wort…"
              className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                onClick={() => {
                  haptic('light')
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Suche löschen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 pt-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-4xl opacity-50">🔍</div>
              <p className="font-semibold text-foreground">Keine Treffer</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Versuch&apos;s mit einem anderen Suchbegriff.
              </p>
            </div>
          ) : (
            <motion.div layout className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {filtered.map((cat, idx) => {
                  const isSelected = cat.id === selectedId
                  return (
                    <motion.button
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{
                        delay: Math.min(idx * 0.025, 0.25),
                        type: 'spring',
                        stiffness: 320,
                        damping: 28,
                      }}
                      onClick={() => handleSelect(cat)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 ring-2 ring-primary shadow-sm'
                          : 'bg-card ring-1 ring-border hover:bg-muted/40',
                      )}
                    >
                      {/* Icon tile */}
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors',
                          isSelected ? 'bg-primary/15' : 'bg-muted/60',
                        )}
                      >
                        {cat.icon}
                      </div>

                      {/* Name + word preview */}
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'truncate font-semibold',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}>
                          {cat.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {cat.words.map(w => w.text).join(' · ')}
                        </p>
                      </div>

                      {/* Word count */}
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {cat.words.length}
                      </span>

                      {/* Selected check */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
