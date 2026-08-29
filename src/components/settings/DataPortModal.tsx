'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, Copy, Check, FileJson } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { GameButton } from '@/components/game/GameButton'
import { getDb } from '@/lib/db/localDb'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'

type Mode = 'export' | 'import'

interface DataPortModalProps {
  open: boolean
  mode: Mode
  onClose: () => void
  /** Called after successful import (so caller can refresh stats) */
  onImported?: () => void
}

/**
 * DataPortModal
 * -------------
 * Modal for exporting/importing all app data (groups, players, stats, results) as JSON.
 *  - Export: shows pretty-printed JSON in a textarea, with Copy-to-Clipboard button
 *  - Import: textarea where user pastes JSON, validates, replaces DB on confirm
 *
 * Used in SettingsScreen footer.
 */
export function DataPortModal({ open, mode, onClose, onImported }: DataPortModalProps) {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // When opening in export mode, fetch all data from DB
  useEffect(() => {
    if (open && mode === 'export') {
      exportData().then(json => setJsonText(json)).catch(() => setJsonText('// Export failed'))
    } else if (open && mode === 'import') {
      setJsonText('')
      setError(null)
    }
  }, [open, mode])

  async function exportData(): Promise<string> {
    try {
      const db = getDb()
      const [groups, results] = await Promise.all([
        db.groups.toArray(),
        db.results.toArray(),
      ])
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        groups,
        results,
      }
      return JSON.stringify(data, null, 2)
    } catch (e) {
      return `// Export failed: ${e instanceof Error ? e.message : 'unknown error'}`
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopied(true)
      haptic('success')
      playSound('vote')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Konnte nicht in die Zwischenablage kopieren.')
    }
  }

  async function handleImport() {
    setError(null)
    setLoading(true)
    try {
      const data = JSON.parse(jsonText)
      if (!data.groups || !Array.isArray(data.groups)) {
        throw new Error('Ungültiges Format: "groups" fehlt oder ist kein Array.')
      }
      const db = getDb()
      // Replace all data
      await db.groups.clear()
      await db.results.clear()
      await db.groups.bulkPut(data.groups)
      if (data.results && Array.isArray(data.results)) {
        await db.results.bulkPut(data.results)
      }
      haptic('success')
      playSound('victory')
      onImported?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ungültiges JSON.')
      haptic('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'export' ? (
              <>
                <Download className="h-5 w-5" />
                Daten exportieren
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Daten importieren
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export'
              ? 'Kopiere deine Spieldaten als JSON.'
              : 'Füge exportiertes JSON ein, um Daten wiederherzustellen.'}
          </DialogDescription>
        </DialogHeader>

        {/* JSON textarea */}
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <FileJson className="h-3 w-3" />
              JSON-Daten
            </span>
            {mode === 'export' && (
              <button
                onClick={handleCopy}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  copied
                    ? 'bg-success text-success-foreground'
                    : 'bg-primary text-primary-foreground',
                )}
                style={copied ? { backgroundColor: 'var(--success)' } : undefined}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Kopiert!' : 'Kopieren'}
              </button>
            )}
          </div>
          <textarea
            value={jsonText}
            onChange={e => {
              setJsonText(e.target.value)
              setError(null)
            }}
            readOnly={mode === 'export'}
            placeholder={mode === 'import' ? '{"groups":[...], "results":[...]}' : ''}
            className="h-64 w-full resize-none rounded-xl border border-border bg-card p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            spellCheck={false}
          />
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

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <GameButton variant="ghost" fullWidth onClick={onClose}>
            Abbrechen
          </GameButton>
          {mode === 'import' && (
            <GameButton
              fullWidth
              onClick={handleImport}
              loading={loading}
              disabled={!jsonText.trim()}
            >
              Importieren
            </GameButton>
          )}
        </div>

        {mode === 'export' && (
          <p className="text-center text-xs text-muted-foreground">
            Tipp: Speichere das JSON in einer Datei, um später wiederherzustellen.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
