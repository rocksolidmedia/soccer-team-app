// src/logic/history.ts
import type { Player } from "../types"

export const STORAGE_KEY = "soccer_team_history_v1"

// ✅ Never show the same exact matchup as the last one shown (ABAB…)
export const NO_REPEAT_LAST_N = 1

// Prevent localStorage from growing forever
export const MAX_HISTORY = 50

export function getRecentHistory(): string[] {
  const history: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  return history.slice(-NO_REPEAT_LAST_N)
}

export function pushToHistory(signature: string) {
  const history: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  const updated = [...history, signature].slice(-MAX_HISTORY)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function signatureForTeams(teamA: Player[], teamB: Player[]) {
  const a = teamA.map((p) => p.id).sort((x, y) => x - y).join("-")
  const b = teamB.map((p) => p.id).sort((x, y) => x - y).join("-")
  // Normalize A|B vs B|A so they count as the same matchup
  return a < b ? `${a}|${b}` : `${b}|${a}`
}