'use strict';
/* ---------- Bridges: lay one bridge across every tile ---------- */
function mountBridge(root, ctx) {
  const P = ctx.puzzle(); const n = P.n; const blocked = new Set(P.blocked); const nums = P.nums; const last = P.order.length; const open = P.open;
  let path = []; let dragging = false; let won = false; const S = n * 10;
  const ctr = (c) => [(c % n) * 10 + 5, ((c / n) | 0) * 10 + 5];
  let g = `<svg class="svgb zp" viewBox="0 0 ${S} ${S}" role="group" aria-label="Bridge puzzle">`;
  g += `<defs><linearGradient id="zpW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18B1B6"/><stop offset=".55" stop-color="#0D84A3"/><stop offset="1" stop-color="#0A4F7C"/></linearGradient>
<radialGradient id="zpIsl" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#C9F08F"/><stop offset=".6" stop-color="#5DB04B"/><stop offset="1" stop-color="#2F8A3D"/></radialGradient>
<radialGradient id="zpOk" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#FFF1A8"/><stop offset=".6" stop-color="#F6C335"/><stop offset="1" stop-color="#D98E00"/></radialGradient>
<radialGradient id="zpSand" cx=".4" cy=".35" r=".9"><stop offset="0" stop-color="#FFF4CF"/><stop offset="1" stop-color="#E0B66A"/></radialGradient>
<linearGradient id="zpRock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9BBC9"/><stop offset="1" stop-color="#70727F"/></linearGradient>
<clipPath id="zpClip"><rect width="${S}" height="${S}" rx="3.5"/></clipPath></defs><rect width="${S}" height="${S}" rx="3.5" fill="url(#zpW)"/><g clip-path="url(#zpClip)"><g class="br-waves">`;
  for (let row = 0; row < n * 2 + 1; row++) { const y = 2.5 + row * 5; let d = `M${-20 + (row % 2) * 5} ${y}`; for (let k = 0; k < n * 2 + 6; k++) d += k === 0 ? 'q2.5 -1.4 5 0' : 't5 0'; g += `<path d="${d}" fill="none" stroke="#fff" stroke-width=".3" opacity="${0.1 + (row % 3) * 0.05}"/>`; }
  g += '</g>';
  for (let k = 0; k < n * 2; k++) g += `<circle class="br-spark" style="animation-delay:${(k % 7) * 0.4}s" cx="${((k * 37 + 11) % (S - 6)) + 3}" cy="${((k * 53 + 7) % (S - 6)) + 3}" r=".42" fill="#fff"/>`;
  g += '</g>';
  for (let c = 0; c < n * n; c++) {
    const [x, y] = ctr(c);
    if (blocked.has(c)) g += `<g class="zp-rock"><rect x="${x - 4.4}" y="${y - 4}" width="8.8" height="8" rx="2.6" fill="url(#zpRock)"/><path d="M${x - 2.6} ${y - 1}l2 -2l2.4 1.4M${x + 0.4} ${y + 2}l2 -.8" stroke="#555766" stroke-width=".5" fill="none" stroke-linecap="round"/><ellipse cx="${x - 1.4}" cy="${y - 2.6}" rx="2" ry=".8" fill="#fff" opacity=".4"/></g>`;
    else g += `<rect class="zp-tile" data-c="${c}" x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" rx="2.4"/>`;
  }
  g += '<polyline class="zp-sh"/><polyline class="zp-base"/><polyline class="zp-plank"/><circle class="zp-head" r="2.1" style="display:none"/>';
  Object.keys(nums).forEach((cs) => { const c = +cs; const [x, y] = ctr(c);
    g += `<g class="zp-i" data-c="${c}"><circle class="halo" cx="${x}" cy="${y}" r="8" fill="#FFE27A" opacity="0"/><circle cx="${x}" cy="${y + 0.5}" r="5" fill="#04243A" opacity=".3"/><circle cx="${x}" cy="${y}" r="4.9" fill="url(#zpSand)"/><circle class="grass" cx="${x}" cy="${y}" r="3.9" fill="url(#zpIsl)"/><ellipse cx="${x - 1.2}" cy="${y - 1.8}" rx="1.5" ry=".8" fill="#fff" opacity=".45"/><text x="${x}" y="${y + 0.3}">${nums[c]}</text></g>`; });
  g += '</svg>';
  const wrap = h('div', { class: 'br zpw', html: g }); const undo = h('button', { class: 'btn ghost sm', onclick: () => { if (!ctx.active() || !path.length) return; path.pop(); draw(); } }, '\u21B6 Undo'); const clear = h('button', { class: 'btn ghost sm', onclick: () => { if (!ctx.active()) return; path = []; draw(); } }, 'Clear');
  const note = h('div', { class: 'zp-note' }, 'Start on island 1');
  root.append(wrap, h('div', { class: 'zp-bar' }, undo, note, clear));
  const svg = wrap.querySelector('svg'); const tiles = [...wrap.querySelectorAll('.zp-tile')]; const isl = [...wrap.querySelectorAll('.zp-i')];
  const sh = svg.querySelector('.zp-sh'), base = svg.querySelector('.zp-base'), plank = svg.querySelector('.zp-plank'), head = svg.querySelector('.zp-head');
  const nextNum = () => { let k = 0; path.forEach((c) => { if (nums[c] && nums[c] > k) k = nums[c]; }); return k + 1; };
  const adj = (a, b) => Math.abs((a % n) - (b % n)) + Math.abs(((a / n) | 0) - ((b / n) | 0)) === 1;
  function step(c) {
    const hd = path[path.length - 1];
    if (path.length >= 2 && c === path[path.length - 2]) { path.pop(); return true; }
    if (blocked.has(c) || path.includes(c) || !adj(hd, c)) return false;
    if (nums[hd] === last) return false; const m = nums[c];
    if (m != null) { if (m !== nextNum()) { flash('Visit the islands in number order: next is ' + nextNum()); return false; } if (m === last && path.length + 1 !== open) { flash('Save island ' + last + ' for the very last tile'); return false; } }
    path.push(c); return true;
  }
  let flashT = 0; function flash(t) { note.textContent = t; note.classList.add('warn'); clearTimeout(flashT); flashT = setTimeout(() => { note.classList.remove('warn'); draw(); }, 1700); }
  function walkTo(t) {
    let guard = 0; while (path.length && path[path.length - 1] !== t && guard++ < 20) {
      const hd = path[path.length - 1]; const hx = hd % n, hy = (hd / n) | 0, tx = t % n, ty = (t / n) | 0; const dx = tx - hx, dy = ty - hy;
      const nx = Math.abs(dx) >= Math.abs(dy) ? hx + Math.sign(dx) : hx; const ny = Math.abs(dx) >= Math.abs(dy) ? hy : hy + Math.sign(dy);
      if (!step(ny * n + nx)) break;
    }
  }
  function draw() {
    const pts = path.map((c) => ctr(c).join(',')).join(' '); [sh, base, plank].forEach((p) => p.setAttribute('points', pts)); const hd = path[path.length - 1];
    if (hd != null) { const [x, y] = ctr(hd); head.setAttribute('cx', x); head.setAttribute('cy', y); head.style.display = ''; } else head.style.display = 'none';
    const set = new Set(path); tiles.forEach((t) => t.classList.toggle('vis', set.has(+t.getAttribute('data-c'))));
    isl.forEach((el) => { const c = +el.getAttribute('data-c'); el.classList.toggle('ok', set.has(c)); el.classList.toggle('next', !path.length ? nums[c] === 1 : nums[c] === nextNum()); });
    if (!note.classList.contains('warn')) note.textContent = !path.length ? 'Start on island 1' : path.length + ' of ' + open + ' tiles \u00B7 next island ' + Math.min(nextNum(), last);
    ctx.progress(path.length / open);
    if (path.length === open && nums[path[path.length - 1]] === last && !won) { won = true; dragging = false; ctx.solve(); }
  }
  const cellAt = (ev) => { const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width * S, y = (ev.clientY - r.top) / r.height * S; if (x < 0 || y < 0 || x >= S || y >= S) return -1; return Math.floor(y / 10) * n + Math.floor(x / 10); };
  svg.addEventListener('pointerdown', (ev) => {
    if (!ctx.active()) return; const c = cellAt(ev); if (c < 0 || blocked.has(c)) return; ev.preventDefault(); try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    if (!path.length) { if (nums[c] === 1) { path = [c]; dragging = true; draw(); } else flash('Start on island 1'); return; }
    const i = path.indexOf(c); if (i >= 0) { path = path.slice(0, i + 1); dragging = true; draw(); return; }
    dragging = true; walkTo(c); draw();
  });
  svg.addEventListener('pointermove', (ev) => { if (!dragging || !ctx.active()) return; const c = cellAt(ev); if (c < 0) return; walkTo(c); draw(); });
  const up = () => { dragging = false; }; svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  draw();
  const setPath = (p) => { path = p.slice(); draw(); };
  return { destroy() {}, reveal: () => setPath(P.path), cheat: () => setPath(P.path),
    celebrate: () => {
      svg.classList.add('won'); const NS = 'http://www.w3.org/2000/svg'; const d = 'M' + path.map((c) => ctr(c).join(' ')).join('L');
      const gEl = document.createElementNS(NS, 'g'); const t = document.createElementNS(NS, 'text'); t.setAttribute('class', 'zp-walker'); t.textContent = '\u{1F6B6}';
      const am = document.createElementNS(NS, 'animateMotion'); am.setAttribute('dur', Math.max(1.2, path.length * 0.07) + 's'); am.setAttribute('path', d); am.setAttribute('fill', 'freeze'); t.append(am); gEl.append(t); svg.append(gEl);
    }, puzzle: P };
}
