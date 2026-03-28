import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Base from "./Base";
import BoardTiles from "./BoardTiles";
import Grid from "./Grid";
import YardCircles from "./YardCircles";
import CenterStar from "./CenterStar";
import Tokens from "./Tokens";

const LudoBoard3D: React.FC = () => {
  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-radial from-[#1a0f08] to-[#030100]">
      <Canvas
        shadows
        camera={{ position: [0, 14, 12], fov: 40 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#030100"]} />

        <ambientLight intensity={0.55} />
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-4, 6, -3]}
          intensity={0.4}
          color="#ffccaa"
        />
        <pointLight position={[0, 2, 0]} intensity={0.35} color="#ffaa66" />

        <Base />
        <BoardTiles />
        <Grid />
        <YardCircles />
        <CenterStar />
        <Tokens />

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 5}
          dampingFactor={0.06}
          rotateSpeed={0.8}
          zoomSpeed={1.2}
          target={[0, 0, 0]}
          makeDefault
        />
      </Canvas>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-md rounded-full px-4 py-1.5 pointer-events-none">
        <p className="text-white/60 text-xs font-sans tracking-wide">
          🖱 Drag to rotate • 🔍 Scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default LudoBoard3D;
