import React, { useEffect, useState } from "react";
import type { GameConfig } from "../../types/game";
import { PLAYER_THEMES } from "../../constants/gameConstants";
import { Bot, User, ArrowRight, X } from "lucide-react";

interface RestoreGameModalProps {
  isOpen: boolean;
  savedConfig: GameConfig | null;
  onRestore: () => void;
  onDiscard: () => void;
}

const RestoreGameModal: React.FC<RestoreGameModalProps> = ({
  isOpen,
  savedConfig,
  onRestore,
  onDiscard,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") onRestore();
      if (e.key === "Escape") onDiscard();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onRestore, onDiscard]);

  if (!shouldRender || !savedConfig) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating
          ? "bg-black/82 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-0"
      }`}
    >
      <div
        className={`relative w-90 rounded-2xl border border-white/10 p-8 flex flex-col items-center gap-6 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        style={{
          background: "linear-gradient(160deg, #1a1008 0%, #0d0600 100%)",
        }}
      >
        <div className="transition-transform duration-300 hover:scale-110">
          <div className="text-4xl select-none">♟️</div>
        </div>

        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-1 tracking-wide">
            Game in Progress
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            You have an unfinished game. Would you like to continue where you
            left off?
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {savedConfig.players.map((p, idx) => {
            const theme = PLAYER_THEMES[p.color];
            return (
              <span
                key={p.color}
                className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-200 hover:scale-105"
                style={{
                  background: theme.primary + "22",
                  color: theme.primary,
                  border: `1px solid ${theme.primary}44`,
                  animationDelay: `${idx * 50}ms`,
                  animation: isAnimating
                    ? "fadeInUp 0.3s ease-out forwards"
                    : "none",
                }}
              >
                {p.name}
                {p.type === "ai" ? (
                  <Bot className="w-3 h-3" />
                ) : (
                  <User className="w-3 h-3" />
                )}
              </span>
            );
          })}
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onRestore}
            className="w-full cursor-pointer py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150
              bg-amber-500 hover:bg-amber-400 active:scale-95 text-black shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 group"
          >
            Continue Game
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={onDiscard}
            className="w-full cursor-pointer py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150
              bg-white/5 hover:bg-red-900/30 active:scale-95 text-red-400 border border-red-900/30 flex items-center justify-center gap-2 group"
          >
            <X className="w-4 h-4 transition-transform duration-150 group-hover:rotate-90" />
            Start Fresh
          </button>
        </div>

        <p className="text-white/20 text-xs transition-opacity duration-300 hover:text-white/40">
          Enter to continue · Esc to discard
        </p>
      </div>
    </div>
  );
};

export default RestoreGameModal;
