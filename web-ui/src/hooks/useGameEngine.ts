import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  GameState,
  Player,
  ValidMove,
  MoveResult,
  PlayerColor,
  Token,
} from "../types/game";
import {
  createInitialTokens,
  getValidMoves,
  executeMove,
  shouldGetExtraTurn,
} from "../utils/gameLogic";
import { MAX_CONSECUTIVE_SIXES } from "../constants/gameConstants";

/**
 * STATUS VALUES
 *
 * "waiting"  — idle, waiting for the current player to roll
 * "rolling"  — dice animation playing (spinner shown)
 * "rolled"   — dice settled, face visible, waiting for move or auto-pass
 * "finished" — game over
 *
 * The missing "rolled" status was the root cause of the dice never showing.
 * Previously after rolling, state went straight back to "waiting", which:
 *   - Made canRoll true again while diceValue was briefly set (UI flicker)
 *   - Made the no-moves path clear diceValue instantly (player never saw number)
 *   - Made the SidePanel's displayedValue delay miss the window entirely
 */

export const useGameEngine = (players: Player[]) => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    players,
    tokens: {
      red: createInitialTokens("red"),
      green: createInitialTokens("green"),
      yellow: createInitialTokens("yellow"),
      blue: createInitialTokens("blue"),
    },
    currentPlayerIndex: 0,
    diceValue: null,
    consecutiveSixes: 0,
    winner: null,
    status: "waiting",
    validMoves: [],
    selectedTokenId: null,
  }));

  const aiProcessingRef = useRef(false);
  // Auto-pass timer ref so we can cancel if the player moves first
  const autoPassTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPlayer = useMemo(
    () =>
      gameState.players.length
        ? gameState.players[gameState.currentPlayerIndex]
        : null,
    [gameState.players, gameState.currentPlayerIndex],
  );

  const isHumanTurn = useMemo(() => {
    if (!currentPlayer) return false;
    if (gameState.winner) return false;
    // Allow interaction in both "waiting" (pre-roll) and "rolled" (picking a token)
    if (gameState.status !== "waiting" && gameState.status !== "rolled")
      return false;
    return currentPlayer.type === "human";
  }, [currentPlayer, gameState.winner, gameState.status]);

  const validMoves = useMemo(() => {
    if (!gameState.diceValue) return [];
    if (!currentPlayer) return [];
    return getValidMoves(
      gameState.diceValue,
      currentPlayer.color,
      gameState.tokens,
    );
  }, [gameState.diceValue, currentPlayer, gameState.tokens]);

  const shouldAIPlay = useMemo(() => {
    if (!currentPlayer) return false;
    if (gameState.winner) return false;
    if (gameState.status !== "waiting") return false;
    if (aiProcessingRef.current) return false;
    return currentPlayer.type === "ai";
  }, [currentPlayer, gameState.winner, gameState.status]);

  // Human: Roll Dice
  const rollDice = useCallback(async (): Promise<number | null> => {
    if (gameState.status !== "waiting") return null;
    if (gameState.winner) return null;
    if (!isHumanTurn) return null;
    if (gameState.diceValue !== null) return null;

    const value = Math.floor(Math.random() * 6) + 1;

    // Phase 1: spinner
    setGameState((prev) => ({
      ...prev,
      diceValue: value,
      status: "rolling",
    }));

    await new Promise((r) => setTimeout(r, 800));

    // Phase 2: settle, ALWAYS keep diceValue so the face shows
    setGameState((prev) => {
      const newConsec = value === 6 ? prev.consecutiveSixes + 1 : 0;
      const isPenalty = newConsec >= MAX_CONSECUTIVE_SIXES;
      const color = prev.players[prev.currentPlayerIndex].color;
      const moves = isPenalty ? [] : getValidMoves(value, color, prev.tokens);

      return {
        ...prev,
        diceValue: value, // keep visible, cleared by move or auto-pass
        consecutiveSixes: newConsec,
        validMoves: moves,
        status: "rolled", // new status: dice face showing
      };
    });

    // Phase 3: schedule auto-pass after 1200ms if no moves
    // (If player has moves and clicks a token, makeMove cancels this timer)
    autoPassTimerRef.current = setTimeout(() => {
      setGameState((prev) => {
        if (prev.status !== "rolled") return prev;
        if (prev.validMoves.length > 0) return prev; // player has moves, don't auto-pass

        const isPenalty = prev.consecutiveSixes >= MAX_CONSECUTIVE_SIXES;
        return {
          ...prev,
          diceValue: null,
          consecutiveSixes: isPenalty ? 0 : prev.consecutiveSixes,
          status: "waiting",
          validMoves: [],
          currentPlayerIndex:
            (prev.currentPlayerIndex + 1) % prev.players.length,
        };
      });
    }, 1200);

    return value;
  }, [gameState.status, gameState.winner, gameState.diceValue, isHumanTurn]);

  // Human: Make Move
  const makeMove = useCallback(
    (tokenId: number, newPosition: number): MoveResult => {
      if (gameState.status !== "rolled" && gameState.status !== "waiting") {
        return { success: false, extraTurn: false };
      }
      if (!gameState.diceValue) return { success: false, extraTurn: false };
      if (!currentPlayer) return { success: false, extraTurn: false };

      // Cancel auto-pass, player is making a move
      if (autoPassTimerRef.current) {
        clearTimeout(autoPassTimerRef.current);
        autoPassTimerRef.current = null;
      }

      const newState = executeMove(
        { ...gameState, validMoves },
        tokenId,
        newPosition,
      );
      if (!newState) return { success: false, extraTurn: false };

      const wasSix = gameState.diceValue === 6;
      const extraTurn = shouldGetExtraTurn(
        wasSix ? gameState.diceValue! : 0,
        gameState.consecutiveSixes,
      );
      const wasWinner = !!newState.winner;

      let captured: { color: PlayerColor; tokenId: number } | undefined;
      if (!wasWinner) {
        for (const color of Object.keys(newState.tokens) as PlayerColor[]) {
          const oldTokens = gameState.tokens[color];
          const newTokens = newState.tokens[color];
          for (let i = 0; i < oldTokens.length; i++) {
            if (
              oldTokens[i].position === newPosition &&
              newTokens[i].position === -1
            ) {
              captured = { color, tokenId: oldTokens[i].id };
              break;
            }
          }
        }
      }

      setGameState(newState);
      return {
        success: true,
        captured,
        extraTurn: extraTurn && !wasWinner,
        winner: newState.winner || undefined,
      };
    },
    [gameState, currentPlayer, validMoves],
  );

  // Human: Select Token
  const selectToken = useCallback(
    (tokenId: number) => {
      if (gameState.status !== "rolled" && gameState.status !== "waiting")
        return;
      if (gameState.validMoves.length === 0) return;
      if (gameState.validMoves.some((m) => m.tokenId === tokenId)) {
        setGameState((prev) => ({ ...prev, selectedTokenId: tokenId }));
      }
    },
    [gameState.status, gameState.validMoves],
  );

  // Reset
  const resetGame = useCallback(() => {
    if (autoPassTimerRef.current) {
      clearTimeout(autoPassTimerRef.current);
      autoPassTimerRef.current = null;
    }
    aiProcessingRef.current = false;
    setGameState({
      players,
      tokens: {
        red: createInitialTokens("red"),
        green: createInitialTokens("green"),
        yellow: createInitialTokens("yellow"),
        blue: createInitialTokens("blue"),
      },
      currentPlayerIndex: 0,
      diceValue: null,
      consecutiveSixes: 0,
      winner: null,
      status: "waiting",
      validMoves: [],
      selectedTokenId: null,
    });
  }, [players]);

  // AI Turn Handler
  /**
   * Every AI turn follows this exact sequence:
   *
   *   600ms   thinking pause
   *   → status="rolling", diceValue=value   (spinner)
   *   900ms   spin
   *   → status="rolled",  diceValue=value   (face visible, player reads number)
   *   900ms   show pause
   *   → [penalty]  700ms extra → clear diceValue → advance turn
   *   → [no moves] 700ms extra → clear diceValue → advance turn
   *   → [move]     400ms deliberate pause → executeMove (keep diceValue)
   *   700ms   result visible (token has moved, dice face still showing)
   *   → commit nextState with diceValue=null, status="waiting"
   *   → aiProcessingRef=false → shouldAIPlay re-fires for extra turn if earned
   */
  useEffect(() => {
    if (!shouldAIPlay) return;
    if (!currentPlayer) return;

    aiProcessingRef.current = true;
    const color = currentPlayer.color;

    const playAITurn = async () => {
      // Thinking pause
      await new Promise((r) => setTimeout(r, 600));

      const value = Math.floor(Math.random() * 6) + 1;
      console.log("AI rolled:", value);

      // Snapshot fresh state
      let snapConsec = 0;
      let snapTokens = {} as Record<PlayerColor, Token[]>;
      setGameState((prev) => {
        snapConsec = prev.consecutiveSixes;
        snapTokens = prev.tokens;
        return prev;
      });
      await new Promise((r) => setTimeout(r, 0));

      const newConsec = value === 6 ? snapConsec + 1 : 0;
      const isPenalty = newConsec >= MAX_CONSECUTIVE_SIXES;

      // Phase 1: spinner
      setGameState((prev) => ({
        ...prev,
        diceValue: value,
        status: "rolling",
      }));
      await new Promise((r) => setTimeout(r, 900));

      // Phase 2: face visible
      setGameState((prev) => ({
        ...prev,
        status: "rolled",
        consecutiveSixes: newConsec,
      }));
      await new Promise((r) => setTimeout(r, 900));

      // Penalty
      if (isPenalty) {
        await new Promise((r) => setTimeout(r, 700));
        aiProcessingRef.current = false;
        setGameState((prev) => ({
          ...prev,
          diceValue: null,
          consecutiveSixes: 0,
          status: "waiting",
          currentPlayerIndex:
            (prev.currentPlayerIndex + 1) % prev.players.length,
        }));
        return;
      }

      const moves = getValidMoves(value, color, snapTokens);
      console.log("AI valid moves:", moves.length);

      // No moves
      if (moves.length === 0) {
        await new Promise((r) => setTimeout(r, 700));
        aiProcessingRef.current = false;
        setGameState((prev) => ({
          ...prev,
          diceValue: null,
          consecutiveSixes: newConsec,
          status: "waiting",
          currentPlayerIndex:
            (prev.currentPlayerIndex + 1) % prev.players.length,
        }));
        return;
      }

      const move = chooseBestMove(moves, snapTokens, color);
      console.log("AI moving:", move);

      await new Promise((r) => setTimeout(r, 400));

      // Phase 3: execute move, keep diceValue visible
      let nextState: GameState | null = null;

      setGameState((prev) => {
        const stateForMove: GameState = {
          ...prev,
          diceValue: value,
          consecutiveSixes: newConsec,
          validMoves: moves,
        };
        const result = executeMove(
          stateForMove,
          move.tokenId,
          move.newPosition,
        );
        if (!result) {
          nextState = null;
          return {
            ...prev,
            diceValue: null,
            status: "waiting",
            currentPlayerIndex:
              (prev.currentPlayerIndex + 1) % prev.players.length,
          };
        }
        nextState = result;
        // Patch diceValue back, cleared after result pause
        return { ...result, diceValue: value, status: "rolled" };
      });

      await new Promise((r) => setTimeout(r, 0));

      if (!nextState) {
        aiProcessingRef.current = false;
        return;
      }

      // Phase 4: result visible after move
      await new Promise((r) => setTimeout(r, 700));

      // CRITICAL: spread nextState (not prev) to preserve tokens + currentPlayerIndex
      aiProcessingRef.current = false;
      setGameState({
        ...nextState!,
        diceValue: null,
        status: nextState!.winner ? "finished" : "waiting",
      });
    };

    playAITurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAIPlay, currentPlayer?.color]);

  return {
    gameState,
    isHumanTurn,
    currentPlayer,
    validMoves,
    rollDice,
    makeMove,
    selectToken,
    resetGame,
    shouldAIPlay,
  };
};

function chooseBestMove(
  moves: ValidMove[],
  tokens: Record<PlayerColor, Token[]>,
  color: PlayerColor,
): ValidMove {
  const finish = moves.find((m) => m.type === "finish");
  if (finish) return finish;

  const moveMoves = moves.filter((m) => m.type === "move");
  if (moveMoves.length > 0) {
    const myTokens = tokens[color];
    return moveMoves.reduce((best, m) => {
      const pos = myTokens.find((t) => t.id === m.tokenId)?.position ?? -1;
      const bestPos =
        myTokens.find((t) => t.id === best.tokenId)?.position ?? -1;
      return pos > bestPos ? m : best;
    });
  }

  return moves.find((m) => m.type === "spawn") ?? moves[0];
}
