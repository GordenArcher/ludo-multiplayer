/**
 * gameLogic.ts, Pure Ludo game logic
 *
 * POSITION VALUES
 *
 *  -1 → in home yard
 *   0–51 -> on the shared outer track  (52 cells, clockwise)
 *  52–56 -> on the player's coloured home lane (5 cells)
 *  isFinished = true -> token has completed the journey
 *
 * PER-PLAYER TRACK ENTRY
 *
 * The outer track is a shared 52-cell ring. Each player has their own
 * entry point. When a token is at outer-track position P, that maps to
 * a different physical square for each colour.
 *
 * We use a LOCAL position system: position 0 is always the player's own
 * starting square, positions increase clockwise. After 51 the token turns
 * into the home lane (positions 52-56).
 *
 * ENTRY OFFSETS (where each colour's start square sits on the shared ring)
 *   Red -> 0 (ring position 0  = [6,1])
 *   Green -> 13 (ring position 13 = [1,8])
 *   Yellow -> 26 (ring position 26 = [8,13])
 *   Blue -> 39 (ring position 39 = [13,6])
 *
 * Physical ring index = (localPosition + ENTRY_OFFSET[color]) % 52
 * This conversion is only needed for rendering (tokenPositions.ts handles it)
 * and for capture detection (comparing physical squares).
 */

import type { PlayerColor, Token, ValidMove, GameState } from "../types/game";
import { MAX_CONSECUTIVE_SIXES } from "../constants/gameConstants";

//  Constants

export const TOTAL_OUTER_CELLS = 52;
export const HOME_LANE_LENGTH = 5; // positions 52-56
export const FINISH_POSITION = 57; // sentinel, means "finished"

/**
 * The physical ring index (0-51) at which each player enters the track.
 * Tokens start at this ring index when they leave the yard.
 */
export const ENTRY_OFFSET: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/**
 * Safe ring indices (physical positions on the shared outer track).
 * Tokens on these squares cannot be captured.
 * Includes all four starting squares plus the four star safe squares.
 */
const SAFE_RING_INDICES = new Set<number>([
  0, // Red start
  8, // Safe star (between red & green)
  13, // Green start
  21, // Safe star (between green & yellow)
  26, // Yellow start
  34, // Safe star (between yellow & blue)
  39, // Blue start
  47, // Safe star (between blue & red)
]);

//  Helpers

/**
 * Convert a token's LOCAL position to the shared ring index.
 * Only valid for positions 0-51 (outer track).
 */
function toRingIndex(localPos: number, color: PlayerColor): number {
  return (localPos + ENTRY_OFFSET[color]) % TOTAL_OUTER_CELLS;
}

/**
 * Convert a shared ring index back to a player's local position.
 * Returns -1 if the ring index is behind the player's entry point
 * (i.e., they haven't passed there yet this lap, shouldn't happen in
 * normal play but useful as a safety check).
 */
function toLocalPosition(ringIndex: number, color: PlayerColor): number {
  return (
    (ringIndex - ENTRY_OFFSET[color] + TOTAL_OUTER_CELLS) % TOTAL_OUTER_CELLS
  );
}

function isSafeLocalPosition(localPos: number, color: PlayerColor): boolean {
  // Home lane squares are always safe
  if (localPos >= 52) return true;
  // Check shared ring safe spots
  const ring = toRingIndex(localPos, color);
  return SAFE_RING_INDICES.has(ring);
}

//  Token creation

export function createInitialTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    position: -1,
    isFinished: false,
  }));
}

//  Move calculation

/**
 * Given a token's current LOCAL position and a dice roll, return the new
 * local position, or null if the move is not possible.
 *
 * Returns FINISH_POSITION (57) if the token completes its journey.
 * Returns null if the dice value would overshoot the home lane.
 */
export function calculateNewPosition(
  currentPos: number,
  dice: number,
  color: PlayerColor,
): number | null {
  // Token in yard, only a 6 can bring it out
  if (currentPos === -1) {
    return null; // handled separately in getValidMoves
  }

  const newPos = currentPos + dice;

  // Still on the outer track
  if (newPos < TOTAL_OUTER_CELLS) {
    return newPos;
  }

  // Entering or moving along the home lane
  // newPos === 52 means first cell of home lane
  // newPos === 56 means last cell of home lane
  // newPos === 57 means exactly finishing — valid only if exact
  if (newPos <= 56) {
    return newPos; // 52-56 = home lane cells
  }

  if (newPos === FINISH_POSITION) {
    return FINISH_POSITION; // exact finish
  }

  // Overshot, cannot move this token
  return null;
}

//  Valid moves

/**
 * Return all valid moves for the current player given a dice roll.
 * A move is only generated here, tokens can ONLY move via this function's
 * output. executeMove validates against it before doing anything.
 */
