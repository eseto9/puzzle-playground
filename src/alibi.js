'use strict';
/* ---------- Alibi: who was at the party, and when ---------- */
const ALC = [
  { n: 'Wizard', em: '\u{1F9D9}', c: '#7A4FD0' }, { n: 'Vampire', em: '\u{1F9DB}', c: '#C0304A' }, { n: 'Ghost', em: '\u{1F47B}', c: '#3F86D0' },
  { n: 'Robot', em: '\u{1F916}', c: '#2E9C70' }, { n: 'Pumpkin', em: '\u{1F383}', c: '#D9801A' },
];
const hourLabel = (t) => String(((6 + t - 1) % 12) + 1);
const hourPm = (t) => hourLabel(t) + (6 + t >= 12 && 6 + t < 24 && ((6 + t) % 24) >= 12 ? 'am' : 'pm');

function alClueSVG(P, c) {
  const col = (a) => ALC[a].c; const W = 64;
  const bar = (x, w, y, a, op) => `<rect x="${x}" y="${y}" width="${w}" height="9" rx="4.5" fill="${col(a)}" opacity="${op || 1}"/>`;
  const dash = (x, y1, y2) => `<path d="M${x} ${y1}V${y2}" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".7"/>`;
  const X = (x, y) => `<path d="M${x - 4} ${y - 4}l8 8M${x + 4} ${y - 4}l-8 8" stroke="#D6303A" stroke-width="2.6" stroke-linecap="round"/>`;
  let s = `<svg viewBox="0 0 ${W} 38" aria-hidden="true">`;
  switch (c.k) {
    case 'overlap': s += `<rect x="24" y="1" width="16" height="36" rx="3" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-width="1.4"/>` + bar(4, 36, 5, c.a) + bar(24, 36, 24, c.b); break;
    case 'apart': s += bar(4, 24, 5, c.a) + bar(36, 24, 24, c.b) + X(32, 19); break;
    case 'before': s += dash(4, 2, 36) + dash(22, 2, 36) + bar(4, 34, 5, c.a) + bar(22, 38, 24, c.b) + `<path d="M5 1.5h15" stroke="#1F7A7A" stroke-width="1.8"/><path d="M21 1.5l-4-3v6z" fill="#1F7A7A"/>`; break;
    case 'left': s += dash(26, 2, 36) + dash(38, 2, 36) + bar(4, 22, 5, c.a) + bar(38, 22, 24, c.b) + `<path d="M26.5 19h11" stroke="#1F7A7A" stroke-width="1.8"/><path d="M38 19l-4-3v6z" fill="#1F7A7A"/>`; break;
    case 'inside': s += bar(4, 56, 24, c.b, 0.9) + dash(18, 5, 33) + dash(46, 5, 33) + bar(18, 28, 5, c.a); break;
    case 'same': s += dash(8, 1, 37) + bar(8, 30, 5, c.a) + bar(8, 46, 24, c.b); break;
    case 'at': case 'notat': {
      const x = 8 + (c.t / Math.max(1, P.T - 1)) * 46;
      s = `<svg viewBox="0 0 ${W} 38" aria-hidden="true"><rect x="3" y="14" width="58" height="10" rx="5" fill="${col(c.a)}" opacity=".28"/><path d="M${x} 6V32" stroke="#1B1730" stroke-width="1.6"/><circle cx="${x}" cy="6" r="3" fill="#1B1730"/>` + (c.k === 'notat' ? X(x, 19) : `<circle cx="${x}" cy="19" r="5" fill="none" stroke="${col(c.a)}" stroke-width="2.4"/>`);
      break;
    }
    default: break;
  }
  return s + '</svg>';
}
const AL_CAP = { overlap: 'Met', apart: 'Never met', before: 'Arrived first', left: 'Left before arrival', inside: 'Stayed within', same: 'Arrived together' };
function alText(P, c) {
  const n = (a) => ALC[a].n;
  switch (c.k) {
    case 'overlap': return n(c.a) + ' and ' + n(c.b) + ' were at the party at the same time';
    case 'apart': return n(c.a) + ' and ' + n(c.b) + ' were never there at the same time';
    case 'before': return n(c.a) + ' arrived before ' + n(c.b);
    case 'left': return n(c.a) + ' left before ' + n(c.b) + ' arrived';
    case 'inside': return n(c.a) + ' stayed entirely within the time ' + n(c.b) + ' was there';
    case 'same': return n(c.a) + ' and ' + n(c.b) + ' arrived together';
    case 'at': return n(c.a) + ' was there at ' + hourLabel(c.t) + ' o\u2019clock';
    default: return n(c.a) + ' was not there at ' + hourLabel(c.t) + ' o\u2019clock';
  }
}

