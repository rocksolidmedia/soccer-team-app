import type { CSSProperties } from "react"
import { Trash2, Icon } from "lucide-react"
import { soccerBall } from "@lucide/lab"

type Props = {
  logoUrl: string

  // stats
  playersCount: number
  selectedCount: number
  avgDiff: number | null
  totalDiff: number | null

  // state
  canGenerate: boolean
  canShowTeams: boolean

  // actions
  onGenerateTeams: () => void
  onClearTeams: () => void

  // styles
  panelStyle: CSSProperties
  buttonStyle: CSSProperties
  statsBoxStyle: CSSProperties
  statsRowStyle: CSSProperties
  statsLabelStyle: CSSProperties
  dividerStyle: CSSProperties
  colors: {
    chip: string
    border: string
    textDim: string
    green: string
    greenText: string
    redDark: string
  }
  R: number
}

export default function ControlPanel({
  logoUrl,
  playersCount,
  selectedCount,
  avgDiff,
  totalDiff,
  canGenerate,
  canShowTeams,
  onGenerateTeams,
  onClearTeams,
  panelStyle,
  buttonStyle,
  statsBoxStyle,
  statsRowStyle,
  statsLabelStyle,
  dividerStyle,
  colors,
  R,
}: Props) {
  return (
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
          <span>{playersCount}</span>
        </div>
        <div style={dividerStyle} />

        <div style={statsRowStyle}>
          <span style={statsLabelStyle}>Selected</span>
          <span>{selectedCount}</span>
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
          onClick={onGenerateTeams}
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
          onClick={onClearTeams}
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
  )
}