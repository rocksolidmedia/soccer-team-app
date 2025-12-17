# Soccer Team App ⚽

A small React + TypeScript app to build **fair soccer teams** from a pool of players.

## Features
- Select players attending the game
- Generate balanced teams based on skill
- Prevents stacking strong players on one team
- Supports even and odd team sizes
- Click players to remove and auto-rebalance
- Same player team variations

## Tech Stack
- React
- TypeScript
- Vite
- Inline styles (no CSS framework yet)

## Getting Started

```bash
npm install
npm run dev
```

## Roadmap

### Done
- [x] Initialize React + TypeScript app (Vite)
- [x] Defined player data and built the player selection UI (selectable cards grouped by role)
- [x] Build team generation logic v1 (optimal split + anti-stacking score)
- [x] Core UI layout (sidebar stats + player pool + teams output)
- [x] Add device-only short-term memory to avoid repeat matchups (ABAB)
- [x] Tie-safe behavior: randomize only truly equivalent non-repeat outcomes

### Next
- [ ] Split App.tsx into reusable components and separate team logic and styles (for scaling)
- [ ] Add player position attributes into the logic
- [ ] Add playstyle attributes into the logic
- [ ] Refactor UI to accomodate new functionalities

### Later / v2+
- [ ] Mobile responsiveness pass (layout, spacing, touch targets)
- [ ] Pre-game player check-in flow
- [ ] Player add/signup flow
- [ ] Admin and User profiles
- [ ] Export/share teams

