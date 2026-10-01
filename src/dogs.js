'use strict';
/* ---------- Pup Parade: line the dogs up by the rules ---------- */
const DOGS = [
  { n: 'Golden', fur: '#F2B84B', ear: '#C98A1E', muz: '#FBE3A7', col: '#E5484D', ears: 'floppy', tongue: true },
  { n: 'Dalmatian', fur: '#FFFFFF', ear: '#2B2833', muz: '#FFFFFF', col: '#3A86FF', ears: 'floppy', spots: true },
  { n: 'Husky', fur: '#8E94A8', ear: '#6E7488', muz: '#F4F5FA', col: '#2EC4B6', ears: 'point', mask: true, eye: '#4FB3FF' },
  { n: 'Lab', fur: '#8B5A3C', ear: '#5E3A25', muz: '#B98A68', col: '#FFD23F', ears: 'floppy' },
  { n: 'Pug', fur: '#E8C9A0', ear: '#3B2F2F', muz: '#3B2F2F', col: '#FF4D9D', ears: 'fold', tongue: true, wrinkle: true },
  { n: 'Corgi', fur: '#F08A24', ear: '#F08A24', muz: '#FFFFFF', col: '#8338EC', ears: 'point', blaze: true },
];
function dogSVG(i, size) {
  const d = DOGS[i]; const W = '#fff'; const st = `stroke="${W}" stroke-width="2.6" stroke-linejoin="round"`;
  let s = `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="dogsvg" aria-hidden="true">`;
  if (d.ears === 'floppy') s += `<ellipse cx="12.5" cy="34" rx="8.5" ry="15.5" transform="rotate(10 12.5 34)" fill="${d.ear}" ${st}/><ellipse cx="51.5" cy="34" rx="8.5" ry="15.5" transform="rotate(-10 51.5 34)" fill="${d.ear}" ${st}/>`;
  else if (d.ears === 'point') s += `<path d="M11 32 L8 6 L29 19Z" fill="${d.ear}" ${st}/><path d="M53 32 L56 6 L35 19Z" fill="${d.ear}" ${st}/><path d="M12.5 24 L11.5 12 L21 18Z" fill="#F7B4C0"/><path d="M51.5 24 L52.5 12 L43 18Z" fill="#F7B4C0"/>`;
  else s += `<path d="M10 28 L7 13 L26 20Z" fill="${d.ear}" ${st}/><path d="M54 28 L57 13 L38 20Z" fill="${d.ear}" ${st}/>`;
  s += `<path d="M16 54 q16 10 32 0" stroke="${W}" stroke-width="8.6" fill="none" stroke-linecap="round"/>`;
  s += `<ellipse cx="32" cy="35" rx="21.5" ry="19.5" fill="${d.fur}" ${st}/>`;
  if (d.mask) s += `<path d="M11 33 C11 13 53 13 53 33 C47 27 40 29 32 36 C24 29 17 27 11 33Z" fill="#5C6176"/><ellipse cx="32" cy="44" rx="14" ry="10.5" fill="#F4F5FA"/>`;
  if (d.blaze) s += `<path d="M27.5 16.5 L36.5 16.5 L38.5 40 L25.5 40Z" fill="#fff"/>`;
  if (d.spots) s += '<ellipse cx="21" cy="27" rx="4.4" ry="3.8" fill="#2B2833"/><ellipse cx="44" cy="29" rx="3.4" ry="3" fill="#2B2833"/><ellipse cx="33" cy="19.5" rx="2.6" ry="2.2" fill="#2B2833"/><circle cx="26" cy="49" r="1.8" fill="#2B2833"/><circle cx="41" cy="48" r="1.5" fill="#2B2833"/>';
  if (d.wrinkle) s += '<path d="M24 22 q8 -4 16 0 M26 26 q6 -3 12 0" stroke="#B88F5E" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
  s += `<ellipse cx="32" cy="45" rx="${d.mask ? 9 : 11.5}" ry="8.5" fill="${d.muz}" ${d.mask ? 'opacity="0"' : ''}/>`;
  const eye = d.eye || '#2a2430';
  s += `<circle cx="23.5" cy="32" r="3.4" fill="${eye}"/><circle cx="40.5" cy="32" r="3.4" fill="${eye}"/>` + (d.eye ? '<circle cx="23.5" cy="32" r="1.7" fill="#14121c"/><circle cx="40.5" cy="32" r="1.7" fill="#14121c"/>' : '') + '<circle cx="24.5" cy="30.8" r="1.1" fill="#fff"/><circle cx="41.5" cy="30.8" r="1.1" fill="#fff"/>';
  s += `<ellipse cx="32" cy="40.5" rx="4.6" ry="3.2" fill="${i === 4 ? '#0f0c12' : '#2a2430'}"/><ellipse cx="30.8" cy="39.5" rx="1.3" ry=".8" fill="#fff" opacity=".6"/><path d="M32 43.5 v3.2 M26.5 47.4 q5.5 4 11 0" stroke="${i === 4 ? '#E7D6BC' : '#2a2430'}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  if (d.tongue) s += '<path d="M29 48.2 q3 8.4 6 0z" fill="#FF7A9A"/>';
  s += `<path d="M16 54 q16 10 32 0" stroke="${d.col}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="32" cy="60.5" r="3" fill="#FFD23F" stroke="#fff" stroke-width="1.4"/></svg>`;
  return s;
}
const SIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.5c0-3 4-4 5-1l.8 2h5.4l.8-2c1-3 5-2 5 1v4.5c0 4.6-4 8-8.5 8s-8.5-3.4-8.5-8z" fill="currentColor"/></svg>';
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" fill="#EF476F"/></svg>';
const BROKEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3l-2 4 3 3-1 7z" fill="#EF476F"/><path d="M12 7a4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11l1-7-3-3z" fill="#EF476F" transform="translate(1.6 .6) rotate(6 14 14)"/></svg>';
const ARROW_R = '<svg viewBox="0 0 28 12" aria-hidden="true"><path d="M2 6h20" stroke="#18A864" stroke-width="2.6" stroke-linecap="round"/><path d="M26 6l-7-5v10z" fill="#18A864"/></svg>';
const dgName = (P, d) => DOGS[P.dogs[d]].n;
function dgText(P, c) {
  const n = (d) => dgName(P, d);
  switch (c.k) {
    case 'pos': return n(c.a) + ' stands in spot ' + (c.p + 1); case 'notpos': return n(c.a) + ' does not stand in spot ' + (c.p + 1);
    case 'adj': return n(c.a) + ' is right next to ' + n(c.b); case 'nadj': return n(c.a) + ' is not next to ' + n(c.b);
    case 'left': return n(c.a) + ' is somewhere left of ' + n(c.b); case 'end': return n(c.a) + ' is at one end of the line'; case 'notend': return n(c.a) + ' is not at either end';
    case 'between': return n(c.a) + ' is somewhere between ' + n(c.b) + ' and ' + n(c.c); default: return n(c.a) + ' and ' + n(c.b) + ' have exactly one dog between them';
  }
}
function mountDogs(root, ctx) {
  const P = ctx.puzzle(); const N = P.N; const total = P.clues.length;
  const ico = (d, big) => h('span', { class: 'dgi' + (big ? ' big' : ''), html: dogSVG(P.dogs[d], big ? 40 : 32) });
  const row = (hl, x) => h('div', { class: 'dg-row' }, LD.range(N).map((i) => h('i', { class: 'sl' + (hl.includes(i) ? ' hl' : '') + (x.includes(i) ? ' x' : ''), html: SIL })));
  const pin = (d, at) => h('span', { class: 'pin', style: `left:${at}%` }, ico(d), h('i', { class: 'arr' }, '\u25BC'));
  const cap = (t) => h('span', { class: 'cap' }, t);
  const mid = Array.from({ length: Math.max(0, N - 2) }, (_, i) => i + 1);
  function card(c) {
    let inner, caption;
    switch (c.k) {
      case 'pos': inner = h('div', { class: 'dg-pos' }, pin(c.a, (c.p + 0.5) / N * 100), row([c.p], [])); caption = 'Spot ' + (c.p + 1); break;
      case 'notpos': inner = h('div', { class: 'dg-pos' }, pin(c.a, (c.p + 0.5) / N * 100), row([], [c.p])); caption = 'Not spot ' + (c.p + 1); break;
      case 'end': inner = h('div', { class: 'dg-pos' }, pin(c.a, 50), row([0, N - 1], [])); caption = 'At an end'; break;
      case 'notend': inner = h('div', { class: 'dg-pos' }, pin(c.a, 50), row(mid, [])); caption = 'Not at an end'; break;
      case 'adj': inner = h('div', { class: 'dg-pair' }, ico(c.a), h('i', { class: 'ht', html: HEART }), ico(c.b)); caption = 'Side by side'; break;
      case 'nadj': inner = h('div', { class: 'dg-pair' }, ico(c.a), h('i', { class: 'ht', html: BROKEN }), ico(c.b)); caption = 'Not side by side'; break;
      case 'left': inner = h('div', { class: 'dg-pair' }, ico(c.a), h('i', { class: 'ar', html: ARROW_R }), ico(c.b)); caption = 'Left of'; break;
      case 'between': inner = h('div', { class: 'dg-pair' }, ico(c.b), h('i', { class: 'dots' }), ico(c.a, true), h('i', { class: 'dots' }), ico(c.c)); caption = 'In between'; break;
      default: inner = h('div', { class: 'dg-pair' }, ico(c.a), h('i', { class: 'gapsil', html: SIL }), ico(c.b)); caption = 'One dog apart';
    }
    const t = dgText(P, c);
    return h('div', { class: 'clue cp dg-c', role: 'img', 'aria-label': t, title: t }, h('div', { class: 'cin' }, inner), cap(caption), h('i', { class: 'tick', 'aria-hidden': 'true' }, '\u2713'));
  }
  const cards = P.clues.map(card); const counter = h('span', { class: 'ln-count' }, '');
  let kennel = LD.shuffle(ctx.r, LD.range(N)); // dog id per kennel slot, -1 = empty
  let lineup = Array(N).fill(-1); // dog id per final-row slot, -1 = empty
  function posOf() { const p = Array(N).fill(-1); lineup.forEach((d, s) => { if (d >= 0) p[d] = s; }); return Int8Array.from(p); }
  let sel = null; let won = false; let drag = null; let ghost = null; let pointerHandled = false;
  const kennelRow = h('div', { class: 'dg-line dg-kennel', style: '--n:' + N });
  const kennelSlots = LD.range(N).map((i) => { const b = h('button', { class: 'dgb dgk', 'aria-label': 'Kennel spot ' + (i + 1) }); b.addEventListener('pointerdown', (ev) => startDrag(ev, 'kennel', i)); b.addEventListener('click', () => { if (pointerHandled) return; tap('kennel', i); }); kennelRow.append(b); return b; });
  const lineEl = h('div', { class: 'dg-line', style: '--n:' + N });
  const slots = LD.range(N).map((s) => { const b = h('button', { class: 'dgb', 'aria-label': 'Spot ' + (s + 1) }); b.addEventListener('pointerdown', (ev) => startDrag(ev, 'line', s)); b.addEventListener('click', () => { if (pointerHandled) return; tap('line', s); }); lineEl.append(b); return b; });
  root.append(h('div', { class: 'ln-hud' }, h('span', null, 'Rules met'), counter), h('div', { class: 'clues dg-clues' }, cards),
    h('div', { class: 'dg-zone-lbl' }, 'Kennel'), kennelRow, h('div', { class: 'dg-zone-lbl' }, 'Line-up'), lineEl,
    h('div', { class: 'ln-note' }, 'Drag a dog from the kennel into the line-up, or tap one then a spot.'));
  function fillSlot(b, d, label) {
    if (d < 0) b.replaceChildren(h('i', { class: 'dgi big empty', html: SIL }));
    else b.replaceChildren(h('span', { class: 'dgi big', html: dogSVG(P.dogs[d], 54) }));
    b.classList.toggle('empty', d < 0); b.setAttribute('aria-label', label + (d >= 0 ? ': ' + dgName(P, d) : ': empty'));
  }
  const clueRefs = (c) => (c.k === 'pos' || c.k === 'notpos' || c.k === 'end' || c.k === 'notend' ? [c.a] : c.k === 'between' ? [c.a, c.b, c.c] : [c.a, c.b]);
  function draw() {
    kennelSlots.forEach((b, i) => { fillSlot(b, kennel[i], 'Kennel spot ' + (i + 1)); b.classList.toggle('sel', sel && sel.zone === 'kennel' && sel.idx === i); });
    slots.forEach((b, s) => { fillSlot(b, lineup[s], 'Spot ' + (s + 1)); b.classList.toggle('sel', sel && sel.zone === 'line' && sel.idx === s); b.prepend(h('span', { class: 'dgn' }, s + 1)); });
    const pos = posOf(); const raw = LD3.dgState(P, pos);
    const st = P.clues.map((c, i) => raw[i] && clueRefs(c).every((d) => pos[d] >= 0));
    cards.forEach((c, i) => c.classList.toggle('ok', st[i])); const ok = st.filter(Boolean).length;
    counter.textContent = ok + ' / ' + total; ctx.progress(ok / total);
    if (lineup.every((d) => d >= 0) && ok === total && !won) { won = true; sel = null; ctx.solve(); }
  }
  function move(from, to) {
    if (from.zone === to.zone && from.idx === to.idx) return;
    const src = from.zone === 'kennel' ? kennel : lineup; const dst = to.zone === 'kennel' ? kennel : lineup;
    const dog = src[from.idx]; if (dog < 0) return;
    const occ = dst[to.idx]; dst[to.idx] = dog; src[from.idx] = occ;
  }
  function tap(zone, idx) {
    if (!ctx.active()) return;
    if (!sel) { if ((zone === 'kennel' ? kennel : lineup)[idx] < 0) return; sel = { zone, idx }; draw(); return; }
    if (sel.zone === zone && sel.idx === idx) { sel = null; draw(); return; }
    move(sel, { zone, idx }); sel = null; draw();
  }
  function slotAt(x, y) { const el = document.elementFromPoint(x, y); const b = el && el.closest && el.closest('.dgb'); if (!b) return null; const inKennel = kennelSlots.indexOf(b); if (inKennel >= 0) return { zone: 'kennel', idx: inKennel }; const inLine = slots.indexOf(b); if (inLine >= 0) return { zone: 'line', idx: inLine }; return null; }
  function startDrag(ev, zone, idx) {
    if (!ctx.active() || ev.button === 2) return; const arr = zone === 'kennel' ? kennel : lineup; const d = arr[idx]; if (d < 0) return;
    drag = { zone, idx, moved: false }; const el = ev.currentTarget; try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    ghost = h('div', { class: 'dg-ghost', html: dogSVG(P.dogs[d], 54) }); document.body.append(ghost); placeGhost(ev.clientX, ev.clientY);
    el.classList.add('dragsrc');
    const move_ = (e) => { drag.moved = true; placeGhost(e.clientX, e.clientY); const hit = slotAt(e.clientX, e.clientY); [...kennelSlots, ...slots].forEach((b) => b.classList.remove('droptgt')); if (hit) (hit.zone === 'kennel' ? kennelSlots[hit.idx] : slots[hit.idx]).classList.add('droptgt'); };
    const up = (e) => {
      el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel);
      el.classList.remove('dragsrc'); [...kennelSlots, ...slots].forEach((b) => b.classList.remove('droptgt')); if (ghost) { ghost.remove(); ghost = null; }
      if (drag.moved) { const hit = slotAt(e.clientX, e.clientY); if (hit) move({ zone, idx }, hit); sel = null; draw(); }
      else tap(zone, idx);
      drag = null; pointerHandled = true; setTimeout(() => { pointerHandled = false; }, 0);
    };
    const cancel = () => { el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel); el.classList.remove('dragsrc'); [...kennelSlots, ...slots].forEach((b) => b.classList.remove('droptgt')); if (ghost) { ghost.remove(); ghost = null; } drag = null; };
    el.addEventListener('pointermove', move_); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel);
  }
  function placeGhost(x, y) { if (ghost) ghost.style.cssText = `left:${x}px;top:${y}px`; }
  draw();
  const solve = () => { const o = Array(N).fill(0); P.sol.forEach((p, d) => { o[p] = d; }); lineup = o; kennel = Array(N).fill(-1); sel = null; draw(); };
  return { destroy() {}, reveal: solve, cheat: solve, celebrate: () => { lineEl.classList.add('won'); slots.forEach((b, i) => b.style.setProperty('--w', i * 90 + 'ms')); }, puzzle: P };
}
