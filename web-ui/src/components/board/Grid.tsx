import React, { useMemo } from "react";
import * as THREE from "three";
import { CELL } from "../../utils/boardLogic";

const Grid: React.FC = () => {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const halfSize = 7.5 * CELL;
    for (let i = 0; i <= 15; i++) {
      const pos = (-7.5 + i) * CELL;
      vertices.push(pos, 0.05, -halfSize, pos, 0.05, halfSize);
      vertices.push(-halfSize, 0.05, pos, halfSize, 0.05, pos);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#3a1e08" transparent opacity={0.2} />
    </lineSegments>
  );
};

export default Grid;
