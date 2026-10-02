'use strict';
/* ---------- Hues: swap tiles to restore the colour gradient ---------- */
function mountHues(root, ctx) {
  const P = ctx.puzzle(); const { rows, cols, colors, start } = P; const N = rows * cols; const anchors = new Set(P.anchors);
  const arr = start.slice(); let sel = -1; let won = false; const movable = LD.range(N).filter((p) => !anchors.has(p));
  const counter = h('span', { class: 'ln-count' }, ''); const board = h('div', { class: 'hu', style: `--cols:${cols};--rows:${rows}` });
  const tiles = colors.map((c, id) => { const t = h('button', { class: 'hu-t' + (anchors.has(id) ? ' fixed' : ''), 'aria-label': 'Colour tile' + (anchors.has(id) ? ' (fixed)' : ''), style: `width:${100 / cols}%;height:${100 / rows}%` }, h('i', { style: 'background:' + c })); board.append(t); return t; });
  root.append(h('div', { class: 'ln-hud' }, h('span', null, 'Tiles in place'), counter), board);
  let pointerHandled = false, ghost = null;
  tiles.forEach((t, id) => { t.addEventListener('click', () => { if (pointerHandled) return; tap(arr.indexOf(id)); }); t.addEventListener('pointerdown', (ev) => startDrag(ev, id)); });
  function layout() { arr.forEach((id, pos) => { const t = tiles[id]; t.style.left = (pos % cols) * 100 / cols + '%'; t.style.top = ((pos / cols) | 0) * 100 / rows + '%'; t.classList.toggle('sel', sel === pos); }); }
  function stats() { const ok = movable.filter((p) => arr[p] === p).length; counter.textContent = ok + ' / ' + movable.length; ctx.progress(ok / movable.length); if (ok === movable.length && !won) { won = true; sel = -1; layout(); ctx.solve(); } }
  function tap(pos) {
    if (!ctx.active()) return; if (anchors.has(pos)) { const t = tiles[arr[pos]]; t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope'); return; }
    if (sel < 0) sel = pos; else if (sel === pos) sel = -1; else { const a = arr[sel]; arr[sel] = arr[pos]; arr[pos] = a; sel = -1; }
    layout(); stats();
  }
  function swapAt(fromPos, toPos) {
    if (!ctx.active() || fromPos === toPos) return;
    if (anchors.has(fromPos) || anchors.has(toPos)) { const t = tiles[arr[anchors.has(toPos) ? toPos : fromPos]]; t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope'); return; }
    const a = arr[fromPos]; arr[fromPos] = arr[toPos]; arr[toPos] = a; sel = -1; layout(); stats();
  }
  function dropTileAt(x, y) { const el = document.elementFromPoint(x, y); const t = el && el.closest && el.closest('.hu-t'); if (!t) return null; const idx = tiles.indexOf(t); return idx >= 0 ? idx : null; }
  function placeGhost(x, y) { if (ghost) ghost.style.cssText = `left:${x}px;top:${y}px`; }
  function startDrag(ev, id) {
    if (!ctx.active()) return; const fromPos = arr.indexOf(id); if (anchors.has(fromPos)) return;
    const el = ev.currentTarget; try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    let moved = false;
    ghost = h('div', { class: 'hu-ghost' }, h('i', { style: 'background:' + colors[id] })); document.body.append(ghost); placeGhost(ev.clientX, ev.clientY);
    el.classList.add('dragsrc');
    const move_ = (e) => { moved = true; placeGhost(e.clientX, e.clientY); tiles.forEach((t) => t.classList.remove('droptgt')); const t2 = dropTileAt(e.clientX, e.clientY); if (t2 != null) tiles[t2].classList.add('droptgt'); };
    const up = (e) => {
      el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel);
      el.classList.remove('dragsrc'); tiles.forEach((t) => t.classList.remove('droptgt')); if (ghost) { ghost.remove(); ghost = null; }
      if (moved) { const targetId = dropTileAt(e.clientX, e.clientY); if (targetId != null) swapAt(fromPos, arr.indexOf(targetId)); }
      else tap(fromPos);
      pointerHandled = true; setTimeout(() => { pointerHandled = false; }, 0);
    };
    const cancel = () => { el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel); el.classList.remove('dragsrc'); tiles.forEach((t) => t.classList.remove('droptgt')); if (ghost) { ghost.remove(); ghost = null; } };
    el.addEventListener('pointermove', move_); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel);
  }
  layout(); stats();
  const solveAll = () => { LD.range(N).forEach((p) => { arr[p] = p; }); sel = -1; layout(); stats(); };
  return { destroy() {}, reveal: solveAll, cheat: solveAll, celebrate: () => { board.classList.add('won'); tiles.forEach((t, id) => t.style.setProperty('--w', ((id % cols) + ((id / cols) | 0)) * 70 + 'ms')); }, puzzle: P,
    snapshot: () => arr.slice(), applySnapshot: (s) => { if (Array.isArray(s)) { for (let i = 0; i < arr.length; i++) arr[i] = s[i] != null ? s[i] : i; sel = -1; layout(); stats(); } } };
}
