'use strict';
/* ---------- Suspect lineup: rule out everyone who breaks a clue ---------- */
const SKIN = ['#F7D3B0', '#E2A97E', '#A9714B']; const HAIRC = ['#6B3F23', '#1E1B22', '#F2C94C', '#D9531E']; const HAIRN = ['brown', 'black', 'blonde', 'red'];
const HATN = ['no hat', 'a cap', 'a top hat']; const GLN = ['no glasses', 'round glasses', 'sunglasses'];
function hatSVG(v) { return v === 1 ? '<path d="M12 27C12 9 52 9 52 27z" fill="#3A86FF"/><rect x="10" y="25" width="44" height="4.5" rx="2" fill="#2563d6"/><path d="M40 27h18a3 3 0 0 1 0 5H40z" fill="#2563d6"/>' : v === 2 ? '<rect x="19" y="3" width="26" height="21" rx="2" fill="#26232e"/><rect x="19" y="16" width="26" height="4.5" fill="#D6303A"/><rect x="11" y="22" width="42" height="4.5" rx="2.2" fill="#26232e"/>' : ''; }
function glassSVG(v) { return v === 1 ? '<g fill="rgba(180,220,255,.35)" stroke="#2b2733" stroke-width="1.6"><circle cx="25" cy="35" r="5.6"/><circle cx="39" cy="35" r="5.6"/></g><path d="M30.6 34.6h2.8" stroke="#2b2733" stroke-width="1.6"/>' : v === 2 ? '<g fill="#1d1a24"><rect x="18.5" y="31" width="12" height="8" rx="3.2"/><rect x="33.5" y="31" width="12" height="8" rx="3.2"/></g><path d="M30.5 34h3" stroke="#1d1a24" stroke-width="1.6"/><path d="M21 33l4-1" stroke="#fff" stroke-width="1" opacity=".6"/>' : ''; }
function faceSVG(f, size) {
  const hc = HAIRC[f.hair]; const sk = SKIN[f.skin || 0];
  return `<svg viewBox="0 0 64 64" width="${size || 56}" height="${size || 56}" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#E8E4F6"/>` +
    `<ellipse cx="32" cy="61" rx="22" ry="12" fill="#6B7AA8"/><path d="M14 26c0-20 36-20 36 0v10c-4-6-8-9-18-9s-14 3-18 9z" fill="${hc}"/>` +
    `<ellipse cx="32" cy="36" rx="15.5" ry="17.5" fill="${sk}"/><circle cx="16.8" cy="37" r="3" fill="${sk}"/><circle cx="47.2" cy="37" r="3" fill="${sk}"/>` +
    `<path d="M16.5 30c3-11 28-11 31 0-6-5-25-5-31 0z" fill="${hc}"/>` +
    (f.beard ? `<path d="M17.5 40c1 15 28 15 29 0-3 6-8 8-14.5 8s-11.5-2-14.5-8z" fill="${hc}"/><path d="M26 42c3 2 9 2 12 0-3-1.6-9-1.6-12 0z" fill="${hc}"/>` : '') +
    (f.glasses ? '' : '<circle cx="25.5" cy="35" r="1.7" fill="#2b2733"/><circle cx="38.5" cy="35" r="1.7" fill="#2b2733"/>') + (f.glasses === 1 ? '<circle cx="25" cy="35" r="1.3" fill="#2b2733"/><circle cx="39" cy="35" r="1.3" fill="#2b2733"/>' : '') +
    `<path d="M27 ${f.beard ? 45 : 44}q5 3.4 10 0" stroke="${f.beard ? '#fff' : '#9a4d3a'}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + glassSVG(f.glasses) + hatSVG(f.hat) + '</svg>';
}
const bareHead = (hc) => `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="38" rx="17" ry="19" fill="#E2A97E"/><path d="M13 30c0-22 38-22 38 0v6c-4-6-8-9-19-9s-15 3-19 9z" fill="${hc || '#9a9ab0'}"/><circle cx="32" cy="38" r="12" fill="rgba(255,255,255,.62)"/><text x="32" y="44" font-size="18" font-weight="800" text-anchor="middle" fill="#5B4E86">?</text></svg>`;
const beardIcon = '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="34" rx="17" ry="19" fill="#E2A97E"/><path d="M15 38c2 22 32 22 34 0-4 8-10 11-17 11s-13-3-17-11z" fill="#4a3322"/></svg>';
function atomIcon(a) {
  if (a.attr === 'hair') return bareHead(HAIRC[a.v]);
  if (a.attr === 'hat') return `<svg viewBox="0 0 64 40" aria-hidden="true"><g transform="translate(0 -8)">${hatSVG(a.v || 1)}</g></svg>`;
  if (a.attr === 'glasses') return `<svg viewBox="8 22 48 24" aria-hidden="true">${glassSVG(a.v || 1)}</svg>`;
  return beardIcon;
}
const NOUN = { hair: (v) => HAIRN[v] + ' hair', hat: (v) => ['', 'a cap', 'a top hat'][v], glasses: (v) => ['', 'round glasses', 'sunglasses'][v], beard: () => 'a beard' };
const BARE = { hair: (v) => HAIRN[v] + ' hair', hat: (v) => ['', 'cap', 'top hat'][v], glasses: (v) => ['', 'round glasses', 'sunglasses'][v], beard: () => 'beard' };
const atomTxt = (a) => NOUN[a.attr](a.v); const bareTxt = (a) => BARE[a.attr](a.v);
function lnClueText(c) {
  switch (c.k) {
    case 'has': return 'The culprit has ' + atomTxt(c); case 'not': return 'The culprit has no ' + bareTxt(c);
    case 'any': return 'The culprit wears ' + (c.attr === 'hat' ? 'a hat' : 'glasses'); case 'none': return 'The culprit wears no ' + (c.attr === 'hat' ? 'hat' : 'glasses');
    case 'or': return 'The culprit has ' + atomTxt(c.a) + ' or ' + atomTxt(c.b); case 'neither': return 'The culprit has neither ' + atomTxt(c.a) + ' nor ' + atomTxt(c.b);
    case 'acc': return 'The culprit has exactly ' + c.n + (c.n === 1 ? ' accessory' : ' accessories') + ' (hat, glasses, beard)';
    case 'rowCnt': return 'In the culprit’s row, exactly ' + c.n + ' people have ' + atomTxt(c); case 'colCnt': return 'In the culprit’s column, exactly ' + c.n + ' people have ' + atomTxt(c);
    case 'dir': return 'Someone with ' + atomTxt(c) + ' stands directly ' + ({ up: 'above', down: 'below', left: 'to the left of', right: 'to the right of' })[c.dir] + ' the culprit'; case 'twin': return 'The culprit has the same hair colour as a neighbour';
    case 'col': return 'The culprit is in column ' + (c.v + 1); case 'row': return 'The culprit is in row ' + (c.v + 1);
    case 'next': return 'The culprit stands next to someone with ' + atomTxt(c); default: return 'The culprit does not stand next to anyone with ' + atomTxt(c);
  }
}
function lnMini(hi) {
  let s = '<svg viewBox="0 0 50 40" aria-hidden="true">'; for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { const on = hi.col != null ? x === hi.col : y === hi.row; s += `<rect x="${x * 10 + 1}" y="${y * 10 + 1}" width="8" height="8" rx="2" fill="${on ? '#FFD23F' : '#B7B3D3'}" opacity="${on ? 1 : 0.55}"/>`; } return s + '</svg>';
}
function lnClueCard(c) {
  const ic = (a) => h('span', { class: 'lnic', html: atomIcon(a) }); const yes = () => h('i', { class: 'yes' }, '\u2713'); const no = () => h('i', { class: 'no' }, '\u2715'); let inner, cap;
  switch (c.k) {
    case 'has': inner = [ic(c), yes()]; cap = 'Culprit: ' + atomTxt(c); break;
    case 'not': inner = [ic(c), no()]; cap = 'Culprit: no ' + bareTxt(c); break;
    case 'any': inner = [ic({ attr: c.attr, v: 1 }), ic({ attr: c.attr, v: 2 }), yes()]; cap = c.attr === 'hat' ? 'Culprit wears a hat' : 'Culprit wears glasses'; break;
    case 'none': inner = [ic({ attr: c.attr, v: 1 }), ic({ attr: c.attr, v: 2 }), no()]; cap = c.attr === 'hat' ? 'Culprit: no hat at all' : 'Culprit: no glasses at all'; break;
    case 'or': inner = [ic(c.a), h('i', { class: 'orw' }, 'or'), ic(c.b)]; cap = 'Culprit has one of these'; break;
    case 'neither': inner = [ic(c.a), ic(c.b), no()]; cap = 'Culprit has neither'; break;
    case 'col': inner = [h('span', { class: 'lnmini', html: lnMini({ col: c.v }) })]; cap = 'Culprit: column ' + (c.v + 1) + ' of 5'; break;
    case 'row': inner = [h('span', { class: 'lnmini', html: lnMini({ row: c.v }) })]; cap = 'Culprit: row ' + (c.v + 1) + ' of 4'; break;
    case 'acc': inner = [h('span', { class: 'accrow' }, ic({ attr: 'hat', v: 1 }), ic({ attr: 'glasses', v: 1 }), ic({ attr: 'beard', v: 1 })), h('i', { class: 'accn' }, c.n)]; cap = 'Culprit has ' + c.n + ' of hat, glasses, beard'; break;
    case 'rowCnt': case 'colCnt': inner = [h('span', { class: 'lnic', html: bareHead() }), h('i', { class: 'arw' }, c.k === 'rowCnt' ? '\u2194' : '\u2195'), ic(c), h('i', { class: 'accn sm' }, c.n)]; cap = (c.k === 'rowCnt' ? 'Culprit\u2019s row' : 'Culprit\u2019s column') + ': exactly ' + c.n; break;
    case 'dir': { const cell = (k) => h('i', { class: 'dc' + (k === 'u' ? ' on' : '') }); const pos = { up: 'u', down: 'd', left: 'l', right: 'r' }[c.dir]; inner = h('span', { class: 'dir3' }, ['u', 'l', 'm', 'r', 'd'].map((k) => (k === 'm' ? h('i', { class: 'dc me', html: bareHead() }) : k === pos ? h('i', { class: 'dc tgt k' + k }, ic(c)) : h('i', { class: 'dc k' + k })))); cap = 'Stands ' + ({ up: 'above', down: 'below', left: 'left of', right: 'right of' })[c.dir] + ' the culprit'; break; }
    case 'twin': inner = [h('span', { class: 'lnic', html: bareHead('#B9B3D3') }), h('i', { class: 'eq' }, '='), h('span', { class: 'lnic', html: bareHead('#B9B3D3') })]; cap = 'Culprit: same hair as a neighbour'; break;
    case 'next': inner = [h('span', { class: 'lnic', html: bareHead() }), h('i', { class: 'arw' }, '\u2194'), ic(c)]; cap = 'Culprit: next to ' + atomTxt(c); break;
    default: inner = [h('span', { class: 'lnic', html: bareHead() }), h('i', { class: 'arw' }, '\u2194'), ic(c), no()]; cap = 'Culprit: not next to ' + atomTxt(c);
  }
  const txt = lnClueText(c);
  return h('div', { class: 'clue cp ln-c', role: 'img', 'aria-label': txt, title: txt }, h('div', { class: 'cin' }, inner), h('span', { class: 'cap' }, cap));
}
function mountLineup(root, ctx) {
  const P = ctx.puzzle(); const N = P.faces.length; const out = new Set(); let won = false; let mode = 'rule';
  const clues = h('div', { class: 'clues lnclues' }, P.clues.map(lnClueCard));
  const grid = h('div', { class: 'lng' });
  const tiles = P.faces.map((f, i) => { const b = h('button', { class: 'lnf', 'aria-label': 'Suspect ' + (i + 1), html: faceSVG(f, 64), onclick: () => { if (pointerHandled) return; tap(i); } }); b.addEventListener('pointerdown', (ev) => startDrag(ev, i)); grid.append(b); return b; });
  const rule = h('button', { 'aria-pressed': 'true', onclick: () => setMode('rule') }, 'Rule out \u2715'); const acc = h('button', { 'aria-pressed': 'false', onclick: () => setMode('accuse') }, 'Accuse \u261D');
  const note = h('div', { class: 'ln-note' }, '');
  const cta = h('button', { class: 'btn you block accuse-cta hide', onclick: () => { const q = LD.range(N).find((z) => !out.has(z)); if (q != null) accuse(q); } }, '\u261D  Only one left: accuse them!');
  const hint = () => (mode === 'rule' ? 'Tap faces that break a clue to mark them with a red \u2715, or drag one onto Accuse to name them straight away. They stay in full colour so you can still count them.' : 'Tap the culprit, or drag their face onto Accuse. A wrong accusation costs 8 seconds.');
  note.textContent = hint();
  function setMode(m) { mode = m; rule.setAttribute('aria-pressed', String(m === 'rule')); acc.setAttribute('aria-pressed', String(m === 'accuse')); grid.classList.toggle('accusing', m === 'accuse'); note.textContent = hint(); }
  root.append(clues, h('div', { class: 'seg ln-seg' }, rule, acc), grid, cta, note);
  function draw() {
    tiles.forEach((t, i) => { t.classList.toggle('out', out.has(i)); t.classList.remove('last'); });
    const left = LD.range(N).filter((q) => !out.has(q)); cta.classList.toggle('hide', left.length !== 1);
    if (left.length === 1) { tiles[left[0]].classList.add('last'); if (mode !== 'accuse') setMode('accuse'); note.textContent = 'Everyone else is ruled out. Accuse the glowing face!'; }
    else if (left.length === 0) note.textContent = 'No one is left, so a clue was misread. Tap faces to bring them back.';
    ctx.progress(Math.min(1, [...out].filter((i) => i !== P.culprit).length / (N - 1)));
  }
  function accuse(i) {
    if (i === P.culprit) { won = true; tiles[i].classList.add('caught'); ctx.solve(); return; }
    out.add(i); ctx.penalty(8); const t = tiles[i]; t.classList.remove('shakeit'); void t.offsetWidth; t.classList.add('shakeit'); draw(); note.textContent = 'Not them. That face is ruled out. +8s';
  }
  function tap(i) {
    if (!ctx.active() || won) return;
    if (mode === 'rule') { if (out.has(i)) out.delete(i); else out.add(i); draw(); return; }
    if (out.has(i)) { out.delete(i); draw(); return; }
    accuse(i);
  }
  let pointerHandled = false;
  function isOverAccuse(x, y) { const el = document.elementFromPoint(x, y); return !!el && (el === acc || acc.contains(el)); }
  function startDrag(ev, i) {
    if (!ctx.active() || won || out.has(i)) return; const el = ev.currentTarget; try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    const sx = ev.clientX, sy = ev.clientY; let moved = false;
    const move_ = (e) => {
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return; moved = true;
      el.classList.add('dragging'); acc.classList.toggle('droptgt', isOverAccuse(e.clientX, e.clientY));
    };
    const up = (e) => {
      el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel);
      el.classList.remove('dragging'); acc.classList.remove('droptgt');
      if (!moved) tap(i);
      else if (isOverAccuse(e.clientX, e.clientY)) accuse(i);
      pointerHandled = true; setTimeout(() => { pointerHandled = false; }, 0);
    };
    const cancel = () => { el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel); el.classList.remove('dragging'); acc.classList.remove('droptgt'); };
    el.addEventListener('pointermove', move_); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel);
  }
  draw();
  const reveal = () => { LD.range(N).forEach((q) => { if (q !== P.culprit) out.add(q); }); draw(); grid.classList.add('won'); tiles[P.culprit].classList.add('caught'); };
  return { destroy() {}, reveal, cheat: () => { reveal(); won = true; ctx.solve(); }, celebrate: () => { grid.classList.add('won'); tiles[P.culprit].classList.add('caught'); }, puzzle: P,
    snapshot: () => [...out], applySnapshot: (s) => { if (Array.isArray(s)) { out.clear(); s.forEach((i) => out.add(i)); draw(); } } };
}
