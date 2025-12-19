import { useState, type CSSProperties } from "react"
import { players } from "./players"
import type { Player } from "./types"

// layout
import ControlPanel from "./components/layout/ControlPanel"
import PlayerPool from "./components/layout/PlayerPool"
import TeamsPanel from "./components/layout/TeamsPanel"

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

          <PlayerPool
            playersByPosition={playersByPosition}
            selectedIds={selectedIds}
            onTogglePlayer={togglePlayer}
            panelStyle={panelStyle}
            textDimColor={colors.textDim}
          />
        </div>

        <TeamsPanel
          teams={teams}
          canShowTeams={canShowTeams}
          onTogglePlayer={togglePlayer}
          panelStyle={panelStyle}
          chipStyle={{
            background: colors.chip,
            padding: "10px 12px",
            fontWeight: 650,
          }}
          borderColor={colors.border}
          radius={R}
          textDimColor={colors.textDim}
        />
      </div>
    </div>
  )
}

export default App