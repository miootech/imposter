/**
 * Sound (§44, §45)
 * ----------------
 * Hybrid sound system:
 *  - Default: Web Audio API synthesized tones (always available, offline-first)
 *  - Optional: lazy-loaded SFX from free online CDNs (CC0 sounds)
 *
 * Respects user preferences (can be disabled in Settings).
 *
 * Sounds are short, friendly, premium-feeling. No arcade bleeps (§44).
 */

import { loadPreferences } from '../../preferences/preferences'

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new AC()
    } catch {
      return null
    }
  }
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export type SoundType =
  | 'tap'           // soft click — button press
  | 'select'        // selection made
  | 'reveal'        // role revealed (soft chime)
  | 'vote'          // vote confirmed
  | 'tick'          // countdown tick (last 10s)
  | 'timerEnd'      // timer expired
  | 'eliminate'     // dramatic elimination
  | 'victory'       // celebratory
  | 'tie'           // neutral tie feedback
  | 'error'         // invalid action
  | 'chaos'         // chaos modifier revealed (dramatic)
  | 'explosion'     // hot potato bomb explosion
  | 'interrogate'   // russian interrogation trigger

interface ToneSpec {
  freq: number
  duration: number
  type: OscillatorType
  gain?: number
  delay?: number
}

const SOUND_PRESETS: Record<SoundType, ToneSpec[]> = {
  tap:       [{ freq: 660, duration: 0.04, type: 'sine', gain: 0.05 }],
  select:    [{ freq: 880, duration: 0.06, type: 'sine', gain: 0.08 }],
  reveal:    [{ freq: 523, duration: 0.08, type: 'sine', gain: 0.1 }, { freq: 784, duration: 0.12, type: 'sine', gain: 0.1, delay: 0.08 }],
  vote:      [{ freq: 659, duration: 0.08, type: 'sine', gain: 0.08 }, { freq: 988, duration: 0.12, type: 'sine', gain: 0.08, delay: 0.06 }],
  tick:      [{ freq: 1200, duration: 0.02, type: 'square', gain: 0.04 }],
  timerEnd:  [{ freq: 440, duration: 0.15, type: 'sawtooth', gain: 0.12 }, { freq: 330, duration: 0.3, type: 'sawtooth', gain: 0.12, delay: 0.15 }],
  eliminate: [{ freq: 220, duration: 0.2, type: 'sawtooth', gain: 0.12 }, { freq: 110, duration: 0.4, type: 'sine', gain: 0.12, delay: 0.2 }],
  victory:   [{ freq: 523, duration: 0.12, type: 'sine', gain: 0.12 }, { freq: 659, duration: 0.12, type: 'sine', gain: 0.12, delay: 0.12 }, { freq: 784, duration: 0.2, type: 'sine', gain: 0.12, delay: 0.24 }],
  tie:       [{ freq: 440, duration: 0.1, type: 'triangle', gain: 0.08 }, { freq: 440, duration: 0.1, type: 'triangle', gain: 0.08, delay: 0.15 }],
  error:     [{ freq: 200, duration: 0.15, type: 'square', gain: 0.1 }],
  chaos:     [{ freq: 150, duration: 0.1, type: 'sawtooth', gain: 0.15 }, { freq: 200, duration: 0.15, type: 'square', gain: 0.12, delay: 0.1 }, { freq: 100, duration: 0.3, type: 'sawtooth', gain: 0.12, delay: 0.25 }],
  explosion: [{ freq: 80, duration: 0.5, type: 'sawtooth', gain: 0.2 }, { freq: 50, duration: 0.4, type: 'square', gain: 0.15, delay: 0.05 }, { freq: 30, duration: 0.6, type: 'sawtooth', gain: 0.1, delay: 0.1 }],
  interrogate: [{ freq: 300, duration: 0.05, type: 'square', gain: 0.1 }, { freq: 600, duration: 0.05, type: 'square', gain: 0.1, delay: 0.07 }, { freq: 300, duration: 0.05, type: 'square', gain: 0.1, delay: 0.14 }],
}

/**
 * Optional online SFX URLs (CC0 / free-use sound effects).
 * Loaded lazily on first use; falls back to synthesized tones if offline or load fails.
 *
 * Sources:
 *  - Mixkit (free SFX, no attribution required for non-commercial)
 *  - Pixabay Sounds (CC0)
 *  - Kenney.nl (CC0 game assets)
 */
const ONLINE_SFX_URLS: Partial<Record<SoundType, string>> = {
  // Mixkit free SFX CDN
  victory: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  eliminate: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
  timerEnd: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  explosion: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
}

// Cache of fetched audio buffers (so we don't re-download)
const audioBufferCache = new Map<SoundType, AudioBuffer | null>()

async function fetchOnlineSfx(type: SoundType, ctx: AudioContext): Promise<AudioBuffer | null> {
  if (audioBufferCache.has(type)) return audioBufferCache.get(type) ?? null
  const url = ONLINE_SFX_URLS[type]
  if (!url) {
    audioBufferCache.set(type, null)
    return null
  }
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    audioBufferCache.set(type, audioBuffer)
    return audioBuffer
  } catch (e) {
    // Network failure / CORS / offline — fall back to synthesized
    audioBufferCache.set(type, null)
    return null
  }
}

function playSynthTones(ctx: AudioContext, tones: ToneSpec[]): void {
  for (const tone of tones) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = tone.type
    osc.frequency.value = tone.freq
    gain.gain.value = tone.gain ?? 0.1
    const start = ctx.currentTime + (tone.delay ?? 0)
    const end = start + tone.duration
    osc.connect(gain)
    gain.connect(ctx.destination)
    // Quick fade out to avoid clicks
    gain.gain.setValueAtTime(tone.gain ?? 0.1, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.start(start)
    osc.stop(end + 0.05)
  }
}

export function playSound(type: SoundType): void {
  if (typeof window === 'undefined') return
  const prefs = loadPreferences()
  if (!prefs.soundEnabled) return
  const ctx = getAudioCtx()
  if (!ctx) return

  const tones = SOUND_PRESETS[type]
  if (!tones) return

  // For sounds with online SFX, try to fetch & play; fall back to synth on failure
  if (ONLINE_SFX_URLS[type]) {
    fetchOnlineSfx(type, ctx).then((buffer) => {
      if (!buffer) {
        playSynthTones(ctx, tones)
        return
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.value = 0.5  // online SFX often louder than synth
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start()
    }).catch(() => {
      playSynthTones(ctx, tones)
    })
  } else {
    playSynthTones(ctx, tones)
  }
}

/**
 * Preload online SFX for a list of sound types.
 * Called on app startup / when sound is enabled, so the SFX are ready
 * when first needed. Non-blocking — failures silently fall back to synth.
 */
export async function preloadSfx(types: SoundType[] = ['victory', 'eliminate', 'timerEnd', 'explosion']): Promise<void> {
  const ctx = getAudioCtx()
  if (!ctx) return
  await Promise.all(types.map(t => fetchOnlineSfx(t, ctx)))
}

