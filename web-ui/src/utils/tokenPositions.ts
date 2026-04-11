import type { PlayerColor } from "../types/game";
import { ENTRY_OFFSET } from "./gameLogic";

/**
 * Token Position Mapping
 *
 * This module maps game state positions to actual 3D world coordinates
 * for rendering tokens on the board.
 *
 * Position values:
 *   -2 = finished (center star area)
 *   -1 = yard (home area)
 *   0-50 = outer track (main path)
 *   51-55 = home lane (colored path to center)
 *
 * The board uses a 15x15 grid with cell size 0.88 units.
 * Coordinates are centered so that (0,0) is the board center.
 */

/** Cell size in world units */
const CELL_SIZE = 0.88;

function rc(row: number, col: number) {
  return { x: (col - 7) * CELL_SIZE, z: (row - 7) * CELL_SIZE };
}

export const OUTER_TRACK: [number, number][] = [
  [6, 1], // 0   Red start
  [6, 2], // 1
  [6, 3], // 2
  [6, 4], // 3
  [6, 5], // 4
  [5, 6], // 5
  [4, 6], // 6
  [3, 6], // 7
  [2, 6], // 8
  [1, 6], // 9
  [0, 6], // 10
  [0, 7], // 11
  [0, 8], // 12
  [1, 8], // 13  Green start
  [2, 8], // 14
  [3, 8], // 15
  [4, 8], // 16
  [5, 8], // 17
  [6, 9], // 18
  [6, 10], // 19
  [6, 11], // 20
  [6, 12], // 21
  [6, 13], // 22
  [6, 14], // 23
  [7, 14], // 24
  [8, 14], // 25
  [8, 13], // 26  Yellow start
  [8, 12], // 27
  [8, 11], // 28
  [8, 10], // 29
  [8, 9], // 30
  [9, 8], // 31
  [10, 8], // 32
  [11, 8], // 33
  [12, 8], // 34
  [13, 8], // 35
  [14, 8], // 36
  [14, 7], // 37
  [14, 6], // 38
  [13, 6], // 39  Blue start
  [12, 6], // 40
  [11, 6], // 41
  [10, 6], // 42
  [9, 6], // 43
  [8, 5], // 44
  [8, 4], // 45
  [8, 3], // 46
  [8, 2], // 47
  [8, 1], // 48
  [8, 0], // 49
  [7, 0], // 50
  [6, 0], // 51
];

if (OUTER_TRACK.length !== 52) {
  console.error(`OUTER_TRACK has ${OUTER_TRACK.length} — expected 52`);
}

export const HOME_LANES: Record<PlayerColor, [number, number][]> = {
  red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
  ],
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
  ],
  yellow: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
  ],
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
  ],
};

