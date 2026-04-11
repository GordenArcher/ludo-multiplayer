import React from "react";
import YardCircle from "./YardCircle";
import type { PlayerColor } from "../../types/game";

interface YardCirclesProps {
  homeImages?: Record<PlayerColor, string>;
}

const YardCircles: React.FC<YardCirclesProps> = ({ homeImages }) => {
  const circles = [
    {
      r: 2.5,
      c: 2.5,
      color: "#dc2626",
      emissive: "#7f1d1d",
      colorKey: "red" as PlayerColor,
    },
    {
      r: 2.5,
      c: 11.5,
      color: "#16a34a",
      emissive: "#14532d",
      colorKey: "green" as PlayerColor,
    },
    {
      r: 11.5,
      c: 2.5,
      color: "#ca8a04",
      emissive: "#713f12",
      colorKey: "yellow" as PlayerColor,
    },
    {
      r: 11.5,
      c: 11.5,
      color: "#2563eb",
      emissive: "#1e3a8a",
      colorKey: "blue" as PlayerColor,
    },
  ];

  return (
    <group>
      {circles.map((circle) => (
        <YardCircle
          key={circle.colorKey}
          row={circle.r}
          col={circle.c}
          color={circle.color}
          emissive={circle.emissive}
          homeImage={homeImages?.[circle.colorKey]}
        />
      ))}
    </group>
  );
};

export default YardCircles;
