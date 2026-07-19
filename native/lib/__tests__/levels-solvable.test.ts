// Guards the level catalog: every level must be fillable — a subset of its
// pieces (honoring rotation) exactly covers all free (non-obstacle) cells.
// Reads the real level data via getLevelSpec/createLevelPieces, so a broken or
// unsolvable level added later fails here. Levels may now carry obstacles and
// decoy pieces, so this is subset-cover, not strict exact-cover of all pieces.
import {
  Piece, ShapeCells,
  createLevelPieces, getBoardSize, getLevelSpec, normalizeCells, rotateCellsClockwise,
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

// Backtracking cover solver for an N x N board. Obstacle cells start occupied;
// pieces may be left unused (decoys). Always fills the top-left-most free cell,
// which bounds the search and guarantees a definitive yes/no.
function isSolvable(pieces: Piece[], size: number, obstacles: ShapeCells = []): boolean {
  const occ = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  for (const [r, c] of obstacles) occ[r][c] = true;
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
        // Anchor the piece so one of its cells lands on the target free cell.
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

describe('every level can fill its free cells', () => {
  test.each(levels)('level %i is solvable', (lvl) => {
    const spec = getLevelSpec(lvl);
    expect(isSolvable(createLevelPieces(lvl), getBoardSize(lvl), spec.obstacles ?? [])).toBe(true);
  });
});

// parMoves must be reachable: you can never fill the board in fewer placements
// than there are solution pieces, so par should cover the free area with the
// smallest sensible pieces. Guard the cheap invariant that par is positive and
// no larger than the piece count offered.
describe('parMoves is sane', () => {
  test.each(levels)('level %i par is within [1, pieceCount]', (lvl) => {
    const spec = getLevelSpec(lvl);
    expect(spec.parMoves).toBeGreaterThan(0);
    expect(spec.parMoves).toBeLessThanOrEqual(spec.pieces.length);
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
