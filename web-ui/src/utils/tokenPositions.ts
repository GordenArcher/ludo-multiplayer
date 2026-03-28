import type { PlayerColor } from "../types/game";
import { ENTRY_OFFSET } from "./gameLogic";

const CELL_SIZE = 0.88;

function rc(row: number, col: number) {
  return { x: (col - 7) * CELL_SIZE, z: (row - 7) * CELL_SIZE };
}

//  Shared outer track: 52 cells clockwise starting at Red's entry
export const OUTER_TRACK: [number, number][] = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5], // 0-4   red entry row ->
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6], // 5-10  up left col ↑
  [0, 7],
  [0, 8], // 11-12 top row →
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8], // 13-17 green entry col ↓ (13=green start)
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14], // 18-23 right across →
  [7, 14],
  [8, 14], // 24-25 right col ↓
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9], // 26-30 yellow entry row ← (26=yellow start)
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8], // 31-36 down right col ↓
  [14, 7],
  [14, 6], // 37-38 bottom row ←
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6], // 39-43 blue entry col ↑ (39=blue start)
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0], // 44-49 left across ←
  [7, 0],
  [6, 0], // 50-51 left col ↑ back
];

if (OUTER_TRACK.length !== 52) {
  console.error(`OUTER_TRACK length = ${OUTER_TRACK.length}, expected 52`);
}

//  Home lanes (local positions 52-56, 5 steps inward to centre)
//
// CRITICAL: these must match the VISUAL lane cells in boardLogic.ts getKind().
// boardLogic maps:
//   lane_red → col 7, rows 1-5   (top arm going up toward centre)
//   lane_green → row 7, cols 9-13  (right arm going right toward centre)  [visual only — col 7 top = green visual]
//   lane_yellow → row 7, cols 1-5   (left arm going left toward centre)
//   lane_blue → col 7, rows 9-13  (bottom arm going down toward centre)
//
// BUT boardLogic's lane colours are rotated from game-logic colours (it's a
// visual offset — see boardLogic comments). The PHYSICAL cells each player's
// token must travel through are determined by the outer track entry offset:
//
//   Red   enters ring at 0  → track goes right along row 6 → turns up col 6
//         → home lane turn-off is at the TOP of col 7 → rows 5→1 (going up, col 7)
//   Green enters ring at 13 → track comes down col 8 → turns right along row 6
//         → home lane turn-off is RIGHT side of row 7 → cols 9→13 (going right, row 7)
//   Yellow enters ring at 26 → track goes left along row 8 → turns down col 8
//         → home lane turn-off is BOTTOM of col 7 → rows 9→13 (going down, col 7)
//   Blue  enters ring at 39 → track goes up col 6 → turns left along row 8
//         → home lane turn-off is LEFT side of row 7 → cols 5→1 (going left, row 7)
//
export const HOME_LANES: Record<PlayerColor, [number, number][]> = {
  // Red: enters top arm going up, turns right into col 7 going UP toward centre
  red: [
    [5, 7],
    [4, 7],
    [3, 7],
    [2, 7],
    [1, 7],
  ],
  // Green: enters right arm going right, turns into row 7 going RIGHT toward centre
  green: [
    [7, 9],
    [7, 10],
    [7, 11],
    [7, 12],
    [7, 13],
  ],
  // Yellow: enters bottom arm going down, turns into col 7 going DOWN toward centre
  yellow: [
    [9, 7],
    [10, 7],
    [11, 7],
    [12, 7],
    [13, 7],
  ],
  // Blue: enters left arm going left, turns into row 7 going LEFT toward centre
  blue: [
    [7, 5],
    [7, 4],
    [7, 3],
    [7, 2],
    [7, 1],
  ],
};

// Yard slot positions
const YARD_SLOTS: Record<PlayerColor, [number, number][]> = {
  red: [
    [1.8, 1.8],
    [1.8, 3.2],
    [3.2, 1.8],
    [3.2, 3.2],
  ],
  green: [
    [1.8, 10.8],
    [1.8, 12.2],
    [3.2, 10.8],
    [3.2, 12.2],
  ],
  yellow: [
    [10.8, 1.8],
    [10.8, 3.2],
    [12.2, 1.8],
    [12.2, 3.2],
  ],
  blue: [
    [10.8, 10.8],
    [10.8, 12.2],
    [12.2, 10.8],
    [12.2, 12.2],
  ],
};

// Main export
export function getTokenWorldPosition(
  position: number,
  color: PlayerColor,
  tokenIndex: number,
): { x: number; y: number; z: number } {
  if (position === -2) {
    // Finished — offset slightly so 4 tokens don't stack exactly
    const offsets = [
      [0.15, 0.15],
      [-0.15, 0.15],
      [0.15, -0.15],
      [-0.15, -0.15],
    ];
    const [ox, oz] = offsets[tokenIndex] ?? [0, 0];
    return { x: ox, y: 0.14, z: oz };
  }

  if (position === -1) {
    const [row, col] = YARD_SLOTS[color][tokenIndex] ?? [7, 7];
    const { x, z } = rc(row, col);
    return { x, y: 0.08, z };
  }

  // Home lane (local 52-56)
  if (position >= 52 && position <= 56) {
    const step = position - 52; // 0-4
    const [row, col] = HOME_LANES[color][step];
    const { x, z } = rc(row, col);
    return { x, y: 0.1, z };
  }

  // Outer track (local 0-51) → convert to physical ring index
  if (position >= 0 && position <= 51) {
    const ringIndex = (position + ENTRY_OFFSET[color]) % 52;
    const [row, col] = OUTER_TRACK[ringIndex];
    const { x, z } = rc(row, col);
    return { x, y: 0.09, z };
  }

  console.warn(
    `getTokenWorldPosition: unexpected position ${position} for ${color}`,
  );
  const [row, col] = YARD_SLOTS[color][tokenIndex] ?? [7, 7];
  const { x, z } = rc(row, col);
  return { x, y: 0.08, z };
}
