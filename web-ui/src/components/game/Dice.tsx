/**
 * Dice.tsx
 *
 * 3D dice that:
 *  1. Spins freely while rolling
 *  2. Snaps to the EXACT rotation that shows the rolled face on top (+Y)
 *  3. Only reveals the number AFTER the spin animation completes
 *  4. Never shows stale values or gets stuck on 6
 */

import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

//  Face rotations
// Three.js BoxGeometry face order: +X(right), -X(left), +Y(top), -Y(bottom), +Z(front), -Z(back)
// We want the correct pip-count face to appear on TOP (+Y) when settled.
//
// Standard dice opposite faces: 1↔6, 2↔5, 3↔4
// We build textures in order [1,2,3,4,5,6] mapped to faces [+X,-X,+Y,-Y,+Z,-Z].
// So face +Y (index 2) = pip 3 by default.
//
// To show value V on top we need to rotate so that the face carrying V ends up as +Y.
// Rotations (Euler XYZ) that bring each value to the top:
const FACE_ROTATIONS: Record<number, [number, number, number]> = {
  1: [0, 0, -Math.PI / 2], // 1 is on +X face → rotate Z 90° CCW to bring to top
  2: [0, 0, Math.PI / 2], // 2 is on -X face → rotate Z 90° CW
  3: [0, 0, 0], // 3 is on +Y face → already on top
  4: [Math.PI, 0, 0], // 4 is on -Y face → flip 180° on X
  5: [-Math.PI / 2, 0, 0], // 5 is on +Z face → rotate X -90°
  6: [Math.PI / 2, 0, 0], // 6 is on -Z face → rotate X +90°
};

//  Dot texture generator
function makeFaceTexture(n: number): THREE.CanvasTexture {
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;

  // Ivory background
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, size, size);

  // Rounded border
  ctx.strokeStyle = "#c8b89a";
  ctx.lineWidth = 8;
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(r, 4);
  ctx.lineTo(size - r, 4);
  ctx.quadraticCurveTo(size - 4, 4, size - 4, r);
  ctx.lineTo(size - 4, size - r);
  ctx.quadraticCurveTo(size - 4, size - 4, size - r, size - 4);
  ctx.lineTo(r, size - 4);
  ctx.quadraticCurveTo(4, size - 4, 4, size - r);
  ctx.lineTo(4, r);
  ctx.quadraticCurveTo(4, 4, r, 4);
  ctx.closePath();
  ctx.stroke();

  // Dot positions for each face value
  const DOT_MAPS: Record<number, [number, number][]> = {
    1: [[128, 128]],
    2: [
      [72, 72],
      [184, 184],
    ],
    3: [
      [72, 72],
      [128, 128],
      [184, 184],
    ],
    4: [
      [72, 72],
      [184, 72],
      [72, 184],
      [184, 184],
    ],
    5: [
      [72, 72],
      [184, 72],
      [128, 128],
      [72, 184],
      [184, 184],
    ],
    6: [
      [72, 66],
      [184, 66],
      [72, 128],
      [184, 128],
      [72, 190],
      [184, 190],
    ],
  };

  const dotR = 22;
  ctx.fillStyle = n === 1 ? "#cc2222" : "#2a2a2a"; // red pip for 1, classic

  for (const [x, y] of DOT_MAPS[n] ?? []) {
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(cv);
}

// Pre-build all 6 textures once
const FACE_TEXTURES = [1, 2, 3, 4, 5, 6].map(makeFaceTexture);

//  Props
interface DiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

//  Component
const Dice: React.FC<DiceProps> = ({ value, isRolling, onRoll, disabled }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Spin state
  const spinRef = useRef({ x: 0, y: 0, z: 0 });
  const spinSpeedRef = useRef({ x: 0, y: 0, z: 0 });

  // Whether we've snapped to the settled rotation for this value
  const [settled, setSettled] = useState(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When rolling starts, kick off a fast random spin
  useEffect(() => {
    if (isRolling) {
      setSettled(false);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      spinSpeedRef.current = {
        x: (Math.random() - 0.5) * 0.35,
        y: (Math.random() - 0.5) * 0.35,
        z: (Math.random() - 0.5) * 0.35,
      };
    }
  }, [isRolling]);

  // When rolling stops and we have a value, wait 300ms then snap to correct face
  useEffect(() => {
    if (!isRolling && value !== null) {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        if (meshRef.current && value !== null) {
          const [ex, ey, ez] = FACE_ROTATIONS[value];
          meshRef.current.rotation.set(ex, ey, ez);
          spinSpeedRef.current = { x: 0, y: 0, z: 0 };
          setSettled(true);
        }
      }, 300);
    }
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [isRolling, value]);

  // Animation loop
  useFrame(() => {
    if (!meshRef.current) return;
    if (isRolling) {
      // Free spin while rolling
      meshRef.current.rotation.x += spinSpeedRef.current.x;
      meshRef.current.rotation.y += spinSpeedRef.current.y;
      meshRef.current.rotation.z += spinSpeedRef.current.z;
    }
    // When not rolling: rotation is either at settled face or idle, do nothing
  });

  const canClick = !disabled && !isRolling;

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={() => canClick && onRoll()}
        scale={isRolling ? 1.08 : 1}
      >
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        {/* Faces in BoxGeometry order: +X, -X, +Y, -Y, +Z, -Z → values 1,2,3,4,5,6 */}
        {FACE_TEXTURES.map((tex, i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            map={tex}
            roughness={0.25}
            metalness={0.05}
          />
        ))}
      </mesh>

      {canClick && value === null && (
        <mesh position={[0, -1.1, 0]}>
          <planeGeometry args={[2.2, 0.5]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
};

export default Dice;
