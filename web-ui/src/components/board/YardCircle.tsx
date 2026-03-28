import React from "react";
import { cellPos } from "../../utils/boardLogic";

interface YardCircleProps {
  row: number;
  col: number;
  color: string;
  emissive: string;
}

const YardCircle: React.FC<YardCircleProps> = ({
  row,
  col,
  color,
  emissive,
}) => {
  const [x, , z] = cellPos(row, col);

  return (
    <group position={[x, 0.05, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.36, 64]} />
        <meshStandardMaterial
          color="#c49a28"
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 64]} />
        <meshStandardMaterial color="#f9f0e0" roughness={0.5} />
      </mesh>

      {([-0.52, 0.52] as const).flatMap((ox) =>
        ([-0.52, 0.52] as const).map((oz) => (
          <mesh
            key={`${ox}${oz}`}
            position={[ox, 0.02, oz]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.26, 36]} />
            <meshStandardMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={0.5}
              roughness={0.25}
              metalness={0.2}
            />
          </mesh>
        )),
      )}
    </group>
  );
};

export default YardCircle;
