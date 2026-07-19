import { Piece, getShapeBounds } from './levels';

// Geometry of a drag, shared by the drag overlay (the floating block), the green
// landing preview, and the actual placement — so all three derive from one source
// of truth and can never drift. Pure: no Reanimated / measure() / shared values.

export type BoardGeometry = {
  cellSize: number;
  boardSize: number;
  dragLift: number; // px the block floats above the finger so it isn't covered
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Board-space top-left (px) of the floating block for a finger at (fx, fy):
// centered on the finger horizontally, lifted by dragLift vertically. These are the
// exact offsets the drag overlay renders with, so the block and the ghost stay in lockstep.
export function dragBlockTopLeft(
  fx: number,
  fy: number,
  piece: Piece,
  g: Pick<BoardGeometry, 'cellSize' | 'dragLift'>,
): { x: number; y: number } {
  const { width, height } = getShapeBounds(piece.shape);
  return {
    x: fx - (width * g.cellSize) / 2,
    y: fy - (height * g.cellSize) / 2 - g.dragLift,
  };
}

// Landing anchor {row, col} = the block's top-left snapped to the grid and clamped
// on-board. Returns null when the piece's center is off the board (no preview/drop).
export function computeAnchor(
  fx: number,
  fy: number,
  piece: Piece,
  g: BoardGeometry,
): { row: number; col: number } | null {
  const { width, height } = getShapeBounds(piece.shape);
  const { x, y } = dragBlockTopLeft(fx, fy, piece, g);
  const cx = fx;
  const cy = fy - g.dragLift;
  const boardPx = g.cellSize * g.boardSize;
  if (cx < 0 || cy < 0 || cx > boardPx || cy > boardPx) return null;
  return {
    col: clamp(Math.round(x / g.cellSize), 0, g.boardSize - width),
    row: clamp(Math.round(y / g.cellSize), 0, g.boardSize - height),
  };
}

// Board cells a piece occupies at a given anchor — the same derivation the green
// ghost renders and placePiece writes. Returned as [row, col] pairs.
export function cellsForAnchor(
  piece: Piece,
  anchor: { row: number; col: number },
): Array<[number, number]> {
  return piece.shape.cells.map(([r, c]) => [anchor.row + r, anchor.col + c] as [number, number]);
}
