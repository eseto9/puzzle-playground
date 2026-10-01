'use strict';
/* ---------- Untangle: drag nodes until no lines cross ---------- */
function mountUntangle(root, ctx) {
  const P = ctx.puzzle(); const pos = P.start.map((p) => p.slice()); let won = false, drag = -1;
  let s = '<svg class="svgb un-svg" viewBox="0 0 100 100" role="group" aria-label="Graph to untangle"><defs><radialGradient id="unN" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#B9A4FF"/><stop offset="1" stop-color="#6A4DE0"/></radialGradient><radialGradient id="unH"><stop offset="0" stop-color="#9C86FF" stop-opacity=".7"/><stop offset="1" stop-color="#9C86FF" stop-opacity="0"/></radialGradient></defs>';
  for (let k = 0; k < 46; k++) { const x = (k * 53 + 13) % 97 + 1.5, y = (k * 37 + 29) % 97 + 1.5; s += `<circle class="un-star" style="animation-delay:${(k % 9) * 0.35}s" cx="${x}" cy="${y}" r="${0.22 + (k % 3) * 0.12}" fill="#fff"/>`; }
  s += '<g class="un-edges">' + P.edges.map(() => '<g class="un-e"><line class="g"/><line class="c"/></g>').join('') + '</g><g class="un-nodes">' + pos.map((_, i) => `<g class="un-n" data-i="${i}"><circle class="halo" r="7.5" fill="url(#unH)"/><circle class="dot" r="3.7" fill="url(#unN)"/><circle class="hit" r="8.5"/></g>`).join('') + '</g></svg>';
  const counter = h('span', { class: 'ln-count' }, ''); const wrap = h('div', { class: 'un', html: s }); root.append(h('div', { class: 'ln-hud' }, h('span', null, 'Lines crossing'), counter), wrap);
  const svg = wrap.querySelector('svg'); const eEls = [...wrap.querySelectorAll('.un-e')]; const nEls = [...wrap.querySelectorAll('.un-n')];
  function update() {
    P.edges.forEach(([a, b], i) => { eEls[i].querySelectorAll('line').forEach((l) => { l.setAttribute('x1', pos[a][0]); l.setAttribute('y1', pos[a][1]); l.setAttribute('x2', pos[b][0]); l.setAttribute('y2', pos[b][1]); }); });
    nEls.forEach((g, i) => { g.querySelectorAll('circle').forEach((c) => { c.setAttribute('cx', pos[i][0]); c.setAttribute('cy', pos[i][1]); }); });
    const cr = LD3.unCross(pos, P.edges); eEls.forEach((e, i) => e.classList.toggle('bad', cr.bad.has(i)));
    counter.textContent = cr.bad.size ? String(cr.bad.size) + (cr.bad.size === 1 ? ' line' : ' lines') : 'None';
    ctx.progress(Math.max(0, 1 - cr.bad.size / P.edges.length));
    if (cr.count === 0 && !won) { won = true; drag = -1; ctx.solve(); }
  }
  const toPt = (ev) => { const r = svg.getBoundingClientRect(); return [Math.max(5, Math.min(95, (ev.clientX - r.left) / r.width * 100)), Math.max(5, Math.min(95, (ev.clientY - r.top) / r.height * 100))]; };
  svg.addEventListener('pointerdown', (ev) => { const g = ev.target.closest && ev.target.closest('.un-n'); if (!g || !ctx.active()) return; drag = +g.getAttribute('data-i'); nEls[drag].classList.add('drag'); try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ } ev.preventDefault(); });
  svg.addEventListener('pointermove', (ev) => { if (drag < 0 || !ctx.active()) return; pos[drag] = toPt(ev); update(); });
  const up = () => { if (drag >= 0) nEls[drag].classList.remove('drag'); drag = -1; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  update();
  return { destroy() {}, reveal: () => { P.solution.forEach((p, i) => { pos[i] = p.slice(); }); update(); }, cheat: () => { P.solution.forEach((p, i) => { pos[i] = p.slice(); }); update(); }, celebrate: () => svg.classList.add('won'), puzzle: P,
    snapshot: () => pos.map((p) => p.slice()), applySnapshot: (s) => { if (Array.isArray(s)) { s.forEach((p, i) => { if (pos[i] && Array.isArray(p)) pos[i] = p.slice(); }); update(); } } };
}
