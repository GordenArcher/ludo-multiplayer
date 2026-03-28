/**
 * Dice.tsx
 *
 * 3D dice that:
 * 1. Spins while rolling
 * 2. Shows correct pip count on top when settled
 * 3. Clean, classic dice appearance
 */

import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Standard dice face arrangement (opposite sides sum to 7)
// BoxGeometry face order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
const FACE_NUMBERS = [2, 5, 1, 6, 3, 4];

// Rotations to bring each number to the top (+Y)
const ROTATION_TO_TOP: Record<number, [number, number, number]> = {
  1: [0, 0, 0], // 1 already on top
  2: [Math.PI / 2, 0, 0], // rotate X 90°
  3: [0, 0, -Math.PI / 2], // rotate Z -90°
  4: [0, 0, Math.PI / 2], // rotate Z 90°
  5: [-Math.PI / 2, 0, 0], // rotate X -90°
  6: [Math.PI, 0, 0], // rotate X 180°
};

// Create texture for a dice face
function createFaceTexture(number: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Subtle border
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  // Dot positions for each number
  const dotPositions: Record<number, [number, number][]> = {
    1: [[size / 2, size / 2]],
    2: [
      [size * 0.25, size * 0.25],
      [size * 0.75, size * 0.75],
    ],
    3: [
      [size * 0.25, size * 0.25],
      [size / 2, size / 2],
      [size * 0.75, size * 0.75],
    ],
    4: [
      [size * 0.25, size * 0.25],
      [size * 0.75, size * 0.25],
      [size * 0.25, size * 0.75],
      [size * 0.75, size * 0.75],
    ],
    5: [
      [size * 0.25, size * 0.25],
      [size * 0.75, size * 0.25],
      [size / 2, size / 2],
      [size * 0.25, size * 0.75],
      [size * 0.75, size * 0.75],
    ],
    6: [
      [size * 0.25, size * 0.2],
      [size * 0.75, size * 0.2],
      [size * 0.25, size / 2],
      [size * 0.75, size / 2],
      [size * 0.25, size * 0.8],
      [size * 0.75, size * 0.8],
    ],
  };

  // Draw dots
  const dotRadius = size * 0.07;
  ctx.fillStyle = "#1a1a1a";

  dotPositions[number]?.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create all textures once
const TEXTURES: Record<number, THREE.CanvasTexture> = {
  1: createFaceTexture(1),
  2: createFaceTexture(2),
  3: createFaceTexture(3),
  4: createFaceTexture(4),
  5: createFaceTexture(5),
  6: createFaceTexture(6),
};

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling, onRoll, disabled }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const spinVelocity = useRef({ x: 0.1, y: 0.12, z: 0.08 });
  const [isAnimating, setIsAnimating] = useState(false);
  const targetRotationRef = useRef<[number, number, number]>([0, 0, 0]);

  // Start rolling animation
  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true);
      // Random spin velocity for more natural rolling
      spinVelocity.current = {
        x: (Math.random() - 0.5) * 0.25,
        y: (Math.random() - 0.5) * 0.25,
        z: (Math.random() - 0.5) * 0.25,
      };
    }
  }, [isRolling]);

  // When rolling stops and we have a value, animate to final rotation
  useEffect(() => {
    if (!isRolling && value !== null && meshRef.current && isAnimating) {
      targetRotationRef.current = ROTATION_TO_TOP[value];

      const startRotation = {
        x: meshRef.current.rotation.x,
        y: meshRef.current.rotation.y,
        z: meshRef.current.rotation.z,
      };

      let startTime: number | null = null;
      const duration = 500;

      const animateToTarget = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);

        if (meshRef.current) {
          meshRef.current.rotation.x =
            startRotation.x +
            (targetRotationRef.current[0] - startRotation.x) * easeOut;
          meshRef.current.rotation.y =
            startRotation.y +
            (targetRotationRef.current[1] - startRotation.y) * easeOut;
          meshRef.current.rotation.z =
            startRotation.z +
            (targetRotationRef.current[2] - startRotation.z) * easeOut;
        }

        if (progress < 1) {
          requestAnimationFrame(animateToTarget);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animateToTarget);
    }
  }, [isRolling, value, isAnimating]);

  // Animation loop for rolling
  useFrame(() => {
    if (isRolling && meshRef.current && isAnimating) {
      meshRef.current.rotation.x += spinVelocity.current.x;
      meshRef.current.rotation.y += spinVelocity.current.y;
      meshRef.current.rotation.z += spinVelocity.current.z;
    }
  });

  const canClick = !disabled && !isRolling && !isAnimating;

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={() => canClick && onRoll()}
        scale={isRolling ? 1.05 : 1}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.2, 1.2, 1.2]} />

        {FACE_NUMBERS.map((num, i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            map={TEXTURES[num]}
            roughness={0.3}
            metalness={0.05}
          />
        ))}
      </mesh>
    </group>
  );
};

export default Dice;
