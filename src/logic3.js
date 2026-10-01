const LD3 = (() => {
const { ri, pick, shuffle, range } = LD;

/* ================= Suspect lineup ================= */
const LN_W = 5, LN_H = 4;
const ATTRS = { hair: 4, hat: 3, glasses: 3, beard: 2 };
function lnAtom(f, a) { return f[a.attr] === a.v; }
function lnNeighbors(i) { const x = i % LN_W, y = (i / LN_W) | 0; const out = []; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X >= 0 && X < LN_W && Y >= 0 && Y < LN_H) out.push(Y * LN_W + X); }); return out; }
const accN = (f) => (f.hat ? 1 : 0) + (f.glasses ? 1 : 0) + (f.beard ? 1 : 0);
const LN_DIR = { up: -LN_W, down: LN_W, left: -1, right: 1 };
function lnDirCell(i, dir) { const x = i % LN_W, y = (i / LN_W) | 0; if (dir === 'up') return y > 0 ? i - LN_W : -1; if (dir === 'down') return y < LN_H - 1 ? i + LN_W : -1; if (dir === 'left') return x > 0 ? i - 1 : -1; return x < LN_W - 1 ? i + 1 : -1; }
function lnEval(c, faces, i) {
  const f = faces[i]; const col = i % LN_W, row = (i / LN_W) | 0;
  switch (c.k) {
    case 'has': return lnAtom(f, c); case 'not': return !lnAtom(f, c);
    case 'any': return f[c.attr] !== 0; case 'none': return f[c.attr] === 0;
    case 'or': return lnAtom(f, c.a) || lnAtom(f, c.b); case 'neither': return !lnAtom(f, c.a) && !lnAtom(f, c.b);
    case 'col': return col === c.v; case 'row': return row === c.v;
    case 'acc': return accN(f) === c.n;
    case 'rowCnt': { let n = 0; for (let x = 0; x < LN_W; x++) if (lnAtom(faces[row * LN_W + x], c)) n++; return n === c.n; }
    case 'colCnt': { let n = 0; for (let y = 0; y < LN_H; y++) if (lnAtom(faces[y * LN_W + col], c)) n++; return n === c.n; }
    case 'dir': { const j = lnDirCell(i, c.dir); return j >= 0 && lnAtom(faces[j], c); }
    case 'twin': return lnNeighbors(i).some((j) => faces[j].hair === f.hair);
    case 'next': return lnNeighbors(i).some((j) => lnAtom(faces[j], c)); default: return !lnNeighbors(i).some((j) => lnAtom(faces[j], c));
  }
}
function genLineup(r, level) {
  const combos = []; for (let h = 0; h < 4; h++) for (let t = 0; t < 3; t++) for (let g = 0; g < 3; g++) for (let b = 0; b < 2; b++) combos.push({ hair: h, hat: t, glasses: g, beard: b });
  for (let attempt = 0; attempt < 3000; attempt++) {
    const faces = shuffle(r, combos).slice(0, LN_W * LN_H).map((f) => ({ ...f, skin: ri(r, 0, 2) }));
    const culprit = ri(r, 0, LN_W * LN_H - 1); const cf = faces[culprit];
    const POSV = { hair: [0, 1, 2, 3], hat: [1, 2], glasses: [1, 2], beard: [1] };
    const atomT = () => { const opts = Object.keys(POSV).filter((a) => a === 'hair' || cf[a] !== 0); const attr = pick(r, opts); return { attr, v: cf[attr] }; };
    const atomF = () => { const attr = pick(r, Object.keys(POSV)); const vs = POSV[attr].filter((v) => v !== cf[attr]); if (!vs.length) return null; return { attr, v: pick(r, vs) }; };
    const anyAtom = () => { const attr = pick(r, Object.keys(POSV)); return { attr, v: pick(r, POSV[attr]) }; };
    const kinds = ['not', 'not', 'none', 'col', 'row', 'acc', 'or', 'neither', 'or', 'next', 'noNext'].concat(level >= 3 ? ['rowCnt', 'colCnt', 'dir', 'dir', 'twin', 'next', 'rowCnt'] : ['any']);
    const makeClue = () => {
      const k = pick(r, kinds); let c = null;
      switch (k) {
        case 'not': { const a = atomF(); c = a && { k, ...a }; break; }
        case 'none': { const attr = pick(r, ['hat', 'glasses']); c = cf[attr] === 0 ? { k, attr } : null; break; }
        case 'any': { const attr = pick(r, ['hat', 'glasses']); c = cf[attr] !== 0 ? { k, attr } : null; break; }
        case 'or': { const a = atomT(), b = atomF() || atomT(); c = a.attr === b.attr ? null : (r() < 0.5 ? { k, a, b } : { k, a: b, b: a }); break; }
        case 'neither': { const a = atomF(), b = atomF(); c = a && b && a.attr !== b.attr ? { k, a, b } : null; break; }
        case 'col': c = { k, v: culprit % LN_W }; break;
        case 'row': c = { k, v: (culprit / LN_W) | 0 }; break;
        case 'acc': c = { k, n: accN(cf) }; break;
        case 'rowCnt': case 'colCnt': { const a = pick(r, ['hat', 'glasses', 'beard']); const v = a === 'beard' ? 1 : ri(r, 1, 2); c = { k, attr: a, v, n: 0 }; break; }
        case 'dir': { const dir = pick(r, ['up', 'down', 'left', 'right']); const j = lnDirCell(culprit, dir); if (j < 0) { c = null; break; } const attr = pick(r, ['hat', 'glasses', 'beard', 'hair']); const f = faces[j]; if (attr !== 'hair' && f[attr] === 0) { c = null; break; } c = { k, dir, attr, v: f[attr] }; break; }
        case 'twin': c = { k }; break;
        case 'next': { const nb = lnNeighbors(culprit).map((j) => faces[j]); const f = pick(r, nb); const attr = pick(r, ['hat', 'glasses', 'beard', 'hair']); c = attr === 'hair' || f[attr] !== 0 ? { k, attr, v: f[attr] } : null; break; }
        default: { const a = atomF(); c = a && !lnNeighbors(culprit).some((j) => lnAtom(faces[j], a)) ? { k: 'noNext', ...a } : null; }
      }
      if (!c) return null;
      if (c.k === 'rowCnt') { let n = 0; for (let x = 0; x < LN_W; x++) if (lnAtom(faces[((culprit / LN_W) | 0) * LN_W + x], c)) n++; c.n = n; if (n === 0 || n > 3) return null; }
      if (c.k === 'colCnt') { let n = 0; for (let y = 0; y < LN_H; y++) if (lnAtom(faces[y * LN_W + (culprit % LN_W)], c)) n++; c.n = n; if (n === 0 || n > 3) return null; }
      return lnEval(c, faces, culprit) ? c : null;
    };
    let alive = range(LN_W * LN_H); const clues = []; let guard = 0;
    while (alive.length > 1 && guard++ < 90) {
      const cands = []; for (let q = 0; q < 40 && cands.length < 8; q++) { const c = makeClue(); if (c) cands.push(c); }
      const scored = cands.map((c) => ({ c, f: alive.filter((i) => lnEval(c, faces, i)) })).filter((x) => x.f.length < alive.length && x.f.includes(culprit));
      if (!scored.length) continue;
      const tgt = level >= 3 ? 0.8 : 0.72;
      scored.sort((x, y) => Math.abs(x.f.length / alive.length - tgt) - Math.abs(y.f.length / alive.length - tgt));
      const ch = r() < 0.6 ? scored[0] : pick(r, scored); clues.push(ch.c); alive = ch.f;
    }
    if (alive.length !== 1) continue;
    for (const c of shuffle(r, clues)) { const rest = clues.filter((x) => x !== c); const al = range(LN_W * LN_H).filter((i) => rest.every((q) => lnEval(q, faces, i))); if (al.length === 1) clues.splice(clues.indexOf(c), 1); }
    const lo = level >= 3 ? 6 : 5, hi = 12; if (clues.length < lo || clues.length > hi) continue;
    if (new Set(clues.map((c) => JSON.stringify(c))).size !== clues.length) continue;
    return { faces, culprit, clues: shuffle(r, clues) };
  }
  throw new Error('genLineup failed');
}
function lnSurvivors(P) { return range(LN_W * LN_H).filter((i) => P.clues.every((c) => lnEval(c, P.faces, i))); }

