import React from "react";
import Token from "./Token";
import { TOKENS } from "../../utils/boardLogic";

const Tokens: React.FC = () => {
  return (
    <group>
      {TOKENS.map((group, groupIdx) =>
        group.positions.map(([row, col], tokenIdx) => (
          <Token
            key={`${groupIdx}-${tokenIdx}`}
            row={row}
            col={col}
            color={group.color}
            emissive={group.emissive}
          />
        )),
      )}
    </group>
  );
};

export default Tokens;
