const LD = (() => {
/* ---------- seeded RNG ---------- */
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const makeRng = (seed) => mulberry32(hashSeed(String(seed)));
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, a) => a[Math.floor(r() * a.length)];
function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const range = (n) => Array.from({ length: n }, (_, i) => i);
const MAX_LEVEL = 5;
const clampLevel = (l) => Math.max(1, Math.min(MAX_LEVEL, l | 0 || 1));

/* ---------- Jungle deduction ---------- */
const ANIMALS = ['tiger', 'elephant', 'monkey', 'toucan', 'frog', 'snake'];
const TERR = ['grass', 'jungle', 'rock', 'mud'];
// rows, cols, animals, min clues, max clues
const LEVELS = [[3, 3, 4, 4, 7], [4, 2, 5, 5, 8], [4, 2, 6, 6, 10], [3, 3, 6, 7, 11], [4, 3, 5, 7, 12]];
const levelInfo = (l) => { const c = LEVELS[clampLevel(l) - 1]; return { rows: c[0], cols: c[1], n: c[2], min: c[3], max: c[4] }; };

const PCACHE = {};
function allPlacements(cells, n) {
  const key = cells + 'x' + n; if (PCACHE[key]) return PCACHE[key];
  let total = 1; for (let i = 0; i < n; i++) total *= (cells - i);
  const out = new Int8Array(total * n); let w = 0;
  const cur = new Int8Array(n); const used = new Uint8Array(cells);
  (function rec(i) {
    if (i === n) { for (let k = 0; k < n; k++) out[w++] = cur[k]; return; }
    for (let c = 0; c < cells; c++) { if (used[c]) continue; used[c] = 1; cur[i] = c; rec(i + 1); used[c] = 0; }
  })(0);
  return (PCACHE[key] = out);
}

/* get(a) returns the cell of animal a, or -1 if unplaced. Returns true / false / null (not decidable yet). */
function clueState(P, c, get) {
  const cols = P.cols; const rowOf = (x) => (x / cols) | 0; const colOf = (x) => x % cols;
  switch (c.k) {
    case 'above': { const x = get(c.a), y = get(c.b); if (x < 0 || y < 0) return null; return rowOf(x) < rowOf(y); }
    case 'row': { const x = get(c.a); if (x < 0) return null; return rowOf(x) === c.v; }
    case 'col': { const x = get(c.a); if (x < 0) return null; return colOf(x) === c.v; }
    case 'notcol': { const x = get(c.a); if (x < 0) return null; return colOf(x) !== c.v; }
    case 'on': { const x = get(c.a); if (x < 0) return null; return c.t === 'palm' ? x === P.palm : P.terr[x] === c.t; }
    case 'noton': { const x = get(c.a); if (x < 0) return null; return c.t === 'palm' ? x !== P.palm : P.terr[x] !== c.t; }
    case 'adj': case 'nadj': {
      const x = get(c.a), y = get(c.b); if (x < 0 || y < 0) return null;
      const d = Math.abs(rowOf(x) - rowOf(y)) + Math.abs(colOf(x) - colOf(y));
      return c.k === 'adj' ? d === 1 : d !== 1;
    }
    case 'sameRow': { const x = get(c.a), y = get(c.b); if (x < 0 || y < 0) return null; return rowOf(x) === rowOf(y); }
    case 'sameCol': { const x = get(c.a), y = get(c.b); if (x < 0 || y < 0) return null; return colOf(x) === colOf(y); }
    case 'diag': { const x = get(c.a), y = get(c.b); if (x < 0 || y < 0) return null; return Math.abs(rowOf(x) - rowOf(y)) === 1 && Math.abs(colOf(x) - colOf(y)) === 1; }
    case 'sameTerr': { const x = get(c.a), y = get(c.b); if (x < 0 || y < 0) return null; return P.terr[x] === P.terr[y]; }
    case 'corner': { const x = get(c.a); if (x < 0) return null; const r0 = rowOf(x), c0 = colOf(x); return (r0 === 0 || r0 === P.rows - 1) && (c0 === 0 || c0 === cols - 1); }
    case 'nextTerr': {
      const x = get(c.a); if (x < 0) return null; const r0 = rowOf(x), c0 = colOf(x);
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const R = r0 + dy, C = c0 + dx; return R >= 0 && R < P.rows && C >= 0 && C < cols && P.terr[R * cols + C] === c.t; });
    }
    case 'rowCount': case 'colCount': {
      let cnt = 0, u = 0;
      for (let a = 0; a < P.n; a++) { const x = get(a); if (x < 0) u++; else if ((c.k === 'rowCount' ? rowOf(x) : colOf(x)) === c.v) cnt++; }
      if (cnt > c.n || cnt + u < c.n) return false;
      return u === 0 ? cnt === c.n : null;
    }
    case 'alone': {
      const x = get(c.a); if (x < 0) return null; let u = 0;
      for (let b = 0; b < P.n; b++) {
        if (b === c.a) continue; const y = get(b);
        if (y < 0) { u++; continue; }
        if (Math.abs(rowOf(x) - rowOf(y)) + Math.abs(colOf(x) - colOf(y)) === 1) return false;
      }
      return u === 0 ? true : null;
    }
    default: { // count
      let cnt = 0, u = 0;
      for (let a = 0; a < P.n; a++) { const x = get(a); if (x < 0) u++; else if (P.terr[x] === c.t) cnt++; }
      if (cnt > c.n || cnt + u < c.n) return false;
      return u === 0 ? cnt === c.n : null;
    }
  }
}
let _pl = null, _off = 0; const _get = (a) => _pl[_off + a];
const holds = (P, c, pl, off) => { _pl = pl; _off = off; return clueState(P, c, _get) === true; };