/* ================= Untangle ================= */
const segCross = (a, b, c, d) => {
  const o = (p, q, s) => (q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]);
  const d1 = o(a, b, c), d2 = o(a, b, d), d3 = o(c, d, a), d4 = o(c, d, b);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};
function distPS(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1]; const l2 = dx * dx + dy * dy; let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)); }
function unCross(pos, edges) {
  const bad = new Set(); let pairs = 0;
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const [a, b] = edges[i], [c, d] = edges[j]; if (a === c || a === d || b === c || b === d) continue;
    if (segCross(pos[a], pos[b], pos[c], pos[d])) { bad.add(i); bad.add(j); pairs++; }
  }
  edges.forEach(([a, b], i) => { for (let v = 0; v < pos.length; v++) if (v !== a && v !== b && distPS(pos[v], pos[a], pos[b]) < 3.2) { bad.add(i); pairs++; } });
  return { bad, count: pairs };
}
function genUntangle(r, level) {
  const N = level >= 3 ? 13 : level === 2 ? 11 : 9; const cols = N <= 9 ? 3 : 4, rows = Math.ceil(N / cols);
  for (let attempt = 0; attempt < 400; attempt++) {
    const cells = shuffle(r, range(cols * rows)).slice(0, N); const cw = 80 / cols, ch = 80 / rows;
    const pos = cells.map((c) => [10 + (c % cols) * cw + cw / 2 + (r() - 0.5) * cw * 0.55, 10 + ((c / cols) | 0) * ch + ch / 2 + (r() - 0.5) * ch * 0.55]);
    const pairs = []; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) pairs.push([i, j, Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1])]);
    pairs.sort((p, q) => p[2] - q[2]); const edges = []; const deg = Array(N).fill(0); const target = Math.round(N * 1.75);
    for (const [i, j] of pairs) {
      if (edges.length >= target) break; if (deg[i] >= 5 || deg[j] >= 5) continue;
      let ok = true; for (let v = 0; v < N && ok; v++) if (v !== i && v !== j && distPS(pos[v], pos[i], pos[j]) < 5) ok = false;
      for (const [a, b] of edges) { if (!ok) break; if (a === i || a === j || b === i || b === j) continue; if (segCross(pos[i], pos[j], pos[a], pos[b])) ok = false; }
      if (ok) { edges.push([i, j]); deg[i]++; deg[j]++; }
    }
    const adj = range(N).map(() => []); edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); }); const seen = new Set([0]); const st = [0];
    while (st.length) { const u = st.pop(); adj[u].forEach((v) => { if (!seen.has(v)) { seen.add(v); st.push(v); } }); }
    if (seen.size !== N || edges.length < N + 3) continue;
    if (unCross(pos, edges).count !== 0) continue;
    for (let t = 0; t < 60; t++) {
      const perm = shuffle(r, range(N)); const start = range(N).map((i) => pos[perm[i]].slice());
      const cr = unCross(start, edges).count; if (cr >= Math.max(6, Math.round(N * 0.8))) return { N, edges, solution: pos, start, crossings: cr };
    }
  }
  throw new Error('genUntangle failed');
}

