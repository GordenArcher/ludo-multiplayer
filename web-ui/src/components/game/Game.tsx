import React, { useState } from "react";
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
import Dice from "./Dice";
import { useGameEngine } from "../../hooks/useGameEngine";

//  GameBoard, only mounts after we have a real config
const GameBoard: React.FC<{ config: GameConfig; onBackToMenu: () => void }> = ({
  config,
}) => {
  const [isRolling, setIsRolling] = useState(false);

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

  const handleRollDice = async () => {
    if (!isHumanTurn) return;
    if (gameState.status !== "waiting") return;
    if (gameState.diceValue !== null) return;
    setIsRolling(true);
    await rollDice();
    setTimeout(() => setIsRolling(false), 600);
  };

  const handleTokenClick = (tokenId: number) => {
    const move = validMoves.find((m) => m.tokenId === tokenId);
    if (move) {
      makeMove(move.tokenId, move.newPosition);
    } else {
      selectToken(tokenId);
    }
  };

  //  KEY FIX: only render tokens for players that are actually in this game ──
  // config.players only contains the 2/3/4 active players.
  // Iterating gameState.tokens would give all 4 colours, the inactive ones
  // would still receive clicks and appear interactive.
  const renderTokens = () => {
    const elements: JSX.Element[] = [];

    for (const player of config.players) {
      const color = player.color as PlayerColor;
      const tokens = gameState.tokens[color];

      tokens.forEach((token, idx) => {
        const isValidMove = validMoves.some((m) => m.tokenId === token.id);
        const isSelected = gameState.selectedTokenId === token.id;
        const isCurrentPlayerTurn = currentPlayer?.color === color;

        // A token is only interactive when:
        //  1. It's a human turn (not AI)
        //  2. It belongs to the current player
        //  3. The dice has been rolled
        //  4. This specific token has a valid move available
        //  5. No one has won yet
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
    <div className="w-full h-screen bg-gradient-radial from-[#1a0f08] to-[#030100] flex overflow-hidden">
      <div className="flex-1 relative">
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

        {!shouldAIPlay && !gameState.winner && (
          <div className="absolute bottom-8 right-8 w-28 h-28 z-20 bg-black/40 rounded-2xl backdrop-blur-sm p-2">
            <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[2, 2, 2]} intensity={0.8} />
              <Dice
                value={gameState.diceValue}
                isRolling={isRolling || gameState.status === "rolling"}
                onRoll={handleRollDice}
                disabled={
                  !isHumanTurn ||
                  gameState.status !== "waiting" ||
                  gameState.diceValue !== null ||
                  !!gameState.winner
                }
              />
            </Canvas>
          </div>
        )}
      </div>

      <div className="w-80 p-4">
        <SidePanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          isHumanTurn={isHumanTurn}
          diceValue={gameState.diceValue}
          validMovesCount={validMoves.length}
          onRollDice={handleRollDice}
          isRolling={isRolling || gameState.status === "rolling"}
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

  // Key ensures a full remount (fresh useGameEngine state) on new game
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
