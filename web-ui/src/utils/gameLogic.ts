import type { PlayerColor, Token, ValidMove, GameState } from "../types/game";
import { MAX_CONSECUTIVE_SIXES } from "../constants/gameConstants";

/**
 * POSITION SYSTEM
 *
 *   -1 = yard
 *    0 = player's start square
 *    1–50 = outer track
 *   51–55 = home lane
 *   56 = FINISH (center star)
 *   -2 = finished (sentinel)
 */

export const HOME_START = 51;
export const HOME_END = 55;
export const FINISH_POS = 56;

export const ENTRY_OFFSET: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

const SAFE_RING = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

function toRingIndex(localPos: number, color: PlayerColor): number {
  return (localPos + ENTRY_OFFSET[color]) % 52;
}

function isSafe(localPos: number, color: PlayerColor): boolean {
  if (localPos >= HOME_START) return true;
  return SAFE_RING.has(toRingIndex(localPos, color));
}

export function createInitialTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({ id, position: -1, isFinished: false }));
}

export function calculateNewPosition(
  currentPos: number,
  dice: number,
  _color: PlayerColor,
): number | null {
  if (currentPos === -1) return null;

  const newPos = currentPos + dice;

  if (currentPos <= 50 && newPos <= 50) return newPos;
  if (newPos === FINISH_POS) return FINISH_POS;
  if (newPos > FINISH_POS) return null;
  if (newPos >= HOME_START) return newPos;

  return null;
}

export function getValidMoves(
  dice: number,
  color: PlayerColor,
  tokens: Record<PlayerColor, Token[]>,
): ValidMove[] {
  const moves: ValidMove[] = [];
  const mine = tokens[color];

  for (const token of mine) {
    if (token.isFinished) continue;

    if (token.position === -1) {
      if (dice === 6) {
        moves.push({ tokenId: token.id, newPosition: 0, type: "spawn" });
      }
      continue;
    }

    const newPos = calculateNewPosition(token.position, dice, color);
    if (newPos === null) continue;

    const isFinish = newPos === FINISH_POS;
    const dest = isFinish ? -2 : newPos;

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

function findCapture(
  localPos: number,
  movingColor: PlayerColor,
  tokens: Record<PlayerColor, Token[]>,
): { color: PlayerColor; tokenId: number } | null {
  if (localPos > 50) return null;
  if (isSafe(localPos, movingColor)) return null;

  const targetRing = toRingIndex(localPos, movingColor);

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

export function checkWinner(
  tokens: Record<PlayerColor, Token[]>,
  color: PlayerColor,
): boolean {
  return tokens[color].every((t) => t.isFinished);
}

export function shouldGetExtraTurn(
  diceValue: number,
  consecutiveSixes: number,
): boolean {
  return diceValue === 6 && consecutiveSixes < MAX_CONSECUTIVE_SIXES;
}

/**
 * Execute a move and return updated game state.
 *
 * FIX #3 — consecutiveSixes double-increment removed.
 *
 * Previously this function recomputed `newConsec` from `state.consecutiveSixes`,
 * but the caller (rollDice / AI handler) had ALREADY incremented it before
 * calling executeMove. This caused the count to be incremented twice, making
 * the penalty trigger one turn early.
 *
 * Fix: executeMove now trusts `state.consecutiveSixes` as already being the
 * updated value (post-roll). It does NOT add 1 again. The callers are
 * responsible for passing in the already-updated consecutiveSixes.
 */
export function executeMove(
  state: GameState,
  tokenId: number,
  newPosition: number,
): GameState | null {
  if (state.diceValue === null) {
    console.warn("executeMove: no dice — roll first");
    return null;
  }

  const color = state.players[state.currentPlayerIndex].color;

  const legal = getValidMoves(state.diceValue, color, state.tokens);
  const move = legal.find(
    (m) => m.tokenId === tokenId && m.newPosition === newPosition,
  );

  if (!move) {
    console.warn("executeMove: illegal move", { tokenId, newPosition, legal });
    return null;
  }

  const newTokens: Record<PlayerColor, Token[]> = {
    red: state.tokens.red.map((t) => ({ ...t })),
    green: state.tokens.green.map((t) => ({ ...t })),
    yellow: state.tokens.yellow.map((t) => ({ ...t })),
    blue: state.tokens.blue.map((t) => ({ ...t })),
  };

  const tIdx = newTokens[color].findIndex((t) => t.id === tokenId);
  if (tIdx === -1) return null;

  let didCapture = false;
  if (newPosition >= 0 && newPosition <= 50) {
    const cap = findCapture(newPosition, color, newTokens);
    if (cap) {
      const cIdx = newTokens[cap.color].findIndex((t) => t.id === cap.tokenId);
      if (cIdx !== -1) {
        newTokens[cap.color][cIdx] = {
          ...newTokens[cap.color][cIdx],
          position: -1,
        };
        didCapture = true;
      }
    }
  }

  if (newPosition === -2) {
    newTokens[color][tIdx] = {
      ...newTokens[color][tIdx],
      position: -2,
      isFinished: true,
    };
  } else {
    newTokens[color][tIdx] = {
      ...newTokens[color][tIdx],
      position: newPosition,
    };
  }

  const winner = checkWinner(newTokens, color) ? color : null;

  // FIX #3 — do NOT recompute consecutiveSixes here.
  // state.consecutiveSixes was already set to the post-roll value by the caller.
  // We just carry it forward as-is.
  const currentConsec = state.consecutiveSixes;

  // Extra turn: rolled 6 (not penalty) OR captured a token
  const extraTurn =
    !winner &&
    (shouldGetExtraTurn(state.diceValue, currentConsec) || didCapture);

  const nextIdx = extraTurn
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    tokens: newTokens,
    currentPlayerIndex: nextIdx,
    diceValue: null,
    consecutiveSixes: currentConsec,
    winner,
    status: winner ? "finished" : "waiting",
    validMoves: [],
    selectedTokenId: null,
  };
}
