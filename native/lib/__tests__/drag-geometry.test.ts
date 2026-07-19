import { Piece, canPlacePiece, createEmptyBoard, placePiece } from '../levels';
import { BoardGeometry, cellsForAnchor, computeAnchor, dragBlockTopLeft } from '../drag-geometry';

// Fixed geometry so the expected anchors below are exact integers.
// cellSize 40, dragLift = 40 * 0.35 = 14 (matches DRAG_LIFT in play.tsx).
const geom = (boardSize: number): BoardGeometry => ({ cellSize: 40, boardSize, dragLift: 14 });

function makePiece(cells: Array<[number, number]>): Piece {
  return { id: 'p', shape: { id: 's', cells }, color: '#000', rotatable: false, rotation: 0 };
}

const SINGLE = makePiece([[0, 0]]);
const DOMINO_H = makePiece([[0, 0], [0, 1]]);
const DOMINO_V = makePiece([[0, 0], [1, 0]]);
const SQUARE = makePiece([[0, 0], [0, 1], [1, 0], [1, 1]]);
const L = makePiece([[0, 0], [1, 0], [1, 1]]);

const sortCells = (cs: Array<[number, number]>) =>
  [...cs].sort(([ar, ac], [br, bc]) => ar - br || ac - bc);

describe('computeAnchor — where the piece snaps', () => {
  test('single cell centers under the finger', () => {
    expect(computeAnchor(60, 60, SINGLE, geom(4))).toEqual({ row: 1, col: 1 });
    expect(computeAnchor(20, 34, SINGLE, geom(4))).toEqual({ row: 0, col: 0 });
    expect(computeAnchor(140, 154, SINGLE, geom(4))).toEqual({ row: 3, col: 3 });
  });

  test('horizontal domino anchors by its top-left, spanning two columns', () => {
    const a = computeAnchor(80, 34, DOMINO_H, geom(4));
    expect(a).toEqual({ row: 0, col: 1 });
    expect(sortCells(cellsForAnchor(DOMINO_H, a!))).toEqual([[0, 1], [0, 2]]);
  });

  test('vertical domino spans two rows', () => {
    const a = computeAnchor(20, 74, DOMINO_V, geom(4));
    expect(a).toEqual({ row: 1, col: 0 });
    expect(sortCells(cellsForAnchor(DOMINO_V, a!))).toEqual([[1, 0], [2, 0]]);
  });

  test('anchor clamps so a piece never hangs off the board edge', () => {
    // Finger jammed into the bottom-right corner; a 2x2 can only sit at {2,2} on a 4x4.
    expect(computeAnchor(160, 160, SQUARE, geom(4))).toEqual({ row: 2, col: 2 });
    // ...and top-left: never negative.
    expect(computeAnchor(20, 34, SQUARE, geom(4))).toEqual({ row: 0, col: 0 });
  });

  test('returns null when the piece center is off the board (no preview / no drop)', () => {
    expect(computeAnchor(-1, 60, SINGLE, geom(4))).toBeNull(); // left of board
    expect(computeAnchor(60, 10, SINGLE, geom(4))).toBeNull(); // above board (past dragLift)
    expect(computeAnchor(200, 60, SINGLE, geom(4))).toBeNull(); // right of 4x4 (boardPx 160)
    expect(computeAnchor(60, 200, SINGLE, geom(4))).toBeNull(); // below board
  });

  test('board-size gating scales with the grid (5x5, 6x6)', () => {
    // x=200 is off a 4x4 (160px) but on-board for 5x5 (200px) and 6x6 (240px).
    expect(computeAnchor(200, 60, SINGLE, geom(4))).toBeNull();
    expect(computeAnchor(200, 60, SINGLE, geom(5))).not.toBeNull();
    expect(computeAnchor(220, 60, SINGLE, geom(6))).not.toBeNull();
  });

  test('rotated L piece anchors by its normalized bounds', () => {
    const a = computeAnchor(60, 74, L, geom(5));
    expect(a).not.toBeNull();
    // Every occupied cell stays on the board.
    for (const [r, c] of cellsForAnchor(L, a!)) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(5);
      expect(c).toBeLessThan(5);
    }
  });
});

describe('hover preview and actual drop are the same cells', () => {
  // The bug class we are guarding against: green highlights one set of cells, the piece
  // lands on another. Both must come from computeAnchor + the same offsets.
  const cases: Array<[string, Piece, number, [number, number][]]> = [
    ['single 4x4', SINGLE, 4, [[60, 60], [20, 34], [140, 154], [100, 100]]],
    ['domino-h 5x5', DOMINO_H, 5, [[80, 74], [120, 114], [160, 154]]],
    ['square 6x6', SQUARE, 6, [[100, 114], [160, 154], [200, 194]]],
    ['L 5x5', L, 5, [[60, 74], [100, 114], [140, 154]]],
  ];

  test.each(cases)('%s: ghost cells === placed cells at every sampled point', (_label, piece, n, points) => {
    for (const [fx, fy] of points) {
      const a = computeAnchor(fx, fy, piece, geom(n));
      if (!a) continue;
      const hoverCells = sortCells(cellsForAnchor(piece, a));

      // Actual drop derived independently via placePiece, then read back.
      const board = placePiece(createEmptyBoard(n), piece, a.row, a.col);
      const dropCells: Array<[number, number]> = [];
      board.forEach((row, r) => row.forEach((cell, c) => cell && dropCells.push([r, c])));

      expect(sortCells(dropCells)).toEqual(hoverCells);
      expect(canPlacePiece(createEmptyBoard(n), piece, a.row, a.col)).toBe(true);
    }
  });
});

describe('floating block aligns with the green ghost', () => {
  // The rendered block sits at dragBlockTopLeft (continuous); the ghost sits at the anchor
  // (snapped). The anchor must be exactly that block position rounded to the grid and clamped,
  // so the two never diverge by more than snapping. If they ever do, this test catches it.
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  test.each([
    ['single 4x4', SINGLE, 4],
    ['domino-h 4x4', DOMINO_H, 4],
    ['square 5x5', SQUARE, 5],
    ['L 6x6', L, 6],
  ] as Array<[string, Piece, number]>)('%s: anchor = snapped(block) at every on-board point', (_label, piece, n) => {
    const g = geom(n);
    const { width, height } = { width: Math.max(...piece.shape.cells.map(([, c]) => c)) + 1, height: Math.max(...piece.shape.cells.map(([r]) => r)) + 1 };
    for (let fx = 0; fx <= g.cellSize * n; fx += 7) {
      for (let fy = 14; fy <= g.cellSize * n + 14; fy += 7) {
        const a = computeAnchor(fx, fy, piece, g);
        if (!a) continue;
        const { x, y } = dragBlockTopLeft(fx, fy, piece, g);
        expect(a.col).toBe(clamp(Math.round(x / g.cellSize), 0, n - width));
        expect(a.row).toBe(clamp(Math.round(y / g.cellSize), 0, n - height));
      }
    }
  });
});
