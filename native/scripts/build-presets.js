// Writes native/lib/level-presets.ts: keeps the existing 1-25 data (extracted
// from levels.ts) and appends generated, solver-verified 26-100.
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'lib', 'level-presets.ts');

// ---------- generator (same as gen-levels.js) ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260717);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
function normalize(cells) {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
function rotateCW(cells) {
  const maxR = Math.max(...cells.map((c) => c[0]));
  return normalize(cells.map(([r, c]) => [c, maxR - r]));
}
function rotateN(cells, t) { let x = normalize(cells); for (let i = 0; i < ((t % 4) + 4) % 4; i++) x = rotateCW(x); return x; }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function pickRotation(norm) { for (const t of [1, 2, 3]) if (!same(rotateN(norm, t), norm)) return t; return 0; }
function grow(grid, N, start, target, compact) {
  const idx = (r, c) => r * N + c;
  const cells = [start]; grid[idx(start[0], start[1])] = 1;
  const inPiece = new Set([idx(start[0], start[1])]);
  while (cells.length < target) {
    const cand = new Map();
    for (const [r, c] of cells) {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        const k = idx(nr, nc);
        if (grid[k] || inPiece.has(k)) continue;
        let touch = 0;
        for (const [er, ec] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inPiece.has(idx(nr + er, nc + ec))) touch++;
        cand.set(k, { cell: [nr, nc], touch });
      }
    }
    if (cand.size === 0) break;
    const list = [...cand.values()];
    let chosen;
    if (compact) { const mx = Math.max(...list.map((x) => x.touch)); chosen = pick(list.filter((x) => x.touch === mx)); }
    else chosen = pick(list);
    cells.push(chosen.cell); inPiece.add(idx(chosen.cell[0], chosen.cell[1])); grid[idx(chosen.cell[0], chosen.cell[1])] = 1;
  }
  return cells;
}
function tryGen(N, sizes, compact) {
  const grid = Array(N * N).fill(0); let empty = N * N; const pieces = [];
  while (empty > 0) {
    const flat = grid.indexOf(0); const start = [Math.floor(flat / N), flat % N];
    let target = Math.min(pick(sizes), empty);
    if (empty - target === 1) target = Math.min(target + 1, empty);
    const cells = grow(grid, N, start, target, compact);
    if (cells.length < 2) return null;
    pieces.push(cells); empty -= cells.length;
  }
  return pieces;
}
function generatePartition(N, sizes, compact) {
  for (let i = 0; i < 5000; i++) { const p = tryGen(N, sizes, compact); if (p) return p; }
  throw new Error(`could not partition ${N}x${N}`);
}
function orientations(cells, rotatable) {
  const base = normalize(cells); if (!rotatable) return [base];
  const seen = new Set(); const out = []; let cur = base;
  for (let i = 0; i < 4; i++) { const k = JSON.stringify(cur); if (!seen.has(k)) { seen.add(k); out.push(cur); } cur = rotateCW(cur); }
  return out;
}
function isSolvable(pieces, N) {
  const occ = Array.from({ length: N }, () => Array(N).fill(false));
  const oris = pieces.map((p) => orientations(p.cells, p.rotatable));
  const used = Array(pieces.length).fill(false);
  const firstEmpty = () => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!occ[r][c]) return [r, c]; return null; };
  function solve() {
    const cell = firstEmpty(); if (!cell) return true; const [er, ec] = cell;
    for (let i = 0; i < pieces.length; i++) {
      if (used[i]) continue;
      for (const shape of oris[i]) for (const [pr, pc] of shape) {
        const ar = er - pr, ac = ec - pc;
        if (!shape.every(([dr, dc]) => { const r = ar + dr, c = ac + dc; return r >= 0 && r < N && c >= 0 && c < N && !occ[r][c]; })) continue;
        shape.forEach(([dr, dc]) => { occ[ar + dr][ac + dc] = true; }); used[i] = true;
        if (solve()) return true;
        used[i] = false; shape.forEach(([dr, dc]) => { occ[ar + dr][ac + dc] = false; });
      }
    }
    return false;
  }
  return solve();
}
const HARD_5 = new Set([32, 39, 46, 53, 60, 67, 74]);
const HARD_6 = new Set([82, 89, 96]);
function difficultyFor(L) {
  if (L <= 75) { if (L - 26 < 3) return 'easy'; if (HARD_5.has(L)) return 'hard'; if (HARD_5.has(L - 1)) return 'easy'; return 'medium'; }
  if (L - 76 < 2) return 'easy'; if (HARD_6.has(L)) return 'hard'; if (HARD_6.has(L - 1)) return 'easy'; return 'medium';
}
const SIZES = { 5: { easy: [3, 4, 4, 5], medium: [3, 3, 4, 5], hard: [4, 4, 5] }, 6: { easy: [4, 4, 5, 6], medium: [4, 4, 5], hard: [4, 5] } };
function buildLevel(L) {
  const N = L <= 75 ? 5 : 6; const diff = difficultyFor(L); const compact = diff === 'easy';
  for (let a = 0; a < 200; a++) {
    const raw = generatePartition(N, SIZES[N][diff], compact);
    const pieces = raw.map((cells) => { const norm = normalize(cells); const rot = diff === 'hard' ? pickRotation(norm) : 0; return { cells: norm, rotatable: rot !== 0, initialRotation: rot }; });
    if (diff === 'hard' && !pieces.some((p) => p.rotatable)) continue;
    if (!isSolvable(pieces, N)) continue;
    return { diff, pieces };
  }
  throw new Error(`level ${L}: no valid board`);
}