function makeClue(r, P, sol) {
  const n = P.n, cols = P.cols, rows = P.rows;
  const rowOf = (x) => (x / cols) | 0, colOf = (x) => x % cols;
  const kind = pick(r, ['above', 'above', 'row', 'col', 'notcol', 'notcol', 'on', 'noton', 'noton', 'count', 'count', 'adj', 'nadj', 'nadj', 'sameRow', 'sameCol', 'diag', 'corner', 'nextTerr', 'nextTerr', 'sameTerr', 'rowCount', 'colCount', 'alone']);
  const a = ri(r, 0, n - 1); let b = ri(r, 0, n - 1); while (b === a) b = ri(r, 0, n - 1);
  const t = P.terr;
  switch (kind) {
    case 'above': { const ra = rowOf(sol[a]), rb = rowOf(sol[b]); if (ra === rb) return null; return ra < rb ? { k: 'above', a, b } : { k: 'above', a: b, b: a }; }
    case 'row': return { k: 'row', a, v: rowOf(sol[a]) };
    case 'col': return { k: 'col', a, v: colOf(sol[a]) };
    case 'notcol': { const c = ri(r, 0, cols - 1); if (c === colOf(sol[a])) return null; return { k: 'notcol', a, v: c }; }
    case 'on': return { k: 'on', a, t: sol[a] === P.palm && r() < 0.6 ? 'palm' : t[sol[a]] };
    case 'noton': { const tt = pick(r, [...TERR, 'palm']); if (tt === 'palm' ? sol[a] === P.palm : t[sol[a]] === tt) return null; if (tt !== 'palm' && !t.includes(tt)) return null; return { k: 'noton', a, t: tt }; }
    case 'count': { const tt = pick(r, TERR); if (!t.includes(tt)) return null; let cnt = 0; sol.forEach((x) => { if (t[x] === tt) cnt++; }); return { k: 'count', t: tt, n: cnt }; }
    case 'sameRow': return rowOf(sol[a]) === rowOf(sol[b]) ? { k: 'sameRow', a, b } : null;
    case 'sameCol': return colOf(sol[a]) === colOf(sol[b]) ? { k: 'sameCol', a, b } : null;
    case 'diag': return Math.abs(rowOf(sol[a]) - rowOf(sol[b])) === 1 && Math.abs(colOf(sol[a]) - colOf(sol[b])) === 1 ? { k: 'diag', a, b } : null;
    case 'sameTerr': return t[sol[a]] === t[sol[b]] ? { k: 'sameTerr', a, b } : null;
    case 'corner': { const r0 = rowOf(sol[a]), c0 = colOf(sol[a]); return (r0 === 0 || r0 === rows - 1) && (c0 === 0 || c0 === cols - 1) ? { k: 'corner', a } : null; }
    case 'nextTerr': {
      const r0 = rowOf(sol[a]), c0 = colOf(sol[a]); const ts = [];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const R = r0 + dy, C = c0 + dx; if (R >= 0 && R < rows && C >= 0 && C < cols) ts.push(t[R * cols + C]); });
      return ts.length ? { k: 'nextTerr', a, t: pick(r, ts) } : null;
    }
    case 'rowCount': case 'colCount': {
      const v = ri(r, 0, (kind === 'rowCount' ? rows : cols) - 1); let cnt = 0;
      sol.forEach((x) => { if ((kind === 'rowCount' ? rowOf(x) : colOf(x)) === v) cnt++; });
      return { k: kind, v, n: cnt };
    }
    case 'alone': { for (let q = 0; q < n; q++) { if (q !== a && Math.abs(rowOf(sol[a]) - rowOf(sol[q])) + Math.abs(colOf(sol[a]) - colOf(sol[q])) === 1) return null; } return { k: 'alone', a }; }
    default: {
      const d = Math.abs(rowOf(sol[a]) - rowOf(sol[b])) + Math.abs(colOf(sol[a]) - colOf(sol[b]));
      if (kind === 'adj') return d === 1 ? { k: 'adj', a, b } : null;
      return d !== 1 ? { k: 'nadj', a, b } : null;
    }
  }
}
const filt = (P, all, alive, c) => { const n = P.n; const out = []; for (let i = 0; i < alive.length; i++) { if (holds(P, c, all, alive[i] * n)) out.push(alive[i]); } return Int32Array.from(out); };

