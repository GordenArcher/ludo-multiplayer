/**
 * Ludo Game Type Definitions
 * Core types used throughout the game engine and UI components
 *
 * @module GameTypes
 */

/**
 * Available player colors in Ludo
 * - Red: Top-left corner
 * - Green: Top-right corner
 * - Yellow: Bottom-left corner
 * - Blue: Bottom-right corner
 */
export type PlayerColor = "red" | "green" | "yellow" | "blue";

/**
 * Player type determines if a human controls the player or AI
 */
export type PlayerType = "human" | "ai";

/**
 * Represents a player in the game
 */
export interface Player {
  /** Unique color identifier */
  color: PlayerColor;
  /** Human or AI controlled */
  type: PlayerType;
  /** Display name entered by player */
  name: string;
}

/**
 * Game token piece
 * Each player has 4 tokens
 */
export interface Token {
  /** Token ID (0-3 for each player) */
  id: number;
  /**
   * Position on board:
   * -1 = in home (yard)
   * 0-51 = on main path (clockwise from start)
   * 52-57 = in home run (colored path to center)
   * -2 = finished (reached center)
   */
  position: number;
  /** Whether token has completed the game */
  isFinished: boolean;
}

/**
 * Complete game state snapshot
 * Single source of truth for all game data
 */
export interface GameState {
  /** All players in the game (2-4 players) */
  players: Player[];
  /** All tokens for all players, organized by color */
  tokens: Record<PlayerColor, Token[]>;
  /** Index of current player in players array */
  currentPlayerIndex: number;
  /** Last dice roll value (1-6), null if not rolled yet */
  diceValue: number | null;
  /** Count of consecutive sixes rolled (max 3 before penalty) */
  consecutiveSixes: number;
  /** Winner of the game, null if game still in progress */
  winner: PlayerColor | null;
  /** Current game phase */
  status: GameStatus;
  /** List of valid moves for current player after dice roll */
  validMoves: ValidMove[];
  /** Currently selected token ID, null if none selected */
  selectedTokenId: number | null;
}

/**
 * Game flow status
 * - waiting: Awaiting dice roll or move selection
 * - rolling: Dice animation in progress
 * - moving: Token movement animation in progress
 * - finished: Game has ended
 */
export type GameStatus =
  | "waiting"
  | "rolling"
  | "rolled"
  | "moving"
  | "finished";

/**
 * Represents a valid move a player can make
 */
export interface ValidMove {
  /** ID of token to move */
  tokenId: number;
  /** New position after move */
  newPosition: number;
  /** Type of move for UI feedback */
  type?: "spawn" | "move" | "capture" | "finish";
}

/**
 * Result of executing a move
 */
export interface MoveResult {
  /** Whether the move was successfully executed */
  success: boolean;
  /** Information about captured token, if any */
  captured?: {
    color: PlayerColor;
    tokenId: number;
  };
  /** Whether player gets another turn (rolled a 6) */
  extraTurn: boolean;
  /** Winner of the game, if move ended the game */
  winner?: PlayerColor;
}

/**
 * Configuration for initial game setup
 */
export interface GameConfig {
  /** Selected players for this game */
  players: Player[];
  /** Total number of players (2, 3, or 4) */
  totalPlayers: number;
}
