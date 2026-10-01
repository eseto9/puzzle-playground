const LD2 = (() => {
const { ri, pick, shuffle, range, clampLevel } = LD;

/* generic builder: all = flat Int8Array of every candidate assignment (stride k); returns unique clue list or null */
function uniqueBuild(r, all, k, makeClue, holdsFn, minC, maxC, prio) {
  const total = all.length / k;
  const filterBy = (al, c) => { const out = []; for (let i = 0; i < al.length; i++) if (holdsFn(c, all, al[i] * k)) out.push(al[i]); return Int32Array.from(out); };
  let alive = Int32Array.from({ length: total }, (_, i) => i); const clues = []; let guard = 0;
  while (alive.length > 1 && guard++ < 120) {
    const cands = []; for (let q = 0; q < 40 && cands.length < 6; q++) { const c = makeClue(); if (c) cands.push(c); }
    const scored = cands.map((c) => ({ c, f: filterBy(alive, c) })).filter((x) => x.f.length < alive.length && x.f.length >= 1);
    if (!scored.length) continue;
    scored.sort((x, y) => Math.abs(x.f.length / alive.length - 0.55) - Math.abs(y.f.length / alive.length - 0.55));
    const choice = r() < 0.7 ? scored[0] : pick(r, scored);
    clues.push(choice.c); alive = choice.f;
  }
  if (alive.length !== 1) return null;
  if (total <= 100000) {
    const order = shuffle(r, clues); if (prio) order.sort((x, y) => prio(x) - prio(y));
    for (const c of order) {
      const rest = clues.filter((x) => x !== c); let al = Int32Array.from({ length: total }, (_, i) => i);
      for (const q of rest) al = filterBy(al, q);
      if (al.length === 1) clues.splice(clues.indexOf(c), 1);
    }
  }
  if (clues.length < minC || clues.length > maxC) return null;
  if (new Set(clues.map((c) => JSON.stringify(c))).size !== clues.length) return null;
  return shuffle(r, clues);
}
function countBy(all, k, clues, holdsFn) {
  let al = Int32Array.from({ length: all.length / k }, (_, i) => i);
  for (const c of clues) { const out = []; for (let i = 0; i < al.length; i++) if (holdsFn(c, all, al[i] * k)) out.push(al[i]); al = Int32Array.from(out); }
  return al.length;
}

/* ---------- Alibi ---------- */
const AL_LEVELS = [[3, 5, 3, 6], [4, 6, 4, 8], [4, 7, 5, 9], [5, 7, 6, 10], [5, 8, 7, 12]]; // suspects, hours, min clues, max clues
function alHolds(c, dur) {
  return (cl, all, off) => {
    const s = (a) => all[off + a]; const e = (a) => all[off + a] + dur[a] - 1;
    switch (cl.k) {
      case 'overlap': return Math.max(s(cl.a), s(cl.b)) <= Math.min(e(cl.a), e(cl.b));
      case 'apart': return Math.max(s(cl.a), s(cl.b)) > Math.min(e(cl.a), e(cl.b));
      case 'before': return s(cl.a) < s(cl.b);
      case 'left': return e(cl.a) < s(cl.b);
      case 'at': return s(cl.a) <= cl.t && cl.t <= e(cl.a);
      case 'notat': return !(s(cl.a) <= cl.t && cl.t <= e(cl.a));
      case 'inside': return s(cl.b) <= s(cl.a) && e(cl.a) <= e(cl.b);
      default: return s(cl.a) === s(cl.b); // same start
    }
  };
}
function genAlibi(r, level) {
  const [nS, T, minC, maxC] = AL_LEVELS[clampLevel(level) - 1];
  for (let attempt = 0; attempt < 400; attempt++) {
    const dur = range(nS).map(() => ri(r, 1, 3)); if (Math.max(...dur) < 2) continue;
    const rng = dur.map((d) => T - d + 1); let total = 1; rng.forEach((m) => { total *= m; });
    const all = new Int8Array(total * nS);
    for (let i = 0; i < total; i++) { let x = i; for (let a = 0; a < nS; a++) { all[i * nS + a] = x % rng[a]; x = Math.floor(x / rng[a]); } }
    const sol = rng.map((m) => ri(r, 0, m - 1)); const s = (a) => sol[a]; const e = (a) => sol[a] + dur[a] - 1;
    const makeClue = () => {
      const kind = pick(r, ['overlap', 'overlap', 'apart', 'apart', 'before', 'left', 'at', 'at', 'notat', 'inside', 'same']);
      const a = ri(r, 0, nS - 1); let b = ri(r, 0, nS - 1); while (b === a) b = ri(r, 0, nS - 1);
      const ov = Math.max(s(a), s(b)) <= Math.min(e(a), e(b));
      switch (kind) {
        case 'overlap': return ov ? { k: 'overlap', a, b } : null;
        case 'apart': return !ov ? { k: 'apart', a, b } : null;
        case 'before': if (s(a) === s(b)) return null; return s(a) < s(b) ? { k: 'before', a, b } : { k: 'before', a: b, b: a };
        case 'left': if (e(a) < s(b)) return { k: 'left', a, b }; if (e(b) < s(a)) return { k: 'left', a: b, b: a }; return null;
        case 'at': { const t = ri(r, 0, T - 1); return s(a) <= t && t <= e(a) ? { k: 'at', a, t } : null; }
        case 'notat': { const t = ri(r, 0, T - 1); return !(s(a) <= t && t <= e(a)) ? { k: 'notat', a, t } : null; }
        case 'inside': return s(b) <= s(a) && e(a) <= e(b) && dur[a] < dur[b] ? { k: 'inside', a, b } : null;
        default: return s(a) === s(b) ? { k: 'same', a, b } : null;
      }
    };
    const clues = uniqueBuild(r, all, nS, makeClue, alHolds(null, dur), minC, maxC);
    if (clues) return { nS, T, dur, sol, clues };
  }
  throw new Error('genAlibi failed');
}
function alState(P, c, st) { const inv = c.b != null ? [c.a, c.b] : [c.a]; if (inv.some((a) => st[a] < 0)) return null; return alHolds(null, P.dur)(c, st, 0); }
function alCheck(P, starts) { const h = alHolds(null, P.dur); return P.clues.every((c) => h(c, starts, 0)); }
function alCount(P) {
  const nS = P.nS; const rng = P.dur.map((d) => P.T - d + 1); let total = 1; rng.forEach((m) => { total *= m; });
  const all = new Int8Array(total * nS);
  for (let i = 0; i < total; i++) { let x = i; for (let a = 0; a < nS; a++) { all[i * nS + a] = x % rng[a]; x = Math.floor(x / rng[a]); } }
  return countBy(all, nS, P.clues, alHolds(null, P.dur));
}

/* ---------- Bridge builder (Hashi) ---------- */
const BR_LEVELS = [[5, 6], [6, 8], [6, 10], [7, 12], [7, 14]]; // grid size, islands
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function brEdges(n, isl) {
  const at = new Map(); isl.forEach((p, i) => at.set(p.y * n + p.x, i)); const E = [];
  isl.forEach((p, i) => {
    [[1, 0], [0, 1]].forEach(([dx, dy]) => {
      let x = p.x + dx, y = p.y + dy; const cells = [];
      while (x >= 0 && x < n && y >= 0 && y < n) { const j = at.get(y * n + x); if (j != null) { E.push({ a: i, b: j, cells, h: dx === 1 }); break; } cells.push(y * n + x); x += dx; y += dy; }
    });
  });
  E.sort((p, q) => Math.min(p.a, p.b) - Math.min(q.a, q.b) || Math.max(p.a, p.b) - Math.max(q.a, q.b));
  const owners = new Map(); E.forEach((e, j) => e.cells.forEach((c) => { if (!owners.has(c)) owners.set(c, []); owners.get(c).push(j); }));
  E.forEach((e) => { e.conf = []; }); const cs = E.map(() => new Set());
  owners.forEach((list) => { for (const a of list) for (const b of list) if (a !== b) cs[a].add(b); });
  E.forEach((e, j) => { e.conf = [...cs[j]]; });
  return E;
}
function brSolve(n, isl, nums, limit) {
  const N = isl.length; const E = brEdges(n, isl); const rem = nums.slice(); const val = Array(E.length).fill(0);
  const inc = range(N).map(() => []); E.forEach((e, j) => { inc[e.a].push(j); inc[e.b].push(j); });
  let count = 0; let first = null;
  const connected = () => { const p = range(N); const f = (x) => (p[x] === x ? x : (p[x] = f(p[x]))); E.forEach((e, j) => { if (val[j]) p[f(e.a)] = f(e.b); }); const r0 = f(0); return range(N).every((i) => f(i) === r0); };
  (function dfs(j) {
    if (count >= limit) return;
    if (j === E.length) { if (rem.every((x) => x === 0) && connected()) { count++; if (!first) first = val.slice(); } return; }
    const e = E[j];
    for (let m = 0; m <= 2; m++) {
      if (m > 0 && e.conf.some((k) => k < j && val[k] > 0)) break;
      if (rem[e.a] < m || rem[e.b] < m) break;
      val[j] = m; rem[e.a] -= m; rem[e.b] -= m;
      let ok = true;
      for (const u of [e.a, e.b]) { const left = inc[u].filter((q) => q > j).length; if (rem[u] > 2 * left) ok = false; if (left === 0 && rem[u] !== 0) ok = false; }
      if (ok) dfs(j + 1);
      val[j] = 0; rem[e.a] += m; rem[e.b] += m;
    }
  })(0);
  return { count, first, E };
}
function genBridge(r, level) {
  const [n, target] = BR_LEVELS[clampLevel(level) - 1];
  for (let attempt = 0; attempt < 3000; attempt++) {
    const isl = []; const occ = new Int8Array(n * n); const idx = (x, y) => y * n + x; const edges = [];
    const add = (x, y) => { isl.push({ x, y }); occ[idx(x, y)] = 1; };
    add(ri(r, 0, n - 1), ri(r, 0, n - 1));
    let tries = 0;
    while (isl.length < target && tries++ < 300) {
      const a = ri(r, 0, isl.length - 1); const [dx, dy] = pick(r, DIRS);
      let x = isl[a].x + dx, y = isl[a].y + dy, maxd = 0;
      while (x >= 0 && x < n && y >= 0 && y < n && occ[idx(x, y)] === 0) { maxd++; x += dx; y += dy; }
      if (maxd < 2) continue; const d = ri(r, 2, Math.min(maxd, 4));
      for (let st = 1; st < d; st++) occ[idx(isl[a].x + dx * st, isl[a].y + dy * st)] = 2;
      add(isl[a].x + dx * d, isl[a].y + dy * d);
      edges.push({ a, b: isl.length - 1, m: r() < 0.35 ? 2 : 1 });
    }
    if (isl.length < target) continue;
    if (isl.some((p, i) => isl.some((q, j) => j > i && Math.abs(p.x - q.x) + Math.abs(p.y - q.y) === 1))) continue;
    // extra edges to make cycles
    const have = new Set(edges.map((e) => Math.min(e.a, e.b) + '-' + Math.max(e.a, e.b)));
    isl.forEach((p, i) => {
      [[1, 0], [0, 1]].forEach(([dx, dy]) => {
        let x = p.x + dx, y = p.y + dy; const between = [];
        while (x >= 0 && x < n && y >= 0 && y < n && occ[idx(x, y)] === 0) { between.push(idx(x, y)); x += dx; y += dy; }
        if (!(x >= 0 && x < n && y >= 0 && y < n) || occ[idx(x, y)] !== 1) return;
        const j = isl.findIndex((q) => q.x === x && q.y === y); const key = Math.min(i, j) + '-' + Math.max(i, j);
        if (have.has(key) || r() > 0.45) return;
        between.forEach((c) => { occ[c] = 2; }); have.add(key); edges.push({ a: i, b: j, m: r() < 0.3 ? 2 : 1 });
      });
    });
    const nums = Array(isl.length).fill(0); edges.forEach((e) => { nums[e.a] += e.m; nums[e.b] += e.m; });
    if (nums.some((v) => v < 1 || v > 8)) continue;
    const res = brSolve(n, isl, nums, 2);
    if (res.count !== 1) continue;
    const solEdges = {}; edges.forEach((e) => { solEdges[Math.min(e.a, e.b) + '-' + Math.max(e.a, e.b)] = e.m; });
    return { n, isl: isl.map((p, i) => ({ x: p.x, y: p.y, num: nums[i] })), sol: solEdges };
  }
  throw new Error('genBridge failed');
}
function brCandidates(P) { return brEdges(P.n, P.isl).map((e) => ({ a: e.a, b: e.b, cells: e.cells, h: e.h, conf: e.conf })); }

return { AL_LEVELS, BR_LEVELS, genAlibi, alState, alCheck, alCount, genBridge, brSolve, brEdges, brCandidates };
})();
if (typeof module !== 'undefined') module.exports = LD2;
