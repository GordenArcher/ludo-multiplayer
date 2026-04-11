import React, { useEffect, useState } from "react";
import { Gamepad2, RotateCw, LogOut, ArrowRight } from "lucide-react";

interface QuitGameModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

const QuitGameModal: React.FC<QuitGameModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onQuit,
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
      if (e.key === "Escape") onResume();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onResume]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating
          ? "bg-black/72 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-0"
      }`}
      onClick={onResume}
    >
      <div
        className={`relative w-85 rounded-2xl border border-white/10 p-8 flex flex-col items-center gap-6 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        style={{
          background: "linear-gradient(160deg, #1a1008 0%, #0d0600 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="transition-transform duration-300 hover:scale-110">
          <Gamepad2 className="w-12 h-12 text-amber-500" />
        </div>

        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-1 tracking-wide">
            Game in Progress
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Your game will be lost if you leave.
            <br />
            What would you like to do?
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full cursor-pointer py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150
              bg-amber-500 hover:bg-amber-400 active:scale-95 text-black shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 group"
          >
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            Resume Game
          </button>

          <button
            onClick={onRestart}
            className="w-full cursor-pointer py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150
              bg-white/10 hover:bg-white/15 active:scale-95 text-white border border-white/10 flex items-center justify-center gap-2 group"
          >
            <RotateCw className="w-4 h-4 transition-transform duration-150 group-hover:rotate-90" />
            Restart Game
          </button>

          <button
            onClick={onQuit}
            className="w-full cursor-pointer py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150
              bg-white/5 hover:bg-red-900/30 active:scale-95 text-red-400 border border-red-900/30 flex items-center justify-center gap-2 group"
          >
            <LogOut className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            Quit to Menu
          </button>
        </div>

        <p className="text-white/20 text-xs transition-opacity duration-300 hover:text-white/40">
          Press Esc to resume
        </p>
      </div>
    </div>
  );
};

export default QuitGameModal;
