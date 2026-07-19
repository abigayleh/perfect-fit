// Generates native/lib/level-presets.ts — the full 1-100 catalog as LEVEL_SPECS
// (obstacles, decoys, rotation, move limits, par) plus LEVEL_DIFFICULTY.
// Seeded + idempotent: rerun to regenerate identical output. Every level is
// solver-verified (a subset of its pieces exactly covers all free cells).
//
// Board pacing (see getBoardSize in lib/levels.ts): 4x4 = 1-7, 5x5 = 8-39,
// 6x6 = 40-75, 7x7 = 76-100. Mechanics are layered in per the schedule below.
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'lib', 'level-presets.ts');

// ---------- seeded RNG ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260719);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const randint = (a, b) => a + Math.floor(rng() * (b - a + 1));

// ---------- geometry ----------
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
// A rotation index (1-3) that yields a shape distinct from the original, or 0 if fully symmetric.
function pickRotation(norm) { const opts = [1, 2, 3].filter((t) => !same(rotateN(norm, t), norm)); return opts.length ? pick(opts) : 0; }

// Grow a connected polyomino of `target` cells from `start` over free (0) grid cells.
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

// Partition the free (non-obstacle) cells of an NxN board into polyomino pieces.
function tryPartition(N, sizes, compact, obstacles) {
  const grid = Array(N * N).fill(0);
  for (const [r, c] of obstacles) grid[r * N + c] = 1;
  let empty = N * N - obstacles.length;
  const pieces = [];
  while (empty > 0) {
    const flat = grid.indexOf(0); const start = [Math.floor(flat / N), flat % N];
    let target = Math.min(pick(sizes), empty);
    if (empty - target === 1) target = Math.min(target + 1, empty);
    const cells = grow(grid, N, start, target, compact);
    if (cells.length < 2) return null; // stranded single cell — bail, caller retries
    pieces.push(cells); empty -= cells.length;
  }
  return pieces;
}

// A standalone random polyomino (used for decoys), not tied to the board layout.
function randomPiece(N, sizes) {
  const grid = Array(N * N).fill(0);
  const start = [randint(0, N - 1), randint(0, N - 1)];
  const cells = grow(grid, N, start, Math.min(pick(sizes), N * N), false);
  return normalize(cells);
}

