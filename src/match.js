'use strict';
/* ---------- Friend race: five puzzles, fastest total time wins; rated with Elo.
   If you finish first, you watch a live read-only mirror of your friend's
   board until they finish too (or quit). ---------- */
const validPicks = (a, n) => Array.isArray(a) && a.length === n && n >= 1 && n <= 5 && a.every((g) => typeof g === 'string' && GAMES[g]);
const GIVEUP_PENALTY = 60;
function raceHud(games, oppName) {
  const nP = games.length;
  const mk = (cls, label) => {
    const bar = h('i'); const st = h('span', { class: 'rst' }, ''); const tm = h('div', { class: 'rtimes' });
    return { bar, st, tm, el: h('div', { class: 'rrow ' + cls }, h('div', { class: 'rtop' }, h('b', null, label), st), h('div', { class: 'lane ' + cls }, bar), tm) };
  };
  const me = mk('you', 'You'), op = mk('rival', oppName);
  function upd(r, i, p, times, done, gave) {
    gave = gave || [];
    r.bar.style.width = Math.round(100 * Math.min(1, (i + p) / nP)) + '%';
    r.st.textContent = done ? 'Finished all ' + nP : 'Puzzle ' + (i + 1) + ' of ' + nP + ' \u00B7 ' + GAMES[games[i]].name;
    r.tm.replaceChildren(...games.map((g, k) => (times[k] != null ? h('span', { class: 'tm ' + (gave[k] ? 'gu' : 'ok') }, GAMES[g].em + ' ' + (gave[k] ? 'gave up' : fmt(times[k]))) : h('span', { class: 'tm' + (k === i && !done ? ' now' : '') }, GAMES[g].em + (k === i && !done ? ' solving' : ' \u2013')))));
  }
  return { el: h('div', { class: 'race-hud' }, me.el, op.el), setMe: (i, p, t, d, g) => upd(me, i, p, t || [], d, g), setOpp: (i, p, t, d, g) => upd(op, i, p, t || [], d, g) };
}
function runRace(cfg) {
  const room = cfg.room; const oppName = cfg.oppName || 'Friend'; const games = cfg.set.slice(); const nP = games.length; const pseed = (i) => cfg.seed + '-' + i;
  const S = { times: [], gave: [], oppTimes: [], oppGave: [], myDone: null, oppDone: null, over: false, t0: 0, lastEmit: 0, celebUntil: 0, penalty: 0, e0: App.rec.elo.r, oppE: null, oppI: 0, oppSnap: null, spectating: false };
  let ctl = null, leftTimer = null, graceT = null; const unsubs = []; let spec = null, specStage = null, specSub = null;
  const hud = raceHud(games, oppName); App.screen = 'match';
  const emit = (d) => { room.emit('h2h', Object.assign({ m: cfg.seed, e: S.e0 }, d)).catch(() => {}); };
  hud.setMe(0, 0, []); hud.setOpp(0, 0, []);
  unsubs.push(room.on('h2h', (msg) => {
    if (msg.sameTab) return; const d = msg.data || {}; if (d.m !== cfg.seed || S.over) return;
    if (typeof d.e === 'number' && S.oppE == null) S.oppE = d.e;
    if (d.t === 'prog') {
      S.oppTimes = Array.isArray(d.times) ? d.times.slice(0, nP) : []; S.oppGave = Array.isArray(d.gave) ? d.gave.slice(0, nP) : [];
      const newI = Math.max(0, Math.min(nP - 1, d.i | 0)); if (newI !== S.oppI) S.oppSnap = null; S.oppI = newI;
      if (d.snap !== undefined) S.oppSnap = d.snap;
      hud.setOpp(S.oppI, +d.p || 0, S.oppTimes, false, S.oppGave);
      if (S.spectating) renderSpectate();
    }
    else if (d.t === 'done') onOppDone(d.tm, d.times, d.gave);
    else if (d.t === 'quit') end(true, 'Your friend left the race.');
  }));
  unsubs.push(room.onPeers(() => {
    if (room.peers().some((p) => !p.sameTab)) { clearTimeout(leftTimer); leftTimer = null; }
    else if (!leftTimer && !S.over) leftTimer = setTimeout(() => {
      if (S.over || room.peers().some((p) => !p.sameTab)) return;
      // only the side that actually finished can claim a win on disconnect; otherwise
      // it's a void race, so the two sides can never both end up declared the winner
      if (S.myDone) end(true, 'Your friend disconnected.');
      else end(null, 'Connection to your friend was lost before the race finished.', true);
    }, 8000);
  }));
  function startPuzzle(i) {
    const gid = games[i];
    ctl = playScreen({ gameId: gid, seed: pseed(i), countdown: i === 0, fast: true, hud: hud.el, giveUpNote: 'You will get +60 seconds.', title: 'Puzzle ' + (i + 1) + ' of ' + nP, sub: GAMES[gid].name,
      onGo: () => { if (i === 0) S.t0 = performance.now(); },
      onProgress: (p, snap) => { if (p >= 1) return; hud.setMe(i, p, S.times, false, S.gave); const now = performance.now(); if (now - S.lastEmit > 500) { S.lastEmit = now; emit({ t: 'prog', i, p, times: S.times, gave: S.gave, snap }); } },
      onSolveNow: (res) => { finish(i, res.time, res.at, false); if (i < nP - 1) setTimeout(() => { try { puzzleFor(games[i + 1], pseed(i + 1)); } catch (e) { /* on demand */ } }, 300); },
      onSolved: () => { if (i < nP - 1 && !S.over) { toast('Solved in ' + fmt(S.times[i]) + ' \u2014 next: ' + GAMES[games[i + 1]].name); startPuzzle(i + 1); } },
      onGiveUp: (res) => { finish(i, res.time, performance.now(), true); if (i < nP - 1 && !S.over) { toast('Answer shown (+60s) \u2014 next: ' + GAMES[games[i + 1]].name); startPuzzle(i + 1); } },
      onQuit: () => confirmQuit(() => { emit({ t: 'quit' }); end(false, 'You left the race.', true); }) });
  }
  function finish(i, time, at, gaveUp) {
    if (gaveUp) S.penalty += GIVEUP_PENALTY; S.times[i] = gaveUp ? time + GIVEUP_PENALTY : time; S.gave[i] = gaveUp; S.celebUntil = gaveUp ? 0 : performance.now() + 1000;
    if (i < nP - 1) { hud.setMe(i + 1, 0, S.times, false, S.gave); emit({ t: 'prog', i: i + 1, p: 0, times: S.times, gave: S.gave }); }
    else {
      const total = Math.round(at - S.t0) / 1000 + S.penalty; S.myDone = { tm: total };
      hud.setMe(nP - 1, 1, S.times, true, S.gave); ctl.freeze(); emit({ t: 'done', tm: total, times: S.times, gave: S.gave });
      graceT = setTimeout(() => { if (S.over) return; if (S.oppDone) end(cmp() === 'me'); else startSpectate(); }, 1300);
    }
  }
  const cmp = () => { const a = S.myDone.tm, b = S.oppDone.tm; return a < b ? 'me' : a > b ? 'opp' : (cfg.host ? 'me' : 'opp'); };
  function onOppDone(tm, times, gave) {
    if (S.over) return; S.oppDone = { tm: +tm || 0 }; if (Array.isArray(times)) S.oppTimes = times.slice(0, nP); if (Array.isArray(gave)) S.oppGave = gave.slice(0, nP); hud.setOpp(nP - 1, 1, S.oppTimes, true, S.oppGave);
    if (S.myDone) end(cmp() === 'me');
  }
  function teardownSpectate() { if (spec && spec.ctl) { try { spec.ctl.destroy(); } catch (e) { /* noop */ } } spec = null; }
  function renderSpectate() {
    if (!S.spectating || S.over || !specStage) return;
    const gid = games[S.oppI]; const seed = pseed(S.oppI);
    if (!spec || spec.gid !== gid || spec.seed !== seed) {
      teardownSpectate(); const root = h('div', { class: 'stage th-' + gid }); specStage.replaceChildren(root);
      const sctx = { r: LD.makeRng('spec|' + seed), level: levelFor(gid, seed), puzzle: () => puzzleFor(gid, seed), active: () => false, progress() {}, penalty() {}, solve() {} };
      spec = { gid, seed, ctl: GAMES[gid].mount(root, sctx) }; if (specSub) specSub.textContent = 'Puzzle ' + (S.oppI + 1) + ' of ' + nP + ' \u00b7 ' + GAMES[gid].name;
    }
    if (spec.ctl.applySnapshot && S.oppSnap) spec.ctl.applySnapshot(S.oppSnap);
  }
  function startSpectate() {
    if (S.over || S.oppDone || S.spectating) return; S.spectating = true; App.screen = 'match';
    specSub = h('span', { class: 'sub' }, '');
    const top = h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', 'aria-label': 'Leave race', onclick: () => confirmQuit(() => { emit({ t: 'quit' }); end(false, 'You left the race.', true); }) }, '\u2190'), h('div', { class: 'ttl' }, 'Watching ' + oppName, specSub));
    specStage = h('div', { class: 'stagewrap' });
    view(h('div', { class: 'wrap' }, top, hud.el, h('p', { class: 'how' }, 'You finished! ' + oppName + ' is still racing \u2014 this updates live as they play.'), specStage));
    renderSpectate();
  }
  function end(won, why, left) {
    if (S.over) return; const wait = left ? 0 : S.celebUntil - performance.now(); if (wait > 50) { if (!S.pending) { S.pending = true; setTimeout(() => { S.pending = false; end(won, why, left); }, wait); } return; }
    S.over = true; clearTimeout(leftTimer); clearTimeout(graceT); unsubs.forEach((u) => { try { u(); } catch (e) { /* noop */ } }); teardownSpectate();
    try { room.leave(); } catch (e) { /* noop */ }
    if (won == null) {
      view(h('div', { class: 'wrap' }, h('div', { class: 'card result' },
        h('h1', null, 'No result'), why ? h('p', { class: 'muted' }, why) : null,
        h('div', { class: 'stack' }, h('button', { class: 'btn rival block', onclick: () => lobby() }, 'New room'), homeBtn()))));
      return;
    }
    const rating = eloApply(S.oppE == null ? 1200 : S.oppE, won ? 1 : 0); const delta = rating.now - rating.old;
    const t = (v, g) => (v != null ? (g ? 'gave up' : fmt(v)) : '\u2014');
    const rows = games.map((g, k) => h('tr', null, h('td', null, GAMES[g].em + ' ' + GAMES[g].name), h('td', { class: !S.gave[k] && S.times[k] != null && S.oppTimes[k] != null && S.times[k] < S.oppTimes[k] ? 'best' : '' }, t(S.times[k], S.gave[k])), h('td', { class: !S.oppGave[k] && S.times[k] != null && S.oppTimes[k] != null && S.oppTimes[k] < S.times[k] ? 'best' : '' }, t(S.oppTimes[k], S.oppGave[k]))));
    rows.push(h('tr', { class: 'tot' }, h('td', null, 'Total'), h('td', null, S.myDone ? fmt(S.myDone.tm) : 'Not finished'), h('td', null, S.oppDone ? fmt(S.oppDone.tm) : 'Not finished')));
    view(h('div', { class: 'wrap' }, h('div', { class: 'card result' },
      h('h1', { class: won ? 'win' : 'lose' }, left ? 'You left' : won ? 'You win' : oppName + ' wins'), why ? h('p', { class: 'muted' }, why) : null,
      h('div', { class: 'elo-chip' }, h('b', null, rating.now), h('span', { class: delta >= 0 ? 'win' : 'lose' }, (delta >= 0 ? '+' : '') + delta + ' Elo')),
      h('table', { class: 'rtab' }, h('thead', null, h('tr', null, h('th', null, 'Puzzle'), h('th', null, 'You'), h('th', null, oppName))), h('tbody', null, rows)),
      h('div', { class: 'stack' }, h('button', { class: 'btn rival block', onclick: () => lobby() }, 'New room'), homeBtn()))));
  }
  startPuzzle(0);
  window.__LD_RACE = S;
}

