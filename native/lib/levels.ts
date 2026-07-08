export const BOARD_SIZE = 4;

export const PIECE_COLORS = [
  '#B77940',
  '#A86631',
  '#8F5A2D',
  '#C28A4B',
  '#9C6B3E',
  '#7E4D2A',
  '#B38354',
];

export type Shape = {
  id: string;
  cells: Array<[number, number]>;
};

export type Piece = {
  id: string;
  shape: Shape;
  color: string;
  rotatable: boolean;
  rotation: number;
};

export type BoardCell = { pieceId: string; color: string } | null;

export type ShapeCells = Array<[number, number]>;

type LevelPiecePreset = {
  cells: ShapeCells;
  rotatable?: boolean;
  initialRotation?: number;
};

const PRESET_LEVELS: Record<number, LevelPiecePreset[]> = {
  1: [
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  ],
  2: [
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [1, 0]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [1, 0]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [0, 1]] },
  ],
  3: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
  ],
  4: [
    { cells: [[0, 0], [0, 1], [1, 0]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0]] },
    { cells: [[0, 0], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  ],
  5: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { cells: [[0, 1], [1, 0], [1, 1], [2, 1]] },
  ],
  6: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 2]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], rotatable: true, initialRotation: 3 },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  ],
  7: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 0], [1, 0], [1, 1]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 1], [1, 0], [1, 1], [2, 1]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
    { cells: [[0, 0], [0, 1]] },
  ],
  8: [
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [0, 1], [1, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 0], [1, 0]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], rotatable: true, initialRotation: 3 },
  ],
  9: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 0]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 0], [0, 1], [1, 1], [1, 2]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  ],
  10: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 1], [1, 0], [1, 1], [1, 2]], rotatable: true, initialRotation: 3 },
    { cells: [[0, 0], [0, 1], [0, 2], [1, 2]], rotatable: true, initialRotation: 1 },
  ],
};

export function normalizeCells(cells: ShapeCells): ShapeCells {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  return cells
    .map(([row, col]) => [row - minRow, col - minCol] as [number, number])
    .sort(([rowA, colA], [rowB, colB]) => rowA - rowB || colA - colB);
}

export function rotateCellsClockwise(cells: ShapeCells): ShapeCells {
  const maxRow = Math.max(...cells.map(([row]) => row));
  const rotated = cells.map(([row, col]) => [col, maxRow - row] as [number, number]);
  return normalizeCells(rotated);
}

export function rotateCells(cells: ShapeCells, turns: number): ShapeCells {
  let next = normalizeCells(cells);
  const safe = ((turns % 4) + 4) % 4;
  for (let i = 0; i < safe; i++) next = rotateCellsClockwise(next);
  return next;
}

export function createLevelPieces(level: number): Piece[] {
  const presets = PRESET_LEVELS[level] ?? PRESET_LEVELS[1];
  return presets.map((preset, idx) => {
    const initialRotation = ((preset.initialRotation ?? 0) % 4 + 4) % 4;
    return {
      id: `level-${level}-piece-${idx}`,
      shape: {
        id: `level-${level}-shape-${idx}`,
        cells: rotateCells(preset.cells, initialRotation),
      },
      color: PIECE_COLORS[idx % PIECE_COLORS.length],
      rotatable: Boolean(preset.rotatable),
      rotation: initialRotation,
    };
  });
}

export function createEmptyBoard(): BoardCell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
}

export function normalizeBoard(board: BoardCell[][]): BoardCell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => board[r]?.[c] ?? null),
  );
}

export function canPlacePiece(
  board: BoardCell[][],
  piece: Piece,
  anchorRow: number,
  anchorCol: number,
): boolean {
  return piece.shape.cells.every(([dr, dc]) => {
    const r = anchorRow + dr;
    const c = anchorCol + dc;
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null;
  });
}

export function placePiece(
  board: BoardCell[][],
  piece: Piece,
  anchorRow: number,
  anchorCol: number,
): BoardCell[][] {
  const next = board.map(row => [...row]);
  for (const [dr, dc] of piece.shape.cells) {
    next[anchorRow + dr][anchorCol + dc] = { pieceId: piece.id, color: piece.color };
  }
  return next;
}

export function getShapeBounds(shape: Shape): { width: number; height: number } {
  const maxRow = Math.max(...shape.cells.map(([r]) => r));
  const maxCol = Math.max(...shape.cells.map(([, c]) => c));
  return { width: maxCol + 1, height: maxRow + 1 };
}

export function getMaxRotatedBounds(cells: ShapeCells): { width: number; height: number } {
  let maxW = 0;
  let maxH = 0;
  for (let t = 0; t < 4; t++) {
    const rotated = rotateCells(cells, t);
    const maxRow = Math.max(...rotated.map(([r]) => r));
    const maxCol = Math.max(...rotated.map(([, c]) => c));
    maxW = Math.max(maxW, maxCol + 1);
    maxH = Math.max(maxH, maxRow + 1);
  }
  return { width: maxW, height: maxH };
}
