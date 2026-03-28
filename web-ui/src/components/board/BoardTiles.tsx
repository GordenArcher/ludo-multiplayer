import React, { useMemo } from "react";
import Tile from "./Tile";

const BoardTiles: React.FC = () => {
  const tiles = useMemo(() => {
    const out: JSX.Element[] = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        out.push(<Tile key={`${r}-${c}`} r={r} c={c} />);
      }
    }
    return out;
  }, []);

  return <group>{tiles}</group>;
};

export default BoardTiles;