/* ---------- live room lobby ---------- */
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const makeCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
function lobby() {
  App.screen = 'lobby'; const ok = !!App.room; let n = 5;
  const input = h('input', { class: 'field', maxlength: 4, placeholder: 'Enter code', 'aria-label': 'Room code', autocomplete: 'off', autocapitalize: 'characters' });
  const nBtns = LD.range(5).map((i) => h('button', { class: 'btn sm ' + (i === 4 ? 'you' : 'ghost'), 'aria-label': (i + 1) + ' puzzle' + (i ? 's' : ''), onclick: () => { n = i + 1; nBtns.forEach((b, k) => { b.className = 'btn sm ' + (k === i ? 'you' : 'ghost'); }); } }, String(i + 1)));
  view(h('div', { class: 'wrap' },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => home() }, '\u2190'), h('div', { class: 'ttl' }, 'Race a friend')),
    h('p', { class: 'how' }, ok ? 'You each pick puzzles in order. Then a quick draw goes down the list and flips a coin for every row to decide whose pick you both play. You race through them at your own pace, you can see which puzzle your friend is on and how fast they solved each, and the fastest total time wins and moves Elo.' : 'Live rooms need this page opened signed in on claude.ai. You can still play the daily puzzle and practice.'),
    h('div', { class: 'card' }, h('h2', null, 'Host'), h('p', { class: 'muted small' }, 'Get a code to share.'),
      h('div', { class: 'muted small', style: 'margin:10px 0 6px' }, 'Number of puzzles'), h('div', { class: 'stack', style: 'display:flex;gap:6px;margin-bottom:12px' }, nBtns),
      h('button', { class: 'btn rival block', disabled: !ok, onclick: () => hostRoom(n) }, 'Create room')),
    h('div', { class: 'card', style: 'margin-top:12px' }, h('h2', null, 'Join'), h('p', { class: 'muted small' }, 'Got a code from a friend?'), input,
      h('button', { class: 'btn you block', style: 'margin-top:10px', disabled: !ok, onclick: () => { const c = input.value.trim().toUpperCase(); if (c.length !== 4) { toast('Codes have 4 letters.'); return; } joinRoom(c); } }, 'Join room'))));
}
async function enter(code) { try { return await App.room.join('h2h-' + code.toLowerCase()); } catch (e) { toast(e && e.code === 'not_permitted' ? 'Your account cannot use live rooms.' : 'Could not open the room. Try again.'); return null; } }
async function oppLabel(room) { const o = room.peers().find((p) => !p.sameTab); if (!o || !o.by) return 'Friend'; const n = await names([o.by]); return n[o.by] || 'Friend'; }
/* ---------- pick N each, then the draw ---------- */
async function hostRoom(n) { const code = makeCode(); const room = await enter(code); if (room) pickLobby(room, true, code, n); }
async function joinRoom(code) { const room = await enter(code); if (room) pickLobby(room, false, code, null); }
function pickLobby(room, host, code, n) {
  App.screen = 'lobby';
  let mine = n ? LD.shuffle(Math.random, GAME_IDS).slice(0, n) : null; let ready = false, theirs = null, theirReady = false, started = false, present = false; const offs = [];
  const clear = () => offs.forEach((f) => { try { f(); } catch (e) { /* noop */ } });
  const emitPicks = () => { if (mine) room.emit('h2h', { t: 'picks', set: mine.slice(), ready }).catch(() => {}); };
  const status = h('div', { class: 'who' }, h('i', { class: 'dot' }), h('span', null, host ? 'Waiting for a friend\u2026' : 'Looking for the host\u2026'));
  const list = h('div', { class: 'slots' }); const friendLine = h('div', { class: 'muted small', style: 'text-align:center;margin-top:10px;min-height:20px' }, '');
  const readyBtn = h('button', { class: 'btn you block', style: 'margin-top:12px', onclick: () => { ready = !ready; draw(); emitPicks(); maybeStart(); } }, 'Lock in my list');
  const shuf = h('button', { class: 'btn ghost sm', onclick: () => { mine = LD.shuffle(Math.random, GAME_IDS).slice(0, n); draw(); emitPicks(); } }, 'Shuffle my list');
  function draw() {
    if (!mine) { list.replaceChildren(h('p', { class: 'muted small' }, 'Waiting for the host to set the number of puzzles\u2026')); readyBtn.disabled = true; shuf.disabled = true; }
    else {
      list.replaceChildren(...mine.map((g, i) => h('div', { class: 'slot-row' }, h('span', { class: 'sl-n' }, i + 1),
        h('select', { disabled: ready, 'aria-label': 'Puzzle ' + (i + 1), onchange: (e) => { mine[i] = e.target.value; emitPicks(); } }, GAME_IDS.map((id) => h('option', { value: id, selected: id === g }, GAMES[id].em + '  ' + GAMES[id].name))), h('span', { class: 'icon-btn sm ph' }))));
      readyBtn.textContent = ready ? 'Locked in \u2713 (tap to edit)' : 'Lock in my list'; readyBtn.className = 'btn block ' + (ready ? 'ghost' : 'you'); readyBtn.disabled = !present; shuf.disabled = ready;
    }
    friendLine.textContent = !present ? '' : theirReady ? 'Your friend locked in their list \u2713' : 'Your friend is still choosing\u2026';
    status.firstChild.className = 'dot' + (present ? ' on' : ''); status.lastChild.textContent = present ? (host ? 'Friend joined.' : 'Connected to the host.') : (host ? 'Waiting for a friend\u2026' : 'Looking for the host\u2026');
  }
  function maybeStart() {
    if (!host || started || !ready || !theirReady || !theirs || !present) return;
    const seed = String(Date.now()) + Math.random().toString(36).slice(2, 6); room.emit('h2h', { t: 'start', m: seed, hs: mine.slice(), gs: theirs.slice() }).catch(() => {}); begin(seed, mine.slice(), theirs.slice());
  }
  async function begin(seed, hs, gs) { if (started) return; started = true; clear(); const name = await oppLabel(room); runReveal({ room, host, seed, hs, gs, oppName: name }); }
  offs.push(room.onPeers(() => {
    present = room.peers().some((p) => !p.sameTab);
    if (!host && present && !mine) { const h2 = room.peers().find((p) => !p.sameTab); const theirN = h2 && h2.presence && h2.presence.n; if (theirN >= 1 && theirN <= 5) { n = theirN; mine = LD.shuffle(Math.random, GAME_IDS).slice(0, n); } }
    draw(); if (present) emitPicks();
  }));
  offs.push(room.on('h2h', (msg) => {
    if (msg.sameTab || started) return; const d = msg.data || {};
    if (d.t === 'picks' && n && validPicks(d.set, n)) { theirs = d.set.slice(); theirReady = !!d.ready; draw(); maybeStart(); }
    else if (d.t === 'start' && !host && d.m && Array.isArray(d.hs) && validPicks(d.hs, d.hs.length) && validPicks(d.gs, d.hs.length)) begin(d.m, d.hs.slice(), d.gs.slice());
  }));
  room.presence(host ? { host, n } : { host }).catch(() => {}); draw();
  view(h('div', { class: 'wrap' }, h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', 'aria-label': 'Leave room', onclick: () => { clear(); try { room.leave(); } catch (e) { /* noop */ } lobby(); } }, '\u2190'), h('div', { class: 'ttl' }, host ? 'Your room' : 'Room ' + code)),
    host ? h('div', { class: 'card', style: 'text-align:center' }, h('div', { class: 'muted' }, 'Tell your friend this code'), h('div', { class: 'code', 'aria-label': 'Room code ' + code.split('').join(' ') }, code), status) : h('div', { class: 'card', style: 'text-align:center' }, status),
    h('div', { class: 'card', style: 'margin-top:12px' }, h('h2', null, 'Pick your puzzles'), h('p', { class: 'muted small', style: 'margin:2px 0 10px' }, 'In the order you want them. Repeats are fine. Your friend picks the same number, then a draw decides each row.'), list, h('div', { class: 'slot-ctl' }, shuf), readyBtn, friendLine)));
}
/* both lists side by side, then a coin flip down each row decides what we play */
function runReveal(cfg) {
  const { room, host, seed, hs, gs, oppName } = cfg; const mine = host ? hs : gs, theirs = host ? gs : hs; const rr = LD.makeRng('rv|' + seed); const timers = []; let gone = false; const n = hs.length;
  const T = (fn, ms) => { timers.push(setTimeout(() => { if (!gone) fn(); }, ms)); };
  const outcome = LD.range(n).map((i) => (LD.makeRng('flip|' + seed + '|' + i)() < 0.5 ? 'host' : 'guest'));
  const final = outcome.map((o, i) => (o === 'host' ? hs[i] : gs[i])); const mineWins = outcome.map((o) => (o === 'host') === host);
  const card = (g, side) => h('div', { class: 'rv-card ' + side }, h('span', { class: 'em' }, GAMES[g].em), GAMES[g].name);
  const rows = LD.range(n).map((i) => h('div', { class: 'rv-row pre' }, card(mine[i], 'L'), h('span', { class: 'rv-n' }, i + 1), card(theirs[i], 'R')));
  const chips = LD.range(n).map((i) => h('div', { class: 'rv-chip' }, i + 1)); const go = h('div', { class: 'rv-go' }, '');
  const reduce = reduceMotion();
  view(h('div', { class: 'wrap' }, h('div', { class: 'topbar' }, h('div', { class: 'ttl' }, 'The draw', h('span', { class: 'sub' }, 'A coin flip on every row picks whose puzzle we both play'))),
    h('div', { class: 'rv-cols' }, h('b', null, 'You'), h('span'), h('b', null, oppName)), ...rows, h('div', { class: 'rv-final' }, h('small', null, 'Your race lineup'), h('div', { class: 'rv-chips' }, chips)), go));
  current = { destroy() { gone = true; timers.forEach(clearTimeout); } };
  const spark = (el) => { for (let k = 0; k < 12; k++) { const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 60; const p = h('i', { class: 'rv-spark' }); p.style.cssText = `--c:${CONF[k % CONF.length]};--dx:${(Math.cos(a) * sp).toFixed(0)}px;--dy:${(Math.sin(a) * sp).toFixed(0)}px;--r:0deg;--t:.8s`; el.append(p); setTimeout(() => p.remove(), 900); } };
  rows.forEach((r, i) => T(() => r.classList.remove('pre'), 150 + i * 170));
  const start0 = 150 + n * 170 + 650;
  function resolveRow(i, at) {
    const row = rows[i]; const L = row.querySelector('.L'), R = row.querySelector('.R'); const win = mineWins[i] ? L : R, lose = mineWins[i] ? R : L;
    T(() => row.classList.add('act'), at);
    if (mine[i] === theirs[i]) { T(() => { L.classList.add('win'); R.classList.add('win'); chips[i].textContent = GAMES[final[i]].em; chips[i].classList.add('on'); go.textContent = 'You both picked ' + GAMES[final[i]].name; }, at + 300); T(() => row.classList.remove('act'), at + 1000); return at + 1050; }
    let t = at + 200; let side = rr() < 0.5 ? 0 : 1; const ticks = reduce ? 2 : 9 + Math.floor(rr() * 3); const winSide = mineWins[i] ? 0 : 1;
    let n = ticks; if ((side + n - 1) % 2 !== winSide) n++;
    for (let k = 0; k < n; k++) { const cur = (side + k) % 2; const delay = 70 + k * k * 4.2; T(() => { L.classList.toggle('hot', cur === 0); R.classList.toggle('hot', cur === 1); }, t); t += reduce ? 160 : delay; }
    T(() => { L.classList.remove('hot'); R.classList.remove('hot'); win.classList.add('win'); lose.classList.add('lose'); spark(win); chips[i].textContent = GAMES[final[i]].em; chips[i].classList.add('on'); go.textContent = GAMES[final[i]].name + ' it is'; }, t);
    T(() => row.classList.remove('act'), t + 650); return t + 700;
  }
  let at = start0; for (let i = 0; i < n; i++) at = resolveRow(i, at);
  T(() => { go.textContent = 'Race starts now!'; }, at + 200);
  T(() => { gone = true; runRace({ host, seed, room, oppName, set: final }); }, at + 1300);
}

