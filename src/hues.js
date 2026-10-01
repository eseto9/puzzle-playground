'use strict';
/* ---------- Hues: swap tiles to restore the colour gradient ---------- */
function mountHues(root, ctx) {
  const P = ctx.puzzle(); const { rows, cols, colors, start } = P; const N = rows * cols; const anchors = new Set(P.anchors);
  const arr = start.slice(); let sel = -1; let won = false; const movable = LD.range(N).filter((p) => !anchors.has(p));
  const counter = h('span', { class: 'ln-count' }, ''); const board = h('div', { class: 'hu', style: `--cols:${cols};--rows:${rows}` });
  const tiles = colors.map((c, id) => { const t = h('button', { class: 'hu-t' + (anchors.has(id) ? ' fixed' : ''), 'aria-label': 'Colour tile' + (anchors.has(id) ? ' (fixed)' : ''), style: `width:${100 / cols}%;height:${100 / rows}%` }, h('i', { style: 'background:' + c })); board.append(t); return t; });
  root.append(h('div', { class: 'ln-hud' }, h('span', null, 'Tiles in place'), counter), board);
  tiles.forEach((t, id) => t.addEventListener('click', () => tap(arr.indexOf(id))));
  function layout() { arr.forEach((id, pos) => { const t = tiles[id]; t.style.left = (pos % cols) * 100 / cols + '%'; t.style.top = ((pos / cols) | 0) * 100 / rows + '%'; t.classList.toggle('sel', sel === pos); }); }
  function stats() { const ok = movable.filter((p) => arr[p] === p).length; counter.textContent = ok + ' / ' + movable.length; ctx.progress(ok / movable.length); if (ok === movable.length && !won) { won = true; sel = -1; layout(); ctx.solve(); } }
  function tap(pos) {
    if (!ctx.active()) return; if (anchors.has(pos)) { const t = tiles[arr[pos]]; t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope'); return; }
    if (sel < 0) sel = pos; else if (sel === pos) sel = -1; else { const a = arr[sel]; arr[sel] = arr[pos]; arr[pos] = a; sel = -1; }
    layout(); stats();
  }
  layout(); stats();
  const solveAll = () => { LD.range(N).forEach((p) => { arr[p] = p; }); sel = -1; layout(); stats(); };
  return { destroy() {}, reveal: solveAll, cheat: solveAll, celebrate: () => { board.classList.add('won'); tiles.forEach((t, id) => t.style.setProperty('--w', ((id % cols) + ((id / cols) | 0)) * 70 + 'ms')); }, puzzle: P,
    snapshot: () => arr.slice(), applySnapshot: (s) => { if (Array.isArray(s)) { arr = s.slice(); sel = -1; layout(); stats(); } } };
}
