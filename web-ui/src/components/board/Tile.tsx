import React from "react";
import {
  getKind,
  getFlag,
  COLORS,
  EMIT,
  EMIT_INT,
  cellPos,
} from "../../utils/boardLogic";

interface TileProps {
  r: number;
  c: number;
}

const Tile: React.FC<TileProps> = ({ r, c }) => {
  const kind = getKind(r, c);
  const flag = getFlag(r, c);
  const [x, , z] = cellPos(r, c);

  const starColor =
    flag === "start_red"
      ? "#dc2626"
      : flag === "start_green"
        ? "#16a34a"
        : flag === "start_blue"
          ? "#2563eb"
          : flag === "start_yellow"
            ? "#ca8a04"
            : "#fbbf24";

  return (
    <group position={[x, 0, z]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[0.83, 0.07, 0.83]} />
        <meshStandardMaterial
          color={COLORS[kind]}
          emissive={EMIT[kind]}
          emissiveIntensity={EMIT_INT[kind]}
          roughness={kind === "path" ? 0.6 : 0.4}
          metalness={kind === "center" ? 0.4 : 0.05}
        />
      </mesh>

      {flag && (
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.21, flag === "safe" ? 6 : 5]} />
          <meshStandardMaterial
            color={starColor}
            emissive={starColor}
            emissiveIntensity={0.65}
            roughness={0.3}
            metalness={0.15}
          />
        </mesh>
      )}
    </group>
  );
};

export default Tile;
