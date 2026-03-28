import React, { useState } from "react";
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
      type: index < 2 ? "human" : "ai",
      name: "",
    }));
    setPlayers(newPlayers);
  };

  const handleTypeChange = (index: number, type: PlayerType) => {
    const updated = [...players];
    updated[index].type = type;
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
        name: p.name.trim() || `${p.color.toUpperCase()} Player`,
      })),
      totalPlayers: playerCount,
    };
    console.log("Starting game with config:", config);
    onStartGame(config);
  };

  const canStart = players.every(
    (p) => p.type === "ai" || p.name.trim() !== "",
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-radial from-[#1a0f08] to-[#030100]">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-bold text-amber-500 mb-2 tracking-wide">
            LUDO
          </h1>
          <p className="text-white/50 text-sm tracking-wider">
            CLASSIC EDITION
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {[2, 3, 4].map((count) => (
            <button
              key={count}
              onClick={() => handlePlayerCountChange(count as 2 | 3 | 4)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                playerCount === count
                  ? "bg-amber-500 text-black"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {count} Players
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {players.map((player, index) => (
            <PlayerCard
              key={player.color}
              color={player.color}
              type={player.type}
              name={player.name}
              onTypeChange={(type) => handleTypeChange(index, type)}
              onNameChange={(name) => handleNameChange(index, name)}
              isActive={index < playerCount}
            />
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            canStart
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          🎲 START GAME
        </button>

        <p className="text-center text-white/30 text-xs mt-4">
          Human players need to enter a name • AI players play automatically
        </p>
      </div>
    </div>
  );
};

export default StartScreen;
