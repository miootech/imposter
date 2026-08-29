'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupEditorDialog } from '@/components/groups/GroupEditorDialog'
import { listGroups, canCreateGroup } from '@/lib/repositories/groupRepository'
import type { Group } from '@/lib/game/models'
import { MAX_GROUPS } from '@/lib/game/models'
import { GameButton } from '@/components/game/GameButton'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

export function GroupsScreen() {
  const openGroupDetail = useGameStore(s => s.openGroupDetail)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [canCreate, setCanCreate] = useState(true)

  const refresh = async () => {
    try {
      const [all, allowed] = await Promise.all([listGroups(), canCreateGroup()])
      setGroups(all)
      setCanCreate(allowed)
    } catch (e) {
      console.error('Failed to load groups', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="relative min-h-screen pb-24">
      <div className="mx-auto max-w-md px-5 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-end justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Gruppen</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {groups.length} / {MAX_GROUPS} erstellt
            </p>
          </div>
          {canCreate && (
            <GameButton
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                haptic('medium')
                playSound('select')
                setEditorOpen(true)
              }}
            >
              Neu
            </GameButton>
          )}
        </motion.div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-5xl">
              🎲
            </div>
            <h3 className="text-lg font-bold text-foreground">Noch keine Gruppe?</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Erstelle deine erste Gruppe und starte direkt eine Runde.
            </p>
            <div className="mt-6">
              <GameButton
                size="lg"
                leftIcon={<Plus className="h-5 w-5" />}
                onClick={() => setEditorOpen(true)}
              >
                Gruppe erstellen
              </GameButton>
            </div>
          </motion.div>
        )}

        {!loading && groups.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {groups.map(g => (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <GroupCard group={g} onClick={() => openGroupDetail(g.id)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!canCreate && groups.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-warning/10 p-4 text-sm text-warning-foreground">
            <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
            <p>Maximal {MAX_GROUPS} Gruppen erreicht. Lösche eine Gruppe, um eine neue zu erstellen.</p>
          </div>
        )}
      </div>

      <GroupEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={async () => {
          setEditorOpen(false)
          await refresh()
        }}
      />
    </div>
  )
}
