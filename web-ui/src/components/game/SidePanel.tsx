import React from "react";
import type { GameState, Player } from "../../types/game";
import {
  PLAYER_THEMES,
  DEFAULT_PLAYER_NAMES,
} from "../../constants/gameConstants";

interface SidePanelProps {
  gameState: GameState;
  currentPlayer: Player | null;
  isHumanTurn: boolean;
  diceValue: number | null;
  validMovesCount: number;
  onRollDice: () => void;
  isRolling: boolean;
}

const getTokenStatus = (tokens: any[]) => {
  const inHome = tokens.filter(
    (t) => t.position === -1 && !t.isFinished,
  ).length;
  const onBoard = tokens.filter(
    (t) => t.position >= 0 && t.position <= 51 && !t.isFinished,
  ).length;
  const inHomeRun = tokens.filter(
    (t) => t.position >= 52 && !t.isFinished,
  ).length;
  const finished = tokens.filter((t) => t.isFinished).length;
  return { inHome, onBoard, inHomeRun, finished };
};

const SidePanel: React.FC<SidePanelProps> = ({
  gameState,
  currentPlayer,
  isHumanTurn,
  diceValue,
  validMovesCount,
  onRollDice,
  isRolling,
}) => {
  const { players, tokens, winner, status } = gameState;

  // Check if roll button should be enabled
  const canRoll =
    isHumanTurn &&
    status === "waiting" &&
    diceValue === null &&
    !winner &&
    !isRolling;

  // Check if pass button should be shown
  const showPassButton =
    isHumanTurn && diceValue !== null && validMovesCount === 0 && !winner;

  return (
    <div className="h-full bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-amber-500 tracking-wide">
          LUDO
        </h2>
        <p className="text-white/40 text-xs mt-1">CLASSIC EDITION</p>
      </div>

      {winner && (
        <div className="mb-6 p-3 bg-amber-500/20 rounded-xl border border-amber-500/50 text-center">
          <p className="text-amber-400 font-bold text-lg">
            🏆 {DEFAULT_PLAYER_NAMES[winner]} WINS! 🏆
          </p>
        </div>
      )}

      {currentPlayer && !winner && (
        <div
          className="mb-6 p-4 rounded-xl text-center"
          style={{
            background: `${PLAYER_THEMES[currentPlayer.color].primary}20`,
            border: `1px solid ${PLAYER_THEMES[currentPlayer.color].primary}`,
          }}
        >
          <p className="text-white/60 text-xs uppercase tracking-wider">
            Current Turn
          </p>
          <p
            className="text-xl font-bold mt-1"
            style={{ color: PLAYER_THEMES[currentPlayer.color].primary }}
          >
            {currentPlayer.name || DEFAULT_PLAYER_NAMES[currentPlayer.color]}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {currentPlayer.type === "ai" ? "🤖 AI Player" : "👤 Human Player"}
          </p>
        </div>
      )}

      {diceValue && !winner && (
        <div className="mb-6 text-center">
          <div className="inline-block w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <span className="text-4xl font-bold text-stone-800">
              {diceValue}
            </span>
          </div>
          {validMovesCount > 0 && isHumanTurn && (
            <p className="text-green-400 text-sm mt-2">
              ✓ {validMovesCount} valid move{validMovesCount !== 1 ? "s" : ""}
            </p>
          )}
          {validMovesCount === 0 && diceValue && isHumanTurn && (
            <p className="text-red-400 text-sm mt-2">
              ✗ No valid moves - click Pass to end turn
            </p>
          )}
        </div>
      )}

      {!winner && canRoll && (
        <button
          onClick={onRollDice}
          className="w-full cursor-pointer py-3 mb-6 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all transform active:scale-95"
        >
          🎲 Roll Dice
        </button>
      )}

      {!winner && showPassButton && (
        <button
          onClick={onRollDice}
          className="w-full py-3 mb-6 bg-red-500/80 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
        >
          Pass Turn
        </button>
      )}

      {!winner && currentPlayer?.type === "ai" && status === "waiting" && (
        <div className="w-full py-3 mb-6 bg-white/10 rounded-xl text-center">
          <p className="text-white/60 text-sm">🤖 AI is thinking...</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
          Players
        </p>
        <div className="space-y-3">
          {players.map((player) => {
            const playerTokens = tokens[player.color];
            const tokenStatus = getTokenStatus(playerTokens);
            const isCurrent = currentPlayer?.color === player.color;
            const theme = PLAYER_THEMES[player.color];
            const displayName =
              player.name || DEFAULT_PLAYER_NAMES[player.color];

            return (
              <div
                key={player.color}
                className={`p-3 rounded-lg transition-all ${isCurrent ? "bg-white/15" : "bg-white/5"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: theme.primary,
                        boxShadow: `0 0 6px ${theme.primary}`,
                      }}
                    />
                    <span
                      className="text-white font-medium text-sm"
                      style={{ color: theme.primary }}
                    >
                      {displayName}
                    </span>
                    {player.type === "ai" && (
                      <span className="text-white/40 text-xs">🤖</span>
                    )}
                  </div>
                  <span className="text-white/60 text-sm font-mono">
                    {tokenStatus.finished}/4
                  </span>
                </div>

                <div className="flex gap-1 h-1.5">
                  <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(tokenStatus.inHome / 4) * 100}%`,
                        background: theme.primary,
                      }}
                    />
                  </div>
                  <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(tokenStatus.onBoard / 4) * 100}%`,
                        background: theme.secondary,
                      }}
                    />
                  </div>
                  <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(tokenStatus.inHomeRun / 4) * 100}%`,
                        background: theme.glow,
                      }}
                    />
                  </div>
                  <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(tokenStatus.finished / 4) * 100}%`,
                        background: "#fbbf24",
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                  <span>🏠</span>
                  <span>🟢</span>
                  <span>✨</span>
                  <span>🏆</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className="text-white/30 text-[10px]">
          Click a token to move • Roll dice to play
        </p>
      </div>
    </div>
  );
};

export default SidePanel;
