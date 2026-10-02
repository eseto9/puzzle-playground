'use strict';
const appEl = () => document.getElementById('app');
let current = null;
function view(...kids) { if (current) { current.destroy(); current = null; } appEl().replaceChildren(...kids); window.scrollTo && window.scrollTo(0, 0); }
function toast(msg) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2400); }
function dialog(msg, ok, cancel) {
  return new Promise((res) => {
    const close = (v) => { m.remove(); res(v); };
    const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'box' }, h('p', null, msg), h('div', { class: 'row' }, cancel ? h('button', { class: 'btn ghost', onclick: () => close(false) }, cancel) : null, h('button', { class: 'btn', onclick: () => close(true) }, ok))));
    document.body.append(m);
  });
}
const confirmQuit = (fn) => dialog('Leave this puzzle? Your time will be lost.', 'Leave', 'Keep playing').then((v) => { if (v) fn(); });
function promptName(current) {
  return new Promise((res) => {
    const inp = h('input', { class: 'field sm', placeholder: 'Your name', maxlength: 18, autocomplete: 'off', value: current || '' });
    const close = (v) => { m.remove(); res(v); };
    const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'box' },
      h('p', null, 'Add your name so others can see it on the board.'), inp,
      h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => close(null) }, 'Skip'), h('button', { class: 'btn', onclick: () => close(inp.value.trim().slice(0, 18)) }, 'Save'))));
    document.body.append(m); setTimeout(() => inp.focus(), 50);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(inp.value.trim().slice(0, 18)); });
  });
}
const reduceMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

/* ---------- completion celebration ---------- */
const CONF = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#2EC4B6', '#3A86FF', '#8338EC', '#FF4D9D'];
function celebrate(sw, timeTxt, onNext) {
  const box = h('div', { class: 'cele' });
  if (!reduceMotion()) {
    for (let k = 0; k < 54; k++) {
      const ang = Math.random() * Math.PI * 2; const sp = 80 + Math.random() * 190; const p = h('i', { class: 'cf', 'aria-hidden': 'true' });
      p.style.cssText = `--c:${CONF[k % CONF.length]};--dx:${(Math.cos(ang) * sp).toFixed(0)}px;--dy:${(Math.sin(ang) * sp + 130).toFixed(0)}px;--r:${(Math.random() * 760 - 380).toFixed(0)}deg;--s:${(0.65 + Math.random() * 0.9).toFixed(2)};--t:${(0.95 + Math.random() * 0.7).toFixed(2)}s;--sh:${Math.random() < 0.5 ? '50%' : '2px'}`;
      box.append(p);
    }
    box.append(h('i', { class: 'ring', 'aria-hidden': 'true' }), h('i', { class: 'ring r2', 'aria-hidden': 'true' }));
  }
  const badgeKids = [h('b', null, 'Solved'), h('span', null, timeTxt)];
  if (onNext) badgeKids.push(h('button', { class: 'btn you sm', style: 'margin-top:10px', onclick: onNext }, 'Continue →'));
  box.append(h('div', { class: 'badge', html: '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="cc" cx="26" cy="26" r="23"/><path class="ck" d="M15 27l8 8 15-17"/></svg>' }, ...badgeKids));
  sw.append(box); return box;
}

