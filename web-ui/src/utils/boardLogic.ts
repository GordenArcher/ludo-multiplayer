import type { Kind, Flag } from "../types/board";

export const CELL = 0.88;

export function cellPos(row: number, col: number): [number, number, number] {
  return [(col - 7) * CELL, 0, (row - 7) * CELL];
}

/**
 * Lane-to-yard visual correspondence (what you see on screen):
 *
 *   col 7, rows 1-5   → visually connects to GREEN yard (top-right) → lane_green
 *   row 7, cols 9-13  → visually connects to BLUE yard (bottom-right) → lane_blue
 *   col 7, rows 9-13  → visually connects to YELLOW yard (bottom-left) → lane_yellow
 *   row 7, cols 1-5   → visually connects to RED yard (top-left) → lane_red
 *
 * The L-shape per player:
 *   Red:    row 6 cols 1-5 (white entry) + row 7 cols 1-5 (red home lane)
 *   Green:  col 8 rows 1-5 (white entry) + col 7 rows 1-5 (green home lane)
 *   Blue:   row 8 cols 9-13 (white entry) + row 7 cols 9-13 (blue home lane)
 *   Yellow: col 6 rows 9-13 (white entry) + col 7 rows 9-13 (yellow home lane)
 */
export function getKind(r: number, c: number): Kind {
  //  Yards (6×6 corners), checked first
  if (r <= 5 && c <= 5) return "yard_red";
  if (r <= 5 && c >= 9) return "yard_green";
  if (r >= 9 && c <= 5) return "yard_yellow";
  if (r >= 9 && c >= 9) return "yard_blue";

  // Home lanes, checked before centre so they take priority
  // RED
  if (c === 7 && r >= 1 && r <= 5) return "lane_green";
  if (r === 6 && c === 1) return "lane_red";
  // GREEN
  if (r === 7 && c >= 9 && c <= 13) return "lane_blue";
  if (r === 1 && c === 8) return "lane_green";
  // YELLOW
  if (r === 7 && c >= 1 && c <= 5) return "lane_red";
  if (r === 13 && c === 6) return "lane_yellow";
  // BLUE
  if (c === 7 && r >= 9 && r <= 13) return "lane_yellow";
  if (r === 8 && c === 13) return "lane_blue";

  // Centre 3×3
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return "center";

  return "path";
}

export function getFlag(r: number, c: number): Flag {
  if (r === 6 && c === 1) return "start_red";
  if (r === 1 && c === 8) return "start_green";
  if (r === 13 && c === 6) return "start_yellow";
  if (r === 8 && c === 13) return "start_blue";

  const safeSpots: [number, number][] = [
    [6, 2],
    [2, 8],
    [8, 12],
    [12, 6],
    [0, 8],
    [6, 14],
    [8, 0],
    [14, 6],
  ];
  if (safeSpots.some(([sr, sc]) => sr === r && sc === c)) return "safe";
  return null;
}

export const COLORS: Record<Kind, string> = {
  yard_red: "#dc2626",
  yard_green: "#16a34a",
  yard_yellow: "#ca8a04",
  yard_blue: "#2563eb",
  lane_red: "#ef4444",
  lane_green: "#22c55e",
  lane_yellow: "#eab308",
  lane_blue: "#3b82f6",
  center: "#fbbf24",
  path: "#f5ead8",
};

export const EMIT: Record<Kind, string> = {
  yard_red: "#7f1d1d",
  yard_green: "#14532d",
  yard_yellow: "#713f12",
  yard_blue: "#1e3a8a",
  lane_red: "#991b1b",
  lane_green: "#166534",
  lane_yellow: "#78350f",
  lane_blue: "#1e3a8a",
  center: "#f59e0b",
  path: "#000000",
};

export const EMIT_INT: Record<Kind, number> = {
  yard_red: 0.22,
  yard_green: 0.22,
  yard_yellow: 0.22,
  yard_blue: 0.22,
  lane_red: 0.28,
  lane_green: 0.28,
  lane_yellow: 0.28,
  lane_blue: 0.28,
  center: 0.35,
  path: 0,
};

export const YARD_CIRCLES = [
  { r: 2.5, c: 2.5, color: "#dc2626", emissive: "#7f1d1d" },
  { r: 2.5, c: 11.5, color: "#16a34a", emissive: "#14532d" },
  { r: 11.5, c: 2.5, color: "#ca8a04", emissive: "#713f12" },
  { r: 11.5, c: 11.5, color: "#2563eb", emissive: "#1e3a8a" },
];

export const TOKENS = [
  {
    color: "#ef4444",
    emissive: "#991b1b",
    positions: [
      [1.8, 1.8],
      [1.8, 3.2],
      [3.2, 1.8],
      [3.2, 3.2],
    ],
  },
  {
    color: "#22c55e",
    emissive: "#166534",
    positions: [
      [1.8, 10.8],
      [1.8, 12.2],
      [3.2, 10.8],
      [3.2, 12.2],
    ],
  },
  {
    color: "#eab308",
    emissive: "#78350f",
    positions: [
      [10.8, 1.8],
      [10.8, 3.2],
      [12.2, 1.8],
      [12.2, 3.2],
    ],
  },
  {
    color: "#3b82f6",
    emissive: "#1e3a8a",
    positions: [
      [10.8, 10.8],
      [10.8, 12.2],
      [12.2, 10.8],
      [12.2, 12.2],
    ],
  },
];
