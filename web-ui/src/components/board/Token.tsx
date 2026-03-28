import React from "react";
import { cellPos } from "../../utils/boardLogic";

interface TokenProps {
  row: number;
  col: number;
  color: string;
  emissive: string;
}

const Token: React.FC<TokenProps> = ({ row, col, color, emissive }) => {
  const [x, , z] = cellPos(row, col);

  return (
    <group position={[x, 0.08, z]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.1, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.12}
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>

      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.29, 48]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.15} />
      </mesh>

      <mesh position={[0, -0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 16]} />
        <meshStandardMaterial color="#000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export default Token;
