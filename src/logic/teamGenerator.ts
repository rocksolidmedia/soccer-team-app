// src/logic/teamGenerator.ts
import type { Player } from "../types"
import { signatureForTeams } from "./history"

export type TeamResult = {
  teamA: Player[]
  teamB: Player[]
  totalA: number
  totalB: number
  avgA: number
  avgB: number
}

type BestCandidate = TeamResult & { score: number; signature: string }

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ✅ TEAM LOGIC — Optimal split with “stacking penalty”
// Implements:
// 1) pick best possible
// 2) avoid last matchup
// 3) if multiple equally-good ways to achieve best non-repeat (true tie), pick random
export function buildOptimalTeams(
  playersToSplit: Player[],
  recentSignatures: string[]
): { result: TeamResult; signature: string } {
  const n = playersToSplit.length
  const big = Math.ceil(n / 2)

  function sumTopK(team: Player[], k: number) {
    const top = [...team].sort((a, b) => b.skill - a.skill).slice(0, k)
    return top.reduce((s, p) => s + p.skill, 0)
  }

  function solveForTeamASize(teamASize: number): BestCandidate {
    const totalAll = playersToSplit.reduce((s, p) => s + p.skill, 0)
    const chosen: number[] = []
    const candidates: BestCandidate[] = []

    function evaluateChoice() {
      const teamA = chosen.map((i) => playersToSplit[i])
      const chosenSet = new Set(chosen)
      const teamB = playersToSplit.filter((_, idx) => !chosenSet.has(idx))

      const totalA = teamA.reduce((s, p) => s + p.skill, 0)
      const totalB = totalAll - totalA

      const avgA = totalA / teamA.length
      const avgB = totalB / teamB.length

      const totalDiff = Math.abs(totalA - totalB)
      const avgDiff = Math.abs(avgA - avgB)

      // --- Anti-stacking controls (soccer-feel)
      const ELITE = 85
      const eliteA = teamA.filter((p) => p.skill >= ELITE).length
      const eliteB = teamB.filter((p) => p.skill >= ELITE).length
      const eliteCountDiff = Math.abs(eliteA - eliteB)

      const eliteStackPenalty =
        (eliteA >= 3 ? (eliteA - 2) * 2 : 0) + (eliteB >= 3 ? (eliteB - 2) * 2 : 0)

      const topK = 4
      const topDiff = Math.abs(sumTopK(teamA, topK) - sumTopK(teamB, topK))

      const score =
        totalDiff * 10000 +
        avgDiff * 100 +
        topDiff * 50 +
        eliteCountDiff * 1200 +
        eliteStackPenalty * 3000

      const sig = signatureForTeams(teamA, teamB)

      candidates.push({ teamA, teamB, totalA, totalB, avgA, avgB, score, signature: sig })
    }

    // Symmetry cut for even splits: force index 0 into Team A so we don’t test mirror duplicates
    const mustIncludeZero = teamASize === n - teamASize
    const startIndex = mustIncludeZero ? 1 : 0
    if (mustIncludeZero) chosen.push(0)

    function backtrack(start: number, left: number) {
      if (left === 0) {
        evaluateChoice()
        return
      }
      for (let i = start; i <= n - left; i++) {
        chosen.push(i)
        backtrack(i + 1, left - 1)
        chosen.pop()
      }
    }

    const remaining = teamASize - (mustIncludeZero ? 1 : 0)
    backtrack(startIndex, remaining)
    if (mustIncludeZero) chosen.pop()

    candidates.sort((a, b) => a.score - b.score)

    const bestNonRecent =
      candidates.find((c) => !recentSignatures.includes(c.signature)) ?? candidates[0]

    if (!bestNonRecent) {
      return {
        teamA: [],
        teamB: [],
        totalA: 0,
        totalB: 0,
        avgA: 0,
        avgB: 0,
        score: Number.POSITIVE_INFINITY,
        signature: "EMPTY",
      }
    }

    const sameScoreNonRecent = candidates.filter(
      (c) => c.score === bestNonRecent.score && !recentSignatures.includes(c.signature)
    )

    if (sameScoreNonRecent.length > 1) {
      return pickRandom(sameScoreNonRecent)
    }

    return bestNonRecent
  }

  // EVEN n => equal teams
  if (n % 2 === 0) {
    const best = solveForTeamASize(n / 2)
    return {
      result: {
        teamA: best.teamA,
        teamB: best.teamB,
        totalA: best.totalA,
        totalB: best.totalB,
        avgA: best.avgA,
        avgB: best.avgB,
      },
      signature: best.signature,
    }
  }

  // ODD n => try A as bigger, then enforce “weaker team gets extra”
  let best = solveForTeamASize(big)

  const aIsBigger = best.teamA.length > best.teamB.length
  const aIsWeaker = best.avgA < best.avgB

  if (aIsBigger !== aIsWeaker) {
    best = {
      ...best,
      teamA: best.teamB,
      teamB: best.teamA,
      totalA: best.totalB,
      totalB: best.totalA,
      avgA: best.avgB,
      avgB: best.avgA,
      signature: signatureForTeams(best.teamB, best.teamA),
    }
  }

  return {
    result: {
      teamA: best.teamA,
      teamB: best.teamB,
      totalA: best.totalA,
      totalB: best.totalB,
      avgA: best.avgA,
      avgB: best.avgB,
    },
    signature: best.signature,
  }
}