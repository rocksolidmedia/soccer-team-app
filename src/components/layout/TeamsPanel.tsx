import type { CSSProperties } from "react"
import type { Player } from "../../types"
import PlayerCard from "../../PlayerCard"
import { Users } from "lucide-react"

type TeamResult = {
  teamA: Player[]
  teamB: Player[]
  totalA: number
  totalB: number
  avgA: number
  avgB: number
}

type Props = {
  teams: TeamResult | null
  canShowTeams: boolean
  onTogglePlayer: (playerId: number) => void
  panelStyle: CSSProperties
  chipStyle: CSSProperties
  borderColor: string
  radius: number
  textDimColor: string
}

export default function TeamsPanel({
  teams,
  canShowTeams,
  onTogglePlayer,
  panelStyle,
  chipStyle,
  borderColor,
  radius,
  textDimColor,
}: Props) {
  if (!canShowTeams || !teams) {
    return (
      <section style={{ ...panelStyle, padding: 16 }}>
        <div
          style={{
            color: textDimColor,
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
      </section>
    )
  }

  return (
    <section style={{ ...panelStyle, padding: 16 }}>
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
                      ...chipStyle,
                      border: `1px solid ${borderColor}`,
                      borderRadius: radius,
                    }}
                  >
                    Avg {avg.toFixed(1)}
                  </div>
                  <div
                    style={{
                      ...chipStyle,
                      border: `1px solid ${borderColor}`,
                      borderRadius: radius,
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
                    selected
                    onToggle={onTogglePlayer}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}