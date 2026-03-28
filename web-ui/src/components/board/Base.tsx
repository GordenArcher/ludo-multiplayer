import React, { useMemo } from "react";
import * as THREE from "three";
import { CELL } from "../../utils/boardLogic";

const Base: React.FC = () => {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#c9a87b";
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 200; i++) {
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          128,
          y + (Math.random() - 0.5) * 14,
          384,
          y + (Math.random() - 0.5) * 18,
          512,
          y + (Math.random() - 0.5) * 10,
        );
        ctx.strokeStyle = `rgba(100, 60, 30, ${0.15 + Math.random() * 0.25})`;
        ctx.lineWidth = 1.5 + Math.random() * 3;
        ctx.stroke();
      }

      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * 512,
          Math.random() * 512,
          8 + Math.random() * 18,
          5 + Math.random() * 12,
          Math.random() * Math.PI,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(80, 45, 20, ${0.25 + Math.random() * 0.35})`;
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 2.2);
    return tex;
  }, []);

  const boardWidth = 15 * CELL + 1.6;

  return (
    <group>
      <mesh position={[0, -0.21, 0]} receiveShadow castShadow>
        <boxGeometry args={[boardWidth, 0.28, boardWidth]} />
        <meshStandardMaterial
          map={texture}
          color="#b87c4f"
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[boardWidth + 0.28, 0.1, boardWidth + 0.28]} />
        <meshStandardMaterial
          color="#9b6e42"
          roughness={0.5}
          metalness={0.08}
        />
      </mesh>
    </group>
  );
};

export default Base;