/* o: {gameId, seed, title, sub, countdown, hud, fast, giveUpNote, onGo, onProgress, onSolveNow, onSolved, onGiveUp, onQuit} */
function playScreen(o) {
  const G = GAMES[o.gameId]; const seed = o.seed || newSeed(); let t0 = 0, running = false, done = false, game = null, penalty = 0; const timers = [];
  const clock = h('span', { class: 'clock' }, '0:00.0'); const pen = h('span', { class: 'chip pen hide' }, '');
  const stage = h('div', { class: 'stage th-' + o.gameId }); const sw = h('div', { class: 'stagewrap' }, stage);
  const back = h('button', { class: 'icon-btn', 'aria-label': 'Leave puzzle', onclick: () => o.onQuit && o.onQuit() }, '\u2190');
  const top = h('div', { class: 'topbar' }, back, h('div', { class: 'ttl' }, o.title || G.name, h('span', { class: 'sub' }, o.sub || G.name)), pen, clock);
  const giveBtn = h('button', { class: 'btn ghost sm giveup', onclick: () => giveUp() }, 'Give up and see the answer');
  const root = h('div', { class: 'wrap' }, top, o.hud || null, h('p', { class: 'how' }, G.how), sw, h('div', { class: 'foot' }, giveBtn));
  view(root);
  const elapsed = () => (running ? (performance.now() - t0) / 1000 : 0);
  timers.push(setInterval(() => { if (running) clock.textContent = fmt(elapsed()); }, 100));
  const overlay = (inner) => { const ov = h('div', { class: 'overlay' }, inner); sw.append(ov); return ov; };
  const ctx = {
    r: LD.makeRng('run|' + seed), level: levelFor(o.gameId, seed), puzzle: () => puzzleFor(o.gameId, seed), active: () => running && !done,
    progress(p) { if (o.onProgress) o.onProgress(Math.max(0, Math.min(1, p)), game && game.snapshot ? game.snapshot() : null); },
    penalty(sec) { if (done) return; t0 -= sec * 1000; penalty += sec; pen.textContent = '+' + penalty + 's'; pen.classList.remove('hide'); },
    solve() {
      if (done) return; done = true; const t = elapsed(); running = false; timers.forEach(clearInterval);
      clock.textContent = fmt(t); clock.classList.add('gold'); if (o.onProgress) o.onProgress(1);
      const res = { time: Math.round(t * 10) / 10, gameId: o.gameId, at: performance.now() };
      if (o.onSolveNow) o.onSolveNow(res);
      try { game && game.celebrate && game.celebrate(); } catch (e) { /* ignore */ }
      stage.classList.add('pulse');
      let advanced = false; let nextT = null;
      const advance = () => { if (advanced) return; advanced = true; clearTimeout(nextT); if (o.onSolved) o.onSolved(res); };
      celebrate(sw, fmt(t), o.onSolved ? advance : null);
      const delay = reduceMotion() ? 500 : o.fast ? 1000 : 1600;
      nextT = setTimeout(advance, delay); timers.push(nextT);
    },
  };
  function giveUp() {
    if (!running || done) return;
    dialog('Show the answer? ' + (o.giveUpNote || 'This puzzle will not count.'), 'Show answer', 'Keep trying').then((ok) => {
      if (!ok || !running || done) return; done = true; const t = elapsed(); running = false; timers.forEach(clearInterval);
      try { game && game.reveal && game.reveal(); } catch (e) { /* ignore */ }
      stage.classList.add('revealed'); sw.append(h('div', { class: 'reveal-tag' }, 'Here\u2019s the answer'));
      const res = { time: Math.round(t * 10) / 10, gameId: o.gameId, at: performance.now(), gaveUp: true };
      timers.push(setTimeout(() => { if (o.onGiveUp) o.onGiveUp(res); }, 2800));
    });
  }
  const begin = () => { game = G.mount(stage, ctx); t0 = performance.now(); running = true; if (o.onGo) o.onGo(); };
  if (o.countdown) {
    const num = h('div', { class: 'big' }, '3'); const cd = overlay(h('div', null, num, h('div', { class: 'sm' }, G.name)));
    timers.push(setTimeout(() => { try { puzzleFor(o.gameId, seed); } catch (e) { /* retried at mount */ } }, 80));
    let n = 3; const iv = setInterval(() => { n--; if (n > 0) num.textContent = n; else if (n === 0) num.textContent = 'Go'; else { clearInterval(iv); cd.remove(); begin(); } }, 800); timers.push(iv);
  } else {
    const sp = overlay(h('div', null, h('i', { class: 'spin' }), h('div', { class: 'sm' }, 'Making a fresh puzzle\u2026')));
    timers.push(setTimeout(() => { sp.remove(); begin(); }, 60));
  }
  const ctl = {
    destroy() { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); running = false; done = true; if (game && game.destroy) game.destroy(); },
    freeze() { running = false; },
    banner(title, sub, cls) { overlay(h('div', null, h('div', { class: 'msg ' + (cls || '') }, title), sub ? h('div', { class: 'sm' }, sub) : null)); },
    prompt(title, sub, label, fn) { const b = h('button', { class: 'btn you', onclick: () => { ov.remove(); fn(); } }, label); const ov = overlay(h('div', null, h('div', { class: 'msg win' }, title), sub ? h('div', { class: 'sm' }, sub) : null, h('div', { style: 'margin-top:16px' }, b))); },
    cheat() { game && game.cheat && game.cheat(); },
    giveUpNow() { giveUp(); },
  };
  current = ctl; return ctl;
}
const homeBtn = () => h('button', { class: 'btn ghost block', onclick: () => home() }, 'Back to home');
function dailyPick(date) { const [y, m, d] = date.split('-').map(Number); const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000); return { gid: GAME_IDS[day % GAME_IDS.length], seed: 'daily-' + date }; }
function startDaily() {
  const date = todayStr(); const { gid, seed } = dailyPick(date); App.screen = 'play';
  playScreen({ gameId: gid, seed, title: 'Today\u2019s puzzle', sub: GAMES[gid].name + ' \u00B7 ' + date, onQuit: () => home(),
    onGiveUp: () => view(h('div', { class: 'wrap' }, h('div', { class: 'card result' }, h('div', { class: 'muted' }, GAMES[gid].name), h('h1', null, 'Answer revealed'), h('p', { class: 'muted small' }, 'No time posted. Solve it fully to get on today\u2019s board.'), h('div', { class: 'stack' }, h('button', { class: 'btn you block', onclick: () => startDaily() }, 'Try again'), h('button', { class: 'btn ghost block', onclick: () => startRandom(gid) }, 'Play another ' + GAMES[gid].name), homeBtn())))),
    onSolved: (res) => {
      const ranked = !App.rec.daily[date]; const shared = App.db && App.uid !== 'local';
      const post = () => {
        if (ranked) { App.rec.daily[date] = { s: res.time, at: Date.now(), g: gid }; saveRec(); }
        showResult();
      };
      if (ranked && shared && !App.rec.name) promptName('').then((nm) => { if (nm) App.rec.name = nm; post(); });
      else post();
      function showResult() {
      const mine = App.rec.daily[date];
      const rows = [...App.board].map(([, d]) => d.daily && d.daily[date]).filter(Boolean).sort((a, b) => a.s - b.s);
      const rank = rows.findIndex((e) => e.s === mine.s && e.at === mine.at) + 1;
      view(h('div', { class: 'wrap' },
        h('div', { class: 'card result' }, h('div', { class: 'muted' }, GAMES[gid].name + (ranked ? ' solved' : ' solved again')), h('div', { class: 'big' }, fmt(res.time)),
          h('div', { class: 'pillrow' }, ranked && rank ? h('span', { class: 'chip' }, 'Rank ' + rank + ' of ' + rows.length) : h('span', { class: 'chip' }, 'Today\u2019s time ' + fmt(mine.s))),
          h('p', { class: 'muted small' }, ranked ? 'Your time is on today\u2019s board.' : 'You already posted today, so this run is unranked.'),
          h('div', { class: 'stack' }, h('button', { class: 'btn you block', onclick: () => startRandom(LD.pick(Math.random, GAME_IDS)) }, 'Keep playing'), h('button', { class: 'btn ghost block', onclick: () => lobby() }, 'Race a friend'))),
        h('div', { class: 'sec' }, h('h2', null, 'Today\u2019s board'), h('div', { class: 'card' }, boardView()))));
      }
    } });
}
function startRandom(gid, seed) {
  seed = seed || newSeed(); App.screen = 'play'; const nextSeed = newSeed();
  const prep = () => setTimeout(() => { try { puzzleFor(gid, nextSeed); } catch (e) { /* made on demand */ } }, 250);
  const again = () => startRandom(gid, nextSeed);
  playScreen({ gameId: gid, seed, title: GAMES[gid].name, sub: GAMES[gid].blurb, onQuit: () => home(),
    onGiveUp: () => { view(h('div', { class: 'wrap' }, h('div', { class: 'card result' }, h('div', { class: 'muted' }, GAMES[gid].name), h('h1', null, 'Answer revealed'), h('p', { class: 'muted small' }, 'No worries. A fresh puzzle is one tap away.'), h('div', { class: 'stack' }, h('button', { class: 'btn you block', onclick: again }, 'Next puzzle'), homeBtn())))); prep(); },
    onSolved: (res) => { view(h('div', { class: 'wrap' }, h('div', { class: 'card result' },
      h('div', { class: 'muted' }, GAMES[gid].name), h('h1', null, 'Solved'), h('div', { class: 'big' }, fmt(res.time)),
      h('div', { class: 'stack' }, h('button', { class: 'btn you block', onclick: again }, 'Next puzzle'), h('button', { class: 'btn ghost block', onclick: () => startRandom(LD.pick(Math.random, GAME_IDS.filter((g) => g !== gid))) }, 'Try a different game'), homeBtn())))); prep(); }
  });
}
function startSurprise() { startRandom(LD.pick(Math.random, GAME_IDS)); }
