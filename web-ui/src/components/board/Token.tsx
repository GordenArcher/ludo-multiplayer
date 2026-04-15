import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTokenWorldPosition } from "../../utils/tokenPositions";
import type { PlayerColor } from "../../types/game";

interface TokenProps {
  tokenId: number;
  color: PlayerColor;
  position: number;
  isFinished: boolean;
  tokenIndex: number;
  stackIndex?: number;
  isInteractive: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  onClick: () => void;
  isSixRolled?: boolean;
}

const Token: React.FC<TokenProps> = ({
  color,
  position,
  isFinished,
  tokenIndex,
  stackIndex = 0,
  isInteractive,
  isSelected,
  isValidMove,
  onClick,
  isSixRolled = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [blinkState, setBlinkState] = useState(true);

  // Blinking effect for valid move when 6 is rolled
  useEffect(() => {
    if (!isValidMove || !isSixRolled) return;

    const interval = setInterval(() => {
      setBlinkState((prev) => !prev);
    }, 300);

    return () => clearInterval(interval);
  }, [isValidMove, isSixRolled]);

  useEffect(() => {
    if (groupRef.current) {
      const worldPos = getTokenWorldPosition(
        position,
        color,
        tokenIndex,
        stackIndex,
      );
      groupRef.current.position.set(worldPos.x, worldPos.y, worldPos.z);
    }
  }, [position, color, tokenIndex, stackIndex]);

  useFrame(({ clock }) => {
    if (groupRef.current && !isSelected && !hovered && !isFinished) {
      const t = clock.getElapsedTime();
      const baseY = getTokenWorldPosition(
        position,
        color,
        tokenIndex,
        stackIndex,
      ).y;
      groupRef.current.position.y = baseY + Math.sin(t * 2) * 0.003;
    }
  });

  const themeColors: Record<PlayerColor, { primary: string; glow: string }> = {
    red: { primary: "#ef4444", glow: "#991b1b" },
    green: { primary: "#22c55e", glow: "#166534" },
    yellow: { primary: "#eab308", glow: "#78350f" },
    blue: { primary: "#3b82f6", glow: "#1e3a8a" },
  };

  const colors = themeColors[color];
  const scale = hovered && isInteractive ? 1.08 : isSelected ? 1.05 : 1;
  const tokenHeight = 0.18;
  const tokenRadius = 0.32;
  const topRadius = 0.28;

  // Blinking opacity for valid move indicator
  const validMoveOpacity = blinkState && isSixRolled ? 1 : 0.8;
  const validMoveScale = blinkState && isSixRolled ? 1.1 : 1;

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => isInteractive && setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {isSelected && (
        <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.58, 32]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.6}
            metalness={0.8}
          />
        </mesh>
      )}

      {isValidMove && !isSelected && (
        <mesh
          position={[0, -0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[validMoveScale, validMoveScale, 1]}
        >
          <ringGeometry args={[0.38, 0.52, 32]} />
          <meshStandardMaterial
            color="#4ade80"
            transparent
            opacity={validMoveOpacity}
            emissive="#22c55e"
            emissiveIntensity={isSixRolled ? 0.5 : 0.2}
          />
        </mesh>
      )}

      <mesh scale={[scale, scale, scale]} castShadow receiveShadow>
        <cylinderGeometry args={[tokenRadius, tokenRadius, tokenHeight, 48]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.glow}
          emissiveIntensity={hovered ? 0.35 : isSelected ? 0.25 : 0.1}
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>

      <mesh
        position={[0, tokenHeight / 2 + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[scale, scale, scale]}
      >
        <circleGeometry args={[topRadius, 48]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>

      <mesh
        position={[0, -tokenHeight / 2 - 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[scale, scale, scale]}
      >
        <circleGeometry args={[tokenRadius - 0.03, 48]} />
        <meshStandardMaterial
          color={colors.glow}
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>

      {hovered && isInteractive && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.52, 16, 16]} />
          <meshStandardMaterial
            color={colors.primary}
            transparent
            opacity={0.2}
            emissive={colors.primary}
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      <mesh
        position={[0, -tokenHeight / 2 - 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

export default Token;
