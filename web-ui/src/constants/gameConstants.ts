import type { PlayerColor } from "../types/game";

/**
 * Maximum number of consecutive sixes allowed
 * Rolling a 6 three times in a row results in turn loss (penalty)
 */
export const MAX_CONSECUTIVE_SIXES = 3;

// POSITION SYSTEM
//
// This defines the internal coordinate system for token positions.
// Must match the position system used in gameLogic.ts
//
// Position values:
//   -1 = yard (home area, token not yet entered)
//    0 = start square (player's entry point onto the board)
//    1-50 = outer track (52 total cells including start at 0)
//   51-55 = home lane (5 colored cells leading to center)
//   56 = finish (reached center star) → token becomes isFinished = true, position = -2

/** Number of outer track cells (local positions 0-50) */
export const TOTAL_PATH_CELLS = 51;

/** First home lane cell (corner of L shape) */
export const HOME_PATH_START = 51;

/** Last home lane cell (adjacent to center) */
export const HOME_PATH_END = 55;

/** Finish position sentinel (reached center star) */
export const FINISH_POSITION = 56;

/**
 * Starting position on main path for each player
 *
 * These determine where tokens spawn when leaving the yard.
 * Positions follow clockwise order starting from Red at position 0.
 *
 * Path order: Red (0) → Green (13) → Yellow (26) → Blue (39)
 */
export const START_POSITIONS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
} as const;

/**
 * Safe spot positions (star squares) on the main path
 * Tokens on these squares cannot be captured by opponents
 *
 * Standard Ludo safe spots at positions: 0, 8, 13, 21, 26, 34, 39, 47
 */
export const SAFE_SPOTS: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Home path positions for each player
 *
 * Each player has 5 home lane cells (local positions 51-55)
 * These are the colored squares leading from the outer track to the center.
 *
 * Note: All players share the same local position numbers (51-55),
 * but they map to different physical cells on the board via HOME_LANES
 * in tokenPositions.ts
 */
export const HOME_PATH: Record<PlayerColor, number[]> = {
  red: [51, 52, 53, 54, 55],
  green: [51, 52, 53, 54, 55],
  yellow: [51, 52, 53, 54, 55],
  blue: [51, 52, 53, 54, 55],
} as const;

/**
 * Default player names for each color
 * Used when player doesn't provide a custom name in the lobby
 */
export const DEFAULT_PLAYER_NAMES: Record<PlayerColor, string> = {
  red: "Red Warrior",
  green: "Green Ranger",
  yellow: "Yellow Knight",
  blue: "Blue Mage",
} as const;

/**
 * Color themes for each player
 * Used throughout the UI for:
 * - Side panel player indicators
 * - Token colors
 * - Turn highlights
 * - Status bars
 *
 * @property primary - Main color for tokens and highlights
 * @property secondary - Darker shade for borders and depth
 * @property glow - Emissive color for subtle glow effects
 */
export const PLAYER_THEMES: Record<
  PlayerColor,
  { primary: string; secondary: string; glow: string }
> = {
  red: { primary: "#ef4444", secondary: "#dc2626", glow: "#991b1b" },
  green: { primary: "#22c55e", secondary: "#16a34a", glow: "#166534" },
  yellow: { primary: "#eab308", secondary: "#ca8a04", glow: "#78350f" },
  blue: { primary: "#3b82f6", secondary: "#2563eb", glow: "#1e3a8a" },
} as const;
