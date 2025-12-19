import { useState, type CSSProperties } from "react"
import { players } from "./players"
import type { Player } from "./types"
import PlayerCard from "./PlayerCard"

// layout
import ControlPanel from "./components/layout/ControlPanel"

// icons
import { Users } from "lucide-react"

// logic
import { buildOptimalTeams } from "./logic/teamGenerator"
import { getRecentHistory, pushToHistory } from "./logic/history"

type TeamResult = {
  teamA: Player[]
  teamB: Player[]
  totalA: number
  totalB: number
  avgA: number
  avgB: number
}

function App() {
  // =====================
  // STATE
  // =====================
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [generatedIds, setGeneratedIds] = useState<number[] | null>(null)
  const [teamsOverride, setTeamsOverride] = useState<TeamResult | null>(null)

  const logoUrl = "/lockup-logo.png"

  // =====================
  // DERIVED DATA
  // =====================
  const sortedPlayers: Player[] = [...players].sort((a, b) => b.skill - a.skill)
  const canGenerate = selectedIds.length >= 8

  const generatedPlayers: Player[] = generatedIds
    ? sortedPlayers.filter((p) => generatedIds.includes(p.id))
    : []

  const canShowTeams = generatedPlayers.length >= 8

  const teams: TeamResult | null = canShowTeams ? teamsOverride : null
  const avgDiff = teams ? Math.abs(teams.avgA - teams.avgB) : null
  const totalDiff = teams ? Math.abs(teams.totalA - teams.totalB) : null

  // =====================
  // PLAYER GROUPING
  // =====================
  const playersByPosition = sortedPlayers.reduce((groups, player) => {
    const position = player.position
    if (!groups[position]) groups[position] = []
    groups[position].push(player)
    return groups
  }, {} as Record<string, Player[]>)

  function getPositionList(pos: string) {
    return playersByPosition[pos] ?? []
  }

  // =====================
  // ACTIONS
  // =====================
  function togglePlayer(playerId: number) {
    // If teams already exist, auto-recompute live
    if (generatedIds && generatedIds.length >= 8) {
      const nextSelectedIds = selectedIds.includes(playerId)
        ? selectedIds.filter((id) => id !== playerId)
        : [...selectedIds, playerId]

      setSelectedIds(nextSelectedIds)
      setGeneratedIds(nextSelectedIds)

      if (nextSelectedIds.length >= 8) {
        const nextPlayers = sortedPlayers.filter((p) => nextSelectedIds.includes(p.id))
        const { result } = buildOptimalTeams(nextPlayers, [])
        setTeamsOverride(result)
      } else {
        setTeamsOverride(null)
      }

      return
    }

    // Pre-generation selection
    setSelectedIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  function generateTeams() {
    if (!canGenerate) return

    const selectedPlayers = sortedPlayers.filter((p) => selectedIds.includes(p.id))
    const recent = getRecentHistory()

    const { result, signature } = buildOptimalTeams(selectedPlayers, recent)

    setGeneratedIds([...selectedIds])
    setTeamsOverride(result)
    pushToHistory(signature)
  }

  function clearTeams() {
    setGeneratedIds(null)
    setSelectedIds([])
    setTeamsOverride(null)
  }

  // =====================
  // STYLES
  // =====================
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

  // =====================
  // RENDER
  // =====================
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
          <ControlPanel
            logoUrl={logoUrl}
            playersCount={sortedPlayers.length}
            selectedCount={selectedIds.length}
            avgDiff={avgDiff}
            totalDiff={totalDiff}
            canGenerate={canGenerate}
            canShowTeams={canShowTeams}
            onGenerateTeams={generateTeams}
            onClearTeams={clearTeams}
            panelStyle={panelStyle}
            buttonStyle={buttonStyle}
            statsBoxStyle={statsBoxStyle}
            statsRowStyle={statsRowStyle}
            statsLabelStyle={statsLabelStyle}
            dividerStyle={dividerStyle}
            colors={colors}
          />

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
          {!canShowTeams || !teams ? (
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
              {(["A", "B"] as const).map((label) => {
                const team = label === "A" ? teams.teamA : teams.teamB
                const avg = label === "A" ? teams.avgA : teams.avgB
                const tot = label === "A" ? teams.totalA : teams.totalB

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
                        <PlayerCard key={p.id} player={p} selected onToggle={togglePlayer} />
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