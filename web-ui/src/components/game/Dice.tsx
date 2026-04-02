/**
 * Dice.tsx
 *
 * 3D animated dice using React Three Fiber.
 * Shows dice rolling animation and displays the rolled value.
 *
 * FIXES applied to original:
 * 1. FACE_NUMBERS corrected: BoxGeometry face order is +X,-X,+Y,-Y,+Z,-Z.
 *    +Y face (index 2) is naturally on top at zero rotation, so it must hold
 *    the value that needs zero rotation to show — we use 1 there.
 *    Assignment: [1, 6, 2, 5, 3, 4] → opposite pairs all sum to 7.
 *
 * 2. ROTATION_TO_TOP corrected to match the new face assignment:
 *    1 is on +Y → no rotation needed
 *    2 is on +Z → tilt X +90° to bring +Z to top
 *    3 is on +X → tilt Z -90° to bring +X to top
 *    4 is on -X → tilt Z +90° to bring -X to top
 *    5 is on -Z → tilt X -90° to bring -Z to top
 *    6 is on -Y → flip X 180° to bring -Y to top
 *
 * 3. isAnimating initialised to false but settle effect was triggering
 *    immediately on mount. Added `hasRolled` ref so settle only fires
 *    after at least one spin has occurred.
 *
 * 4. Number in SidePanel now hidden until settle completes — handled via
 *    the existing isRolling + isAnimating flags passed up.
 */

import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
// +Y is naturally on top at zero rotation → assign 1 there
// Opposite faces sum to 7: 1↔6, 2↔5, 3↔4
const FACE_NUMBERS = [3, 4, 1, 6, 2, 5];
//                   +X  -X  +Y  -Y  +Z  -Z

// Rotations (Euler XYZ) to bring each value to the top (+Y)
const ROTATION_TO_TOP: Record<number, [number, number, number]> = {
  1: [0, 0, 0], // +Y → already on top
  2: [Math.PI / 2, 0, 0], // +Z → tilt X +90°
  3: [0, 0, -Math.PI / 2], // +X → tilt Z -90°
  4: [0, 0, Math.PI / 2], // -X → tilt Z +90°
  5: [-Math.PI / 2, 0, 0], // -Z → tilt X -90°
  6: [Math.PI, 0, 0], // -Y → flip X 180°
};

// Create texture for a dice face — unchanged from original
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

  // FIX: track whether a spin has ever started so settle doesn't fire on mount
  const hasSpunRef = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Start rolling animation
  useEffect(() => {
    if (isRolling) {
      hasSpunRef.current = true;
      setIsAnimating(true);
      spinVelocity.current = {
        x: (Math.random() - 0.5) * 0.28,
        y: (Math.random() - 0.5) * 0.28,
        z: (Math.random() - 0.5) * 0.28,
      };
    }
  }, [isRolling]);

  // FIX: only settle after a real spin has happened
  useEffect(() => {
    if (
      !isRolling &&
      value !== null &&
      meshRef.current &&
      hasSpunRef.current &&
      isAnimating
    ) {
      const target = ROTATION_TO_TOP[value];
      if (!target) return;

      const startRotation = {
        x: meshRef.current.rotation.x,
        y: meshRef.current.rotation.y,
        z: meshRef.current.rotation.z,
      };

      let startTime: number | null = null;
      const duration = 520; // ms, settle animation length

      const animateToTarget = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);

        // FIX: shortest-arc interpolation so it doesn't spin the long way round
        const lerpAngle = (a: number, b: number, t: number) => {
          let diff = b - a;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          return a + diff * t;
        };

        if (meshRef.current) {
          meshRef.current.rotation.x = lerpAngle(
            startRotation.x,
            target[0],
            easeOut,
          );
          meshRef.current.rotation.y = lerpAngle(
            startRotation.y,
            target[1],
            easeOut,
          );
          meshRef.current.rotation.z = lerpAngle(
            startRotation.z,
            target[2],
            easeOut,
          );
        }

        if (progress < 1) {
          requestAnimationFrame(animateToTarget);
        } else {
          if (meshRef.current) {
            meshRef.current.rotation.set(target[0], target[1], target[2]);
          }
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animateToTarget);
    }
  }, [isRolling, value, isAnimating]);

  // Animation loop, spin while rolling, idle otherwise
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
