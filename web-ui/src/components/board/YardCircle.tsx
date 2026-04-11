import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cellPos } from "../../utils/boardLogic";

interface YardCircleProps {
  row: number;
  col: number;
  color: string;
  emissive: string;
  homeImage?: string;
}

const YardCircle: React.FC<YardCircleProps> = ({
  row,
  col,
  color,
  emissive,
  homeImage,
}) => {
  const [x, , z] = cellPos(row, col);
  const [textureLoaded, setTextureLoaded] = useState(false);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!homeImage) {
      setTextureLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
      textureRef.current = texture;
      setTextureLoaded(true);
    };

    img.onerror = (err) => {
      console.error(`Failed to load image for ${color}:`, err);
    };

    img.src = homeImage;

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [homeImage, color]);

  // The yard covers from row 0-5 and col 0-5 (6x6 area)
  // Center of red yard is at row 2.5, col 2.5
  // The yard width is approximately 6 * CELL_SIZE = 6 * 0.88 = 5.28 units
  const yardSize = 5.2;

  return (
    <group position={[x, 0.02, z]}>
      {homeImage && textureLoaded && textureRef.current && (
        <mesh
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[yardSize, yardSize]} />
          <meshStandardMaterial
            map={textureRef.current}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
      )}

      {!homeImage && (
        <mesh receiveShadow castShadow>
          <boxGeometry args={[yardSize, 0.05, yardSize]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </mesh>
      )}

      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.36, 64]} />
        <meshStandardMaterial
          color="#c49a28"
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 64]} />
        <meshStandardMaterial color="#f9f0e0" roughness={0.5} />
      </mesh>

      {([-0.52, 0.52] as const).flatMap((ox) =>
        ([-0.52, 0.52] as const).map((oz) => (
          <mesh
            key={`${ox}${oz}`}
            position={[ox, 0.12, oz]}
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
