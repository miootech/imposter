'use client'

import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { GameButton } from '@/components/game/GameButton'
import { GroupCard } from '@/components/groups/GroupCard'
import { listGroups } from '@/lib/repositories/groupRepository'
import { useEffect, useState } from 'react'
import type { Group } from '@/lib/game/models'

function getGreeting(): { text: string; sub: string } {
  const hour = new Date().getHours()
  if (hour < 6) return { text: 'Noch wach?', sub: 'Das wird gefährlich. 💀' }
  if (hour < 11) return { text: 'Guten Morgen!', sub: 'Bereit für Chaos? 👀' }
  if (hour < 14) return { text: 'Mahlzeit!', sub: 'Wer wird heute erwischt?' }
  if (hour < 18) return { text: 'Zeit für eine Runde?', sub: 'Nur eine Runde… versprochen.' }
  if (hour < 22) return { text: 'Guten Abend.', sub: 'Mal sehen, wer heute lügt. 👀' }
  return { text: 'Noch wach?', sub: 'Das wird gefährlich. 💀' }
}

export function HomeScreen() {
  const greeting = useMemo(getGreeting, [])
  const startSetup = useGameStore(s => s.startSetup)
  const setActiveTab = useGameStore(s => s.setActiveTab)
  const openGroupDetail = useGameStore(s => s.openGroupDetail)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const all = await listGroups()
      setGroups(all)
    } catch (e) {
      console.error('Failed to load groups', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const startGameFlow = () => {
    if (groups.length === 0) {
      setActiveTab('groups')
    } else {
      startSetup()
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-24">
      {/* Decorative blobs */}
      <div className="blob-bg" />

      <div className="relative z-10 mx-auto max-w-md px-5 pt-12">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-sm font-medium text-muted-foreground">{greeting.text}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {greeting.sub}
          </h1>
        </motion.div>

        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-10"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 shadow-xl shadow-primary/10 ring-1 ring-primary/10">
            <motion.div
              className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Pass & Play
              </div>
              <h2 className="text-2xl font-bold leading-tight text-foreground">
                Spiel starten
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                3–12 Spieler. Ein Smartphone. Geheime Rollen.
              </p>
              <div className="mt-5">
                <GameButton
                  size="lg"
                  hapticPattern="heavy"
                  soundType="select"
                  onClick={startGameFlow}
                  rightIcon={<ChevronRight className="h-5 w-5" />}
                >
                  Los geht&apos;s
                </GameButton>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick groups access */}
        {groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4 flex items-center justify-between"
          >
            <h3 className="text-lg font-bold text-foreground">Deine Gruppen</h3>
            <button
              onClick={() => setActiveTab('groups')}
              className="text-sm font-medium text-primary"
            >
              Alle ansehen
            </button>
          </motion.div>
        )}

        <div className="space-y-3">
          {!loading && groups.length === 0 && (
            <motion.button
              onClick={() => setActiveTab('groups')}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/50 p-5 text-left transition-colors hover:border-primary/50 hover:bg-card"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Erste Gruppe erstellen</p>
                <p className="text-sm text-muted-foreground">
                  Noch keine Gruppe? Starte hier.
                </p>
              </div>
            </motion.button>
          )}

          {groups.slice(0, 3).map(g => (
            <GroupCard
              key={g.id}
              group={g}
              onClick={() => openGroupDetail(g.id)}
              compact
            />
          ))}
        </div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center text-xs text-muted-foreground"
        >
          100% offline · keine Accounts · keine Cloud
        </motion.p>
      </div>
    </div>
  )
}
