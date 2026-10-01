'use strict';
/* ---------- Paint layers: restack the paper cut-outs ---------- */
function paintShapeSVG(s, extra) {
  const f = LD3.PAL[s.color]; const base = `fill="${f}" ${extra || ''}`;
  if (s.type === 'circle') return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.size}" ${base}/>`;
  if (s.type === 'ring') { const R = s.size, r = s.size * 0.5; return `<path d="M${s.cx - R} ${s.cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0ZM${s.cx - r} ${s.cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z" fill-rule="evenodd" ${base}/>`; }
  if (s.type === 'rect') return `<rect x="${s.cx - s.size * 0.9}" y="${s.cy - s.size * 0.9}" width="${s.size * 1.8}" height="${s.size * 1.8}" rx="${s.size * 0.22}" transform="rotate(${(s.rot * 180 / Math.PI).toFixed(1)} ${s.cx} ${s.cy})" ${base}/>`;
  return `<polygon points="${LD3.shapePts(s).map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" stroke-linejoin="round" ${base}/>`;
}
function mountPaint(root, ctx) {
  const P = ctx.puzzle(); let order = P.start.slice(); let mode = 'front'; let won = false;
  const startMatch = LD3.paintMatch(P, P.start, P.target);
  const targetSVG = `<svg viewBox="0 0 100 100" class="pt-svg" aria-label="Target picture" role="img">${P.target.map((id) => `<g class="sh">${paintShapeSVG(P.shapes[id])}</g>`).join('')}</svg>`;
  const work = h('div', { class: 'pt-canvas' }); const chips = h('div', { class: 'pt-chips' });
  const fr = h('button', { 'aria-pressed': 'true', onclick: () => setMode('front') }, 'Bring to front'); const bk = h('button', { 'aria-pressed': 'false', onclick: () => setMode('back') }, 'Send to back');
  function setMode(m) { mode = m; fr.setAttribute('aria-pressed', String(m === 'front')); bk.setAttribute('aria-pressed', String(m === 'back')); }
  root.append(h('div', { class: 'pt-grid' }, h('figure', { class: 'pt-fig tgt' }, h('div', { class: 'pt-canvas', html: targetSVG }), h('figcaption', null, 'Match this')), h('figure', { class: 'pt-fig' }, work, h('figcaption', null, 'Your picture'))),
    h('div', { class: 'seg pt-seg' }, fr, bk), h('div', { class: 'pt-stack' }, h('small', null, 'Top'), chips, h('small', null, 'Bottom')));
  function chipSVG(s) { return `<svg viewBox="0 0 100 100" aria-hidden="true">${paintShapeSVG({ ...s, cx: 50, cy: 50, size: 34, rot: s.rot })}</svg>`; }
  function draw(pop) {
    work.innerHTML = `<svg viewBox="0 0 100 100" class="pt-svg live" aria-label="Your picture" role="img">${order.map((id) => `<g class="sh${pop === id ? ' pop' : ''}" data-id="${id}">${paintShapeSVG(P.shapes[id])}</g>`).join('')}</svg>`;
    chips.replaceChildren(...order.slice().reverse().map((id) => {
      const b = h('button', { class: 'pt-chip', 'aria-label': 'Layer, drag to reorder or tap to move', html: chipSVG(P.shapes[id]) });
      b.dataset.id = id; b.addEventListener('pointerdown', (ev) => startDrag(ev, b)); b.addEventListener('click', () => { if (b.dataset.dragged) { delete b.dataset.dragged; return; } move(id); });
      return b;
    }));
    const m = LD3.paintMatch(P, order, P.target); ctx.progress(Math.max(0, (m - startMatch) / Math.max(0.01, 1 - startMatch)));
    if (LD3.paintSame(P, order, P.target) && !won) { won = true; ctx.solve(); }
  }
  function move(id) { if (!ctx.active()) return; order = order.filter((x) => x !== id); if (mode === 'front') order.push(id); else order.unshift(id); draw(id); }
  function startDrag(ev, el) {
    if (!ctx.active()) return; try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    el.classList.add('dragging');
    const onMove = (e) => {
      if (!el.dataset.dragged) { el.dataset.dragged = '1'; }
      const under = document.elementFromPoint(e.clientX, e.clientY); const target = under && under.closest && under.closest('.pt-chip');
      if (target && target !== el && target.parentNode === chips) {
        const kids = [...chips.children]; const from = kids.indexOf(el), to = kids.indexOf(target);
        if (from < 0 || to < 0) return;
        if (from < to) chips.insertBefore(el, target.nextSibling); else chips.insertBefore(el, target);
      }
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
      el.classList.remove('dragging');
      if (el.dataset.dragged) { order = [...chips.children].map((c) => +c.dataset.id).reverse(); draw(); }
    };
    el.addEventListener('pointermove', onMove); el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp);
  }
  work.addEventListener('click', (ev) => {
    if (!ctx.active()) return; const svg = work.querySelector('svg'); if (!svg) return; const r = svg.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * 100, y = (ev.clientY - r.top) / r.height * 100;
    for (let k = order.length - 1; k >= 0; k--) { if (LD3.inShape(P.shapes[order[k]], x, y)) { move(order[k]); return; } }
  });
  draw();
  return { destroy() {}, reveal: () => { order = P.target.slice(); draw(); }, cheat: () => { order = P.target.slice(); draw(); }, celebrate: () => root.classList.add('won'), puzzle: P };
}
