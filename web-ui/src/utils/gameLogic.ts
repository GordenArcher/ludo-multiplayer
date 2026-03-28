import type { PlayerColor, Token, ValidMove, GameState } from "../types/game";
import { MAX_CONSECUTIVE_SIXES } from "../constants/gameConstants";

/**
 * POSITION SYSTEM
 *
 * This defines the internal coordinate system for token positions.
 * The board is represented as a linear path with special zones.
 *
 * Position values:
 *   -1 = yard (home area, token not yet entered)
 *    0 = player's start square (bottom of the L-shaped home lane)
 *    1–50 = rest of outer track (52 total cells including start)
 *   51–55 = home lane (5 cells, the vertical/horizontal part of the L)
 *           local 51 = first home cell (corner of L, adjacent to start)
 *           local 55 = last home cell (adjacent to centre)
 *   56 = FINISH — token reaches centre star (game winning position)
 *   -2 = finished (token has completed the game, sentinel value)
 *
 * Movement rules for home lane:
 *   From local 51 (home entry):
 *     roll 1 → 52, roll 2 → 53, roll 3 → 54, roll 4 → 55, roll 5 → 56 (finish)
 *     roll 6 → 57 = OVERSHOOT → invalid
 *
 * Physical ring mapping:
 *   ringIndex = (localPos + ENTRY_OFFSET[color]) % 52
 *   This maps the linear path to the circular board layout.
 */

/** First home lane cell (corner of L shape) */
export const HOME_START = 51;

/** Last home lane cell (adjacent to centre) */
export const HOME_END = 55;

/** Finish position sentinel (reached centre star) */
export const FINISH_POS = 56;

/**
 * Entry offset for each color on the main path
 * These determine where each player's tokens start on the circular track
 *
 * Red:    0   (top-left)
 * Green:  13  (top-right)
 * Yellow: 26  (bottom-left)
 * Blue:   39  (bottom-right)
 */
export const ENTRY_OFFSET: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/** Safe spots (star squares) on the main path - tokens here cannot be captured */
const SAFE_RING = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

/**
 * Convert local position to ring index on the circular track
 * Used for capture detection and safe spot checking
 *
 * @param localPos - Local position on player's path (0-50)
 * @param color - Player color (determines offset)
 * @returns Ring index on the shared circular track
 */
function toRingIndex(localPos: number, color: PlayerColor): number {
  return (localPos + ENTRY_OFFSET[color]) % 52;
}

/**
 * Check if a position is safe from capture
 * Safe positions include:
 * - Home lane cells (always safe)
 * - Star squares on the main path
 *
 * @param localPos - Local position on player's path
 * @param color - Player color
 * @returns True if position is safe
 */
function isSafe(localPos: number, color: PlayerColor): boolean {
  if (localPos >= HOME_START) return true; // home lane always safe
  return SAFE_RING.has(toRingIndex(localPos, color));
}

/**
 * Create initial tokens for a player
 * All tokens start in yard (position = -1)
 *
 * @param color - Player color
 * @returns Array of 4 tokens with IDs 0-3
 */
export function createInitialTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({ id, position: -1, isFinished: false }));
}

/**
 * Calculate new position after moving a token
 * Handles main path movement, home lane entry, and finish condition
 *
 * @param currentPos - Current position (-1 = yard, 0-50 = main path, 51-55 = home lane)
 * @param dice - Dice value (1-6)
 * @param _color - Player color (unused but kept for API consistency)
 * @returns New position, or null if move is invalid
 */
export function calculateNewPosition(
  currentPos: number,
  dice: number,
  _color: PlayerColor,
): number | null {
  // Token in yard - cannot move without a 6 (handled by caller)
  if (currentPos === -1) return null;

  const newPos = currentPos + dice;

  // Still on outer track (local 0-50)
  if (currentPos <= 50 && newPos <= 50) return newPos;

  // Crossing into home lane or finishing
  if (newPos === FINISH_POS) return FINISH_POS; // exact finish (e.g. at 55, roll 1)
  if (newPos > FINISH_POS) return null; // overshoot — invalid
  if (newPos >= HOME_START) return newPos; // 51-55 — valid home lane cell

  return null;
}

/**
 * Get all valid moves for the current player
 *
 * @param dice - Current dice value (1-6)
 * @param color - Current player color
 * @param tokens - All tokens in the game
 * @returns Array of valid moves with token ID and new position
 */
export function getValidMoves(
  dice: number,
  color: PlayerColor,
  tokens: Record<PlayerColor, Token[]>,
): ValidMove[] {
  const moves: ValidMove[] = [];
  const mine = tokens[color];

  for (const token of mine) {
    // Skip finished tokens
    if (token.isFinished) continue;

    // Token in yard — needs exactly 6 to spawn
    if (token.position === -1) {
      if (dice === 6) {
        moves.push({ tokenId: token.id, newPosition: 0, type: "spawn" });
      }
      continue;
    }

    // Calculate new position based on current position and dice
    const newPos = calculateNewPosition(token.position, dice, color);
    if (newPos === null) continue;

    const isFinish = newPos === FINISH_POS;
    const dest = isFinish ? -2 : newPos;

    // Prevent landing on own token on non-safe outer squares
    if (!isFinish && newPos <= 50) {
      const blocked = mine.some(
        (t) =>
          t.id !== token.id &&
          t.position === newPos &&
          !t.isFinished &&
          !isSafe(newPos, color),
      );
      if (blocked) continue;
    }

    moves.push({
      tokenId: token.id,
      newPosition: dest,
      type: isFinish ? "finish" : "move",
    });
  }

  return moves;
}

