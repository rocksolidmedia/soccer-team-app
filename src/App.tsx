import { useState, type CSSProperties } from "react"
import { players } from "./players"
import PlayerCard from "./PlayerCard"

// Lucide (standard icons)
import { Users, Trash2, Icon } from "lucide-react"
// Lucide Lab (soccer ball)
import { soccerBall } from "@lucide/lab"

function App() {
  // STATE
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [generatedIds, setGeneratedIds] = useState<number[] | null>(null)

  // ✅ Put your lockup logo in /public and set the filename here:
  const logoUrl = "/lockup-logo.png"

  // DERIVED DATA
  const sortedPlayers = [...players].sort((a, b) => b.skill - a.skill)
  const canGenerate = selectedIds.length >= 8

  const generatedPlayers = generatedIds
    ? sortedPlayers.filter((p) => generatedIds.includes(p.id))
    : []

  const canShowTeams = generatedPlayers.length >= 8

  // Group players by position (for the top pool UI)
  const playersByPosition = sortedPlayers.reduce((groups, player) => {
    const position = player.position
    if (!groups[position]) groups[position] = []
    groups[position].push(player)
    return groups
  }, {} as Record<string, typeof sortedPlayers>)

  function getPositionList(pos: string) {
    return playersByPosition[pos] ?? []
  }

  // ACTIONS
  function togglePlayer(playerId: number) {
    // If teams exist, clicking a player removes them from the generated set AND selection
    // (and because teams are derived from generatedPlayers, they auto-regenerate)
    if (generatedIds && generatedIds.length >= 8) {
      setGeneratedIds((prev) => (prev ? prev.filter((id) => id !== playerId) : prev))
      setSelectedIds((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : prev
      )
      return
    }

    setSelectedIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  function generateTeams() {
    if (!canGenerate) return
    setGeneratedIds([...selectedIds])
  }

  function clearTeams() {
    setGeneratedIds(null)
    setSelectedIds([])
  }

  // ✅ TEAM LOGIC — Optimal split with “stacking penalty”
  // - Even selected => equal team sizes ALWAYS
  // - Odd selected  => extra player goes to weaker team (by average)
  // - Score prioritizes: TOTAL difference, then AVG diff, then anti-stacking
  function buildOptimalTeams(playersToSplit: typeof generatedPlayers) {
    const n = playersToSplit.length
    const big = Math.ceil(n / 2)

    function sumTopK(team: typeof playersToSplit, k: number) {
      const top = [...team].sort((a, b) => b.skill - a.skill).slice(0, k)
      return top.reduce((s, p) => s + p.skill, 0)
    }

    function solveForTeamASize(teamASize: number) {
      let best:
        | {
            teamA: typeof playersToSplit
            teamB: typeof playersToSplit
            totalA: number
            totalB: number
            avgA: number
            avgB: number
            score: number
          }
        | null = null

      const totalAll = playersToSplit.reduce((s, p) => s + p.skill, 0)
      const chosen: number[] = []

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
        // 1) Spread “elite” players (85+) across teams
        const ELITE = 85
        const eliteA = teamA.filter((p) => p.skill >= ELITE).length
        const eliteB = teamB.filter((p) => p.skill >= ELITE).length
        const eliteCountDiff = Math.abs(eliteA - eliteB)

        // 2) Penalize “super stacks” (3+ elites on one team)
        const eliteStackPenalty =
          (eliteA >= 3 ? (eliteA - 2) * 2 : 0) + (eliteB >= 3 ? (eliteB - 2) * 2 : 0)

        // 3) Penalize top-end clustering (top 4 sum difference)
        const topK = 4
        const topDiff = Math.abs(sumTopK(teamA, topK) - sumTopK(teamB, topK))

        // Weighted score:
        // - Totals dominate
        // - Avg is a tiebreaker-ish factor
        // - EliteCountDiff + stack penalty strongly reduce “95 + 3x85” type outcomes
        const score =
          totalDiff * 10000 +
          avgDiff * 100 +
          topDiff * 50 +
          eliteCountDiff * 1200 +
          eliteStackPenalty * 3000

        if (!best || score < best.score) {
          best = { teamA, teamB, totalA, totalB, avgA, avgB, score }
        }
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

      if (!best) throw new Error("No solution found")
      return best
    }

    // EVEN n => equal teams
    if (n % 2 === 0) {
      const best = solveForTeamASize(n / 2)
      return {
        teamA: best.teamA,
        teamB: best.teamB,
        totalA: best.totalA,
        totalB: best.totalB,
        avgA: best.avgA,
        avgB: best.avgB,
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
      }
    }

    return {
      teamA: best.teamA,
      teamB: best.teamB,
      totalA: best.totalA,
      totalB: best.totalB,
      avgA: best.avgA,
      avgB: best.avgB,
    }
  }

  const teams = canShowTeams ? buildOptimalTeams(generatedPlayers) : null
  const avgDiff = teams ? Math.abs(teams.avgA - teams.avgB) : null
  const totalDiff = teams ? Math.abs(teams.totalA - teams.totalB) : null

  // STYLES
  const R = 12

  const colors = {
    bg: "#1f2226",
    panel: "#2a2f35",
    border: "rgba(255,255,255,0.10)",
    text: "rgba(255,255,255,0.92)",
    textDim: "rgba(255,255,255,0.70)",
    chip: "#333a41",
    green: "#2ecc71",
    greenText: "#0b2a16",
    redDark: "#8e1e16",
  }

  const panelStyle: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: R,
    padding: 12,
  }

  const buttonStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 14px",
    borderRadius: R,
    border: `1px solid ${colors.border}`,
    fontWeight: 750,
    cursor: "pointer",
    height: 44,
  }

  const statsBoxStyle: CSSProperties = {
    background: colors.chip,
    border: `1px solid ${colors.border}`,
    borderRadius: R,
    padding: 12,
    display: "grid",
    gap: 10,
  }

  const statsRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 650,
    color: colors.text,
  }

  const statsLabelStyle: CSSProperties = {
    color: colors.textDim,
    fontWeight: 650,
  }

  const dividerStyle: CSSProperties = {
    height: 1,
    background: colors.border,
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        padding: 16,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* TOP ROW */}
        <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
          {/* SIDEBAR */}
          <aside
            style={{
              ...panelStyle,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* LOGO */}
            <div
              style={{
                height: 46,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  height: 40,
                  width: "auto",
                  maxWidth: 200,
                  objectFit: "contain",
                  userSelect: "none",
                  pointerEvents: "none",
                  opacity: 0.95,
                }}
              />
            </div>

            <div style={{ height: 10 }} />

            {/* STATS BOX */}
            <div style={statsBoxStyle}>
              <div style={statsRowStyle}>
                <span style={statsLabelStyle}>Players</span>
                <span>{sortedPlayers.length}</span>
              </div>
              <div style={dividerStyle} />

              <div style={statsRowStyle}>
                <span style={statsLabelStyle}>Selected</span>
                <span>{selectedIds.length}</span>
              </div>
              <div style={dividerStyle} />

              <div style={statsRowStyle}>
                <span style={statsLabelStyle}>Avg. Dif</span>
                <span>{avgDiff ?? "—"}</span>
              </div>
              <div style={dividerStyle} />

              <div style={statsRowStyle}>
                <span style={statsLabelStyle}>Total Dif</span>
                <span>{totalDiff ?? "—"}</span>
              </div>
            </div>

            {/* push buttons + footer to bottom */}
            <div style={{ marginTop: "auto" }} />

            {/* Buttons */}
            <div style={{ display: "grid", gap: 10 }}>
              <button
                onClick={generateTeams}
                disabled={!canGenerate}
                style={{
                  ...buttonStyle,
                  background: !canGenerate ? colors.chip : colors.green,
                  color: !canGenerate ? colors.textDim : colors.greenText,
                }}
              >
                <Icon iconNode={soccerBall} size={18} />
                Make Teams
              </button>

              <button
                onClick={clearTeams}
                style={{
                  ...buttonStyle,
                  background: colors.redDark,
                  color: "#ffffff",
                }}
              >
                <Trash2 size={18} />
                Clear Teams
              </button>
            </div>

            {/* Footer message */}
            <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  color: colors.textDim,
                  fontSize: 13,
                  maxWidth: 180,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {canShowTeams
                  ? "Your teams have been created. Go have fun!"
                  : "Select at least 8 players to enable team generation."}
              </div>
            </div>
          </aside>

          {/* PLAYER POOL */}
          <section style={{ ...panelStyle, padding: 16, flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {["Def", "Mid", "Fwd"].map((pos) => (
                <div key={pos} style={panelStyle}>
                  <div style={{ fontWeight: 800, marginBottom: 10, color: colors.textDim }}>
                    {pos.toUpperCase()}
                  </div>
                  <ul style={{ padding: 0, margin: 0 }}>
                    {getPositionList(pos).map((p) => (
                      <PlayerCard
                        key={p.id}
                        player={p}
                        selected={selectedIds.includes(p.id)}
                        onToggle={togglePlayer}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* TEAMS */}
        <section style={{ ...panelStyle, padding: 16 }}>
          {!canShowTeams ? (
            <div
              style={{
                color: colors.textDim,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Users size={18} />
              Teams will appear here after you click <b>Make Teams.</b>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {["A", "B"].map((label) => {
                const team = label === "A" ? teams!.teamA : teams!.teamB
                const avg = label === "A" ? teams!.avgA : teams!.avgB
                const tot = label === "A" ? teams!.totalA : teams!.totalB

                return (
                  <div key={label} style={panelStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 850 }}>Team {label}</div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <div
                          style={{
                            background: colors.chip,
                            border: `1px solid ${colors.border}`,
                            borderRadius: R,
                            padding: "10px 12px",
                            fontWeight: 650,
                          }}
                        >
                          Avg {avg.toFixed(1)}
                        </div>
                        <div
                          style={{
                            background: colors.chip,
                            border: `1px solid ${colors.border}`,
                            borderRadius: R,
                            padding: "10px 12px",
                            fontWeight: 650,
                          }}
                        >
                          Tot {tot}
                        </div>
                      </div>
                    </div>

                    <div style={{ height: 12 }} />

                    <ul style={{ padding: 0, margin: 0 }}>
                      {team.map((p) => (
                        <PlayerCard
                          key={p.id}
                          player={p}
                          selected={true}
                          onToggle={togglePlayer}
                        />
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App