export function getValidMoves(
  dice: number,
  color: PlayerColor,
  tokens: Record<PlayerColor, Token[]>,
): ValidMove[] {
  const moves: ValidMove[] = [];
  const myTokens = tokens[color];

  for (const token of myTokens) {
    if (token.isFinished) continue;

    // Token in yard: needs a 6
    if (token.position === -1) {
      if (dice === 6) {
        // Check the starting square isn't blocked by two own tokens
        // (in standard Ludo you can stack your own, but you can't enter
        //  if the spot has 2+ of your own, we allow stacking for simplicity)
        moves.push({
          tokenId: token.id,
          newPosition: 0, // local position 0 = this player's start square
          type: "spawn",
        });
      }
      continue;
    }

    // Token on board
    const newPos = calculateNewPosition(token.position, dice, color);

    if (newPos === null) continue; // overshoot or invalid

    // Can't land on own token (unless it's a safe/star square, stack allowed there)
    if (newPos !== FINISH_POSITION && newPos < 52) {
      const blocked = myTokens.some(
        (t) =>
          t.id !== token.id &&
          t.position === newPos &&
          !t.isFinished &&
          !isSafeLocalPosition(newPos, color),
      );
      if (blocked) continue;
    }

    moves.push({
      tokenId: token.id,
      newPosition: newPos === FINISH_POSITION ? -2 : newPos,
      type: newPos === FINISH_POSITION ? "finish" : "move",
    });
  }

  return moves;
}

// Capture detection

/**
 * Check whether landing at `localPos` captures an enemy token.
 * Only possible on the outer track (localPos 0-51) and only on non-safe squares.
 */
function findCapturedToken(
  localPos: number,
  movingColor: PlayerColor,
  tokens: Record<PlayerColor, Token[]>,
): { color: PlayerColor; tokenId: number } | null {
  // No captures on home lane or safe squares
  if (localPos >= 52) return null;
  if (isSafeLocalPosition(localPos, movingColor)) return null;

  // The physical ring square we're landing on
  const targetRing = toRingIndex(localPos, movingColor);

  for (const color of Object.keys(tokens) as PlayerColor[]) {
    if (color === movingColor) continue;
    for (const token of tokens[color]) {
      if (token.isFinished || token.position < 0 || token.position >= 52)
        continue;
      const theirRing = toRingIndex(token.position, color);
      if (theirRing === targetRing) {
        return { color, tokenId: token.id };
      }
    }
  }

  return null;
}

//  Win check

export function checkWinner(
  tokens: Record<PlayerColor, Token[]>,
  color: PlayerColor,
): boolean {
  return tokens[color].every((t) => t.isFinished);
}

//  Extra turn

export function shouldGetExtraTurn(
  diceValue: number,
  consecutiveSixes: number,
): boolean {
  // Rolling a 6 gives an extra turn unless it's the 3rd consecutive 6
  return diceValue === 6 && consecutiveSixes < MAX_CONSECUTIVE_SIXES;
}

//  Execute move

/**
 * Apply a move to the game state. Returns the new state or null if invalid.
 *
 * STRICT VALIDATION, a move is only applied if:
 *  1. There is an active dice value
 *  2. The (tokenId, newPosition) pair exists in getValidMoves()
 */
export function executeMove(
  state: GameState,
  tokenId: number,
  newPosition: number,
): GameState | null {
  //   must have rolled
  if (state.diceValue === null) {
    console.warn("executeMove: no dice value, roll first");
    return null;
  }

  const color = state.players[state.currentPlayerIndex].color;

  //  validate against legal moves
  const legalMoves = getValidMoves(state.diceValue, color, state.tokens);
  const move = legalMoves.find(
    (m) => m.tokenId === tokenId && m.newPosition === newPosition,
  );
  if (!move) {
    console.warn("executeMove: not a legal move", {
      tokenId,
      newPosition,
      legalMoves,
    });
    return null;
  }

  //  Deep-copy tokens
  const newTokens: Record<PlayerColor, Token[]> = {
    red: state.tokens.red.map((t) => ({ ...t })),
    green: state.tokens.green.map((t) => ({ ...t })),
    yellow: state.tokens.yellow.map((t) => ({ ...t })),
    blue: state.tokens.blue.map((t) => ({ ...t })),
  };

  const tokenIdx = newTokens[color].findIndex((t) => t.id === tokenId);
  if (tokenIdx === -1) return null;

  const token = newTokens[color][tokenIdx];

  //  Handle capture
  let didCapture = false;
  if (newPosition >= 0 && newPosition < 52) {
    const cap = findCapturedToken(newPosition, color, newTokens);
    if (cap) {
      const capIdx = newTokens[cap.color].findIndex(
        (t) => t.id === cap.tokenId,
      );
      if (capIdx !== -1) {
        newTokens[cap.color][capIdx] = {
          ...newTokens[cap.color][capIdx],
          position: -1,
        };
        didCapture = true;
      }
    }
  }

  //  Update token
  if (newPosition === -2) {
    // Finish
    newTokens[color][tokenIdx] = { ...token, position: -2, isFinished: true };
  } else {
    newTokens[color][tokenIdx] = { ...token, position: newPosition };
  }

  //  Win check
  const winner = checkWinner(newTokens, color) ? color : null;

  //  Extra turn?
  const newConsecutiveSixes =
    state.diceValue === 6 ? state.consecutiveSixes + 1 : 0;

  const extraTurn =
    !winner &&
    (shouldGetExtraTurn(state.diceValue, state.consecutiveSixes) || didCapture);

  const nextPlayerIndex = extraTurn
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    tokens: newTokens,
    currentPlayerIndex: nextPlayerIndex,
    diceValue: null, // always clear dice after a move
    consecutiveSixes: newConsecutiveSixes,
    winner,
    status: winner ? "finished" : "waiting",
    validMoves: [],
    selectedTokenId: null,
  };
}
