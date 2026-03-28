import React from "react";
import type { PlayerColor, PlayerType } from "../../types/game";

interface PlayerCardProps {
  color: PlayerColor;
  type: PlayerType;
  name: string;
  onTypeChange: (type: PlayerType) => void;
  onNameChange: (name: string) => void;
  isActive: boolean;
}

const colorStyles: Record<
  PlayerColor,
  { bg: string; border: string; text: string }
> = {
  red: { bg: "bg-red-500/20", border: "border-red-500", text: "text-red-400" },
  green: {
    bg: "bg-green-500/20",
    border: "border-green-500",
    text: "text-green-400",
  },
  yellow: {
    bg: "bg-yellow-500/20",
    border: "border-yellow-500",
    text: "text-yellow-400",
  },
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-500",
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
}) => {
  const styles = colorStyles[color];

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        isActive ? styles.border : "border-white/10"
      } ${styles.bg} backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${styles.text} bg-current`} />
          <span className={`text-lg font-bold ${styles.text} uppercase`}>
            {color}
          </span>
        </div>

        <div className="flex gap-1 bg-black/40 rounded-lg p-0.5">
          <button
            onClick={() => onTypeChange("human")}
            className={`px-3 py-1 text-xs rounded-md transition cursor-pointer ${
              type === "human"
                ? `bg-white/20 text-white`
                : "text-white/50 hover:text-white/80"
            }`}
          >
            👤 Human
          </button>
          <button
            onClick={() => onTypeChange("ai")}
            className={`px-3 py-1 text-xs rounded-md transition cursor-pointer ${
              type === "ai"
                ? `bg-white/20 text-white`
                : "text-white/50 hover:text-white/80"
            }`}
          >
            🤖 AI
          </button>
        </div>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={`${color} Player`}
        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/50 transition"
      />
    </div>
  );
};

export default PlayerCard;
