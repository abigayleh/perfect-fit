// Guards the level catalog: every level must have a real perfect tiling of its
// board (4x4, 5x5, or 6x6 depending on level). Reads the actual level data via
// createLevelPieces, so a broken or unsolvable level added later fails here.
import {
  Piece, ShapeCells,
  createLevelPieces, getBoardSize, getLevelDifficulty, normalizeCells, rotateCellsClockwise,
} from '../levels';
import { MAX_LEVEL } from '../progress';

// Orientations a piece can actually be placed in: all 4 rotations if rotatable,
// otherwise just the one shape it's handed as (matches in-game behavior).
function orientations(piece: Piece): ShapeCells[] {
  const base = normalizeCells(piece.shape.cells);
  if (!piece.rotatable) return [base];
  const seen = new Set<string>();
  const out: ShapeCells[] = [];
  let cur = base;
  for (let i = 0; i < 4; i++) {
    const key = JSON.stringify(cur);
    if (!seen.has(key)) { seen.add(key); out.push(cur); }
    cur = rotateCellsClockwise(cur);
  }
  return out;
}

// Backtracking exact-cover solver for an N x N board. Always fills the top-left-most
// empty cell, which bounds the search and guarantees a definitive yes/no.
function isSolvable(pieces: Piece[], size: number): boolean {
  const occ = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const oris = pieces.map(orientations);
  const used = Array<boolean>(pieces.length).fill(false);

  function firstEmpty(): [number, number] | null {
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!occ[r][c]) return [r, c];
    return null;
  }

  function solve(): boolean {
    const cell = firstEmpty();
    if (!cell) return true;
    const [er, ec] = cell;
    for (let i = 0; i < pieces.length; i++) {
      if (used[i]) continue;
      for (const shape of oris[i]) {
        // Anchor the piece so one of its cells lands on the target empty cell.
        for (const [pr, pc] of shape) {
          const ar = er - pr;
          const ac = ec - pc;
          const fits = shape.every(([dr, dc]) => {
            const r = ar + dr, c = ac + dc;
            return r >= 0 && r < size && c >= 0 && c < size && !occ[r][c];
          });
          if (!fits) continue;
          shape.forEach(([dr, dc]) => { occ[ar + dr][ac + dc] = true; });
          used[i] = true;
          if (solve()) return true;
          used[i] = false;
          shape.forEach(([dr, dc]) => { occ[ar + dr][ac + dc] = false; });
        }
      }
    }
    return false;
  }
  return solve();
}

const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

describe('every level fills its board exactly', () => {
  test.each(levels)('level %i covers every cell', (lvl) => {
    const size = getBoardSize(lvl);
    const total = createLevelPieces(lvl).reduce((s, p) => s + p.shape.cells.length, 0);
    expect(total).toBe(size * size);
  });
});

describe('every level has a perfect tiling', () => {
  test.each(levels)('level %i is solvable', (lvl) => {
    expect(isSolvable(createLevelPieces(lvl), getBoardSize(lvl))).toBe(true);
  });
});

// Sanity check that the solver can say "no": a 1x4 bar + three 2x2 squares sums
// to 16 but can never tile 4x4 (the squares are left an odd-sized region).
describe('solver rejects impossible tilings', () => {
  const piece = (cells: ShapeCells): Piece => ({
    id: 'x', shape: { id: 's', cells: normalizeCells(cells) },
    color: '#000', rotatable: false, rotation: 0,
  });
  test('bar + three squares is not solvable', () => {
    const bar = piece([[0, 0], [0, 1], [0, 2], [0, 3]]);
    const sq = () => piece([[0, 0], [0, 1], [1, 0], [1, 1]]);
    expect(isSolvable([bar, sq(), sq(), sq()], 4)).toBe(false);
  });
});

describe('difficulty invariant', () => {
  test.each(levels)('level %i: rotatable pieces only on hard levels', (lvl) => {
    const hasRotatable = createLevelPieces(lvl).some((p) => p.rotatable);
    if (getLevelDifficulty(lvl) !== 'hard') expect(hasRotatable).toBe(false);
  });
});
