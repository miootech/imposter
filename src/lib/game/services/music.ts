/**
 * Background Music Service
 * ------------------------
 * Plays looping background music tracks for different game phases.
 * Force-switches tracks on state change with smooth fade in/out.
 *
 * Tracks expected in /public/music/:
 *  - idle.mp3, discussion.mp3, voting.mp3, reveal.mp3
 *
 * Respects user preferences (can be disabled in Settings).
 */

import { loadPreferences } from '../../preferences/preferences'

export type MusicTrack = 'idle' | 'discussion' | 'voting' | 'reveal' | 'results'

const TRACK_PATHS: Record<MusicTrack, string> = {
  idle: '/music/idle.mp3',
  discussion: '/music/discussion.mp3',
  voting: '/music/voting.mp3',
  reveal: '/music/reveal.mp3',
  results: '/music/results.mp3',
}

const TARGET_VOLUME = 0.15

let currentAudio: HTMLAudioElement | null = null
let currentTrack: MusicTrack | null = null
let fadeInterval: ReturnType<typeof setInterval> | null = null

function clearFade() {
  if (fadeInterval) {
    clearInterval(fadeInterval)
    fadeInterval = null
  }
}

function fadeOutAndPlay(newTrack: MusicTrack) {
  if (!currentAudio || currentAudio.paused) {
    // Nothing playing — just start the new track
    startTrack(newTrack)
    return
  }

  clearFade()
  // Fade out current track over 500ms
  const fadeStep = currentAudio.volume / 10
  fadeInterval = setInterval(() => {
    if (!currentAudio) { clearFade(); startTrack(newTrack); return }
    currentAudio.volume = Math.max(0, currentAudio.volume - fadeStep)
    if (currentAudio.volume <= 0.01) {
      clearFade()
      currentAudio.pause()
      currentAudio.currentTime = 0
      startTrack(newTrack)
    }
  }, 50)
}

function startTrack(track: MusicTrack) {
  const audio = new Audio(TRACK_PATHS[track])
  audio.loop = true
  audio.volume = 0
  audio.play()
    .then(() => {
      // Fade in over 800ms
      clearFade()
      const fadeStep = TARGET_VOLUME / 10
      fadeInterval = setInterval(() => {
        if (!audio) { clearFade(); return }
        audio.volume = Math.min(TARGET_VOLUME, audio.volume + fadeStep)
        if (audio.volume >= TARGET_VOLUME) {
          audio.volume = TARGET_VOLUME
          clearFade()
        }
      }, 80)
      currentAudio = audio
      currentTrack = track
    })
    .catch(() => {
      // File missing or autoplay blocked — fail silently
    })
}

/**
 * Force-switch to a specific music track.
 * Smoothly fades out the current track and fades in the new one.
 */
export function playMusicTrack(track: MusicTrack): void {
  if (typeof window === 'undefined') return
  const prefs = loadPreferences()
  if (!prefs.bgMusicEnabled) return

  // Already playing this exact track? Don't restart
  if (currentTrack === track && currentAudio && !currentAudio.paused) return

  // Switch with fade
  fadeOutAndPlay(track)
}

/**
 * Stop all background music with a quick fade.
 */
export function stopMusic(): void {
  if (!currentAudio) { currentTrack = null; return }
  clearFade()
  const fadeStep = currentAudio.volume / 10
  const stopFade = setInterval(() => {
    if (!currentAudio) { clearInterval(stopFade); return }
    currentAudio.volume = Math.max(0, currentAudio.volume - fadeStep)
    if (currentAudio.volume <= 0.01) {
      clearInterval(stopFade)
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio = null
      currentTrack = null
    }
  }, 40)
}

/**
 * Check if a music track is currently playing.
 */
export function isMusicPlaying(track?: MusicTrack): boolean {
  if (!currentAudio || currentAudio.paused) return false
  if (track) return currentTrack === track
  return true
}
