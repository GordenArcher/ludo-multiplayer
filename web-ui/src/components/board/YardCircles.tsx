import React from "react";
import YardCircle from "./YardCircle";
import { YARD_CIRCLES } from "../../utils/boardLogic";

const YardCircles: React.FC = () => {
  return (
    <group>
      {YARD_CIRCLES.map((circle, i) => (
        <YardCircle
          key={i}
          row={circle.r}
          col={circle.c}
          color={circle.color}
          emissive={circle.emissive}
        />
      ))}
    </group>
  );
};

export default YardCircles;
