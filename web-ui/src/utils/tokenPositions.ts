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

/**
 * Convert grid coordinates (row, col) to world position (x, z)
 *
 * @param row - Grid row (0-14, 0 = top)
 * @param col - Grid column (0-14, 0 = left)
 * @returns World coordinates with x (right/left) and z (forward/back)
 */
function rc(row: number, col: number) {
  return { x: (col - 7) * CELL_SIZE, z: (row - 7) * CELL_SIZE };
}

/**
 * Outer track positions in clockwise order
 *
 * The main path consists of 52 cells arranged in a clockwise loop.
 * This array maps ring index (0-51) to actual grid coordinates.
 *
 * Path flow:
 *   Red start (6,1) → clockwise around → back to Red start
 *
 * Colors enter at specific ring indices:
 *   Red:    0   (6,1)
 *   Green:  13  (0,8)
 *   Yellow: 26  (8,14)
 *   Blue:   39  (14,6)
 */
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

// Validate track length
if (OUTER_TRACK.length !== 52) {
  console.error(`OUTER_TRACK has ${OUTER_TRACK.length} — expected 52`);
}

/**
 * HOME LANES, 5 cells each (local positions 51-55)
 *
 * Each player has a 5-cell home lane that connects their last outer cell
 * to the center finish area. Tokens must traverse these cells in order
 * and need an exact roll to reach the center.
 *
 * Entry points from outer track:
 *   Red:   local 50 → ring 50 → [7,0]  → turn RIGHT → home lane cells
 *   Green: local 50 → ring 11 → [0,7]  → turn DOWN  → home lane cells
 *   Yellow: local 50 → ring 24 → [7,14] → turn LEFT  → home lane cells
 *   Blue:  local 50 → ring 37 → [14,7] → turn UP    → home lane cells
 *
 * Movement rules:
 *   From home lane entry (local 51):
 *     roll 1 → 52, roll 2 → 53, roll 3 → 54, roll 4 → 55, roll 5 → 56 (finish)
 *     roll 6 → 57 = overshoot → invalid
 */
export const HOME_LANES: Record<PlayerColor, [number, number][]> = {
  red: [
    [7, 1], // 51 - first home cell
    [7, 2], // 52
    [7, 3], // 53
    [7, 4], // 54
    [7, 5], // 55 - last home cell (adjacent to center)
  ],
  green: [
    [1, 7], // 51
    [2, 7], // 52
    [3, 7], // 53
    [4, 7], // 54
    [5, 7], // 55
  ],
  yellow: [
    [7, 13], // 51
    [7, 12], // 52
    [7, 11], // 53
    [7, 10], // 54
    [7, 9], // 55
  ],
  blue: [
    [13, 7], // 51
    [12, 7], // 52
    [11, 7], // 53
    [10, 7], // 54
    [9, 7], // 55
  ],
};

/**
 * Yard positions for each player
 * Each player has 4 distinct slots where their tokens sit when in home.
 *
 * These are positioned within the colored corner squares.
 */
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

/**
 * Small offsets for finished tokens
 * When multiple tokens finish, they're arranged in a small cluster
 * around the center star to avoid overlapping.
 */
const FINISH_OFFSETS: [number, number][] = [
  [0.15, 0.15], // Top-right quadrant
  [-0.15, 0.15], // Top-left quadrant
  [0.15, -0.15], // Bottom-right quadrant
  [-0.15, -0.15], // Bottom-left quadrant
];

/**
 * Get the 3D world position for a token based on its game state
 *
 * Maps logical positions to actual coordinates on the 3D board:
 *   - Finished tokens: clustered around center star
 *   - Yard tokens: positioned in colored home squares
 *   - Home lane tokens: on colored path to center
 *   - Outer track tokens: on main path with ring index mapping
 *
 * @param position - Game position (-2, -1, 0-50, 51-55)
 * @param color - Player color (determines offset and home lane)
 * @param tokenIndex - Token index (0-3) for yard/finish arrangement
 * @returns World coordinates { x, y, z } for rendering
 */
export function getTokenWorldPosition(
  position: number,
  color: PlayerColor,
  tokenIndex: number,
): { x: number; y: number; z: number } {
  // FINISHED TOKENS (position = -2)

  if (position === -2) {
    const [offsetX, offsetZ] = FINISH_OFFSETS[tokenIndex] ?? [0, 0];
    return { x: offsetX, y: 0.14, z: offsetZ };
  }

  // YARD TOKENS (position = -1)

  if (position === -1) {
    const [row, col] = YARD[color][tokenIndex] ?? [7, 7];
    const { x, z } = rc(row, col);
    return { x, y: 0.08, z };
  }

  // HOME LANE TOKENS (local positions 51-55)

  if (position >= 51 && position <= 55) {
    const step = position - 51; // 0 = first home cell, 4 = last home cell
    const cell = HOME_LANES[color][step];
    if (!cell) {
      console.warn(`HOME_LANES[${color}][${step}] missing`);
      return { x: 0, y: 0.1, z: 0 };
    }
    const { x, z } = rc(cell[0], cell[1]);
    return { x, y: 0.1, z };
  }

  // OUTER TRACK TOKENS (local positions 0-50)

  if (position >= 0 && position <= 50) {
    // Convert local position to global ring index using player offset
    const ring = (position + ENTRY_OFFSET[color]) % 52;
    const cell = OUTER_TRACK[ring];
    if (!cell) {
      console.warn(
        `OUTER_TRACK[${ring}] missing (local ${position}, ${color})`,
      );
      return { x: 0, y: 0.09, z: 0 };
    }
    const { x, z } = rc(cell[0], cell[1]);
    return { x, y: 0.09, z };
  }

  // FALLBACK (should never reach here)

  console.warn(`Unexpected position ${position} for ${color}`);
  const [row, col] = YARD[color][tokenIndex] ?? [7, 7];
  const { x, z } = rc(row, col);
  return { x, y: 0.08, z };
}