function genTerrain(r, rows, cols) {
  const cells = rows * cols;
  for (let t = 0; t < 500; t++) {
    const terr = range(cells).map(() => pick(r, ['grass', 'jungle', 'jungle', 'rock', 'mud', 'grass', 'rock']));
    const kinds = new Set(terr);
    if (kinds.size >= 3 && terr.includes('jungle')) { const js = range(cells).filter((i) => terr[i] === 'jungle'); return { terr, palm: pick(r, js) }; }
  }
  throw new Error('terrain');
}
function genPuzzle(r, level) {
  const L = levelInfo(level); const cells = L.rows * L.cols; const all = allPlacements(cells, L.n); const total = all.length / L.n;
  for (let attempt = 0; attempt < 300; attempt++) {
    const { terr, palm } = genTerrain(r, L.rows, L.cols);
    const animals = shuffle(r, range(6)).slice(0, L.n);
    const P = { rows: L.rows, cols: L.cols, n: L.n, terr, palm, animals };
    const sol = shuffle(r, range(cells)).slice(0, L.n);
    let alive = Int32Array.from({ length: total }, (_, i) => i); const clues = [];
    let guard = 0;
    while (alive.length > 1 && guard++ < 80) {
      const cands = [];
      for (let k = 0; k < 40 && cands.length < 6; k++) { const c = makeClue(r, P, sol); if (c) cands.push(c); }
      const scored = cands.map((c) => ({ c, f: filt(P, all, alive, c) })).filter((x) => x.f.length < alive.length && x.f.length >= 1);
      if (!scored.length) continue;
      // prefer moderate clues: closest to keeping ~55% of survivors, with a little randomness
      scored.sort((x, y) => Math.abs(x.f.length / alive.length - 0.55) - Math.abs(y.f.length / alive.length - 0.55));
      const choice = r() < 0.7 ? scored[0] : pick(r, scored);
      clues.push(choice.c); alive = choice.f;
    }
    if (alive.length !== 1) continue;
    if (total <= 100000) { // prune redundant clues
      for (const c of shuffle(r, clues)) {
        const rest = clues.filter((x) => x !== c); let al = Int32Array.from({ length: total }, (_, i) => i);
        for (const q of rest) al = filt(P, all, al, q);
        if (al.length === 1) clues.splice(clues.indexOf(c), 1);
      }
    }
    if (clues.length < L.min || clues.length > L.max) continue;
    // de-duplicate identical clues
    if (new Set(clues.map((c) => JSON.stringify(c))).size !== clues.length) continue;
    return { P, clues: shuffle(r, clues), sol };
  }
  throw new Error('genPuzzle failed level ' + level);
}
function countSolutions(P, clues) {
  const all = allPlacements(P.rows * P.cols, P.n); let al = Int32Array.from({ length: all.length / P.n }, (_, i) => i);
  for (const c of clues) al = filt(P, all, al, c);
  return al.length;
}
function allHold(P, clues, placed) { return clues.every((c) => clueState(P, c, (a) => placed[a]) === true); }

return { makeRng, hashSeed, ri, pick, shuffle, range, clampLevel, MAX_LEVEL, ANIMALS, TERR, levelInfo, genPuzzle, clueState, countSolutions, allHold };
})();
if (typeof module !== 'undefined') module.exports = LD;
