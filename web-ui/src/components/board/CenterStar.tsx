import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CenterStar: React.FC = () => {
  const starRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (starRef.current) {
      starRef.current.rotation.y += delta * 0.6;
      starRef.current.rotation.z += delta * 0.4;
    }
  });

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.42;
    const innerRadius = 0.18;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  return (
    <group position={[0, 0.1, 0]}>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1.05, 4]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh ref={starRef} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry
          args={[
            starShape,
            {
              depth: 0.08,
              bevelEnabled: true,
              bevelThickness: 0.02,
              bevelSize: 0.02,
              bevelSegments: 3,
            },
          ]}
        />
        <meshStandardMaterial
          color="#ffd966"
          emissive="#f59e0b"
          emissiveIntensity={0.7}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

export default CenterStar;
