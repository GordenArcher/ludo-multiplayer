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

  const yardSize = 5.2;

  // Helper to get contrasting text/label color
  const getContrastColor = (hexColor: string) => {
    // Simple contrast, white for dark colors, black for light
    const darkColors = ["#dc2626", "#16a34a", "#2563eb", "#ca8a04"];
    return darkColors.includes(hexColor) ? "#ffffff" : "#000000";
  };

  const labelColor = getContrastColor(color);

  return (
    <group position={[x, 0.02, z]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[yardSize, 0.05, yardSize]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>

      {homeImage && textureLoaded && textureRef.current && (
        <mesh
          position={[0, 0.045, 0]}
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

      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, 64]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.7}
          roughness={0.3}
          emissive="#b8860b"
          emissiveIntensity={0.15}
        />
      </mesh>

      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 64]} />
        <meshStandardMaterial
          color="#fef3c7"
          roughness={0.3}
          metalness={0.1}
          emissive="#fde047"
          emissiveIntensity={0.1}
        />
      </mesh>

      {([-0.65, 0.65] as const).flatMap((ox) =>
        ([-0.65, 0.65] as const).map((oz) => (
          <group key={`${ox}${oz}`}>
            <mesh position={[ox, 0.1, oz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.32, 48]} />
              <meshStandardMaterial
                color="#d4af37"
                emissive="#fbbf24"
                emissiveIntensity={0.3}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>

            <mesh position={[ox, 0.11, oz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.26, 48]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={0.4}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>

            <mesh position={[ox, 0.115, oz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.18, 32]} />
              <meshStandardMaterial
                color={labelColor}
                emissive={labelColor}
                emissiveIntensity={0.15}
                roughness={0.1}
                metalness={0.05}
                transparent
                opacity={0.6}
              />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
};

export default YardCircle;
