/**
 * VotingEngine (§62, §63, §64, §65)
 * ---------------------------------
 * Pure functions for vote tallying and tie handling.
 *
 * Rules:
 *   - Self-voting is allowed (§62).
 *   - Each player casts exactly one vote (no double votes).
 *   - After voting, vote is hidden, no change possible (§63).
 *   - Tally: player with the most votes is eliminated (§66).
 *   - TIE: nobody eliminated (§65). No runoff, no random elimination.
 *
 * Pure: takes a vote map, returns the elimination result.
 */

export interface VoteTallyResult {
  /** Map of playerId → vote count, sorted ascending by votes */
  sortedCandidates: Array<{ playerId: string; votes: number }>
  /** The eliminated player ID, or null if tie / no votes */
  eliminatedPlayerId: string | null
  /** Whether the result was a tie */
  isTie: boolean
  /** Highest vote count */
  maxVotes: number
}

/**
 * Tally votes. Returns candidates sorted from LEAST to MOST votes (for progressive
 * reveal per §64). Tie => eliminatedPlayerId is null.
 *
 * Pure: deterministic given the vote map.
 */
export function tallyVotes(votes: Map<string, string>): VoteTallyResult {
  // Count votes per candidate
  const counts = new Map<string, number>()
  for (const target of votes.values()) {
    counts.set(target, (counts.get(target) ?? 0) + 1)
  }

  // Sort ascending by vote count, then by player ID for deterministic tie order
  const sortedCandidates = [...counts.entries()]
    .map(([playerId, votes]) => ({ playerId, votes }))
    .sort((a, b) => {
      if (a.votes !== b.votes) return a.votes - b.votes
      return a.playerId.localeCompare(b.playerId)
    })

  if (sortedCandidates.length === 0) {
    return {
      sortedCandidates: [],
      eliminatedPlayerId: null,
      isTie: false,
      maxVotes: 0,
    }
  }

  const maxVotes = sortedCandidates[sortedCandidates.length - 1].votes
  const topCandidates = sortedCandidates.filter(c => c.votes === maxVotes)

  return {
    sortedCandidates,
    eliminatedPlayerId: topCandidates.length === 1 ? topCandidates[0].playerId : null,
    isTie: topCandidates.length > 1,
    maxVotes,
  }
}

/**
 * Validate that a vote map is well-formed:
 *   - Each voter votes at most once (Map guarantees this)
 *   - Each vote target exists in the candidate set
 */
export function validateVotes(
  votes: Map<string, string>,
  candidateIds: readonly string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const candidateSet = new Set(candidateIds)
  for (const [voter, target] of votes.entries()) {
    if (!candidateSet.has(target)) {
      errors.push(`Vote target ${target} is not a valid candidate.`)
    }
    if (!candidateSet.has(voter)) {
      errors.push(`Voter ${voter} is not a valid candidate.`)
    }
  }
  return { valid: errors.length === 0, errors }
}