const YARD: Record<PlayerColor, [number, number][]> = {
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

const FINISH_OFFSETS: [number, number][] = [
  [0.15, 0.15],
  [-0.15, 0.15],
  [0.15, -0.15],
  [-0.15, -0.15],
];

/**
 * Stack offsets for tokens sharing the same board cell.
 *
 * When multiple tokens occupy the same cell (same player or safe square),
 * we spread them in a tight cluster so they're all visible.
 * stackIndex is the token's position within that cluster (0 = no offset).
 *
 * Layout (top view):
 *   slot 0 → centre          (no XZ offset, slightly higher Y)
 *   slot 1 → right
 *   slot 2 → left
 *   slot 3 → back
 *
 * Y is staggered so tokens don't clip through each other.
 */
const STACK_XZ: [number, number][] = [
  [0, 0], // slot 0 — base
  [0.22, 0], // slot 1
  [-0.22, 0], // slot 2
  [0, 0.22], // slot 3
];

const STACK_Y_STEP = 0.07; // each layer raises by this amount

/**
 * Get the 3D world position for a token based on its game state.
 *
 * @param position   - Game position (-2, -1, 0–50, 51–55)
 * @param color      - Player color
 * @param tokenIndex - Token index (0–3) for yard / finish arrangement
 * @param stackIndex - Position within a stack of tokens sharing this cell
 *                     (0 = first/only token, 1–3 = stacked on top)
 */
export function getTokenWorldPosition(
  position: number,
  color: PlayerColor,
  tokenIndex: number,
  stackIndex = 0,
): { x: number; y: number; z: number } {
  const [sx, sz] = STACK_XZ[stackIndex] ?? [0, 0];
  const sy = stackIndex * STACK_Y_STEP;

  // FINISHED TOKENS (position = -2)
  if (position === -2) {
    const [offsetX, offsetZ] = FINISH_OFFSETS[tokenIndex] ?? [0, 0];
    return { x: offsetX, y: 0.14 + sy, z: offsetZ };
  }

  // YARD TOKENS (position = -1)
  if (position === -1) {
    const [row, col] = YARD[color][tokenIndex] ?? [7, 7];
    const { x, z } = rc(row, col);
    // Yard slots are already spread out per token so no XZ stack offset needed,
    // but we still raise Y if somehow two tokens share a yard slot.
    return { x, y: 0.08 + sy, z };
  }

  // HOME LANE TOKENS (local positions 51–55)
  if (position >= 51 && position <= 55) {
    const step = position - 51;
    const cell = HOME_LANES[color][step];
    if (!cell) {
      console.warn(`HOME_LANES[${color}][${step}] missing`);
      return { x: sx, y: 0.1 + sy, z: sz };
    }
    const { x, z } = rc(cell[0], cell[1]);
    return { x: x + sx, y: 0.1 + sy, z: z + sz };
  }

  // OUTER TRACK TOKENS (local positions 0–50)
  if (position >= 0 && position <= 50) {
    const ring = (position + ENTRY_OFFSET[color]) % 52;
    const cell = OUTER_TRACK[ring];
    if (!cell) {
      console.warn(
        `OUTER_TRACK[${ring}] missing (local ${position}, ${color})`,
      );
      return { x: sx, y: 0.09 + sy, z: sz };
    }
    const { x, z } = rc(cell[0], cell[1]);
    return { x: x + sx, y: 0.09 + sy, z: z + sz };
  }

  // FALLBACK
  console.warn(`Unexpected position ${position} for ${color}`);
  const [row, col] = YARD[color][tokenIndex] ?? [7, 7];
  const { x, z } = rc(row, col);
  return { x, y: 0.08, z };
}

/**
 * Build a map of  cellKey → stackIndex  for every active token.
 *
 * Called once per render in GameBoard before tokens are drawn.
 * Returns a nested map:  color → tokenId → stackIndex
 *
 * Tokens in the yard (-1) each have their own fixed slot so they're
 * never stacked, we skip them here.
 * Finished tokens (-2) also have fixed offsets so we skip those too.
 */
export function computeStackIndices(
  tokens: Record<
    PlayerColor,
    Array<{ id: number; position: number; isFinished: boolean }>
  >,
  colors: PlayerColor[],
): Record<PlayerColor, Record<number, number>> {
  // cellKey → list of { color, id } in arrival order
  const cellMap = new Map<string, Array<{ color: PlayerColor; id: number }>>();

  for (const color of colors) {
    for (const token of tokens[color]) {
      // Skip yard and finished, they have their own fixed offsets
      if (token.position === -1 || token.isFinished) continue;

      // For outer track we normalise to ring index so tokens from different
      // players that physically share the same square get the same key.
      let cellKey: string;
      if (token.position >= 0 && token.position <= 50) {
        const ring = (token.position + ENTRY_OFFSET[color]) % 52;
        cellKey = `ring:${ring}`;
      } else {
        // Home lane positions are per-color so no cross-color sharing possible
        cellKey = `${color}:${token.position}`;
      }

      if (!cellMap.has(cellKey)) cellMap.set(cellKey, []);
      cellMap.get(cellKey)!.push({ color, id: token.id });
    }
  }

  // Build result map initialised to 0
  const result: Record<PlayerColor, Record<number, number>> = {
    red: {},
    green: {},
    yellow: {},
    blue: {},
  };
  for (const color of colors) {
    for (const token of tokens[color]) {
      result[color][token.id] = 0;
    }
  }

  // Assign stack slots in the order tokens were added to each cell
  for (const entries of cellMap.values()) {
    entries.forEach(({ color, id }, slotIndex) => {
      result[color][id] = slotIndex;
    });
  }

  return result;
}
