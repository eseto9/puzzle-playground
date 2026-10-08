'use strict';
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}
const fmt = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60); const r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
const fmtS = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

const ANI = {
  tiger: { name: 'Tiger', em: '\u{1F42F}', c: '#E39A2D' },
  elephant: { name: 'Elephant', em: '\u{1F418}', c: '#8F8BD0' },
  monkey: { name: 'Monkey', em: '\u{1F435}', c: '#8B4A22' },
  toucan: { name: 'Toucan', em: '\u{1F99C}', c: '#2E2C93' },
  frog: { name: 'Frog', em: '\u{1F438}', c: '#7DB33A' },
  snake: { name: 'Snake', em: '\u{1F40D}', c: '#2E9C70' },
};
const TNAME = { grass: 'grass', jungle: 'jungle', rock: 'rock', mud: 'mud', palm: 'palm tree' };
const rowName = (R, v) => (R === 3 ? ['top', 'middle', 'bottom'][v] : ['top', 'second', 'third', 'bottom'][v]);
const colName = (C, v) => (C === 2 ? ['left', 'right'][v] : ['left', 'middle', 'right'][v]);

const TC = { grass: '#D3EA6C', jungle: '#3F9A40', rock: '#9C9CA6', mud: '#A9794A' };
function miniMap(P, hi) {
  const W = P.cols * 10, H = P.rows * 10; let s = `<svg class="mm" viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  const focus = hi.row != null || hi.col != null;
  const isCorner = (i) => { const r0 = (i / P.cols) | 0, c0 = i % P.cols; return (r0 === 0 || r0 === P.rows - 1) && (c0 === 0 || c0 === P.cols - 1); };
  P.terr.forEach((t, i) => {
    const r0 = (i / P.cols) | 0, c0 = i % P.cols; const x = c0 * 10, y = r0 * 10;
    const on = hi.row != null ? r0 === hi.row : hi.col != null ? c0 === hi.col : true;
    s += `<rect x="${x + 0.5}" y="${y + 0.5}" width="9" height="9" rx="1.6" fill="${TC[t]}" opacity="${focus && !on ? 0.28 : 1}"/>`;
    if (i === P.palm) s += `<text x="${x + 5}" y="${y + 7.3}" font-size="6.5" text-anchor="middle" opacity="${focus && !on ? 0.4 : 1}">\u{1F334}</text>`;
    if (hi.corners && isCorner(i)) s += `<rect x="${x + 0.3}" y="${y + 0.3}" width="9.4" height="9.4" rx="2.4" fill="#fff" fill-opacity=".3" stroke="#fff" stroke-width="1.5"/>`;
  });
  if (hi.row != null) s += `<rect x="0.3" y="${hi.row * 10 + 0.3}" width="${W - 0.6}" height="9.4" rx="3" fill="none" stroke="#fff" stroke-width="1.7"/>`;
  if (hi.col != null) s += `<rect x="${hi.col * 10 + 0.3}" y="0.3" width="9.4" height="${H - 0.6}" rx="3" fill="none" stroke="#fff" stroke-width="1.7"/>`;
  if (hi.cell != null) s += `<circle cx="${(hi.cell % P.cols) * 10 + 5}" cy="${((hi.cell / P.cols) | 0) * 10 + 5}" r="5.8" fill="#fff" fill-opacity=".3" stroke="#fff" stroke-width="1.6"/>`;
  return s + '</svg>';
}
const CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke="#1F7A7A" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></g><g fill="#1F7A7A"><path d="M12 1.5l3.6 4.8H8.4zM12 22.5l3.6-4.8H8.4zM1.5 12l4.8-3.6v7.2zM22.5 12l-4.8-3.6v7.2z"/></g></svg>';
const LINK = '<svg viewBox="0 0 18 9" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1" y="1.5" width="9" height="6" rx="3"/><rect x="8" y="1.5" width="9" height="6" rx="3"/></g></svg>';
const HBAR = '<svg viewBox="0 0 28 10" aria-hidden="true"><path d="M5 5h18" stroke="#1F7A7A" stroke-width="2.2" stroke-linecap="round"/><path d="M1 5l5-4v8zM27 5l-5-4v8z" fill="#1F7A7A"/></svg>';
const VBAR = '<svg viewBox="0 0 10 20" aria-hidden="true"><path d="M5 5v10" stroke="#1F7A7A" stroke-width="2.2" stroke-linecap="round"/><path d="M5 1l-4 5h8zM5 19l-4-5h8z" fill="#1F7A7A"/></svg>';
const CIRC = { 1: [[20, 20]], 2: [[6, 6], [36, 36]], 3: [[4, 4], [40, 12], [20, 40]], 4: [[4, 4], [44, 4], [4, 44], [44, 44]] };

function clueText(P, c) {
  const nm = (a) => ANI[LD.ANIMALS[P.animals[a]]].name;
  switch (c.k) {
    case 'above': return nm(c.a) + ' is above ' + nm(c.b);
    case 'row': return nm(c.a) + ' is in the ' + rowName(P.rows, c.v) + ' row';
    case 'col': return nm(c.a) + ' is in the ' + colName(P.cols, c.v) + ' column';
    case 'notcol': return nm(c.a) + ' is not in the ' + colName(P.cols, c.v) + ' column';
    case 'on': return nm(c.a) + ' is on ' + TNAME[c.t];
    case 'noton': return nm(c.a) + ' is not on ' + TNAME[c.t];
    case 'adj': return nm(c.a) + ' touches ' + nm(c.b) + ' side by side';
    case 'nadj': return nm(c.a) + ' is not next to ' + nm(c.b);
    case 'sameRow': return nm(c.a) + ' and ' + nm(c.b) + ' are in the same row';
    case 'sameCol': return nm(c.a) + ' and ' + nm(c.b) + ' are in the same column';
    case 'diag': return nm(c.a) + ' and ' + nm(c.b) + ' are diagonal neighbours';
    case 'corner': return nm(c.a) + ' is in a corner';
    case 'nextTerr': return nm(c.a) + ' is next to ' + TNAME[c.t];
    case 'sameTerr': return nm(c.a) + ' and ' + nm(c.b) + ' are on the same kind of terrain';
    case 'rowCount': return 'The ' + rowName(P.rows, c.v) + ' row has ' + c.n + ' animals';
    case 'colCount': return 'The ' + colName(P.cols, c.v) + ' column has ' + c.n + ' animals';
    case 'alone': return nm(c.a) + ' has no animal next to it';
    default: return 'Exactly ' + c.n + ' animals on ' + TNAME[c.t];
  }
}
const cap = (t) => h('span', { class: 'cap' }, t);
const cc = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function mountJungle(root, ctx) {
  const { P, clues, sol } = ctx.puzzle();
  const N = P.n; const aid = (a) => LD.ANIMALS[P.animals[a]]; const info = (a) => ANI[aid(a)];
  const placed = Array(N).fill(-1); let sel = null;
  const tok = (a, cls) => h('span', { class: 'tok ' + (cls || ''), style: '--c:' + info(a).c, 'aria-hidden': 'true' }, info(a).em);
  const mm = (hi) => h('span', { class: 'mmw', html: miniMap(P, hi) });
  const swatch = (t, big, kids) => h('span', { class: 'sw-t ' + t + (big ? ' big' : '') }, kids);
  const neg = (el) => h('span', { class: 'neg' }, el);

  function clueCard(c) {
    let inner, caption = null;
    switch (c.k) {
      case 'above': inner = h('div', { class: 'cl-above' }, h('div', { class: 'ab' }, tok(c.a), h('i', { class: 'arr' }, '\u25B2')), h('i', { class: 'lnk', html: LINK }), h('div', { class: 'ab' }, tok(c.b), h('i', { class: 'arr' }, '\u25BC'))); caption = 'higher up'; break;
      case 'row': inner = [mm({ row: c.v }), tok(c.a)]; caption = cc(rowName(P.rows, c.v)) + ' row'; break;
      case 'col': inner = [mm({ col: c.v }), tok(c.a)]; caption = cc(colName(P.cols, c.v)) + ' column'; break;
      case 'notcol': inner = [mm({ col: c.v }), neg(tok(c.a))]; caption = 'Not ' + colName(P.cols, c.v) + ' column'; break;
      case 'on': case 'noton': {
        const t = tok(c.a); const tw = c.k === 'noton' ? neg(t) : t;
        inner = c.t === 'palm' ? [mm({ cell: P.palm }), tw] : [swatch(c.t, false), tw];
        caption = (c.k === 'noton' ? 'Not on ' : 'On ') + TNAME[c.t]; break;
      }
      case 'adj': case 'nadj': inner = h('div', { class: 'cl-adj' }, h('div', { class: 'st' }, tok(c.a), tok(c.b)), h('span', { class: c.k === 'nadj' ? 'neg' : '', html: CROSS })); caption = c.k === 'adj' ? 'Side by side' : 'Not touching'; break;
      case 'sameRow': inner = h('div', { class: 'cl-pair' }, tok(c.a), h('i', { class: 'bar-h', html: HBAR }), tok(c.b)); caption = 'Same row'; break;
      case 'sameCol': inner = h('div', { class: 'cl-pair v' }, tok(c.a), h('i', { class: 'bar-v', html: VBAR }), tok(c.b)); caption = 'Same column'; break;
      case 'diag': inner = h('div', { class: 'cl-diag' }, tok(c.a), h('i', { class: 'dline' }), tok(c.b)); caption = 'Diagonal'; break;
      case 'corner': inner = [mm({ corners: true }), tok(c.a)]; caption = 'In a corner'; break;
      case 'nextTerr': inner = h('div', { class: 'cl-next' }, tok(c.a), h('i', { class: 'x4', html: CROSS }), swatch(c.t, false)); caption = 'Next to ' + TNAME[c.t]; break;
      case 'sameTerr': inner = h('div', { class: 'cl-pair' }, tok(c.a), h('i', { class: 'eq' }, '='), tok(c.b)); caption = 'Same terrain'; break;
      case 'rowCount': case 'colCount': {
        const isRow = c.k === 'rowCount';
        inner = [mm(isRow ? { row: c.v } : { col: c.v }), h('span', { class: 'nb' }, c.n)];
        caption = cc(isRow ? rowName(P.rows, c.v) : colName(P.cols, c.v)) + (isRow ? ' row' : ' column') + ' has ' + c.n; break;
      }
      case 'alone': inner = h('div', { class: 'cl-alone' }, h('i'), h('i'), h('i'), h('i'), h('div', { class: 'ctr' }, tok(c.a))); caption = 'All alone'; break;
      default: {
        const kids = c.n === 0 ? [h('span', { class: 'neg zero' })] : c.n <= 4 ? CIRC[c.n].map(([x, y]) => h('i', { class: 'cnt', style: `left:${x}%;top:${y}%` })) : [h('i', { class: 'cnt big', style: 'left:22%;top:22%' }, c.n + '\u00D7')];
        inner = swatch(c.t, true, kids); caption = c.n + (c.n === 1 ? ' animal' : ' animals') + ' on ' + TNAME[c.t];
      }
    }
    const txt = clueText(P, c);
    return h('div', { class: 'clue cp', role: 'img', 'aria-label': txt, title: txt }, h('div', { class: 'cin' }, inner), cap(caption));
  }
  const clueEls = clues.map(clueCard); const cluesEl = h('div', { class: 'clues' }, clueEls);

  let pointerHandled = false;
  const board = h('div', { class: 'jb', style: '--cols:' + P.cols });
  const cellEls = P.terr.map((t, i) => { const b = h('button', { class: 'cell ' + t, 'data-i': i, onclick: () => { if (pointerHandled) return; tapCell(i); } }); b.addEventListener('pointerdown', (ev) => { const occ = occupant(i); if (occ >= 0) startDrag(ev, occ, () => tapCell(i)); }); board.append(b); return b; });
  const tray = h('div', { class: 'tray' });
  const trayEls = P.animals.map((_, a) => { const b = h('button', { class: 'slot', 'aria-label': info(a).name, onclick: () => { if (pointerHandled) return; tapTray(a); } }, tok(a)); b.addEventListener('pointerdown', (ev) => startDrag(ev, a, () => tapTray(a))); tray.append(b); return b; });
  const jgridEl = h('div', { class: 'jgrid', style: '--bf:' + (P.cols >= 3 ? 1.5 : 1.1) + 'fr' }, cluesEl, tray, board); root.append(jgridEl);

  const occupant = (i) => placed.indexOf(i);
  function draw() {
    cellEls.forEach((b, i) => {
      const a = occupant(i); const t = P.terr[i];
      b.replaceChildren(...[h('span', { class: 'tl' }, TNAME[t]), i === P.palm ? h('span', { class: 'palm', 'aria-hidden': 'true' }, '\u{1F334}') : null, a >= 0 ? tok(a, 'on' + (sel === a ? ' sel' : '')) : null].filter(Boolean));
      b.classList.toggle('tgt', sel !== null && a !== sel);
      b.setAttribute('aria-label', TNAME[t] + (i === P.palm ? ' with palm tree' : '') + ', row ' + (((i / P.cols) | 0) + 1) + ' column ' + ((i % P.cols) + 1) + (a >= 0 ? ', ' + info(a).name : ', empty'));
    });
    trayEls.forEach((b, a) => { b.classList.toggle('used', placed[a] >= 0); b.classList.toggle('sel', sel === a); b.setAttribute('aria-pressed', String(sel === a)); });
    let sat = 0;
    clues.forEach((c, k) => { const s = LD.clueState(P, c, (a) => placed[a]); clueEls[k].classList.toggle('bad', s === false); clueEls[k].classList.toggle('ok', s === true); if (s === true) sat++; });
    const np = placed.filter((x) => x >= 0).length;
    ctx.progress(0.5 * np / N + 0.5 * sat / clues.length);
    if (np === N && LD.allHold(P, clues, placed)) ctx.solve();
  }
  function tapTray(a) { if (!ctx.active()) return; if (placed[a] >= 0) { placed[a] = -1; sel = a; } else sel = sel === a ? null : a; draw(); }
  function tapCell(i) {
    if (!ctx.active()) return;
    const occ = occupant(i);
    if (sel === null) { if (occ >= 0) sel = occ; draw(); return; }
    if (occ === sel) { placed[sel] = -1; sel = null; draw(); return; }
    const from = placed[sel]; placed[sel] = i; if (occ >= 0) placed[occ] = from;
    sel = null; draw();
  }
  function placeAt(a, destCell) {
    if (destCell == null) { placed[a] = -1; sel = null; draw(); return; }
    const occ = occupant(destCell); if (occ === a) { sel = null; draw(); return; }
    const from = placed[a]; placed[a] = destCell; if (occ >= 0) placed[occ] = from;
    sel = null; draw();
  }
  function dropTargetAt(x, y) {
    const el = document.elementFromPoint(x, y); if (!el) return undefined;
    const cell = el.closest && el.closest('.cell'); if (cell) return +cell.getAttribute('data-i');
    if (el.closest && el.closest('.tray')) return null;
    return undefined;
  }
  let ghost = null;
  function placeGhost(x, y) { if (ghost) ghost.style.cssText = `left:${x}px;top:${y}px`; }
  function startDrag(ev, a, plainTap) {
    if (!ctx.active()) return; const d = { moved: false }; const el = ev.currentTarget; try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    ghost = h('div', { class: 'jg-ghost' }, info(a).em); document.body.append(ghost); placeGhost(ev.clientX, ev.clientY);
    el.classList.add('dragsrc');
    const move_ = (e) => { d.moved = true; placeGhost(e.clientX, e.clientY); const t = dropTargetAt(e.clientX, e.clientY); cellEls.forEach((c) => c.classList.remove('droptgt')); if (typeof t === 'number') cellEls[t].classList.add('droptgt'); };
    const up = (e) => {
      el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel);
      el.classList.remove('dragsrc'); cellEls.forEach((c) => c.classList.remove('droptgt')); if (ghost) { ghost.remove(); ghost = null; }
      if (d.moved) { const t = dropTargetAt(e.clientX, e.clientY); if (t !== undefined) placeAt(a, t); else draw(); }
      else plainTap();
      pointerHandled = true; setTimeout(() => { pointerHandled = false; }, 0);
    };
    const cancel = () => { el.removeEventListener('pointermove', move_); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel); el.classList.remove('dragsrc'); cellEls.forEach((c) => c.classList.remove('droptgt')); if (ghost) { ghost.remove(); ghost = null; } };
    el.addEventListener('pointermove', move_); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel);
  }
  draw();
  return { destroy() {}, reveal: () => { sol.forEach((c, a) => { placed[a] = c; }); sel = null; draw(); }, cheat: () => { sol.forEach((c, a) => { placed[a] = c; }); sel = null; draw(); }, celebrate: () => jgridEl.classList.add('won'), puzzle: { P, clues, sol },
    snapshot: () => placed.slice(), applySnapshot: (s) => { if (Array.isArray(s)) { for (let i = 0; i < placed.length; i++) placed[i] = s[i] != null ? s[i] : -1; sel = null; draw(); } } };
}

/* ---------- textures & shared svg defs ---------- */
function installTextures() {
  const url = (svg) => 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' + svg + '</svg>') + '")';
  const T = {
    grass: url("<rect width='100' height='100' fill='#CDE96A'/><g stroke='#9FCB33' stroke-width='2.4' stroke-linecap='round' fill='none'><path d='M10 40q2-12 6-16M18 70q2-12 6-16M40 30q3-12 8-16M56 80q2-12 6-16M78 52q3-12 8-16M30 92q2-10 6-14M70 20q2-10 6-14M88 86q2-10 6-14'/></g><g stroke='#EAF7A6' stroke-width='1.8' stroke-linecap='round' fill='none'><path d='M24 54q1-8 4-11M62 46q1-8 4-11M84 70q1-8 4-11M46 64q1-8 4-11'/></g>"),
    jungle: url("<rect width='100' height='100' fill='#2F8F3E'/><g fill='#4DB04F'><ellipse cx='25' cy='28' rx='20' ry='9' transform='rotate(-30 25 28)'/><ellipse cx='72' cy='70' rx='22' ry='9' transform='rotate(25 72 70)'/><ellipse cx='70' cy='22' rx='16' ry='7' transform='rotate(35 70 22)'/></g><g fill='#1F6E31'><ellipse cx='30' cy='75' rx='18' ry='8' transform='rotate(20 30 75)'/><ellipse cx='55' cy='48' rx='14' ry='6' transform='rotate(-40 55 48)'/></g><g stroke='#8FD97C' stroke-width='1.2' opacity='.7'><path d='M8 36L42 20M52 78L92 62M52 52L60 44'/></g>"),
    rock: url("<rect width='100' height='100' fill='#9A9AA6'/><g fill='#BDBDC9'><ellipse cx='30' cy='30' rx='22' ry='16'/><ellipse cx='70' cy='68' rx='24' ry='18'/></g><g fill='#80808C'><ellipse cx='72' cy='28' rx='14' ry='10'/><ellipse cx='28' cy='74' rx='16' ry='11'/></g><g stroke='#666672' stroke-width='1.8' fill='none' stroke-linecap='round'><path d='M20 24l8 10 6-4M64 62l10 8M70 22l6 6'/></g><g fill='#7FB36B' opacity='.8'><circle cx='14' cy='60' r='3'/><circle cx='20' cy='64' r='2'/></g>"),
    mud: url("<rect width='100' height='100' fill='#AA7A4B'/><ellipse cx='50' cy='52' rx='38' ry='27' fill='#8A5A2F'/><ellipse cx='42' cy='46' rx='21' ry='12' fill='#774A25'/><ellipse cx='36' cy='42' rx='9' ry='4' fill='#C9985F' opacity='.8'/><g fill='#C6955F'><circle cx='14' cy='20' r='3'/><circle cx='86' cy='80' r='3.5'/><circle cx='80' cy='18' r='2.5'/></g>"),
    stars: url("<g fill='#fff'><circle cx='12' cy='14' r='1.1' opacity='.8'/><circle cx='70' cy='8' r='1.4' opacity='.9'/><circle cx='42' cy='36' r='.9' opacity='.6'/><circle cx='90' cy='44' r='1.2' opacity='.8'/><circle cx='24' cy='66' r='1' opacity='.7'/><circle cx='60' cy='80' r='1.3' opacity='.85'/><circle cx='8' cy='92' r='.8' opacity='.6'/><circle cx='84' cy='94' r='1' opacity='.7'/></g>"),
  };
  const root = document.documentElement.style; Object.keys(T).forEach((k) => root.setProperty('--tx-' + k, T[k]));
  if (!document.getElementById('shared-defs')) document.body.insertAdjacentHTML('afterbegin', '<svg id="shared-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="lgBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC857"/><stop offset=".55" stop-color="#F28C28"/><stop offset="1" stop-color="#D96A12"/></linearGradient></defs></svg>');
}
