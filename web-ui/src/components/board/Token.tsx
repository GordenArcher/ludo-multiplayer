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
  /** Slot within a stack of tokens sharing this cell (0 = base, 1–3 = above) */
  stackIndex?: number;
  isInteractive: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  onClick: () => void;
}

const Token: React.FC<TokenProps> = ({
  tokenId,
  color,
  position,
  isFinished,
  tokenIndex,
  stackIndex = 0,
  isInteractive,
  isSelected,
  isValidMove,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

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

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => isInteractive && setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {isSelected && (
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.52, 32]} />
          <meshStandardMaterial color="#4ade80" transparent opacity={0.8} />
        </mesh>
      )}
      <mesh scale={[scale, scale, scale]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.1, 48]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.glow}
          emissiveIntensity={hovered ? 0.35 : isSelected ? 0.25 : 0.1}
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>
      <mesh
        position={[0, 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[scale, scale, scale]}
      >
        <circleGeometry args={[0.29, 48]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>
      {hovered && isInteractive && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.48, 16, 16]} />
          <meshStandardMaterial
            color={colors.primary}
            transparent
            opacity={0.2}
            emissive={colors.primary}
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
      <mesh position={[0, -0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.36, 16]} />
        <meshStandardMaterial color="#000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

export default Token;