// ---------- keep the hand-authored 1-25 (4x4) blocks from the existing file ----------
// Read our own prior output and preserve levels 1-25 verbatim, cutting at level 26.
function objectBody(src, header) {
  const start = src.indexOf(header);
  if (start < 0) throw new Error('marker not found: ' + header);
  const bodyStart = src.indexOf('{', start) + 1;
  const end = src.indexOf('\n};', bodyStart);
  return src.slice(bodyStart, end);
}
function keep1to25(body) {
  const idx = body.indexOf('\n  26:');
  if (idx < 0) throw new Error('level 26 boundary not found');
  return body.slice(0, idx).replace(/^\n/, '').replace(/\s+$/, '');
}
const src = fs.readFileSync(OUT, 'utf8');
const diff125 = keep1to25(objectBody(src, 'const LEVEL_DIFFICULTY'));
const preset125 = keep1to25(objectBody(src, 'const PRESET_LEVELS'));

// ---------- generate 26-100 ----------
const fmt = (cells) => '[' + cells.map(([r, c]) => `[${r}, ${c}]`).join(', ') + ']';
const presetLines = [];
const diffLines = [];
const stats = { easy: 0, medium: 0, hard: 0 };
for (let L = 26; L <= 100; L++) {
  const { diff, pieces } = buildLevel(L);
  stats[diff]++;
  diffLines.push(`  ${L}: '${diff}',`);
  presetLines.push(`  ${L}: [`);
  for (const p of pieces) {
    if (p.rotatable) presetLines.push(`    { cells: ${fmt(p.cells)}, rotatable: true, initialRotation: ${p.initialRotation} },`);
    else presetLines.push(`    { cells: ${fmt(p.cells)} },`);
  }
  presetLines.push(`  ],`);
}

// ---------- write level-presets.ts ----------
const out = `import type { Difficulty, LevelPiecePreset } from './levels';

// Level catalog. 1-25 = 4x4, 26-75 = 5x5, 76-100 = 6x6 (see getBoardSize).
// Each level is a perfect exact-cover tiling of its board; only hard levels have
// rotatable pieces. 26-100 are generated + solver-verified (scripts/build-presets.js).
// Difficulty resets to easy at each new board size, then ramps with hard spikes.
export const LEVEL_DIFFICULTY: Record<number, Difficulty> = {
${diff125}
${diffLines.join('\n')}
};

export const PRESET_LEVELS: Record<number, LevelPiecePreset[]> = {
${preset125}
${presetLines.join('\n')}
};
`;
fs.writeFileSync(OUT, out);
console.log('wrote', OUT);
console.log('26-100 difficulty stats:', JSON.stringify(stats));