function mountAlibi(root, ctx) {
  const P = ctx.puzzle(); const { nS, T, dur, clues } = P; const st = Array(nS).fill(-1);
  const tk = (a, cls) => h('span', { class: 'tok ' + (cls || ''), style: '--c:' + ALC[a].c, 'aria-hidden': 'true' }, ALC[a].em);
  /* timeline board */
  const board = h('div', { class: 'al', style: '--T:' + T });
  board.append(h('div', { class: 'al-head' }, h('span', { class: 'al-pm' }, 'pm'), h('div', { class: 'al-hours' }, ...LD.range(T).map((t) => h('span', null, hourLabel(t))))));
  const bars = [], tracks = [];
  for (let a = 0; a < nS; a++) {
    const bar = h('div', { class: 'al-bar', style: '--c:' + ALC[a].c + ';--d:' + dur[a] }, h('span', null, dur[a] + 'h'));
    const track = h('div', { class: 'al-track' }, ...LD.range(T).map((t) => h('button', { class: 'al-cell', 'aria-label': ALC[a].n + ' arrives at ' + hourLabel(t), onclick: () => place(a, t) })), bar);
    board.append(h('div', { class: 'al-row' }, h('div', { class: 'al-who' }, tk(a), h('small', null, dur[a] + 'h')), track)); bars.push(bar); tracks.push(track);
  }
  const clueEls = clues.map((c) => {
    const two = c.b != null; const txt = alText(P, c);
    const cap = c.k === 'at' ? 'There at ' + hourLabel(c.t) : c.k === 'notat' ? 'Not there at ' + hourLabel(c.t) : AL_CAP[c.k];
    return h('div', { class: 'clue cp al-c', role: 'img', 'aria-label': txt, title: txt },
      h('div', { class: 'cin' }, h('div', { class: 'st' }, tk(c.a), two ? tk(c.b) : null), h('span', { class: 'alsv', html: alClueSVG(P, c) })), h('span', { class: 'cap' }, cap));
  });
  root.append(board, h('div', { class: 'clues c3' }, clueEls));
  function draw() {
    st.forEach((s, a) => { const b = bars[a]; b.classList.toggle('on', s >= 0); if (s >= 0) b.style.setProperty('--s', s); });
    let sat = 0; clues.forEach((c, k) => { const v = LD2.alState(P, c, st); clueEls[k].classList.toggle('bad', v === false); if (v === true) sat++; });
    const np = st.filter((x) => x >= 0).length; ctx.progress(0.5 * np / nS + 0.5 * sat / clues.length);
    if (np === nS && LD2.alCheck(P, st)) ctx.solve();
  }
  function place(a, t) {
    if (!ctx.active()) return; const s = Math.min(t, T - dur[a]);
    st[a] = st[a] === s ? -1 : s; draw();
  }
  draw();
  return { destroy() {}, reveal: () => { P.sol.forEach((s, a) => { st[a] = s; }); draw(); }, cheat: () => { P.sol.forEach((s, a) => { st[a] = s; }); draw(); }, celebrate: () => board.classList.add('won'), puzzle: P };
}
