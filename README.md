# Perfect Fit

A cozy, wood-themed block-fitting puzzle game for iOS. Drag polyomino pieces from
the tray onto the board and pack them so every cell is filled — no gaps, no overlaps.
100 hand-tuned levels layer in new twists as you climb: rotation, blocked cells,
spare decoy pieces, and tight move budgets.

Built with **Expo** / **React Native**. The app lives in [`native/`](native/).

## Gameplay

- Drag a piece from the tray up onto the board; a green preview shows where it lands.
- Fill **every** free cell to win — the pieces fuse into one solid wooden block.
- Tap a piece's rotate badge to turn it. Drag a placed piece back off the board to redo it.
- Earn **1–3 stars** per level based on how cleanly you solve it (see below).

## Mechanics

Introduced gradually so each new idea gets room to breathe before they combine:

| Mechanic | What it does |
| --- | --- |
| **Rotation** | Some pieces arrive turned and must be rotated to fit. |
| **Obstacles** | Pre-filled wooden cells you must tile around. |
| **Decoys** | The tray holds more pieces than you need — pick the right subset. |
| **Move limits** | A placement budget on challenge levels; run out and the level fails. |
| **Stars** | 3★ = solved in the minimum placements, 2★ = within two extra, 1★ = solved. Best result is saved per level. |

## Progression

The board grows as you advance:

| Levels | Board |
| --- | --- |
| 1–7 | 4×4 |
| 8–39 | 5×5 |
| 40–75 | 6×6 |
| 76–100 | 7×7 |

## Tech stack

- **Expo** + **React Native** (TypeScript)
- **expo-router** for navigation
- **react-native-reanimated** + **react-native-gesture-handler** for the drag/drop and animations
- **AsyncStorage** for level progress and star records
- **Jest** (`jest-expo`) for tests

## Getting started

```bash
cd native
npm install
npm start        # Metro — open in Expo Go, or press i for the iOS simulator
```

Or launch straight into a build:

```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
```

## Project structure

```
native/
  app/                 expo-router screens (play.tsx is the game screen)
  components/          Tile, WoodButton, Icon, …
  lib/
    levels.ts          board/piece model, board sizes, solver-facing helpers
    level-presets.ts   the generated 1–100 catalog (LEVEL_SPECS)
    progress.ts        unlock progress + per-level star storage
    drag-geometry.ts   pure drag/placement math (shared by preview + drop)
  scripts/
    build-presets.js   generates + solver-verifies the whole level catalog
  lib/__tests__/       jest tests (level solvability, drag geometry)
```

## Levels

Every level is a `LevelSpec` in [`native/lib/level-presets.ts`](native/lib/level-presets.ts)
— its pieces (including any decoys), obstacle cells, optional move limit, and par.
The full catalog is generated and **solver-verified** by
[`native/scripts/build-presets.js`](native/scripts/build-presets.js), which is seeded and
idempotent — rerun it to regenerate identical output, or tune the difficulty schedule inside
it and regenerate:

```bash
cd native
node scripts/build-presets.js
```

## Testing

```bash
cd native
npm test
```

The suite solver-verifies that every level in the catalog is actually solvable (a subset of
its pieces exactly covers all free cells) and checks the pure drag/placement geometry.
Run it before any release.
