'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Pencil, X, Trophy, Skull, Heart, Gamepad2 } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { GameButton } from '@/components/game/GameButton'
import { RoleIcon } from '@/components/game/RoleBadge'
import { AnimatedNumber } from '@/components/game/AnimatedNumber'
import { ExpandablePlayerCard } from '@/components/groups/ExpandablePlayerCard'
import {
  getGroup,
  addPlayer,
  removePlayer,
  updatePlayer,
  updateGroup,
  deleteGroup,
  isMainUser,
} from '@/lib/repositories/groupRepository'
import type { Group, Player } from '@/lib/game/models'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'

export function GroupDetailScreen() {
  const groupId = useGameStore(s => s.selectedGroupId)
  const openGroupDetail = useGameStore(s => s.openGroupDetail)
  const startSetup = useGameStore(s => s.startSetup)
  const mainUsername = usePreferencesStore(s => s.username)
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editGroupOpen, setEditGroupOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const refresh = useCallback(async () => {
    if (!groupId) return
    try {
      const g = await getGroup(groupId)
      setGroup(g)
    } catch (e) {
      console.error('Failed to load group', e)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Gruppe nicht gefunden.</p>
        <GameButton onClick={() => openGroupDetail(null)}>Zurück</GameButton>
      </div>
    )
  }

  // Group games played = MAX of player games played (since all players play together each game)
  // Using sum would give N× too much (e.g. 6 players × 1 game = 6)
  const totalGames = group.players.reduce((s, p) => Math.max(s, p.stats.gamesPlayed), 0)
  const canPlay = group.players.length >= 3

  return (
    <div className="relative min-h-screen pb-32">
      {/* Hero header */}
      <div
        className="relative overflow-hidden px-5 pb-8 pt-12"
        style={{
          background: `linear-gradient(135deg, ${group.color}25, transparent 60%)`,
        }}
      >
        <div className="mx-auto max-w-md">
          <button
            onClick={() => {
              haptic('light')
              openGroupDetail(null)
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>

          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-sm"
              style={{ backgroundColor: `${group.color}30` }}
            >
              {group.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold text-foreground">{group.name}</h1>
              <p className="text-sm text-muted-foreground">
                {group.players.length} Spieler · {totalGames} Spiele
              </p>
            </div>
            <button
              onClick={() => setEditGroupOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
              aria-label="Gruppe bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5">
        {/* Quick stats summary */}
        {group.players.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 grid grid-cols-3 gap-3"
          >
            <StatCard
              icon={<Trophy className="h-4 w-4" />}
              label="Punkte"
              value={group.players.reduce((s, p) => s + p.points, 0)}
              color="var(--primary)"
            />
            <StatCard
              icon={<Gamepad2 className="h-4 w-4" />}
              label="Spiele"
              value={totalGames}
              color="var(--detective)"
            />
            <StatCard
              icon={<Skull className="h-4 w-4" />}
              label="Eliminiert"
              value={group.players.reduce((s, p) => s + p.stats.eliminations, 0)}
              color="var(--impostor)"
            />
          </motion.div>
        )}

        {/* Players list */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Spieler</h2>
          {group.players.length < 12 && (
            <GameButton
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setAddDialogOpen(true)}
            >
              Hinzufügen
            </GameButton>
          )}
        </div>

        {group.players.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <div className="mb-3 text-4xl">👥</div>
            <p className="font-semibold text-foreground">Keine Spieler</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Füge mindestens 3 Spieler hinzu, um zu spielen.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {group.players.map((player, idx) => (
                <ExpandablePlayerCard
                  key={player.id}
                  player={player}
                  index={idx}
                  isMain={isMainUser(player.displayName, mainUsername)}
                  onRemove={async () => {
                    await removePlayer(group.id, player.id)
                    haptic('warning')
                    await refresh()
                  }}
                  onRename={async (newName) => {
                    await updatePlayer(group.id, player.id, { displayName: newName })
                    await refresh()
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}


        {/* Danger zone */}
        <div className="mt-8 border-t border-border pt-6">
          <GameButton
            variant="ghost"
            size="sm"
            className="text-destructive"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setDeleteOpen(true)}
          >
            Gruppe löschen
          </GameButton>
        </div>
      </div>

      {/* Floating play button — sits above the bottom nav (which is ~64px tall + safe area) */}
      {canPlay && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed left-0 right-0 z-20 px-5"
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto max-w-md">
            <GameButton
              size="lg"
              fullWidth
              hapticPattern="heavy"
              soundType="select"
              onClick={() => {
                startSetup()
              }}
              className="shadow-2xl"
            >
              Spiel starten
            </GameButton>
          </div>
        </motion.div>
      )}

      {/* Add Player Dialog */}
      <AddPlayerDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={async (name) => {
          await addPlayer(group.id, name)
          haptic('success')
          playSound('vote')
          setAddDialogOpen(false)
          await refresh()
        }}
        existingNames={group.players.map(p => p.displayName.toLowerCase())}
      />

      {/* Edit Group Dialog */}
      <EditGroupDialog
        open={editGroupOpen}
        group={group}
        onClose={() => setEditGroupOpen(false)}
        onSaved={async () => {
          setEditGroupOpen(false)
          await refresh()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gruppe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das löscht „{group.name}&quot; und alle zugehörigen Spieler und Statistiken.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await deleteGroup(group.id)
                openGroupDetail(null)
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border"
    >
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        <AnimatedNumber value={value} />
      </div>
    </motion.div>
  )
}

function AddPlayerDialog({
  open,
  onClose,
  onAdd,
  existingNames,
}: {
  open: boolean
  onClose: () => void
  onAdd: (name: string) => void
  existingNames: string[]
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setError(null)
    }
  }, [open])

  const handleAdd = () => {
    if (!name.trim()) {
      setError('Bitte einen Namen eingeben.')
      return
    }
    if (existingNames.includes(name.trim().toLowerCase())) {
      setError('Ein Spieler mit diesem Namen existiert bereits.')
      return
    }
    onAdd(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Spieler hinzufügen</DialogTitle>
          <DialogDescription>
            Spieler können jederzeit hinzugefügt werden.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="player-name">Anzeigename</Label>
            <Input
              id="player-name"
              autoFocus
              placeholder="z.B. Ali, Mara, Jonas"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
              }}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-3">
          <GameButton variant="ghost" fullWidth onClick={onClose}>
            Abbrechen
          </GameButton>
          <GameButton fullWidth onClick={handleAdd}>
            Hinzufügen
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditGroupDialog({
  open,
  group,
  onClose,
  onSaved,
}: {
  open: boolean
  group: Group
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(group.name)
  const [icon, setIcon] = useState(group.icon)
  const [color, setColor] = useState(group.color)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(group.name)
      setIcon(group.icon)
      setColor(group.color)
    }
  }, [open, group])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateGroup(group.id, { name: name.trim(), icon, color })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gruppe bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-group-name">Name</Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={32}
            />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {availableIcons().map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'flex h-12 items-center justify-center rounded-xl text-2xl',
                    icon === ic ? 'bg-primary/15 ring-2 ring-primary' : 'bg-muted',
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Farbe</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => {
                const c = paletteColor(i)
                return (
                  <button
                    key={i}
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-9 w-9 rounded-full',
                      color === c && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                    )}
                    style={{ backgroundColor: c }}
                  />
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <GameButton variant="ghost" fullWidth onClick={onClose}>
            Abbrechen
          </GameButton>
          <GameButton fullWidth onClick={handleSave} loading={saving}>
            Speichern
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Local helpers to avoid circular import with repository
function availableIcons() {
  return ['🎲', '👥', '🎯', '🌟', '🎭', '🍕', '🎮', '🦊', '⚡', '🏆']
}
function paletteColor(i: number) {
  const palette = [
    '#E07A5F', '#457B9D', '#81B29A', '#F2CC8F', '#A8DADC',
    '#B8C0EC', '#F4A261', '#E76F51', '#2A9D8F', '#9B5DE5',
  ]
  return palette[i % palette.length]
}

// Silence unused warnings
void Heart
