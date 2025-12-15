import type { Player } from "./types"

type PlayerCardProps = {
  player: Player
  selected: boolean
  onToggle: (playerId: number) => void
}

function PlayerCard({ player, selected, onToggle }: PlayerCardProps) {
  const R = 12

  const colors = {
    bg: "#2a2f35",
    bgSelected: "#2f353c",
    border: "rgba(255,255,255,0.10)",
    text: "rgba(255,255,255,0.92)",
    textDim: "rgba(255,255,255,0.70)",
    pill: "#333a41",
    circle: "#ffffff",
  }

  return (
    <li
      onClick={() => onToggle(player.id)}
      style={{
        listStyle: "none",
        border: `1px solid ${colors.border}`,
        borderRadius: R,
        padding: 12,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        userSelect: "none",
        background: selected ? colors.bgSelected : colors.bg,
      }}
    >
      {/* LEFT: avatar + name/position */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: colors.circle,
            flex: "0 0 auto",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              color: colors.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {player.name}
          </div>
          <div style={{ fontSize: 13, color: colors.textDim }}>{player.position}</div>
        </div>
      </div>

      {/* RIGHT: skill pill */}
      <div
        style={{
          fontWeight: 800,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          background: colors.pill,
          borderRadius: 999,
          padding: "6px 10px",
          flex: "0 0 auto",
        }}
      >
        {player.skill}
      </div>
    </li>
  )
}

export default PlayerCard