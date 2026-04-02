import React, { useState, type JSX } from "react";
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

const GameBoard: React.FC<{ config: GameConfig; onBackToMenu: () => void }> = ({
  config,
  onBackToMenu,
}) => {
  /**
   * FIX - removed the local `isRolling` useState entirely.
   *
   * Previously `isRolling` was a separate boolean managed in Game.tsx with
   * a setTimeout to clear it. This created two sources of truth that drifted
   * apart from gameState.status, causing SidePanel to receive contradictory
   * signals (isRolling=true but diceValue=null, or vice versa).
   *
   * Now: derive isRolling purely from gameState.status === "rolling".
   * The single source of truth is the game state machine.
   */
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

  // Derived directly from game state, no separate local flag
  const isRolling = gameState.status === "rolling";

  const handleRollDice = async () => {
    if (!isHumanTurn) return;
    if (gameState.status !== "waiting") return;
    if (gameState.diceValue !== null) return;
    await rollDice();
    // No setTimeout needed, rollDice manages status transitions internally
  };

  const handleTokenClick = (tokenId: number) => {
    const move = validMoves.find((m) => m.tokenId === tokenId);
    if (move) {
      makeMove(move.tokenId, move.newPosition);
    } else {
      selectToken(tokenId);
    }
  };

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

        elements.push(
          <Token
            key={`${color}-${token.id}`}
            tokenId={token.id}
            color={color}
            position={token.position}
            isFinished={token.isFinished}
            tokenIndex={idx}
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
          <YardCircles />
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
        />
      </div>
    </div>
  );
};

const Game: React.FC = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  if (!gameConfig) {
    return <StartScreen onStartGame={setGameConfig} />;
  }

  const gameKey = gameConfig.players
    .map((p) => `${p.color}-${p.type}`)
    .join("|");

  return (
    <GameBoard
      key={gameKey}
      config={gameConfig}
      onBackToMenu={() => setGameConfig(null)}
    />
  );
};

export default Game;
