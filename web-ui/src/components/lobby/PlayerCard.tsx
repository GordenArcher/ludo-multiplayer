import React from "react";
import { User, Bot, AlertCircle } from "lucide-react";
import type { PlayerColor, PlayerType } from "../../types/game";

interface PlayerCardProps {
  color: PlayerColor;
  type: PlayerType;
  name: string;
  onTypeChange: (type: PlayerType) => void;
  onNameChange: (name: string) => void;
  isActive: boolean;
  isAIDisabled?: boolean;
  aiCount?: number;
}

const colorStyles: Record<
  PlayerColor,
  { bg: string; border: string; text: string }
> = {
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
};

const PlayerCard: React.FC<PlayerCardProps> = ({
  color,
  type,
  name,
  onTypeChange,
  onNameChange,
  isActive,
  isAIDisabled,
  aiCount = 0,
}) => {
  const styles = colorStyles[color];

  if (!isActive) {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 opacity-40">
        <div className="flex items-center justify-center h-[100px]">
          <p className="text-white/20 text-sm">Inactive</p>
        </div>
      </div>
    );
  }

  const isAI = type === "ai";
  const aiButtonDisabled = isAIDisabled && !isAI;

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${styles.text} bg-current`} />
          <span className={`text-lg font-medium ${styles.text} uppercase`}>
            {color}
          </span>
        </div>

        <div className="flex gap-1 bg-black/30 rounded-lg p-0.5">
          <button
            onClick={() => onTypeChange("human")}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 cursor-pointer ${
              type === "human"
                ? "bg-white/20 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <User className="w-3 h-3" />
            Human
          </button>
          <button
            onClick={() => !aiButtonDisabled && onTypeChange("ai")}
            disabled={aiButtonDisabled}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${
              type === "ai"
                ? "bg-white/20 text-white cursor-pointer"
                : aiButtonDisabled
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/50 hover:text-white/80 cursor-pointer"
            }`}
            title={aiButtonDisabled ? "Maximum 1 AI allowed" : ""}
          >
            <Bot className="w-3 h-3" />
            AI
          </button>
        </div>
      </div>

      {type === "human" ? (
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={`${color} player name`}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      ) : (
        <div className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/50 text-sm flex items-center gap-2">
          <Bot className="w-3 h-3" />
          AI Player
        </div>
      )}

      {aiCount === 1 && !isAI && (
        <div className="mt-2 flex items-center gap-1 text-amber-500/60 text-[10px]">
          <AlertCircle className="w-3 h-3" />
          <span>AI slot taken - only 1 AI allowed</span>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
