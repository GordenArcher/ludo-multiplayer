import type { PlayerColor } from "../types/game";

/**
 * Maximum consecutive sixes before losing your turn
 */
export const MAX_CONSECUTIVE_SIXES = 3;

/**
 * Default display names
 */
export const DEFAULT_PLAYER_NAMES: Record<PlayerColor, string> = {
  red: "Red Warrior",
  green: "Green Ranger",
  yellow: "Yellow Knight",
  blue: "Blue Mage",
} as const;

/**
 * UI colour themes
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

//  The constants below are kept for backward compatibility but the canonical
//    source of truth for movement logic is now gameLogic.ts

export const TOTAL_PATH_CELLS = 52;

/**
 * Local position 0 is always each player's own start square.
 * These are the physical ring offsets, exported for any code that still
 * references START_POSITIONS, but gameLogic.ts uses ENTRY_OFFSET internally.
 */
export const START_POSITIONS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
} as const;

/**
 * Home lane positions per player (local positions 52-56).
 * Exported for any legacy references, gameLogic.ts computes these inline.
 */
export const HOME_PATH: Record<PlayerColor, number[]> = {
  red: [52, 53, 54, 55, 56],
  green: [52, 53, 54, 55, 56],
  yellow: [52, 53, 54, 55, 56],
  blue: [52, 53, 54, 55, 56],
} as const;

/**
 * Safe ring indices on the outer track (physical, not per-player local).
 * Includes all four start squares and the four star safe squares.
 */
export const SAFE_SPOTS: number[] = [0, 8, 13, 21, 26, 34, 39, 47];