// ---------- solver (obstacle-aware subset cover, mirrors the app) ----------
function orientations(preset) {
  const base = rotateN(preset.cells, preset.initialRotation || 0);
  if (!preset.rotatable) return [base];
  const seen = new Set(); const out = []; let cur = base;
  for (let i = 0; i < 4; i++) { const k = JSON.stringify(cur); if (!seen.has(k)) { seen.add(k); out.push(cur); } cur = rotateCW(cur); }
  return out;
}
function isSolvable(presets, N, obstacles) {
  const occ = Array.from({ length: N }, () => Array(N).fill(false));
  for (const [r, c] of obstacles) occ[r][c] = true;
  const oris = presets.map(orientations);
  const used = Array(presets.length).fill(false);
  const firstEmpty = () => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!occ[r][c]) return [r, c]; return null; };
  function solve() {
    const cell = firstEmpty(); if (!cell) return true; const [er, ec] = cell;
    for (let i = 0; i < presets.length; i++) {
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

// ---------- per-level schedule ----------
function boardSizeFor(L) {
  if (L <= 7) return 4;
  if (L <= 39) return 5;
  if (L <= 75) return 6;
  return 7;
}
// Onboarding levels at the start of each new board size — kept gentle (no obstacles/limits).
const EASE_IN = new Set([1, 2, 3, 8, 9, 10, 40, 41, 42, 43, 76, 77, 78, 79]);
const HARD = new Set([7, 32, 39, 52, 63, 75, 89, 96, 100]);
const SIZES = { 4: [2, 3, 4], 5: [3, 4, 5], 6: [4, 5, 6], 7: [4, 5, 6] };

function classify(L) {
  const N = boardSizeFor(L);
  const diff = EASE_IN.has(L) ? 'easy' : HARD.has(L) ? 'hard' : 'medium';
  const compact = diff === 'easy';
  const rot = !(L <= 3 || (L >= 8 && L <= 10)); // rotation is standard once introduced
  const mv = L >= 32 && !EASE_IN.has(L);         // move limits become frequent from L32
  let obs = 0;
  if (!EASE_IN.has(L)) {
    if (L === 6 || L === 7) obs = randint(1, 2);
    else if (L >= 17 && L <= 39) obs = randint(1, 3);
    else if (L >= 44 && L <= 75) obs = randint(2, 4);
    else if (L >= 80) obs = randint(3, 5);
  }
  let dec = 0;
  if (L >= 24 && L <= 63) dec = 1;
  else if (L >= 64 && L <= 89) dec = randint(1, 2);
  else if (L >= 90) dec = 2;
  return { N, diff, compact, rot, mv, obs, dec };
}

function reserveObstacles(N, count) {
  const set = new Set();
  while (set.size < count) set.add(randint(0, N * N - 1));
  return [...set].map((k) => [Math.floor(k / N), k % N]);
}

function applyRotations(pieces, N) {
  let any = false;
  for (const p of pieces) {
    const rotable = pickRotation(p.cells);
    if (rotable && rng() < 0.55) { p.rotatable = true; p.initialRotation = rotable; any = true; }
  }
  if (!any) { // guarantee at least one turnable piece on a rotation level
    for (const p of pieces) { const r = pickRotation(p.cells); if (r) { p.rotatable = true; p.initialRotation = r; break; } }
  }
}

function buildLevel(L) {
  const cfg = classify(L);
  const { N } = cfg;
  for (let attempt = 0; attempt < 400; attempt++) {
    const obstacles = reserveObstacles(N, cfg.obs);
    let raw = null;
    for (let a = 0; a < 60 && !raw; a++) raw = tryPartition(N, SIZES[N], cfg.compact, obstacles);
    if (!raw) continue;
    const pieces = raw.map((cells) => ({ cells: normalize(cells), rotatable: false, initialRotation: 0 }));
    if (cfg.rot) applyRotations(pieces, N);
    const par = pieces.length;
    // Decoys: extra plausible pieces the player must recognise as unneeded.
    for (let d = 0; d < cfg.dec; d++) {
      const decoy = { cells: randomPiece(N, SIZES[N]), rotatable: false, initialRotation: 0 };
      if (cfg.rot) { const r = pickRotation(decoy.cells); if (r && rng() < 0.6) { decoy.rotatable = true; decoy.initialRotation = r; } }
      pieces.push(decoy);
    }
    // Shuffle so decoys don't sit predictably at the end of the tray.
    for (let i = pieces.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pieces[i], pieces[j]] = [pieces[j], pieces[i]]; }
    if (!isSolvable(pieces, N, obstacles)) continue;
    const moveLimit = cfg.mv ? par + Math.max(2, Math.round(par * 0.4)) : undefined;
    return { pieces, obstacles, par, moveLimit, diff: cfg.diff };
  }
  throw new Error(`level ${L}: could not generate a valid board`);
}

// ---------- emit ----------
const fmt = (cells) => '[' + cells.map(([r, c]) => `[${r}, ${c}]`).join(', ') + ']';
const specLines = [];
const diffLines = [];
const stats = { easy: 0, medium: 0, hard: 0, obstacles: 0, decoys: 0, moveLimits: 0, rotation: 0 };

for (let L = 1; L <= 100; L++) {
  const { pieces, obstacles, par, moveLimit, diff } = buildLevel(L);
  stats[diff]++;
  if (obstacles.length) stats.obstacles++;
  if (pieces.length > par) stats.decoys++;
  if (moveLimit != null) stats.moveLimits++;
  if (pieces.some((p) => p.rotatable)) stats.rotation++;
  diffLines.push(`  ${L}: '${diff}',`);
  specLines.push(`  ${L}: {`);
  specLines.push(`    parMoves: ${par},`);
  if (moveLimit != null) specLines.push(`    moveLimit: ${moveLimit},`);
  if (obstacles.length) specLines.push(`    obstacles: [${obstacles.map(([r, c]) => `[${r}, ${c}]`).join(', ')}],`);
  specLines.push(`    pieces: [`);
  for (const p of pieces) {
    if (p.rotatable) specLines.push(`      { cells: ${fmt(p.cells)}, rotatable: true, initialRotation: ${p.initialRotation} },`);
    else specLines.push(`      { cells: ${fmt(p.cells)} },`);
  }
  specLines.push(`    ],`);
  specLines.push(`  },`);
}

const out = `import type { Difficulty, LevelSpec } from './levels';

// Full level catalog — generated + solver-verified by scripts/build-presets.js
// (seeded, idempotent; rerun to regenerate). Board sizes 4x4/5x5/6x6/7x7 by
// level (see getBoardSize). Mechanics layer in over the run: rotation, then
// obstacles, then decoy pieces, then frequent move limits from L32.
export const LEVEL_DIFFICULTY: Record<number, Difficulty> = {
${diffLines.join('\n')}
};

export const LEVEL_SPECS: Record<number, LevelSpec> = {
${specLines.join('\n')}
};
`;
fs.writeFileSync(OUT, out);
console.log('wrote', OUT);
console.log('stats:', JSON.stringify(stats));