/* ================= Paint layers ================= */
const PAL = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#2EC4B6', '#3A86FF', '#8338EC', '#FF4D9D'];
const PTYPES = ['circle', 'rect', 'tri', 'hex', 'star', 'ring'];
function shapePts(s) {
  const nPts = { tri: 3, hex: 6, star: 10 }[s.type]; const out = [];
  for (let i = 0; i < nPts; i++) { const a = s.rot + (i / nPts) * Math.PI * 2 - Math.PI / 2; const rad = s.type === 'star' ? (i % 2 ? s.size * 0.45 : s.size) : s.size; out.push([s.cx + Math.cos(a) * rad, s.cy + Math.sin(a) * rad]); }
  return out;
}
function inPoly(p, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { if (((pts[i][1] > p[1]) !== (pts[j][1] > p[1])) && (p[0] < (pts[j][0] - pts[i][0]) * (p[1] - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0])) c = !c; } return c; }
function inShape(s, x, y) {
  if (s.type === 'circle') return Math.hypot(x - s.cx, y - s.cy) <= s.size;
  if (s.type === 'ring') { const d = Math.hypot(x - s.cx, y - s.cy); return d <= s.size && d >= s.size * 0.5; }
  if (s.type === 'rect') { const dx = x - s.cx, dy = y - s.cy; const c = Math.cos(-s.rot), sn = Math.sin(-s.rot); const rx = dx * c - dy * sn, ry = dx * sn + dy * c; return Math.abs(rx) <= s.size * 0.9 && Math.abs(ry) <= s.size * 0.9; }
  return inPoly([x, y], s._pts || (s._pts = shapePts(s)));
}
const PG = 30; const PSAMP = (() => { const a = []; for (let j = 0; j < PG; j++) for (let i = 0; i < PG; i++) a.push([(i + 0.5) * 100 / PG, (j + 0.5) * 100 / PG]); return a; })();
function paintImage(shapes, order) {
  const out = new Int8Array(PSAMP.length).fill(-1);
  for (let p = 0; p < PSAMP.length; p++) for (let k = order.length - 1; k >= 0; k--) { if (shapes[order[k]].mem[p]) { out[p] = order[k]; break; } }
  return out;
}
function genPaint(r, level) {
  const n = level >= 3 ? 7 : level === 2 ? 6 : 5;
  for (let attempt = 0; attempt < 600; attempt++) {
    const colors = shuffle(r, range(PAL.length)).slice(0, n); const types = shuffle(r, PTYPES.concat(['circle', 'rect', 'tri', 'star']));
    const shapes = range(n).map((i) => ({ id: i, type: types[i], color: colors[i], cx: 28 + r() * 44, cy: 28 + r() * 44, size: 17 + r() * 11, rot: r() * Math.PI }));
    shapes.forEach((s) => { s.mem = PSAMP.map(([x, y]) => inShape(s, x, y)); });
    const target = shuffle(r, range(n)); const timg = paintImage(shapes, target);
    const vis = range(n).map((i) => timg.reduce((a, v) => a + (v === i ? 1 : 0), 0));
    if (vis.some((v) => v < 22)) continue;
    const start = shuffle(r, range(n)); const simg = paintImage(shapes, start);
    let diff = 0; for (let p = 0; p < timg.length; p++) if (timg[p] !== simg[p]) diff++;
    if (diff < PSAMP.length * 0.16) continue;
    return { n, shapes: shapes.map((s) => { const c = { ...s }; delete c._pts; return c; }), target, start };
  }
  throw new Error('genPaint failed');
}
function paintPrep(P) { P.shapes.forEach((s) => { s.mem = PSAMP.map(([x, y]) => inShape(s, x, y)); }); return P; }
const paintSame = (P, a, b) => { const x = paintImage(P.shapes, a), y = paintImage(P.shapes, b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; };
const paintMatch = (P, a, b) => { const x = paintImage(P.shapes, a), y = paintImage(P.shapes, b); let m = 0; for (let i = 0; i < x.length; i++) if (x[i] === y[i]) m++; return m / x.length; };


/* ================= Bridges (one bridge over every tile) ================= */
function zipSolve(n, blocked, order, limit, budget) {
  const open = n * n - blocked.size; const num = new Map(order.map((c, i) => [c, i + 1])); const last = order.length;
  const vis = new Uint8Array(n * n); blocked.forEach((c) => { vis[c] = 2; }); let count = 0, nodes = 0, first = null; const path = [];
  const nb = (c) => { const x = c % n, y = (c / n) | 0; const o = []; if (x > 0) o.push(c - 1); if (x < n - 1) o.push(c + 1); if (y > 0) o.push(c - n); if (y < n - 1) o.push(c + n); return o; };
  const NB = range(n * n).map(nb);
  const connectedRest = (head) => {
    let free = 0; for (let i = 0; i < n * n; i++) if (!vis[i]) free++; if (!free) return true;
    const seen = new Uint8Array(n * n); const st = []; NB[head].forEach((q) => { if (!vis[q]) { seen[q] = 1; st.push(q); } }); let got = st.length;
    if (!got) return false;
    while (st.length) { const u = st.pop(); for (const v of NB[u]) if (!vis[v] && !seen[v]) { seen[v] = 1; got++; st.push(v); } }
    return got === free;
  };
  const dfs = (c, k, visited) => {
    if (count >= limit || nodes++ > budget) return;
    if (visited === open) { if (c === order[last - 1] && k === last) { count++; if (!first) first = path.slice(); } return; }
    for (const q of NB[c]) {
      if (vis[q]) continue; const m = num.get(q);
      if (m != null && m !== k + 1) continue; if (m === last && visited + 1 !== open) continue;
      vis[q] = 1; path.push(q);
      let dead = false; for (const w of NB[q]) { if (vis[w]) continue; let f = 0; for (const z of NB[w]) if (!vis[z]) f++; if (f === 0 && !(num.get(w) === last && visited + 2 === open)) { dead = true; break; } }
      if (!dead && connectedRest(q)) dfs(q, m != null ? m : k, visited + 1);
      vis[q] = 0; path.pop();
    }
  };
  vis[order[0]] = 1; path.push(order[0]); dfs(order[0], 1, 1);
  return { count, first, over: nodes > budget };
}
function genZip(r, level) {
  const n = level >= 3 ? 6 : 5; const nb = level === 1 ? 0 : level === 2 ? 2 : ri(r, 2, 3);
  for (let attempt = 0; attempt < 600; attempt++) {
    const blocked = new Set(shuffle(r, range(n * n)).slice(0, nb));
    const open = n * n - blocked.size; const free = range(n * n).filter((c) => !blocked.has(c));
    const start = pick(r, free); const sol = zipSolve(n, blocked, [start, -1], 1, 40000);
    // find any hamiltonian path from start (no end constraint): use randomized DFS
    const vis = new Uint8Array(n * n); blocked.forEach((c) => { vis[c] = 2; }); const path = [start]; vis[start] = 1; let nodes = 0;
    const nbr = (c) => { const x = c % n, y = (c / n) | 0; const o = []; if (x > 0) o.push(c - 1); if (x < n - 1) o.push(c + 1); if (y > 0) o.push(c - n); if (y < n - 1) o.push(c + n); return o; };
    const go = () => { if (path.length === open) return true; if (nodes++ > 30000) return false; const c = path[path.length - 1]; for (const q of shuffle(r, nbr(c))) { if (vis[q]) continue; vis[q] = 1; path.push(q); if (go()) return true; path.pop(); vis[q] = 0; } return false; };
    if (!go()) continue;
    const k0 = level === 1 ? 4 : level === 2 ? 5 : 6; let idxs = new Set([0, open - 1]);
    const want = shuffle(r, range(open).slice(2, open - 2)).slice(0, k0 - 2); want.forEach((i) => idxs.add(i));
    for (let grow = 0; grow < 12; grow++) {
      const order = [...idxs].sort((a, b) => a - b).map((i) => path[i]);
      const res = zipSolve(n, blocked, order, 2, 150000);
      if (res.count === 1 && !res.over) {
        let cur = [...idxs].sort((a, b) => a - b);
        for (const ix of shuffle(r, cur.slice(1, -1))) { if (cur.length <= 4) break; const tryIdx = cur.filter((q) => q !== ix); const ord2 = tryIdx.map((i) => path[i]); const rr = zipSolve(n, blocked, ord2, 2, 150000); if (rr.count === 1 && !rr.over) cur = tryIdx; }
        const order2 = cur.map((i) => path[i]); const nums = {}; order2.forEach((c, i) => { nums[c] = i + 1; });
        return { n, blocked: [...blocked], nums, order: order2, path, open };
      }
      if (res.over) break;
      const sorted = [...idxs].sort((a, b) => a - b); let bi = 0, bg = 0; for (let i = 0; i + 1 < sorted.length; i++) if (sorted[i + 1] - sorted[i] > bg) { bg = sorted[i + 1] - sorted[i]; bi = i; }
      if (bg < 2) break; idxs.add(sorted[bi] + Math.floor(bg / 2));
    }
  }
  throw new Error('genZip failed');
}

/* ================= Hues (colour gradient) ================= */
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
function labToRgb([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map((c) => Math.round(255 * Math.min(1, Math.max(0, fromLin(c)))));
}
const lch = (L, C, H) => [L, C * Math.cos(H * Math.PI / 180), C * Math.sin(H * Math.PI / 180)];
const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
function genHues(r, level) {
  const [rows, cols, extra] = level >= 3 ? [4, 4, 1] : level === 2 ? [4, 4, 2] : [4, 4, 3];
  for (let attempt = 0; attempt < 500; attempt++) {
    const h0 = r() * 360; const hs = [h0, h0 + 70 + r() * 70, h0 + 180 + r() * 50, h0 + 250 + r() * 60].map((x) => x % 360);
    const cs = shuffle(r, hs).map((H) => lch(0.5 + r() * 0.38, 0.1 + r() * 0.07, H));
    const [TL, TR, BL, BR] = cs; const lab = [];
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const u = cols > 1 ? j / (cols - 1) : 0, v = rows > 1 ? i / (rows - 1) : 0; lab.push([0, 1, 2].map((k) => (1 - v) * ((1 - u) * TL[k] + u * TR[k]) + v * ((1 - u) * BL[k] + u * BR[k]))); }
    let minD = 9; for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = lab[i * cols + j]; [[1, 0], [0, 1]].forEach(([dy, dx]) => { const I = i + dy, J = j + dx; if (I < rows && J < cols) { const b = lab[I * cols + J]; minD = Math.min(minD, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])); } }); }
    if (minD < 0.032) continue;
    const colors = lab.map((l) => hex(labToRgb(l))); if (new Set(colors).size !== colors.length) continue;
    const N = rows * cols; const corners = [0, cols - 1, (rows - 1) * cols, N - 1]; const anchors = new Set(corners);
    shuffle(r, range(N).filter((i) => !anchors.has(i))).slice(0, extra).forEach((i) => anchors.add(i));
    const movable = range(N).filter((i) => !anchors.has(i));
    for (let t = 0; t < 40; t++) {
      const perm = shuffle(r, movable); const arr = range(N); movable.forEach((p, k) => { arr[p] = perm[k]; });
      const wrong = movable.filter((p) => arr[p] !== p).length; if (wrong >= movable.length * 0.85) return { rows, cols, colors, anchors: [...anchors], start: arr };
    }
  }
  throw new Error('genHues failed');
}


