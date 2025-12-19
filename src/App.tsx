import { useState, type CSSProperties } from "react"
import { players } from "./players"
import type { Player } from "./types"
import PlayerCard from "./PlayerCard"

// Lucide (standard icons)
import { Users, Trash2, Icon } from "lucide-react"
// Lucide Lab (soccer ball)
import { soccerBall } from "@lucide/lab"

// Extracted logic
import { buildOptimalTeams, type TeamResult } from "./logic/teamGenerator"
import { getRecentHistory, pushToHistory } from "./logic/history"

function App() {
  // STATE
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [generatedIds, setGeneratedIds] = useState<number[] | null>(null)
  const [teamsOverride, setTeamsOverride] = useState<TeamResult | null>(null)

  const logoUrl = "/lockup-logo.png"

  // DERIVED DATA
  const sortedPlayers: Player[] = [...players].sort((a, b) => b.skill - a.skill)
  const canGenerate = selectedIds.length >= 8

  const generatedPlayers: Player[] = generatedIds
    ? sortedPlayers.filter((p) => generatedIds.includes(p.id))
    : []

  const canShowTeams = generatedPlayers.length >= 8

  // Group players by position
  const playersByPosition = sortedPlayers.reduce((groups, player) => {
    const position = player.position
    if (!groups[position]) groups[position] = []
    groups[position].push(player)
    return groups
  }, {} as Record<string, Player[]>)

  function getPositionList(pos: string) {
    return playersByPosition[pos] ?? []
  }

  // ✅ FIXED: toggle logic now supports add + remove with auto-rebalance
  function togglePlayer(playerId: number) {
    // If teams already exist, auto-update generated set
    if (generatedIds) {
      const isInGenerated = generatedIds.includes(playerId)

      const nextGeneratedIds = isInGenerated
        ? generatedIds.filter((id) => id !== playerId)
        : [...generatedIds, playerId]

      const nextSelectedIds = selectedIds.includes(playerId)
        ? selectedIds.filter((id) => id !== playerId)
        : [...selectedIds, playerId]

      setGeneratedIds(nextGeneratedIds)
      setSelectedIds(nextSelectedIds)

      const nextGeneratedPlayers = sortedPlayers.filter((p) =>
        nextGeneratedIds.includes(p.id)
      )

      if (nextGeneratedPlayers.length >= 8) {
        const { result } = buildOptimalTeams(nextGeneratedPlayers, [])
        setTeamsOverride(result)
      } else {
        setTeamsOverride(null)
      }

      return
    }

    // No teams yet → just toggle selection
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

  const teams: TeamResult | null = canShowTeams ? teamsOverride : null
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
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
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
                  pointerEvents: "none",
                }}
              />
            </div>

            <div style={{ height: 10 }} />

            {/* STATS */}
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
                  color: "#fff",
                }}
              >
                <Trash2 size={18} />
                Clear Teams
              </button>
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
                        <div style={{ ...panelStyle, padding: "10px 12px" }}>
                          Avg {avg.toFixed(1)}
                        </div>
                        <div style={{ ...panelStyle, padding: "10px 12px" }}>
                          Tot {tot}
                        </div>
                      </div>
                    </div>

                    <ul style={{ padding: 0, margin: 0 }}>
                      {team.map((p) => (
                        <PlayerCard
                          key={p.id}
                          player={p}
                          selected
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