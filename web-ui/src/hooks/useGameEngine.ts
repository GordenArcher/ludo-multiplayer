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
  const autoPassTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * aiTurnTrigger: a counter incremented each time an AI turn must begin.
   *
   * We cannot rely on [shouldAIPlay, currentPlayer?.color] as the effect
   * dependency because when the same AI player earns an extra turn (rolled 6),
   * neither value changes, so React skips the effect entirely and the game
   * freezes. Using a counter guarantees the effect always re-runs.
   */
  const [aiTurnTrigger, setAiTurnTrigger] = useState(0);

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

  // Bridge: fires when a different AI player's turn starts (color/index changes)
  useEffect(() => {
    if (!shouldAIPlay) return;
    setAiTurnTrigger((n) => n + 1);
  }, [shouldAIPlay]);

  // Human: Roll Dice
  const rollDice = useCallback(async (): Promise<number | null> => {
    if (gameState.status !== "waiting") return null;
    if (gameState.winner) return null;
    if (!isHumanTurn) return null;
    if (gameState.diceValue !== null) return null;

    const value = Math.floor(Math.random() * 6) + 1;

    setGameState((prev) => ({ ...prev, diceValue: value, status: "rolling" }));
    await new Promise((r) => setTimeout(r, 800));

    setGameState((prev) => {
      const newConsec = value === 6 ? prev.consecutiveSixes + 1 : 0;
      const isPenalty = newConsec >= MAX_CONSECUTIVE_SIXES;
      const color = prev.players[prev.currentPlayerIndex].color;
      const moves = isPenalty ? [] : getValidMoves(value, color, prev.tokens);
      return {
        ...prev,
        diceValue: value,
        consecutiveSixes: newConsec,
        validMoves: moves,
        status: "rolled",
      };
    });

    autoPassTimerRef.current = setTimeout(() => {
      setGameState((prev) => {
        if (prev.status !== "rolled") return prev;
        if (prev.validMoves.length > 0) return prev;
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

  /**
   * AI Turn Handler
   *
   * KEY DESIGN RULE: executeMove() is the single source of truth for
   * currentPlayerIndex and consecutiveSixes after a move. We do NOT override
   * those fields, we just check whether executeMove kept the same index
   * (extra turn) or advanced it (normal turn end).
   *
   * For the extra-turn case we call setAiTurnTrigger directly instead of
   * relying on shouldAIPlay re-evaluating, because when the same player keeps
   * their turn, currentPlayer.color doesn't change so the bridge effect above
   * would never re-fire.
   */
  useEffect(() => {
    if (aiTurnTrigger === 0) return;
    if (!currentPlayer) return;
    if (currentPlayer.type !== "ai") return;
    if (gameState.winner) return;

    aiProcessingRef.current = true;
    const color = currentPlayer.color;
    const playerIndex = gameState.currentPlayerIndex;

    const playAITurn = async () => {
      // 1. Thinking pause
      await new Promise((r) => setTimeout(r, 600));

      const value = Math.floor(Math.random() * 6) + 1;
      console.log(`AI (${color}) rolled:`, value);

      // Snapshot consecutiveSixes and tokens from current state
      let snapConsec = 0;
      let snapTokens = {} as Record<PlayerColor, Token[]>;
      setGameState((prev) => {
        snapConsec = prev.consecutiveSixes;
        snapTokens = prev.tokens;
        return prev; // no change, just reading
      });
      await new Promise((r) => setTimeout(r, 0));

      const newConsec = value === 6 ? snapConsec + 1 : 0;
      const isPenalty = newConsec >= MAX_CONSECUTIVE_SIXES;

      // 2. Spinner
      setGameState((prev) => ({
        ...prev,
        diceValue: value,
        status: "rolling",
      }));
      await new Promise((r) => setTimeout(r, 900));

      // 3. Face visible
      setGameState((prev) => ({
        ...prev,
        status: "rolled",
        consecutiveSixes: newConsec,
      }));
      await new Promise((r) => setTimeout(r, 900));

      // 4a. Penalty, lose turn
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
      console.log(`AI (${color}) valid moves:`, moves.length);

      // 4b. No moves, pass turn
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

      // 4c. Execute move
      const move = chooseBestMove(moves, snapTokens, color);
      console.log(`AI (${color}) moving:`, move);
      await new Promise((r) => setTimeout(r, 400));

      // Build the exact state executeMove expects:
      // - diceValue set to what was rolled
      // - consecutiveSixes set to the post-roll value (executeMove does NOT re-increment)
      // - validMoves populated so the legality check passes
      const stateForMove: GameState = {
        ...gameState, // base: current live state (has correct tokens, players, index)
        tokens: snapTokens,
        diceValue: value,
        consecutiveSixes: newConsec,
        validMoves: moves,
        status: "rolled",
      };

      const nextState = executeMove(
        stateForMove,
        move.tokenId,
        move.newPosition,
      );

      if (!nextState) {
        console.warn("AI executeMove returned null — passing turn");
        aiProcessingRef.current = false;
        setGameState((prev) => ({
          ...prev,
          diceValue: null,
          status: "waiting",
          currentPlayerIndex:
            (prev.currentPlayerIndex + 1) % prev.players.length,
        }));
        return;
      }

      // Show token in new position with dice still visible
      setGameState({ ...nextState, diceValue: value, status: "rolled" });

      // 5. Result visible pause
      await new Promise((r) => setTimeout(r, 700));

      /**
       * executeMove already set currentPlayerIndex correctly:
       *   - same index  → extra turn (rolled 6 or captured)
       *   - next index  → normal turn end
       *
       * We just commit its decision. For the extra-turn case we directly
       * increment aiTurnTrigger so the effect re-fires even though color
       * hasn't changed.
       */
      const gotExtraTurn = nextState.currentPlayerIndex === playerIndex;
      console.log(`AI (${color}) extra turn:`, gotExtraTurn);

      aiProcessingRef.current = false;
      setGameState({
        ...nextState,
        diceValue: null,
        status: nextState.winner ? "finished" : "waiting",
      });

      if (gotExtraTurn && !nextState.winner) {
        setAiTurnTrigger((n) => n + 1);
      }
    };

    playAITurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTurnTrigger]);

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
