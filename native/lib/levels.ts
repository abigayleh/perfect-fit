import { LEVEL_DIFFICULTY, LEVEL_SPECS } from './level-presets';

// Board grows with progression: 4x4 (1-7), 5x5 (8-39), 6x6 (40-75), 7x7 (76-100).
export function getBoardSize(level: number): number {
  if (level <= 7) return 4;
  if (level <= 39) return 5;
  if (level <= 75) return 6;
  return 7;
}

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

export type BoardCell = { pieceId: string; color: string } | { obstacle: true } | null;

export type ShapeCells = Array<[number, number]>;

export type LevelPiecePreset = {
  cells: ShapeCells;
  rotatable?: boolean;
  initialRotation?: number;
};

// A level's full definition. `pieces` may include decoys (more than needed to
// fill the free cells); `obstacles` are permanently blocked cells; `moveLimit`,
// if set, fails the level when exceeded. `parMoves` is the 3-star threshold —
// the minimum placements to win (= number of solution pieces).
export type LevelSpec = {
  pieces: LevelPiecePreset[];
  obstacles?: ShapeCells;
  moveLimit?: number;
  parMoves: number;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export function getLevelDifficulty(level: number): Difficulty {
  return LEVEL_DIFFICULTY[level] ?? 'medium';
}

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

// Every level is defined in the generated LEVEL_SPECS catalog; fall back to
// level 1 only as a defensive guard against an out-of-range request.
export function getLevelSpec(level: number): LevelSpec {
  return LEVEL_SPECS[level] ?? LEVEL_SPECS[1];
}

export function createLevelPieces(level: number): Piece[] {
  const presets = getLevelSpec(level).pieces;
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

export function createEmptyBoard(size: number): BoardCell[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
}

// Board seeded with a level's obstacle cells (permanently blocked).
export function createBoard(size: number, obstacles?: ShapeCells): BoardCell[][] {
  const board = createEmptyBoard(size);
  for (const [r, c] of obstacles ?? []) {
    if (r >= 0 && r < size && c >= 0 && c < size) board[r][c] = { obstacle: true };
  }
  return board;
}

export function isObstacle(cell: BoardCell): cell is { obstacle: true } {
  return cell !== null && 'obstacle' in cell;
}

// Win state: no empty (null) cells remain. Obstacles count as filled, and
// leftover decoy pieces in the tray are fine.
export function isBoardFull(board: BoardCell[][]): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

// 3 stars = no wasted placements, 2 = up to two extra, 1 = solved at all.
export function starsFor(moves: number, parMoves: number): number {
  if (moves <= parMoves) return 3;
  if (moves <= parMoves + 2) return 2;
  return 1;
}

// Board helpers infer the grid size from the board itself, so they work for any
// board size without threading a size argument through every call site.
export function normalizeBoard(board: BoardCell[][]): BoardCell[][] {
  const size = board.length;
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => board[r]?.[c] ?? null),
  );
}

export function canPlacePiece(
  board: BoardCell[][],
  piece: Piece,
  anchorRow: number,
  anchorCol: number,
): boolean {
  const size = board.length;
  return piece.shape.cells.every(([dr, dc]) => {
    const r = anchorRow + dr;
    const c = anchorCol + dc;
    return r >= 0 && r < size && c >= 0 && c < size && board[r][c] === null;
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