/* ---------- home ---------- */
function home() {
  App.screen = 'home';
  const recLine = h('div', { class: 'rec' }); const friendBtn = h('button', { class: 'btn rival', onclick: () => ensureName(() => lobby()) }, 'Race a friend');
  const streakEl = h('span', { class: 'streak' });
  const nameInput = h('input', { class: 'field sm', style: 'flex:1;min-width:0;width:auto', placeholder: 'Your name', maxlength: 18, autocomplete: 'off', value: App.rec.name || '' });
  const nameNote = h('div', { class: 'muted small', style: 'margin-top:6px' });
  const nameSave = () => { const v = nameInput.value.trim().slice(0, 18); if (!v) { nameNote.textContent = 'A name is required so others can see who\u2019s on the board.'; return; } App.rec.name = v; saveRec(); nameNote.textContent = 'Saved \u2014 this is what others see on the board.'; };
  const nameField = h('div', { class: 'namefield' }, h('label', { class: 'muted small', for: 'nmIn' }, 'Your name on the leaderboard (required)'), h('div', { style: 'display:flex;gap:8px;margin-top:4px' }, nameInput, h('button', { class: 'btn ghost sm', style: 'flex:none', onclick: nameSave }, 'Save')), nameNote);
  nameInput.id = 'nmIn'; nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameSave(); });
  const dailyGrid = h('div', { class: 'tiles' });
  function drawDaily() {
    const today = App.rec.daily[todayStr()] || {};
    dailyGrid.replaceChildren(...GAME_IDS.map((id) => { const d = today[id];
      return h('button', { class: 'tile', onclick: () => ensureName(() => startDaily(id)) },
        h('span', { class: 'gem', style: '--tc:' + GAMES[id].tc }, GAMES[id].em),
        h('div', null, h('b', null, GAMES[id].name), h('span', { class: 'd' }, d ? 'Solved \u00B7 ' + fmt(d.s) : 'Play today\u2019s')),
        d ? h('span', { class: 'lv', style: 'color:var(--ok)' }, '\u2713') : null); }));
  }
  function refresh() {
    if (App.screen !== 'home') return; const r = App.rec;
    recLine.textContent = App.room ? 'Your Elo ' + r.elo.r + (r.elo.n ? ' \u00B7 ' + r.elo.n + (r.elo.n === 1 ? ' race' : ' races') : '') : 'Live races need this page opened signed in on claude.ai';
    friendBtn.disabled = !App.room;
    const s = streak(); streakEl.textContent = s ? s + ' day streak' : '';
    const shared = App.db && App.uid !== 'local'; nameField.hidden = !shared;
    if (shared && document.activeElement !== nameInput) nameInput.value = r.name || '';
    drawDaily();
  }
  const hero = h('section', { class: 'hero', 'aria-label': 'Race a friend' },
    h('div', { class: 'lanes', 'aria-hidden': 'true' }, h('div', { class: 'lane-row' }, h('span', null, 'You'), h('div', { class: 'lane you', style: '--to:78%' }, h('i'))), h('div', { class: 'lane-row' }, h('span', null, 'Friend'), h('div', { class: 'lane rival', style: '--to:61%' }, h('i')))),
    h('h1', null, 'Race a friend on puzzles you pick'), h('div', { class: 'cta-row' }, friendBtn, h('button', { class: 'btn you', onclick: () => daily.scrollIntoView({ behavior: 'smooth' }) }, 'Today\u2019s puzzles')), recLine);
  const daily = h('section', { class: 'sec' }, h('h2', null, 'Today\u2019s puzzles'), h('p', { class: 'muted small', style: 'margin:-4px 0 10px' }, 'One daily puzzle for each game \u2014 new ones at midnight, your time.'), dailyGrid);
  const leaderboard = h('section', { class: 'sec' }, h('h2', null, 'Leaderboard'), h('div', { class: 'card' }, nameField, boardView()));
  const tiles = h('div', { class: 'tiles' }, ...GAME_IDS.map((id) => h('button', { class: 'tile', onclick: () => startRandom(id) }, h('span', { class: 'gem', style: '--tc:' + GAMES[id].tc }, GAMES[id].em), h('div', null, h('b', null, GAMES[id].name), h('span', { class: 'd' }, GAMES[id].blurb)))),
    h('button', { class: 'tile wide', onclick: () => startSurprise() }, h('div', null, h('b', null, 'Surprise me'), h('span', { class: 'd' }, 'A random puzzle from a random game.'))));
  view(h('div', { class: 'wrap' }, h('div', { class: 'brand' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i')), h('b', null, 'Puzzle Playground'), streakEl), hero, daily, leaderboard, h('section', { class: 'sec' }, h('h2', null, 'Keep playing'), tiles)));
  refresh();
  const f = () => { if (App.screen !== 'home') { App.listeners = App.listeners.filter((x) => x !== f); return; } refresh(); }; App.listeners.push(f);
}
installTextures();
App.rec = mergeRec(defRec(), lsGet()); App.board.set(App.uid, App.rec);
home();
initCaps().then(() => { if (App.screen === 'home') home(); }).catch((e) => console.warn(e));
