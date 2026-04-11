import React, { useEffect, useState, useMemo, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { GameConfig, PlayerColor } from "../../types/game";
import StartScreen from "../lobby/StartScreen";
import Base from "../board/Base";
import BoardTiles from "../board/BoardTiles";
import Grid from "../board/Grid";
import YardCircles from "../board/YardCircles";
import CenterStar from "../board/CenterStar";
import Token from "../board/Token";
import SidePanel from "./SidePanel";
import { useGameEngine } from "../../hooks/useGameEngine";
import { computeStackIndices } from "../../utils/tokenPositions";
import {
  saveGameToSession,
  loadPersistedGame,
  clearPersistedGame,
} from "../../hooks/usePersistedgame";
import { sounds } from "../../utils/sounds";
import QuitGameModal from "../modals/quitGameModal";
import RestoreGameModal from "../modals/restoregamemodal";

const GameBoard: React.FC<{
  config: GameConfig;
  onBackToMenu: () => void;
  onRestart: () => void;
}> = ({ config, onBackToMenu, onRestart }) => {
  const {
    gameState,
    isHumanTurn,
    currentPlayer,
    validMoves,
    rollDice,
    makeMove,
    selectToken,
    shouldAIPlay,
  } = useGameEngine(config.players);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showQuitModal, setShowQuitModal] = useState(false);

  const isRolling = gameState.status === "rolling";

  useEffect(() => {
    if (
      soundEnabled &&
      currentPlayer &&
      isHumanTurn &&
      gameState.status === "waiting"
    ) {
      sounds.turnStart();
    }
  }, [currentPlayer, isHumanTurn, gameState.status, soundEnabled]);

  const handleRollDice = async () => {
    if (!isHumanTurn) return;
    if (gameState.status !== "waiting") return;
    if (soundEnabled) sounds.rollDice();
    if (gameState.diceValue !== null) return;
    await rollDice();
  };

  const handleTokenClick = (tokenId: number) => {
    const move = validMoves.find((m) => m.tokenId === tokenId);
    if (move) {
      if (soundEnabled) {
        if (move.type === "spawn") sounds.tokenSpawn();
        else if (move.type === "finish") sounds.tokenFinish();
        else sounds.tokenMove();
      }
      makeMove(move.tokenId, move.newPosition);
    } else {
      selectToken(tokenId);
    }
  };

  const stackIndices = useMemo(
    () =>
      computeStackIndices(
        gameState.tokens,
        config.players.map((p) => p.color),
      ),
    [gameState.tokens, config.players],
  );

  const homeImages = config.players.reduce(
    (acc, player) => {
      if (player.homeImage) {
        acc[player.color] = player.homeImage;
      }
      return acc;
    },
    {} as Record<PlayerColor, string>,
  );

  const renderTokens = () => {
    const elements: JSX.Element[] = [];

    for (const player of config.players) {
      const color = player.color as PlayerColor;
      const playerTokens = gameState.tokens[color];

      playerTokens.forEach((token, idx) => {
        const isValidMove = validMoves.some((m) => m.tokenId === token.id);
        const isSelected = gameState.selectedTokenId === token.id;
        const isCurrentPlayerTurn = currentPlayer?.color === color;

        const canInteract =
          isHumanTurn &&
          isCurrentPlayerTurn &&
          gameState.diceValue !== null &&
          isValidMove &&
          !gameState.winner;

        const stackIndex = stackIndices[color]?.[token.id] ?? 0;

        elements.push(
          <Token
            key={`${color}-${token.id}`}
            tokenId={token.id}
            color={color}
            position={token.position}
            isFinished={token.isFinished}
            tokenIndex={idx}
            stackIndex={stackIndex}
            isInteractive={canInteract}
            isSelected={isSelected}
            isValidMove={isValidMove && isCurrentPlayerTurn && isHumanTurn}
            onClick={() => {
              if (canInteract) handleTokenClick(token.id);
            }}
          />,
        );
      });
    }

    return elements;
  };

  return (
    <>
      <div className="w-full h-screen bg-gradient-radial from-[#1a0f08] to-[#030100] relative overflow-hidden">
        <div className="absolute inset-0">
          <Canvas
            shadows
            camera={{ position: [0, 14, 12], fov: 40 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#030100"]} />
            <ambientLight intensity={0.55} />
            <directionalLight
              position={[8, 12, 6]}
              intensity={1.2}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight
              position={[-4, 6, -3]}
              intensity={0.4}
              color="#ffccaa"
            />
            <pointLight position={[0, 2, 0]} intensity={0.35} color="#ffaa66" />

            <Base />
            <BoardTiles />
            <Grid />
            <YardCircles homeImages={homeImages} />
            <CenterStar />
            {renderTokens()}

            <OrbitControls
              enableZoom
              enablePan
              enableRotate
              minDistance={8}
              maxDistance={22}
              maxPolarAngle={Math.PI / 2.2}
              minPolarAngle={Math.PI / 5}
              dampingFactor={0.06}
              rotateSpeed={0.8}
              zoomSpeed={1.2}
              target={[0, 0, 0]}
              makeDefault
            />
          </Canvas>
        </div>

        <div className="absolute top-0 right-0 h-full z-30">
          <SidePanel
            gameState={gameState}
            currentPlayer={currentPlayer}
            isHumanTurn={isHumanTurn}
            diceValue={gameState.diceValue}
            validMovesCount={validMoves.length}
            onRollDice={handleRollDice}
            isRolling={isRolling}
            onQuit={() => setShowQuitModal(true)}
          />
        </div>
      </div>

      <QuitGameModal
        isOpen={showQuitModal}
        onResume={() => setShowQuitModal(false)}
        onRestart={() => {
          setShowQuitModal(false);
          onRestart();
        }}
        onQuit={() => {
          setShowQuitModal(false);
          clearPersistedGame();
          onBackToMenu();
        }}
      />
    </>
  );
};

// Game (root) handles session persistence and restore prompt

const Game: React.FC = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  // Saved config found in sessionStorage on mount
  const [pendingRestore, setPendingRestore] = useState<GameConfig | null>(null);

  // On first mount check for a persisted game
  useEffect(() => {
    const saved = loadPersistedGame();
    if (saved) setPendingRestore(saved);
  }, []);

  // Persist config whenever a game is active
  useEffect(() => {
    if (gameConfig) {
      saveGameToSession(gameConfig);
    }
  }, [gameConfig]);

  const handleStartGame = (config: GameConfig) => {
    clearPersistedGame();
    setGameConfig(config);
  };

  const handleRestore = () => {
    if (pendingRestore) {
      setGameConfig(pendingRestore);
      setPendingRestore(null);
    }
  };

  const handleDiscard = () => {
    clearPersistedGame();
    setPendingRestore(null);
  };

  const handleBackToMenu = () => {
    clearPersistedGame();
    setGameConfig(null);
  };

  const handleRestart = () => {
    setRestartKey((k) => k + 1);
  };

  // Show restore prompt over the start screen if a saved game exists
  if (!gameConfig) {
    return (
      <>
        <StartScreen onStartGame={handleStartGame} />
        <RestoreGameModal
          isOpen={pendingRestore !== null}
          savedConfig={pendingRestore}
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      </>
    );
  }

  const gameKey =
    gameConfig.players.map((p) => `${p.color}-${p.type}`).join("|") +
    `-${restartKey}`;

  return (
    <GameBoard
      key={gameKey}
      config={gameConfig}
      onBackToMenu={handleBackToMenu}
      onRestart={handleRestart}
    />
  );
};

export default Game;
