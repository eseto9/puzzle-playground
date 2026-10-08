'use strict';
/* =========================================================
   Public web relay: stands in for the Claude artifact's room/db/user
   capabilities when this page runs outside Claude (e.g. GitHub Pages).
   Everyone who opens this page, or knows a race code, shares one topic
   tree on a free public MQTT broker; nothing private goes through it.
   Same trick as the Whereabouts project (github.com/eseto9/Whereabouts).
   ========================================================= */
const WEB_RELAYS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
const WEB_NS = 'witsend-eseto9/v1/';
const MQTT_SRC = 'https://cdn.jsdelivr.net/npm/mqtt@5.16.0/dist/mqtt.min.js';
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

/* ---------- local identity + display name ---------- */
function webIdentity() {
  let id; try { id = localStorage.getItem('witsend:uid'); } catch (e) { id = null; }
  if (!id || !/^w[a-z0-9]{10,24}$/.test(id)) { id = 'w' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8); try { localStorage.setItem('witsend:uid', id); } catch (e) { /* ignore */ } }
  return id;
}
function webUser(uid) { return { async id() { return uid; }, async profiles(ids) { const out = {}; ids.forEach((i) => { out[i] = { name: (App.board.get(i) || {}).name || '' }; }); return out; } }; }

/* ---------- db shim: same doc()/collection() shape as the artifact's db,
   backed by retained messages on the relay (a newcomer gets everyone's
   latest retained message for free the moment they subscribe) ---------- */
function webDb() {
  let client = null, connectP = null; const rows = new Map(); const listeners = new Set();
  function connect() {
    if (connectP) return connectP;
    connectP = (window.mqtt ? Promise.resolve() : loadScript(MQTT_SRC)).then(() => new Promise((resolve) => {
      let relay = 0;
      const tryConnect = () => {
        const c = window.mqtt.connect(WEB_RELAYS[relay % WEB_RELAYS.length], { clientId: 'wd' + Math.random().toString(36).slice(2, 10), clean: true, keepalive: 30, reconnectPeriod: 4000, connectTimeout: 10000 });
        let done = false; let watchdog = null;
        const rotate = () => { if (client !== c) return; try { c.end(true); } catch (e) { /* ignore */ } client = null; relay++; tryConnect(); };
        c.on('connect', () => { if (!done) { done = true; client = c; c.subscribe(WEB_NS + 'lb/+', { qos: 0 }); resolve(c); } clearTimeout(watchdog); });
        c.on('close', () => { if (done && client === c) { clearTimeout(watchdog); watchdog = setTimeout(rotate, 10000); } });
        c.on('message', (t, buf) => {
          let d; try { d = JSON.parse(new TextDecoder().decode(buf)); } catch (e) { return; }
          if (!d || typeof d !== 'object') return;
          const id = t.slice((WEB_NS + 'lb/').length); if (!id) return;
          rows.set(id, d); listeners.forEach((cb) => { try { cb(); } catch (e) { /* ignore */ } });
        });
        setTimeout(() => { if (!done) { try { c.end(true); } catch (e) { /* ignore */ } if (relay < WEB_RELAYS.length - 1) { relay++; tryConnect(); } else resolve(null); } }, 8000);
      };
      tryConnect();
    })).catch(() => null);
    return connectP;
  }
  connect();
  return {
    doc(path) {
      const id = path.split('/')[1];
      return { async set(data) { const c = await connect(); if (!c) throw Object.assign(new Error('offline'), { code: 'unavailable' }); rows.set(id, data); c.publish(WEB_NS + 'lb/' + id, JSON.stringify(data), { qos: 0, retain: true }); } };
    },
    collection() {
      return {
        onSnapshot(cb) {
          const fire = () => cb({ docs: [...rows].map(([id, data]) => ({ id, data: () => data })) });
          listeners.add(fire); connect().then(fire);
          return () => listeners.delete(fire);
        },
      };
    },
  };
}

/* ---------- room shim: same on/emit/peers/onPeers/presence/leave shape as
   the artifact's live room, scoped to one room id over the relay ---------- */
