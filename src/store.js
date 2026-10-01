'use strict';
const App = { uid: 'local', db: null, user: null, room: null, rec: null, board: new Map(), listeners: [], screen: 'home' };
const LS_KEY = 'logicduel:rec:v6';
const defRec = () => ({ v: 6, daily: {}, elo: { r: 1200, n: 0 } });
function lsGet() { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function lsSet(r) { try { localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch (e) { /* unavailable */ } }
function stable(o) { if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']'; if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}'; return JSON.stringify(o); }
function mergeRec(a, b) {
  const o = defRec();
  [a, b].forEach((x) => {
    if (!x || typeof x !== 'object') return;
    const dd = x.daily || {};
    Object.keys(dd).forEach((d) => { const e = dd[d]; if (!e || typeof e.s !== 'number') return; if (!o.daily[d] || (e.at || 0) < (o.daily[d].at || 0)) o.daily[d] = e; });
    const el = x.elo || {}; if ((el.n | 0) > o.elo.n) o.elo = { r: +el.r || 1200, n: el.n | 0 };
  });
  return o;
}
const pad2 = (n) => String(n).padStart(2, '0');
const dstr = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const todayStr = () => dstr(new Date());
function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); return dstr(new Date(y, m - 1, d + n)); }
function streak() { let d = App.rec.daily[todayStr()] ? todayStr() : addDays(todayStr(), -1); let n = 0; while (App.rec.daily[d]) { n++; d = addDays(d, -1); } return n; }
const notify = () => App.listeners.slice().forEach((f) => { try { f(); } catch (e) { console.warn(e); } });
let saveChain = Promise.resolve();
function saveRec() {
  const cut = addDays(todayStr(), -21); Object.keys(App.rec.daily).forEach((d) => { if (d < cut) delete App.rec.daily[d]; });
  lsSet(App.rec); App.board.set(App.uid, App.rec);
  if (App.db && App.uid !== 'local') {
    const data = JSON.parse(JSON.stringify(App.rec));
    saveChain = saveChain.then(() => App.db.doc('lb/' + App.uid).set(data)).catch((e) => { console.warn('save failed', e && e.code); });
  }
  notify();
}
async function initCaps() {
  App.rec = mergeRec(defRec(), lsGet()); App.board.set(App.uid, App.rec);
  if (!window.claude || !window.claude.use) return;
  try { App.user = await claude.use('user'); } catch (e) { /* none */ }
  try { if (App.user) { const id = await App.user.id(); if (id) App.uid = id; } } catch (e) { /* none */ }
  try { App.db = await claude.use('db'); } catch (e) { /* none */ }
  try { App.room = await claude.use('room'); } catch (e) { /* none */ }
  App.board = new Map([[App.uid, App.rec]]);
  if (App.db && App.uid !== 'local') {
    try {
      App.db.collection('lb').onSnapshot((snap) => {
        const m = new Map(); snap.docs.forEach((d) => { const v = d.data(); if (v) m.set(d.id, v); });
        const mine = m.get(App.uid); const merged = mergeRec(App.rec, mine);
        const changed = stable(merged) !== stable(mine ? mergeRec(null, mine) : {});
        App.rec = merged; m.set(App.uid, App.rec); App.board = m; lsSet(App.rec);
        if (changed) saveRec(); else notify();
      }, (e) => { console.warn('board', e && e.code); });
    } catch (e) { console.warn(e); }
  }
  notify();
}
async function names(ids) {
  const out = {}; ids.forEach((i) => { out[i] = ''; });
  try { if (App.user && App.user.profiles && ids.length) { const ps = await App.user.profiles(ids); ids.forEach((i) => { out[i] = (ps[i] && ps[i].name) || ''; }); } } catch (e) { /* ignore */ }
  return out;
}
function boardView() {
  let tab = 'today';
  const defs = [['today', 'Today'], ['yest', 'Yesterday'], ['elo', 'Elo']];
  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const body = h('div', { class: 'board', 'aria-live': 'polite' }); const note = h('div', { class: 'note' });
  defs.forEach(([k, l]) => tabs.append(h('button', { class: 'tab', role: 'tab', 'aria-selected': String(k === tab), onclick: () => { tab = k; [...tabs.children].forEach((b, i) => b.setAttribute('aria-selected', String(defs[i][0] === tab))); draw(); } }, l)));
  const root = h('div', null, tabs, body, note); let seq = 0;
  async function draw() {
    const my = ++seq; const date = tab === 'yest' ? addDays(todayStr(), -1) : todayStr(); let rows;
    if (tab === 'elo') rows = [...App.board].map(([id, d]) => ({ id, r: (d.elo && d.elo.r) || 1200, n: (d.elo && d.elo.n) || 0 })).filter((x) => x.n > 0).sort((a, b) => b.r - a.r || b.n - a.n);
    else rows = [...App.board].map(([id, d]) => ({ id, e: d.daily && d.daily[date] })).filter((x) => x.e).sort((a, b) => a.e.s - b.e.s);
    const shown = rows.slice(0, 8); const mi = rows.findIndex((x) => x.id === App.uid); if (mi >= 8) shown.push(rows[mi]);
    const nm = await names(shown.map((x) => x.id)); if (my !== seq) return;
    if (!rows.length) body.replaceChildren(h('div', { class: 'empty' }, tab === 'elo' ? 'No ranked races yet. Race a friend to get on the Elo board.' : tab === 'today' ? 'No times yet today. Be the first on the board.' : 'Nobody posted yesterday.'));
    else body.replaceChildren(...shown.map((x) => { const me = x.id === App.uid; const nmTxt = nm[x.id] || (me ? 'You' : 'Player'); return h('div', { class: 'brow' + (me ? ' me' : '') }, h('span', { class: 'rk' }, rows.indexOf(x) + 1), h('span', { class: 'nm' }, nmTxt + (me && nm[x.id] ? ' (you)' : '')), h('div', { class: 'sc' }, tab === 'elo' ? String(x.r) : fmt(x.e.s), tab === 'elo' ? h('small', null, x.n + (x.n === 1 ? ' race' : ' races')) : null)); }));
    note.textContent = App.db && App.uid !== 'local' ? (tab === 'elo' ? 'Elo rating from live races against friends. Everyone starts at 1200.' : 'Fastest solve wins. New puzzle at midnight, your time.') : 'Times are kept on this device. Open this page signed in to claude.ai to share a live board.';
  }
  const refresh = () => { if (!root.isConnected) { App.listeners = App.listeners.filter((f) => f !== refresh); return; } draw(); };
  App.listeners.push(refresh); draw(); return root;
}

/* ---------- Elo ---------- */
function eloApply(oppRating, score) {
  const e = App.rec.elo; const exp = 1 / (1 + Math.pow(10, (oppRating - e.r) / 400)); const nr = Math.round(e.r + 32 * (score - exp));
  const out = { old: e.r, now: nr }; App.rec.elo = { r: nr, n: e.n + 1 }; saveRec(); return out;
}
