/**
 * Ludo Board 3D Component
 *
 * Main 3D board visualization with interactive tokens.
 * Handles token selection and move execution.
 *
 * Features:
 * - Full 3D board with textures
 * - Interactive tokens that respond to clicks
 * - Visual feedback for valid moves
 * - Highlight selected token
 * - Turn-based gameplay integration
 *
 * @module LudoBoard3D
 */

import React, { useState, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Base from "./Base";
import BoardTiles from "./BoardTiles";
import Grid from "./Grid";
import YardCircles from "./YardCircles";
import CenterStar from "./CenterStar";
import Token from "./Token";
import type { PlayerColor, Token as TokenType } from "../../types/game";
import { PLAYER_THEMES } from "../../constants/gameConstants";

interface LudoBoard3DProps {
  /** All tokens in the game */
  tokens: Record<PlayerColor, TokenType[]>;
  /** Current player color */
  currentPlayer: PlayerColor | null;
  /** Valid moves for current dice roll */
  validMoves: { tokenId: number; newPosition: number }[];
  /** Currently selected token ID */
  selectedTokenId: number | null;
  /** Callback when a token is clicked */
  onTokenClick: (tokenId: number) => void;
  /** Whether the board is interactive (not AI turn) */
  interactive: boolean;
}

// Token positions in yards (where they sit visually)
const TOKEN_POSITIONS: Record<PlayerColor, [number, number][]> = {
  red: [
    [1.8, 1.8],
    [1.8, 3.2],
    [3.2, 1.8],
    [3.2, 3.2],
  ],
  green: [
    [1.8, 10.8],
    [1.8, 12.2],
    [3.2, 10.8],
    [3.2, 12.2],
  ],
  yellow: [
    [10.8, 1.8],
    [10.8, 3.2],
    [12.2, 1.8],
    [12.2, 3.2],
  ],
  blue: [
    [10.8, 10.8],
    [10.8, 12.2],
    [12.2, 10.8],
    [12.2, 12.2],
  ],
};

// Map token position to 3D coordinates
// This is a simplified version
const getTokenWorldPosition = (
  position: number,
  color: PlayerColor,
): [number, number, number] => {
  // For now, return yard positions
  // This will be expanded to map path positions
  if (position === -1) {
    const pos = TOKEN_POSITIONS[color][0];
    return [(pos[1] - 7) * 0.88, 0.08, (pos[0] - 7) * 0.88];
  }
  // Placeholder for path positions
  return [0, 0.08, 0];
};

const LudoBoard3D: React.FC<LudoBoard3DProps> = ({
  tokens,
  currentPlayer,
  validMoves,
  selectedTokenId,
  onTokenClick,
  interactive,
}) => {
  // Track hover state for tokens
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);

  // Render all tokens for all players
  const renderTokens = () => {
    const allTokens: JSX.Element[] = [];

    for (const color of Object.keys(tokens) as PlayerColor[]) {
      const playerTokens = tokens[color];
      const theme = PLAYER_THEMES[color];
      const positions = TOKEN_POSITIONS[color];

      playerTokens.forEach((token, index) => {
        // Get visual position based on game state
        const [x, , z] = getTokenWorldPosition(token.position, color);

        // Check if this token has a valid move
        const hasValidMove = validMoves.some((m) => m.tokenId === token.id);
        const isSelected = selectedTokenId === token.id;
        const isHovered = hoveredToken === token.id;
        const isCurrentPlayerTurn = currentPlayer === color;
        const canInteract = interactive && isCurrentPlayerTurn && hasValidMove;

        allTokens.push(
          <Token
            key={`${color}-${token.id}`}
            row={positions[index][0]}
            col={positions[index][1]}
            color={theme.primary}
            emissive={theme.glow}
            isInteractive={canInteract}
            isSelected={isSelected}
            isHovered={isHovered}
            onClick={() => canInteract && onTokenClick(token.id)}
            onHoverStart={() => setHoveredToken(token.id)}
            onHoverEnd={() => setHoveredToken(null)}
          />,
        );
      });
    }

    return allTokens;
  };

  return (
    <div className="w-full h-full relative">
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
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
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

      {!interactive && currentPlayer && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
          <p className="text-white/80 text-sm">
            🤖 {currentPlayer.toUpperCase()} AI is thinking...
          </p>
        </div>
      )}
    </div>
  );
};

export default LudoBoard3D;
