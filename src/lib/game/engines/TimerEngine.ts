/**
 * TimerEngine (§47, §48)
 * ----------------------
 * Pure functions for timer duration lookup.
 *
 * Timer matrix (§47):
 *   9-12 players:  R1=3:00  R2=2:30  R3=2:00  R4=1:00  R5+=0:30
 *   6-8  players:  R1=2:30  R2=2:00  R3=1:30  R4=1:00  R5+=0:30
 *   3-5   players: R1=2:00  R2=1:30  R3=1:00  R4+=0:30
 *
 * Timer reduction rule (§48):
 *   Timer only reduces after a REAL elimination. On tie, timer stays unchanged.
 *   Implementation: the "effective round" for the timer matrix only advances
 *   when an elimination occurred.
 */

import { TIMER_MATRIX } from '../models'

type PlayerBucket = 'small' | 'medium' | 'large'

export function playerBucket(playerCount: number): PlayerBucket {
  if (playerCount <= 5) return 'small'
  if (playerCount <= 8) return 'medium'
  return 'large'
}

/**
 * Get the timer duration in seconds for a given player count and effective round.
 *
 * `effectiveRound` is the round index considering ONLY rounds that followed a
 * real elimination. Round 1 is always index 0. If round 2 was a tie, round 3
 * uses the same timer as round 2 would have used.
 *
 * The matrix has 4-5 entries per bucket. For rounds beyond the matrix, the last
 * value (30 seconds) is used.
 */
export function getTimerSeconds(playerCount: number, effectiveRound: number): number {
  const bucket = playerBucket(playerCount)
  const matrix = TIMER_MATRIX[bucket]
  const idx = Math.min(effectiveRound - 1, matrix.length - 1)
  return matrix[idx]
}

/**
 * Format seconds as M:SS.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Determine the next effective round number after a round ends.
 * If the round had a real elimination, advance. If tie, stay.
 */
export function nextEffectiveRound(
  currentEffectiveRound: number,
  hadElimination: boolean,
): number {
  return hadElimination ? currentEffectiveRound + 1 : currentEffectiveRound
}
