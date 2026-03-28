import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  GameState,
  Player,
  ValidMove,
  MoveResult,
  PlayerColor,
} from "../types/game";
import {
  createInitialTokens,
  getValidMoves,
  executeMove,
  shouldGetExtraTurn,
} from "../utils/gameLogic";
import { MAX_CONSECUTIVE_SIXES } from "../constants/gameConstants";

/**
 * useGameEngine Hook
 *
 * Main game state management hook for Ludo.
 * Integrates pure game logic with React state and provides
 * a clean API for UI components.
 *
 * Features:
 * - Dice rolling with validation and animation states
 * - Token movement execution with capture logic
 * - AI turn handling with natural delays
 * - Game state updates with turn management
 * - Winner detection and game reset
 * - Valid move calculation and selection tracking
 *
 * @param players - Array of player configurations from lobby
 * @returns Game state and control functions
 */
export const useGameEngine = (players: Player[]) => {
  /**
   * Create initial game state with all tokens in home positions
   * and first player ready to play
   */
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialTokens = {
      red: createInitialTokens("red"),
      green: createInitialTokens("green"),
      yellow: createInitialTokens("yellow"),
      blue: createInitialTokens("blue"),
    };

    return {
      players,
      tokens: initialTokens,
      currentPlayerIndex: 0, // First player (Red) starts
      diceValue: null, // No dice rolled yet
      consecutiveSixes: 0, // Track for penalty rule
      winner: null, // No winner yet
      status: "waiting", // Ready for action
      validMoves: [], // No moves calculated yet
      selectedTokenId: null, // No token selected
    };
  });

  // Track if we're in the middle of AI processing to prevent duplicate turns
  const aiProcessingRef = useRef(false);

  /**
   * Get the current player object based on index
   * Returns null if players array is empty (shouldn't happen in game)
   */
  const currentPlayer = useMemo(() => {
    if (!gameState.players.length) return null;
    return gameState.players[gameState.currentPlayerIndex];
  }, [gameState.players, gameState.currentPlayerIndex]);

  /**
   * Determine if it's a human player's turn
   * Conditions:
   * - Player exists
   * - No winner yet
   * - Game is in waiting state (not rolling/moving)
   * - Player type is "human"
   */
  const isHumanTurn = useMemo(() => {
    if (!currentPlayer) return false;
    if (gameState.winner) return false;
    if (gameState.status !== "waiting") return false;
    return currentPlayer.type === "human";
  }, [currentPlayer, gameState.winner, gameState.status]);

  /**
   * Calculate all valid moves for current player based on dice value
   * Only runs when dice has been rolled and current player exists
   * Memoized to avoid recalculating on every render
   */
  const validMoves = useMemo(() => {
    if (!gameState.diceValue) return [];
    if (!currentPlayer) return [];
    return getValidMoves(
      gameState.diceValue,
      currentPlayer.color,
      gameState.tokens,
    );
  }, [gameState.diceValue, currentPlayer, gameState.tokens]);

  /**
   * Determine if AI should take a turn
   * Conditions:
   * - Current player exists
   * - No winner
   * - Game is waiting for action
   * - AI not already processing a turn
   * - Player type is "ai"
   */
  const shouldAIPlay = useMemo(() => {
    if (!currentPlayer) return false;
    if (gameState.winner) return false;
    if (gameState.status !== "waiting") return false;
    if (aiProcessingRef.current) return false;
    return currentPlayer.type === "ai";
  }, [currentPlayer, gameState.winner, gameState.status]);

  /**
   * End current turn and move to next player
   * Resets dice value, consecutive sixes counter, and valid moves
   * Used when player has no moves or chooses to pass
   */
  const endTurn = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "waiting",
      diceValue: null,
      consecutiveSixes: 0,
      validMoves: [],
      selectedTokenId: null,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
    }));
  }, []);

  /**
   * Roll the dice - HUMAN PLAYER only
   *
   * Process:
   * 1. Validate conditions (human turn, waiting state, no dice rolled)
   * 2. Generate random dice value (1-6)
   * 3. Update consecutive sixes counter
   * 4. Set rolling animation state
   * 5. After animation delay, check for penalty or calculate moves
   * 6. If no valid moves, end turn automatically
   * 7. If moves available, show them for player selection
   *
   * @returns Dice value rolled, or null if roll was invalid
   */
  const rollDice = useCallback(async (): Promise<number | null> => {
    console.log("rollDice called", {
      status: gameState.status,
      winner: gameState.winner,
      isHumanTurn,
      diceValue: gameState.diceValue,
    });

    // Validation: Can only roll when waiting, no winner, human turn, and no dice value yet
    if (gameState.status !== "waiting") return null;
    if (gameState.winner) return null;
    if (!isHumanTurn) return null;
    if (gameState.diceValue !== null) return null;

    // Generate random dice value (1-6)
    const value = Math.floor(Math.random() * 6) + 1;
    console.log("Dice rolled:", value);

    // Update consecutive sixes counter for penalty rule
    const newConsecutiveSixes =
      value === 6 ? gameState.consecutiveSixes + 1 : 0;
    const isPenalty = newConsecutiveSixes >= MAX_CONSECUTIVE_SIXES;

    // Set rolling animation state
    setGameState((prev) => ({
      ...prev,
      diceValue: value,
      status: "rolling",
    }));

    // Wait for dice animation to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check for penalty (3 sixes in a row = lose turn)
    if (isPenalty) {
      console.log("Penalty! Losing turn");
      setGameState((prev) => ({
        ...prev,
        status: "waiting",
        diceValue: null,
        consecutiveSixes: 0,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
      }));
      return value;
    }

    // Calculate all valid moves for this dice roll
    const moves = getValidMoves(value, currentPlayer!.color, gameState.tokens);
    console.log("Valid moves:", moves.length);

    if (moves.length === 0) {
      // No valid moves - end turn automatically
      console.log("No valid moves, ending turn");
      setGameState((prev) => ({
        ...prev,
        status: "waiting",
        diceValue: null,
        consecutiveSixes: newConsecutiveSixes,
        validMoves: [],
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
      }));
    } else {
      // Valid moves available - wait for player to choose a token
      setGameState((prev) => ({
        ...prev,
        status: "waiting",
        validMoves: moves,
        consecutiveSixes: newConsecutiveSixes,
      }));
    }

    return value;
  }, [gameState, isHumanTurn, currentPlayer]);

  /**
   * Execute a move for a specific token
   *
   * Process:
   * 1. Validate conditions (waiting state, dice rolled, current player exists)
   * 2. Check if move is valid using pre-calculated validMoves
   * 3. Execute move using pure game logic (capture, position update)
   * 4. Check for winner and extra turn conditions
   * 5. Update game state with new positions and turn management
   *
   * @param tokenId - ID of token to move (0-3 per player)
   * @param newPosition - Target position for the token
   * @returns Result with success status, capture info, and extra turn flag
   */
  const makeMove = useCallback(
    (tokenId: number, newPosition: number): MoveResult => {
      console.log("makeMove called", { tokenId, newPosition });

      // Validation checks
      if (gameState.status !== "waiting") {
        console.log("Cannot move - status not waiting");
        return { success: false, extraTurn: false };
      }
      if (!gameState.diceValue) {
        console.log("Cannot move - no dice value");
        return { success: false, extraTurn: false };
      }
      if (!currentPlayer) {
        console.log("Cannot move - no current player");
        return { success: false, extraTurn: false };
      }

      // Execute the move using pure game logic
      const newState = executeMove(
        {
          ...gameState,
          validMoves,
        },
        tokenId,
        newPosition,
      );

      if (!newState) {
        console.log("Invalid move");
        return { success: false, extraTurn: false };
      }

      // Check for extra turn (rolled a 6 and not the third consecutive)
      const wasSix = gameState.diceValue === 6;
      const extraTurn = shouldGetExtraTurn(
        wasSix ? gameState.diceValue! : 0,
        gameState.consecutiveSixes,
      );
      const wasWinner = !!newState.winner;

      // Find captured token by comparing old and new state
      let captured: { color: PlayerColor; tokenId: number } | undefined;
      if (!wasWinner) {
        for (const color of Object.keys(newState.tokens) as PlayerColor[]) {
          const oldTokens = gameState.tokens[color];
          const newTokens = newState.tokens[color];

          for (let i = 0; i < oldTokens.length; i++) {
            // If token was at newPosition and now is at home (-1), it was captured
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

      // Update game state with new values
      setGameState(newState);

      console.log("Move executed", {
        extraTurn: extraTurn && !wasWinner,
        captured,
      });

      return {
        success: true,
        captured,
        extraTurn: extraTurn && !wasWinner,
        winner: newState.winner || undefined,
      };
    },
    [gameState, currentPlayer, validMoves],
  );

  /**
   * Select a token for visual feedback (highlighting)
   * Only selects tokens that have valid moves
   * Does not execute movement, just UI state
   *
   * @param tokenId - ID of token to select
   */
  const selectToken = useCallback(
    (tokenId: number) => {
      // Can only select when waiting and moves are available
      if (gameState.status !== "waiting") return;
      if (gameState.validMoves.length === 0) return;

      // Check if this token actually has a valid move
      const isValidMove = gameState.validMoves.some(
        (m) => m.tokenId === tokenId,
      );
      if (isValidMove) {
        setGameState((prev) => ({
          ...prev,
          selectedTokenId: tokenId,
        }));
      }
    },
    [gameState.status, gameState.validMoves],
  );

  /**
   * Reset game to initial state
   * Useful for "Play Again" functionality
   * Resets all tokens, clears winner, and starts with first player
   */
  const resetGame = useCallback(() => {
    const initialTokens = {
      red: createInitialTokens("red"),
      green: createInitialTokens("green"),
      yellow: createInitialTokens("yellow"),
      blue: createInitialTokens("blue"),
    };

    setGameState({
      players,
      tokens: initialTokens,
      currentPlayerIndex: 0,
      diceValue: null,
      consecutiveSixes: 0,
      winner: null,
      status: "waiting",
      validMoves: [],
      selectedTokenId: null,
    });
    aiProcessingRef.current = false;
  }, [players]);

  /**
   * AI Turn Handler
   *
   * Automatically plays AI turns when shouldAIPlay is true.
   * AI logic:
   * 1. Wait a natural delay (800ms)
   * 2. Roll dice randomly
   * 3. Check for penalty (3 sixes in a row)
   * 4. Calculate valid moves
   * 5. If moves available, pick first valid move (simple strategy)
   * 6. Execute the move with animation delay
   * 7. End turn or continue based on extra turn rule
   *
   * This effect runs whenever it's AI's turn and game is waiting
   */
  useEffect(() => {
    if (!shouldAIPlay) return;
    if (!currentPlayer) return;

    // Mark that AI is processing to prevent duplicate turns
    aiProcessingRef.current = true;

    const playAITurn = async () => {
      // Natural delay to make AI feel less robotic
      await new Promise((resolve) => setTimeout(resolve, 800));

      // AI rolls dice
      const value = Math.floor(Math.random() * 6) + 1;
      console.log("AI rolled:", value);

      const newConsecutiveSixes =
        value === 6 ? gameState.consecutiveSixes + 1 : 0;
      const isPenalty = newConsecutiveSixes >= MAX_CONSECUTIVE_SIXES;

      // Handle penalty (3 sixes in a row = lose turn)
      if (isPenalty) {
        console.log("AI penalty - losing turn");
        setGameState((prev) => ({
          ...prev,
          diceValue: value,
          status: "rolling",
        }));
        await new Promise((resolve) => setTimeout(resolve, 400));
        setGameState((prev) => ({
          ...prev,
          status: "waiting",
          diceValue: null,
          consecutiveSixes: 0,
          currentPlayerIndex:
            (prev.currentPlayerIndex + 1) % prev.players.length,
        }));
        aiProcessingRef.current = false;
        return;
      }

      // Get valid moves for this dice roll
      const moves = getValidMoves(value, currentPlayer.color, gameState.tokens);

      // No valid moves - end turn
      if (moves.length === 0) {
        console.log("AI has no moves, ending turn");
        setGameState((prev) => ({
          ...prev,
          diceValue: value,
          status: "rolling",
        }));
        await new Promise((resolve) => setTimeout(resolve, 400));
        setGameState((prev) => ({
          ...prev,
          status: "waiting",
          diceValue: null,
          consecutiveSixes: newConsecutiveSixes,
          currentPlayerIndex:
            (prev.currentPlayerIndex + 1) % prev.players.length,
        }));
        aiProcessingRef.current = false;
        return;
      }

      // Simple AI strategy: pick the first valid move
      // (Future enhancement: smarter AI with capture priority)
      const move = moves[0];
      console.log("AI moving token:", move);

      // Show dice roll animation
      setGameState((prev) => ({
        ...prev,
        diceValue: value,
        status: "rolling",
      }));

      await new Promise((resolve) => setTimeout(resolve, 400));

      // Execute the move
      const newState = executeMove(
        { ...gameState, diceValue: value, validMoves: moves },
        move.tokenId,
        move.newPosition,
      );

      if (newState) {
        setGameState(newState);
      }

      // AI turn complete
      aiProcessingRef.current = false;
    };

    playAITurn();
  }, [shouldAIPlay, currentPlayer, gameState]);

  return {
    /** Current game state snapshot */
    gameState,
    /** Whether it's a human player's turn */
    isHumanTurn,
    /** Current player object */
    currentPlayer,
    /** Valid moves for current dice roll */
    validMoves,
    /** Roll the dice (human only) */
    rollDice,
    /** Execute a move with specific token */
    makeMove,
    /** Select a token for visual feedback */
    selectToken,
    /** Reset game to initial state */
    resetGame,
    /** Whether AI should take a turn (for UI loading states) */
    shouldAIPlay,
  };
};
