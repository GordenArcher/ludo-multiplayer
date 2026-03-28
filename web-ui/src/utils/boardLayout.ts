import type { CellData, BoardLayout } from "../types/board";

export class BoardLayoutGenerator {
  private static readonly SIZE = 15; // 15x15 grid
  private static readonly PATH_START = 6; // Path starts at row/col 6
  private static readonly PATH_END = 8; // Path ends at row/col 8

  static generate(): BoardLayout {
    const cells: CellData[] = [];

    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        const cell = this.determineCellType(row, col);
        if (cell) {
          cells.push(cell);
        }
      }
    }

    return {
      cells,
      dimensions: { rows: this.SIZE, cols: this.SIZE },
    };
  }

  private static determineCellType(row: number, col: number): CellData | null {
    // Corners (Home areas)
    if (row < 6 && col < 6) {
      return this.createCornerCell(row, col, "red");
    }
    if (row < 6 && col >= 9) {
      return this.createCornerCell(row, col, "green");
    }
    if (row >= 9 && col < 6) {
      return this.createCornerCell(row, col, "yellow");
    }
    if (row >= 9 && col >= 9) {
      return this.createCornerCell(row, col, "blue");
    }

    // Center
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
      return {
        id: `center-${row}-${col}`,
        position: { row, col },
        type: "center",
      };
    }

    // Main path (the cross shape)
    const isOnPath = this.isOnPath(row, col);
    if (isOnPath) {
      return {
        id: `path-${row}-${col}`,
        position: { row, col },
        type: "path",
        isSafeSpot: this.isSafeSpot(row, col),
        pathIndex: this.calculatePathIndex(row, col),
      };
    }

    // Home columns (colored paths to center)
    const homeColumn = this.getHomeColumn(row, col);
    if (homeColumn) {
      return {
        id: `homeColumn-${row}-${col}`,
        position: { row, col },
        type: "homeColumn",
        color: homeColumn,
      };
    }

    return null; // Empty space
  }

  private static isOnPath(row: number, col: number): boolean {
    const inMiddleRow = row === 6 || row === 7 || row === 8;
    const inMiddleCol = col === 6 || col === 7 || col === 8;
    const onOuterRing = row === 0 || row === 14 || col === 0 || col === 14;

    return (
      (inMiddleRow || inMiddleCol || onOuterRing) && !this.isCorner(row, col)
    );
  }

  private static isCorner(row: number, col: number): boolean {
    return (
      (row < 6 && col < 6) ||
      (row < 6 && col > 8) ||
      (row > 8 && col < 6) ||
      (row > 8 && col > 8)
    );
  }

  private static isSafeSpot(row: number, col: number): boolean {
    // Star positions on the path
    const safeSpots = [
      [0, 6],
      [6, 0],
      [6, 14],
      [14, 6], // Middle of each side
      [2, 6],
      [6, 2],
      [6, 12],
      [12, 6], // Star positions
    ];
    return safeSpots.some(([r, c]) => r === row && c === col);
  }

  private static calculatePathIndex(row: number, col: number): number {
    // This maps board coordinates to path index 0-51
    // We'll implement this based on actual path order
    // For now, returning a placeholder
    return (row + col) % 52;
  }

  private static getHomeColumn(
    row: number,
    col: number,
  ): "red" | "green" | "yellow" | "blue" | null {
    // Red home column (top-left to center)
    if (col === 6 && row > 0 && row < 6) return "red";
    // Green home column (top-right to center)
    if (row === 6 && col > 8 && col < 14) return "green";
    // Yellow home column (bottom-left to center)
    if (row === 8 && col > 0 && col < 6) return "yellow";
    // Blue home column (bottom-right to center)
    if (col === 8 && row > 8 && row < 14) return "blue";

    return null;
  }

  private static createCornerCell(
    row: number,
    col: number,
    color: "red" | "green" | "yellow" | "blue",
  ): CellData {
    return {
      id: `${color}-home-${row}-${col}`,
      position: { row, col },
      type: "home",
      color,
    };
  }
}