/**
 * Find if landing on a position would capture an opponent's token
 *
 * @param localPos - Local position being landed on
 * @param movingColor - Color of the moving player
 * @param tokens - All tokens in the game
 * @returns Captured token info or null if no capture
 */
function findCapture(
  localPos: number,
  movingColor: PlayerColor,
  tokens: Record<PlayerColor, Token[]>,
): { color: PlayerColor; tokenId: number } | null {
  // Home lane positions are always safe
  if (localPos > 50) return null;
  // Safe spots cannot capture
  if (isSafe(localPos, movingColor)) return null;

  const targetRing = toRingIndex(localPos, movingColor);

  // Check all opponents for a token at this ring position
  for (const color of Object.keys(tokens) as PlayerColor[]) {
    if (color === movingColor) continue;
    for (const t of tokens[color]) {
      if (t.isFinished || t.position < 0 || t.position > 50) continue;
      if (toRingIndex(t.position, color) === targetRing) {
        return { color, tokenId: t.id };
      }
    }
  }
  return null;
}

/**
 * Check if a player has won the game
 *
 * @param tokens - All tokens in the game
 * @param color - Player color to check
 * @returns True if all 4 tokens are finished
 */
export function checkWinner(
  tokens: Record<PlayerColor, Token[]>,
  color: PlayerColor,
): boolean {
  return tokens[color].every((t) => t.isFinished);
}

/**
 * Determine if player gets an extra turn
 * Rolling a 6 gives an extra turn, unless it's the third consecutive six
 *
 * @param diceValue - Current dice roll
 * @param consecutiveSixes - Number of consecutive sixes rolled
 * @returns True if player gets another turn
 */
export function shouldGetExtraTurn(
  diceValue: number,
  consecutiveSixes: number,
): boolean {
  return diceValue === 6 && consecutiveSixes < MAX_CONSECUTIVE_SIXES;
}

/**
 * Execute a move and return updated game state
 * Pure function - does not mutate input
 *
 * Process:
 * 1. Validate move is legal
 * 2. Deep copy tokens
 * 3. Check for capture and reset captured token if applicable
 * 4. Update token position
 * 5. Check for winner
 * 6. Determine next player (extra turn if rolled 6 or captured)
 * 7. Return new game state
 *
 * @param state - Current game state
 * @param tokenId - ID of token to move
 * @param newPosition - New position for the token
 * @returns Updated game state or null if move is invalid
 */
export function executeMove(
  state: GameState,
  tokenId: number,
  newPosition: number,
): GameState | null {
  // Validate dice has been rolled
  if (state.diceValue === null) {
    console.warn("executeMove: no dice — roll first");
    return null;
  }

  const color = state.players[state.currentPlayerIndex].color;

  // Verify move is legal
  const legal = getValidMoves(state.diceValue, color, state.tokens);
  const move = legal.find(
    (m) => m.tokenId === tokenId && m.newPosition === newPosition,
  );

  if (!move) {
    console.warn("executeMove: illegal move", { tokenId, newPosition, legal });
    return null;
  }

  // Deep copy tokens to avoid mutation
  const newTokens: Record<PlayerColor, Token[]> = {
    red: state.tokens.red.map((t) => ({ ...t })),
    green: state.tokens.green.map((t) => ({ ...t })),
    yellow: state.tokens.yellow.map((t) => ({ ...t })),
    blue: state.tokens.blue.map((t) => ({ ...t })),
  };

  // Find token index
  const tIdx = newTokens[color].findIndex((t) => t.id === tokenId);
  if (tIdx === -1) return null;

  // Handle capture on main path positions
  let didCapture = false;
  if (newPosition >= 0 && newPosition <= 50) {
    const cap = findCapture(newPosition, color, newTokens);
    if (cap) {
      const cIdx = newTokens[cap.color].findIndex((t) => t.id === cap.tokenId);
      if (cIdx !== -1) {
        // Send captured token back home
        newTokens[cap.color][cIdx] = {
          ...newTokens[cap.color][cIdx],
          position: -1,
        };
        didCapture = true;
      }
    }
  }

  // Update moving token position
  if (newPosition === -2) {
    // Token finished the game
    newTokens[color][tIdx] = {
      ...newTokens[color][tIdx],
      position: -2,
      isFinished: true,
    };
  } else {
    // Normal movement
    newTokens[color][tIdx] = {
      ...newTokens[color][tIdx],
      position: newPosition,
    };
  }

  // Check for winner
  const winner = checkWinner(newTokens, color) ? color : null;

  // Update consecutive sixes counter
  const newConsec = state.diceValue === 6 ? state.consecutiveSixes + 1 : 0;

  // Determine extra turn: rolled 6 (not penalty) OR captured a token
  const extraTurn =
    !winner &&
    (shouldGetExtraTurn(state.diceValue, state.consecutiveSixes) || didCapture);

  // Next player index (stay same for extra turn)
  const nextIdx = extraTurn
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex + 1) % state.players.length;

  // Return updated game state
  return {
    ...state,
    tokens: newTokens,
    currentPlayerIndex: nextIdx,
    diceValue: null,
    consecutiveSixes: newConsec,
    winner,
    status: winner ? "finished" : "waiting",
    validMoves: [],
    selectedTokenId: null,
  };
}