/* ================= Pup Parade (order the dogs) ================= */
function dgHolds(c, pos, off, N) {
  const p = (a) => pos[off + a];
  switch (c.k) {
    case 'pos': return p(c.a) === c.p; case 'notpos': return p(c.a) !== c.p;
    case 'adj': return Math.abs(p(c.a) - p(c.b)) === 1; case 'nadj': return Math.abs(p(c.a) - p(c.b)) !== 1;
    case 'left': return p(c.a) < p(c.b);
    case 'end': return p(c.a) === 0 || p(c.a) === N - 1; case 'notend': return p(c.a) !== 0 && p(c.a) !== N - 1;
    case 'between': { const lo = Math.min(p(c.b), p(c.c)), hi = Math.max(p(c.b), p(c.c)); return p(c.a) > lo && p(c.a) < hi; }
    default: return Math.abs(p(c.a) - p(c.b)) === 2; // gap1
  }
}
function dgPerms(N) {
  const out = []; const cur = []; const used = Array(N).fill(false);
  (function rec() { if (cur.length === N) { out.push(...cur); return; } for (let i = 0; i < N; i++) { if (used[i]) continue; used[i] = true; cur.push(i); rec(); cur.pop(); used[i] = false; } })();
  return Int8Array.from(out);
}
function genDogs(r, level) {
  const N = level >= 2 ? 6 : 5; const all = dgPerms(N); const total = all.length / N;
  for (let attempt = 0; attempt < 2000; attempt++) {
    const dogs = shuffle(r, range(6)).slice(0, N); const sol = shuffle(r, range(N)); // sol[d] = position of dog d
    const kinds = ['notpos', 'notpos', 'adj', 'nadj', 'nadj', 'left', 'left', 'end', 'notend'].concat(level >= 2 ? ['between', 'gap1', 'gap1'] : ['pos']).concat(level >= 3 ? ['between', 'nadj'] : []);
    const makeClue = () => {
      const k = pick(r, kinds); const a = ri(r, 0, N - 1); let b = ri(r, 0, N - 1); while (b === a) b = ri(r, 0, N - 1); let c3 = ri(r, 0, N - 1); while (c3 === a || c3 === b) c3 = ri(r, 0, N - 1);
      const d = Math.abs(sol[a] - sol[b]);
      switch (k) {
        case 'pos': return { k, a, p: sol[a] };
        case 'notpos': { const p = ri(r, 0, N - 1); return p === sol[a] ? null : { k, a, p }; }
        case 'adj': return d === 1 ? { k, a, b } : null; case 'nadj': return d !== 1 ? { k, a, b } : null;
        case 'left': return sol[a] < sol[b] ? { k, a, b } : { k, a: b, b: a };
        case 'end': return sol[a] === 0 || sol[a] === N - 1 ? { k, a } : null;
        case 'notend': return sol[a] !== 0 && sol[a] !== N - 1 ? { k, a } : null;
        case 'between': { const lo = Math.min(sol[b], sol[c3]), hi = Math.max(sol[b], sol[c3]); if (sol[a] > lo && sol[a] < hi) return { k, a, b, c: c3 }; return null; }
        default: return d === 2 ? { k: 'gap1', a, b } : null;
      }
    };
    const filterBy = (al, c) => { const o = []; for (let i = 0; i < al.length; i++) if (dgHolds(c, all, al[i] * N, N)) o.push(al[i]); return Int32Array.from(o); };
    let alive = Int32Array.from({ length: total }, (_, i) => i); const clues = []; let guard = 0;
    while (alive.length > 1 && guard++ < 100) {
      const cands = []; for (let q = 0; q < 40 && cands.length < 7; q++) { const c = makeClue(); if (c) cands.push(c); }
      const scored = cands.map((c) => ({ c, f: filterBy(alive, c) })).filter((x) => x.f.length < alive.length && x.f.length >= 1);
      if (!scored.length) continue; const tgt = level >= 3 ? 0.7 : 0.6;
      scored.sort((x, y) => Math.abs(x.f.length / alive.length - tgt) - Math.abs(y.f.length / alive.length - tgt));
      const ch = r() < 0.65 ? scored[0] : pick(r, scored); clues.push(ch.c); alive = ch.f;
    }
    if (alive.length !== 1) continue;
    for (const c of shuffle(r, clues)) { let al = Int32Array.from({ length: total }, (_, i) => i); for (const q of clues.filter((x) => x !== c)) al = filterBy(al, q); if (al.length === 1) clues.splice(clues.indexOf(c), 1); }
    const lo = N === 6 ? 6 : 5, hi = N === 6 ? 10 : 8; if (clues.length < lo || clues.length > hi) continue;
    if (new Set(clues.map((c) => JSON.stringify(c))).size !== clues.length) continue;
    return { N, dogs, sol, clues: shuffle(r, clues) };
  }
  throw new Error('genDogs failed');
}
function dgState(P, pos) { return P.clues.map((c) => dgHolds(c, pos, 0, P.N)); }

return { genDogs, dgState, genZip, zipSolve, genHues, genLineup, lnEval, lnSurvivors, LN_W, LN_H, genUntangle, unCross, genPaint, paintPrep, paintImage, paintSame, paintMatch, inShape, shapePts, PAL, segCross, distPS };
})();
if (typeof module !== 'undefined') module.exports = LD3;
