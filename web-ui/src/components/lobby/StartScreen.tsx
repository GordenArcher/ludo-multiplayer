import React, { useState } from "react";
import { Users, Bot, User, Play, Gamepad2 } from "lucide-react";
import type { PlayerColor, PlayerType, GameConfig } from "../../types/game";
import PlayerCard from "./PlayerCard";

interface StartScreenProps {
  onStartGame: (config: GameConfig) => void;
}

const PLAYER_COLORS: PlayerColor[] = ["red", "green", "yellow", "blue"];

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [players, setPlayers] = useState<
    { color: PlayerColor; type: PlayerType; name: string }[]
  >([
    { color: "red", type: "human", name: "" },
    { color: "green", type: "human", name: "" },
  ]);

  const handlePlayerCountChange = (count: 2 | 3 | 4) => {
    setPlayerCount(count);
    const newPlayers = PLAYER_COLORS.slice(0, count).map((color, index) => ({
      color,
      type: "human", // Start all as human
      name: "",
    }));
    setPlayers(newPlayers);
  };

  const handleTypeChange = (index: number, type: PlayerType) => {
    const updated = [...players];
    const currentAICount = updated.filter((p) => p.type === "ai").length;

    // If trying to set AI
    if (type === "ai") {
      // Max 1 AI allowed
      if (currentAICount >= 1) {
        return; // Can't have more than one AI
      }
      updated[index].type = "ai";
      updated[index].name = ""; // Clear name for AI
    }
    // If setting to human
    else {
      updated[index].type = "human";
    }

    setPlayers(updated);
  };

  const handleNameChange = (index: number, name: string) => {
    const updated = [...players];
    updated[index].name = name;
    setPlayers(updated);
  };

  const handleStart = () => {
    const config: GameConfig = {
      players: players.map((p) => ({
        ...p,
        name:
          p.type === "ai"
            ? "AI Player"
            : p.name.trim() || `${p.color.toUpperCase()} Player`,
      })),
      totalPlayers: playerCount,
    };
    onStartGame(config);
  };

  // Check if all humans have names and there's at least one human
  const hasHuman = players.some((p) => p.type === "human");
  const allHumansHaveNames = players
    .filter((p) => p.type === "human")
    .every((p) => p.name.trim() !== "");

  const canStart = hasHuman && allHumansHaveNames;

  const aiCount = players.filter((p) => p.type === "ai").length;
  const aiDisabled = aiCount >= 1;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#0a0502]">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gamepad2 className="w-10 h-10 text-amber-500" />
            <h1 className="text-5xl sm:text-6xl font-bold text-amber-500">
              LUDO
            </h1>
          </div>
          <p className="text-white/40 text-sm tracking-wider">
            CLASSIC EDITION
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex bg-black/30 rounded-lg p-0.5">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => handlePlayerCountChange(count as 2 | 3 | 4)}
                className={`px-4 cursor-pointer sm:px-6 py-2 text-sm font-medium transition flex items-center gap-2 ${
                  playerCount === count
                    ? "bg-amber-500 text-white"
                    : "text-white/60 hover:text-white/80"
                } ${count === 2 ? "rounded-l-md" : ""} ${
                  count === 4 ? "rounded-r-md" : ""
                }`}
              >
                <Users className="w-4 h-4" />
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {players.map((player, index) => {
            const isAIDisabled = aiDisabled && player.type !== "ai";

            return (
              <PlayerCard
                key={player.color}
                color={player.color}
                type={player.type}
                name={player.name}
                onTypeChange={(type) => handleTypeChange(index, type)}
                onNameChange={(name) => handleNameChange(index, name)}
                isActive={index < playerCount}
                isAIDisabled={isAIDisabled}
                aiCount={aiCount}
              />
            );
          })}
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full cursor-pointer py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
            canStart
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          <Play className="w-4 h-4" />
          START GAME
        </button>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-white/30 text-xs">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>At least 1 human required</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            <span>Maximum 1 AI allowed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
