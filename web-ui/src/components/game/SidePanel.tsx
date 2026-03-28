import React, { useState } from "react";
import {
  Gamepad2,
  Trophy,
  Dice5,
  Check,
  X,
  Brain,
  Users,
  Home,
  Circle,
  Sparkles,
  Crown,
  ArrowRight,
  Loader,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { players, tokens, winner, status } = gameState;

  const canRoll =
    isHumanTurn &&
    status === "waiting" &&
    diceValue === null &&
    !winner &&
    !isRolling;

  const showPassButton =
    isHumanTurn && diceValue !== null && validMovesCount === 0 && !winner;

  const isAIPlaying =
    currentPlayer?.type === "ai" && status === "waiting" && !winner;

  // Mini floating action buttons for collapsed mode
  const renderMiniControls = () => {
    if (!isHumanTurn || winner) return null;

    return (
      <div className="fixed right-4 bottom-24 z-30 flex flex-col gap-2">
        {canRoll && (
          <button
            onClick={onRollDice}
            className="w-14 h-14 cursor-pointer bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-2xl flex items-center justify-center transition-all transform active:scale-95"
            title="Roll Dice"
          >
            <Dice5 className="w-6 h-6" />
          </button>
        )}
        {showPassButton && (
          <button
            onClick={onRollDice}
            className="w-14 h-14 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all"
            title="Pass Turn"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    );
  };

  // Current player mini indicator for collapsed mode
  const renderMiniCurrentPlayer = () => {
    if (!currentPlayer || winner) return null;

    if (isAIPlaying) {
      return (
        <div className="fixed top-4 right-4 z-30 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/20 shadow-xl">
          <div className="flex items-center gap-2">
            <Loader className="w-3.5 h-3.5 animate-spin text-white/80" />
            <span className="text-xs text-white/80">AI thinking...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed top-4 right-4 z-30 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/20 shadow-xl">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: PLAYER_THEMES[currentPlayer.color].primary,
              boxShadow: `0 0 8px ${PLAYER_THEMES[currentPlayer.color].primary}`,
            }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: PLAYER_THEMES[currentPlayer.color].primary }}
          >
            {currentPlayer.name || DEFAULT_PLAYER_NAMES[currentPlayer.color]}
          </span>
          {currentPlayer.type === "ai" ? (
            <Brain className="w-3.5 h-3.5 text-white/60" />
          ) : (
            <Users className="w-3.5 h-3.5 text-white/60" />
          )}
        </div>
      </div>
    );
  };

  // Dice value mini display for collapsed mode
  const renderMiniDiceValue = () => {
    if (!diceValue || winner) return null;

    return (
      <div className="fixed top-20 right-4 z-30 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/20 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">{diceValue}</span>
        </div>
      </div>
    );
  };

  // Winner mini display for collapsed mode
  const renderMiniWinner = () => {
    if (!winner) return null;

    return (
      <div className="fixed top-4 right-4 z-30 bg-amber-500/90 backdrop-blur-md rounded-full px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-black" />
          <span className="text-sm font-bold text-black">
            {DEFAULT_PLAYER_NAMES[winner]} Wins!
          </span>
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <>
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed cursor-pointer right-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 backdrop-blur-md rounded-l-full p-2 hover:bg-black/80 transition-all shadow-xl border-l border-t border-b border-white/20"
          title="Expand Panel"
        >
          <PanelLeftOpen className="w-5 h-5 text-white/80" />
        </button>

        {renderMiniCurrentPlayer()}
        {renderMiniDiceValue()}
        {renderMiniWinner()}
        {renderMiniControls()}
      </>
    );
  }

  // Expanded view, full side panel
  return (
    <>
      <button
        onClick={() => setIsCollapsed(true)}
        className="absolute cursor-pointer top-4 right-4 z-20 bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all"
        title="Collapse Panel"
      >
        <PanelLeftClose className="w-4 h-4 text-white/70" />
      </button>

      <div className="h-full bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl flex flex-col relative">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gamepad2 className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-amber-500 tracking-wide">
              LUDO
            </h2>
          </div>
          <p className="text-white/40 text-xs mt-1">CLASSIC EDITION</p>
        </div>

        {winner && (
          <div className="mb-6 p-3 bg-amber-500/20 rounded-xl border border-amber-500/50 text-center">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <p className="text-amber-400 font-bold text-lg">
                {DEFAULT_PLAYER_NAMES[winner]} WINS!
              </p>
            </div>
          </div>
        )}

        {currentPlayer && !winner && (
          <div
            className="mb-6 p-4 rounded-xl text-center"
            style={{
              background: isAIPlaying
                ? "bg-white/10"
                : `${PLAYER_THEMES[currentPlayer.color].primary}20`,
              border: `1px solid ${
                isAIPlaying
                  ? "rgba(255,255,255,0.2)"
                  : PLAYER_THEMES[currentPlayer.color].primary
              }`,
            }}
          >
            {isAIPlaying ? (
              <>
                <p className="text-white/60 text-xs uppercase tracking-wider flex items-center justify-center gap-1 mb-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  AI Thinking
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5 text-white/60" />
                  <p className="text-white/80 font-medium">
                    {currentPlayer.name ||
                      DEFAULT_PLAYER_NAMES[currentPlayer.color]}
                  </p>
                </div>
                <p className="text-white/40 text-xs mt-2">Making decision...</p>
              </>
            ) : (
              <>
                <p className="text-white/60 text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Current Turn
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ color: PLAYER_THEMES[currentPlayer.color].primary }}
                >
                  {currentPlayer.name ||
                    DEFAULT_PLAYER_NAMES[currentPlayer.color]}
                </p>
                <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Human Player
                </p>
              </>
            )}
          </div>
        )}

        {diceValue && !winner && !isAIPlaying && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg">
              <Dice5 className="w-10 h-10 text-stone-800" />
              <span className="text-3xl font-bold text-stone-800 ml-1">
                {diceValue}
              </span>
            </div>
            {validMovesCount > 0 && isHumanTurn && (
              <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-1">
                <Check className="w-4 h-4" />
                {validMovesCount} valid move{validMovesCount !== 1 ? "s" : ""}
              </p>
            )}
            {validMovesCount === 0 && diceValue && isHumanTurn && (
              <p className="text-red-400 text-sm mt-2 flex items-center justify-center gap-1">
                <X className="w-4 h-4" />
                No valid moves, click Pass to end turn
              </p>
            )}
          </div>
        )}

        {!winner && canRoll && (
          <button
            onClick={onRollDice}
            className="w-full cursor-pointer py-3 mb-6 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Dice5 className="w-5 h-5" />
            Roll Dice
          </button>
        )}

        {!winner && showPassButton && (
          <button
            onClick={onRollDice}
            className="w-full py-3 mb-6 bg-red-500/80 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Pass Turn
          </button>
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
              const isCurrentAIPlaying = isCurrent && isAIPlaying;
              const theme = PLAYER_THEMES[player.color];
              const displayName =
                player.name || DEFAULT_PLAYER_NAMES[player.color];

              return (
                <div
                  key={player.color}
                  className={`p-3 rounded-lg transition-all ${
                    isCurrentAIPlaying
                      ? "bg-white/10 border border-white/20"
                      : isCurrent
                        ? "bg-white/15"
                        : "bg-white/5"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: isCurrentAIPlaying
                            ? "#888"
                            : theme.primary,
                          boxShadow: isCurrentAIPlaying
                            ? "none"
                            : `0 0 6px ${theme.primary}`,
                        }}
                      />
                      <span
                        className="text-white font-medium text-sm"
                        style={{
                          color: isCurrentAIPlaying ? "#aaa" : theme.primary,
                        }}
                      >
                        {displayName}
                      </span>
                      {player.type === "ai" && !isCurrentAIPlaying && (
                        <Brain className="w-3 h-3 text-white/40" />
                      )}
                      {isCurrentAIPlaying && (
                        <Loader className="w-3 h-3 animate-spin text-white/60" />
                      )}
                    </div>
                    <span className="text-white/60 text-sm font-mono flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {tokenStatus.finished}/4
                    </span>
                  </div>

                  {isCurrentAIPlaying && (
                    <div className="mb-2 text-[10px] text-amber-400/70 flex items-center gap-1">
                      <Loader className="w-2.5 h-2.5 animate-spin" />
                      <span>Making move...</span>
                    </div>
                  )}

                  <div className="flex gap-1 h-1.5">
                    <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(tokenStatus.inHome / 4) * 100}%`,
                          background: isCurrentAIPlaying
                            ? "#666"
                            : theme.primary,
                        }}
                      />
                    </div>
                    <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(tokenStatus.onBoard / 4) * 100}%`,
                          background: isCurrentAIPlaying
                            ? "#666"
                            : theme.secondary,
                        }}
                      />
                    </div>
                    <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(tokenStatus.inHomeRun / 4) * 100}%`,
                          background: isCurrentAIPlaying ? "#666" : theme.glow,
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
                    <span className="flex items-center gap-0.5">
                      <Home className="w-2.5 h-2.5" /> Home
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Circle className="w-2.5 h-2.5" /> Board
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Path
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5" /> Done
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <p className="text-white/30 text-[10px] flex items-center justify-center gap-1">
            <span>🖱️</span> Click a token to move •{" "}
            <Dice5 className="w-3 h-3" /> Roll dice to play
          </p>
        </div>
      </div>
    </>
  );
};

export default SidePanel;