function webRoom(id) {
  const ME = 'w' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  const HEARTBEAT = 2000, TIMEOUT = 14000;
  const known = new Map([[ME, { presence: Object.freeze({}), updatedAt: Date.now(), seen: Infinity }]]);
  const frozen = new Map(), topics = new Map(), peerHandlers = new Set();
  const pending = { joined: new Set([ME]), left: new Map(), updated: new Set() };
  let snapshot = null, flushT = null, client = null, lastSent = 0, sendT = null, relay = 0;
  const sender = (peer) => ({ peer, by: null, isMe: peer === ME, sameTab: peer === ME, kind: 'viewer', guest: false });
  const peerObj = (pid) => { const k = known.get(pid); let p = frozen.get(pid); if (!p || p.presence !== k.presence) { p = Object.freeze(Object.assign(sender(pid), { presence: k.presence, updatedAt: k.updatedAt })); frozen.set(pid, p); } return p; };
  const peers = () => snapshot || (snapshot = Object.freeze([...known.keys()].map(peerObj)));
  function touch(kind, pid) {
    snapshot = null;
    if (kind === 'joined') { pending.joined.add(pid); pending.left.delete(pid); }
    else if (kind === 'left') { if (!pending.joined.delete(pid)) pending.left.set(pid, frozen.get(pid) || Object.freeze(Object.assign(sender(pid), { presence: Object.freeze({}), updatedAt: Date.now() }))); pending.updated.delete(pid); frozen.delete(pid); }
    else if (!pending.joined.has(pid)) pending.updated.add(pid);
    if (!flushT && peerHandlers.size) flushT = setTimeout(flush, 16);
  }
  function flush() {
    flushT = null;
    const ch = Object.freeze({ peers: peers(), joined: Object.freeze([...pending.joined].filter((pid) => known.has(pid)).map(peerObj)), left: Object.freeze([...pending.left.values()]), updated: Object.freeze([...pending.updated].filter((pid) => known.has(pid)).map(peerObj)) });
    pending.joined.clear(); pending.left.clear(); pending.updated.clear();
    if (ch.joined.length || ch.left.length || ch.updated.length) for (const fn of [...peerHandlers]) { try { fn(ch); } catch (e) { /* ignore */ } }
  }
  function setPresence(pid, pres) {
    const had = known.has(pid), k = known.get(pid) || { presence: Object.freeze({}), updatedAt: 0, seen: 0 };
    k.seen = pid === ME ? Infinity : Date.now();
    const changed = !had || JSON.stringify(k.presence) !== JSON.stringify(pres);
    if (changed) { k.presence = Object.freeze(pres); k.updatedAt = Date.now(); }
    known.set(pid, k); if (!had) touch('joined', pid); else if (changed) touch('updated', pid);
  }
  function drop(pid) { if (pid !== ME && known.delete(pid)) touch('left', pid); }
  function deliver(topic, from, data) { const hs = topics.get(topic); if (!hs) return; const msg = Object.freeze(Object.assign(sender(from), { topic, data })); for (const fn of [...hs]) { try { fn(msg); } catch (e) { /* ignore */ } } }
  const base = WEB_NS + 'room/' + id + '/';
  const pub = (t, obj) => { if (client && client.connected) client.publish(base + t, JSON.stringify(obj), { qos: 0 }); };
  function announce() { lastSent = Date.now(); pub('p/' + ME, { p: known.get(ME).presence }); }
  function onMessage(t, buf) {
    let m; try { m = JSON.parse(new TextDecoder().decode(buf)); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    const rest = t.slice(base.length);
    if (rest.startsWith('p/')) { const pid = rest.slice(2); if (pid === ME || !/^w[a-z0-9]{6,20}$/.test(pid)) return; if (m.bye) { drop(pid); return; } if (m.p && typeof m.p === 'object' && !Array.isArray(m.p)) setPresence(pid, m.p); }
    else if (rest === 'hello') { if (m.from !== ME) announce(); }
    else if (rest === 'e') { if (m.from === ME || typeof m.topic !== 'string' || typeof m.from !== 'string') return; if (!known.has(m.from)) return; deliver(m.topic, m.from, m.data); }
  }
  function connect() {
    const tryConnect = () => {
      const url = WEB_RELAYS[relay % WEB_RELAYS.length];
      const c = window.mqtt.connect(url, { clientId: ME, clean: true, keepalive: 20, reconnectPeriod: 4000, connectTimeout: 10000, will: { topic: base + 'p/' + ME, payload: JSON.stringify({ bye: 1 }), qos: 0, retain: false } });
      client = c; let ever = false; let watchdog = null;
      const rotate = () => { if (client !== c) return; try { c.end(true); } catch (e) { /* ignore */ } relay++; tryConnect(); };
      const armWatchdog = () => { clearTimeout(watchdog); watchdog = setTimeout(rotate, 10000); };
      c.on('connect', () => { ever = true; clearTimeout(watchdog); c.subscribe(base + '#', { qos: 0 }, () => { pub('hello', { from: ME }); announce(); }); });
      c.on('message', onMessage);
      c.on('close', () => { if (client === c && ever) armWatchdog(); });
      setTimeout(() => { if (client === c && !ever) rotate(); }, 9000);
    };
    (window.mqtt ? Promise.resolve() : loadScript(MQTT_SRC)).then(tryConnect).catch(() => {});
  }
  connect();
  const hb = setInterval(() => { if (!client) return; if (Date.now() - lastSent >= HEARTBEAT) announce(); const now = Date.now(); for (const [pid, k] of known) if (pid !== ME && now - k.seen > TIMEOUT) drop(pid); }, 1000);
  return {
    async emit(topic, data) { pub('e', { from: ME, topic, data }); setTimeout(() => deliver(topic, ME, data), 0); },
    on(topic, handler) { if (!topics.has(topic)) topics.set(topic, new Set()); const fn = (m) => handler(m); topics.get(topic).add(fn); return () => topics.get(topic).delete(fn); },
    async presence(patch) {
      const next = Object.assign({}, known.get(ME).presence);
      for (const [k, v] of Object.entries(patch || {})) { if (v === null) delete next[k]; else next[k] = v; }
      setPresence(ME, JSON.parse(JSON.stringify(next)));
      if (Date.now() - lastSent >= 100) announce(); else if (!sendT) sendT = setTimeout(() => { sendT = null; announce(); }, 100);
    },
    peers,
    onPeers(handler) { const fn = (c) => handler(c); peerHandlers.add(fn); queueMicrotask(() => { if (peerHandlers.has(fn)) handler(Object.freeze({ peers: peers(), joined: peers(), left: Object.freeze([]), updated: Object.freeze([]) })); }); return () => peerHandlers.delete(fn); },
    leave() { clearInterval(hb); try { pub('p/' + ME, { bye: 1 }); } catch (e) { /* ignore */ } try { client && client.end(true); } catch (e) { /* ignore */ } },
  };
}
function webRoomManager() { return { async join(id) { return webRoom(id); } }; }
