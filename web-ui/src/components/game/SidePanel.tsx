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
  LogOut,
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
  onQuit: () => void;
}

const getTokenStatus = (tokens: any[]) => {
  const inHome = tokens.filter(
    (t) => t.position === -1 && !t.isFinished,
  ).length;
  const onBoard = tokens.filter(
    (t) => t.position >= 0 && t.position <= 50 && !t.isFinished,
  ).length;
  const inHomeRun = tokens.filter(
    (t) => t.position >= 51 && !t.isFinished,
  ).length;
  const finished = tokens.filter((t) => t.isFinished).length;
  return { inHome, onBoard, inHomeRun, finished };
};

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 20],
    [72, 20],
    [28, 50],
    [72, 50],
    [28, 80],
    [72, 80],
  ],
};

const DiceFace: React.FC<{ value: number }> = ({ value }) => {
  const pips = PIP_POSITIONS[value] ?? [];
  return (
    <div
      style={{
        width: 72,
        height: 72,
        background: "#f8f3e8",
        borderRadius: 10,
        border: "2px solid #d4c9b0",
        position: "relative",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.8)",
      }}
    >
      {pips.map(([px, py], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 11,
            height: 11,
            borderRadius: "50%",
            background:
              value === 1
                ? "radial-gradient(circle at 35% 35%, #ff6b6b, #cc1111)"
                : "radial-gradient(circle at 35% 35%, #444, #111)",
            left: `${px}%`,
            top: `${py}%`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </div>
  );
};

const SidePanel: React.FC<SidePanelProps> = ({
  gameState,
  currentPlayer,
  isHumanTurn,
  diceValue,
  validMovesCount,
  onRollDice,
  isRolling,
  onQuit,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { players, tokens, winner, status } = gameState;

  const isSpinning = isRolling || status === "rolling";
  const showDiceFace = !isSpinning && diceValue !== null && !winner;

  const canRoll =
    isHumanTurn &&
    status === "waiting" &&
    diceValue === null &&
    !winner &&
    !isSpinning;

  const showPassButton =
    isHumanTurn &&
    status === "rolled" &&
    diceValue !== null &&
    validMovesCount === 0 &&
    !winner;

  const isAITurn = currentPlayer?.type === "ai" && !winner;

  const renderMiniControls = () => {
    if (!isHumanTurn || winner) return null;
    return (
      <div className="fixed right-4 bottom-24 z-30 flex flex-col gap-2">
        {canRoll && (
          <button
            onClick={onRollDice}
            className="w-14 h-14 cursor-pointer bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
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

  const renderMiniCurrentPlayer = () => {
    if (!currentPlayer || winner) return null;
    return (
      <div className="fixed top-4 right-4 z-30 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/20 shadow-xl">
        <div className="flex items-center gap-2">
          {isAITurn ? (
            <Loader className="w-3.5 h-3.5 animate-spin text-white/80" />
          ) : (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: PLAYER_THEMES[currentPlayer.color].primary,
                boxShadow: `0 0 8px ${PLAYER_THEMES[currentPlayer.color].primary}`,
              }}
            />
          )}
          <span
            className="text-sm font-medium"
            style={{
              color: isAITurn
                ? "#aaa"
                : PLAYER_THEMES[currentPlayer.color].primary,
            }}
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

  const renderMiniDiceValue = () => {
    if (!showDiceFace) return null;
    return (
      <div className="fixed top-20 right-4 z-30 bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-xl">
        <DiceFace value={diceValue!} />
      </div>
    );
  };

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
            className="mb-4 p-4 rounded-xl text-center"
            style={{
              background: `${PLAYER_THEMES[currentPlayer.color].primary}18`,
              border: `1px solid ${
                isAITurn
                  ? "rgba(255,255,255,0.2)"
                  : PLAYER_THEMES[currentPlayer.color].primary
              }`,
            }}
          >
            {isAITurn ? (
              <>
                <p className="text-white/60 text-xs uppercase tracking-wider flex items-center justify-center gap-1 mb-2">
                  <Loader className="w-3 h-3 animate-spin" /> AI Thinking
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5 text-white/60" />
                  <p className="text-white/80 font-medium">
                    {currentPlayer.name ||
                      DEFAULT_PLAYER_NAMES[currentPlayer.color]}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-white/60 text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Current Turn
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ color: PLAYER_THEMES[currentPlayer.color].primary }}
                >
                  {currentPlayer.name ||
                    DEFAULT_PLAYER_NAMES[currentPlayer.color]}
                </p>
                <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Human Player
                </p>
              </>
            )}
          </div>
        )}

        {isSpinning && !winner && (
          <div className="mb-5 flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">
              Rolling...
            </span>
          </div>
        )}

        {showDiceFace && (
          <div className="mb-5 flex flex-col items-center gap-2">
            <DiceFace value={diceValue!} />
            {validMovesCount > 0 && isHumanTurn && (
              <p className="text-green-400 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                {validMovesCount} valid move{validMovesCount !== 1 ? "s" : ""}
              </p>
            )}
            {validMovesCount === 0 && isHumanTurn && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> No valid moves — passing…
              </p>
            )}
            {!isHumanTurn && isAITurn && (
              <p className="text-white/50 text-sm">AI rolled {diceValue}</p>
            )}
          </div>
        )}

        {!winner && canRoll && (
          <button
            onClick={onRollDice}
            className="w-full cursor-pointer py-3 mb-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Dice5 className="w-5 h-5" /> Roll Dice
          </button>
        )}

        {!winner && showPassButton && (
          <button
            onClick={onRollDice}
            className="w-full py-3 mb-3 bg-red-500/80 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" /> Pass Turn
          </button>
        )}

        <button
          onClick={onQuit}
          className="w-full cursor-pointer py-2.5 mb-4 bg-white/5 hover:bg-red-900/30 text-white/60 hover:text-red-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-red-900/30"
        >
          <LogOut className="w-4 h-4" />
          Quit to Menu
        </button>

        <div className="flex-1 overflow-y-auto">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
            Players
          </p>
          <div className="space-y-3">
            {players.map((player) => {
              const playerTokens = tokens[player.color];
              const ts = getTokenStatus(playerTokens);
              const isCurrent = currentPlayer?.color === player.color;
              const isCurrentAI = isCurrent && isAITurn;
              const theme = PLAYER_THEMES[player.color];
              const name = player.name || DEFAULT_PLAYER_NAMES[player.color];

              return (
                <div
                  key={player.color}
                  className={`p-3 rounded-lg transition-all ${
                    isCurrentAI
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
                          background: isCurrentAI ? "#888" : theme.primary,
                          boxShadow: isCurrentAI
                            ? "none"
                            : `0 0 6px ${theme.primary}`,
                        }}
                      />
                      <span
                        className="text-white font-medium text-sm"
                        style={{ color: isCurrentAI ? "#aaa" : theme.primary }}
                      >
                        {name}
                      </span>
                      {player.type === "ai" && !isCurrentAI && (
                        <Brain className="w-3 h-3 text-white/40" />
                      )}
                      {isCurrentAI && (
                        <Loader className="w-3 h-3 animate-spin text-white/60" />
                      )}
                    </div>
                    <span className="text-white/60 text-sm font-mono flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {ts.finished}/4
                    </span>
                  </div>

                  <div className="flex gap-1 h-1.5">
                    {[
                      {
                        val: ts.inHome,
                        bg: isCurrentAI ? "#666" : theme.primary,
                      },
                      {
                        val: ts.onBoard,
                        bg: isCurrentAI ? "#666" : theme.secondary,
                      },
                      {
                        val: ts.inHomeRun,
                        bg: isCurrentAI ? "#666" : theme.glow,
                      },
                      { val: ts.finished, bg: "#fbbf24" },
                    ].map(({ val, bg }, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-white/20 rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(val / 4) * 100}%`,
                            background: bg,
                          }}
                        />
                      </div>
                    ))}
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
            <span>🖱️</span> Click token to move • <Dice5 className="w-3 h-3" />{" "}
            Roll to play
          </p>
        </div>
      </div>
    </>
  );
};

export default SidePanel;
