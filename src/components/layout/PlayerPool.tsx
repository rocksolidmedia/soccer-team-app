import type { CSSProperties } from "react"
import type { Player } from "../../types"
import PlayerCard from "../ui/PlayerCard"

type Props = {
  playersByPosition: Record<string, Player[]>
  selectedIds: number[]
  onTogglePlayer: (playerId: number) => void
  panelStyle: CSSProperties
  textDimColor: string
}

export default function PlayerPool({
  playersByPosition,
  selectedIds,
  onTogglePlayer,
  panelStyle,
  textDimColor,
}: Props) {
  return (
    <section style={{ ...panelStyle, padding: 16, flex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {["Def", "Mid", "Fwd"].map((pos) => (
          <div key={pos} style={panelStyle}>
            <div style={{ fontWeight: 800, marginBottom: 10, color: textDimColor }}>
              {pos.toUpperCase()}
            </div>
            <ul style={{ padding: 0, margin: 0 }}>
              {(playersByPosition[pos] ?? []).map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  selected={selectedIds.includes(p.id)}
                  onToggle={onTogglePlayer}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}