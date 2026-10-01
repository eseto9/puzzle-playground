'use strict';
/* ---------- registry: every puzzle is generated fresh from a seed ---------- */
const GAMES = {
  jungle: { name: 'Jungle', em: '\u{1F42F}', tc: '#E39A2D', blurb: 'Place animals by the clues', how: 'Tap an animal, then a tile. White rings show where, a red \u2715 means not. Make every clue true.', mount: mountJungle, levels: [2, 3, 3], gen: (r, l) => LD.genPuzzle(r, l) },
  alibi: { name: 'Alibi', em: '\u{1F50E}', tc: '#7A4FD0', blurb: 'Who was at the party, and when?', how: 'Tap an hour in a guest\u2019s row to set when they arrived. The bar shows how long they stayed. Make every clue true.', mount: mountAlibi, levels: [3, 4, 4, 5], gen: (r, l) => LD2.genAlibi(r, l) },
  bridge: { name: 'Bridges', em: '\u{1F309}', tc: '#0E9AA7', blurb: 'Lay one bridge over every tile', how: 'Drag from island 1 to lay a single bridge that covers every tile and visits the islands in number order. Drag backward to undo.', mount: mountBridge, levels: [1, 2, 2, 3], gen: (r, l) => LD3.genZip(r, l) },
  dogs: { name: 'Pup Parade', em: '\u{1F436}', tc: '#E39A2D', blurb: 'Line the dogs up by the rules', how: 'Drag a dog from the kennel into a line-up spot, or tap one then a spot. Rearrange until every rule card is met. Green ticks show the rules you have satisfied.', mount: mountDogs, levels: [1, 2, 2, 3], gen: (r, l) => LD3.genDogs(r, l) },
  lineup: { name: 'Lineup', em: '\u{1F575}\uFE0F', tc: '#3A6FD8', blurb: 'Find the culprit from tricky clues', how: 'Every clue describes the culprit. Rule out any face that breaks one, or switch to Accuse and name your suspect straight away. When only one face is left, accuse them. A wrong accusation costs 8 seconds.', mount: mountLineup, levels: [2, 3, 3], gen: (r, l) => LD3.genLineup(r, l) },
  untangle: { name: 'Untangle', em: '\u{1F578}\uFE0F', tc: '#7A5CF0', blurb: 'Drag nodes until no lines cross', how: 'Drag the glowing nodes around. Red lines are still crossing. Untangle them all.', mount: mountUntangle, levels: [2, 2, 3], gen: (r, l) => LD3.genUntangle(r, l) },
  paint: { name: 'Layers', em: '\u{1F3A8}', tc: '#FF5A5F', blurb: 'Restack the paper to match', how: 'Tap a shape to bring it to the front, or switch to Send to back. Restack the layers until your picture matches the target.', mount: mountPaint, levels: [1, 2, 2, 3], gen: (r, l) => LD3.paintPrep(LD3.genPaint(r, l)) },
  hues: { name: 'Hues', em: '\u{1F308}', tc: '#C646E8', blurb: 'Swap tiles to rebuild the gradient', how: 'The colours form a smooth gradient between the four corners. Tap two tiles to swap them. Tiles with a dot are fixed.', mount: mountHues, levels: [1, 2, 3], gen: (r, l) => LD3.genHues(r, l) },
};
const GAME_IDS = Object.keys(GAMES);

/* generated on demand and cached, so a puzzle can be prepared before it is needed */
const PCACHE_UI = {}; const PORDER = [];
const newSeed = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const levelFor = (gid, seed) => LD.pick(LD.makeRng('L|' + gid + '|' + seed), GAMES[gid].levels);
function puzzleFor(gid, seed) {
  const key = gid + '|' + seed; if (PCACHE_UI[key]) return PCACHE_UI[key];
  const level = levelFor(gid, seed); let P = null, err = null;
  for (let k = 0; k < 6 && !P; k++) { try { P = GAMES[gid].gen(LD.makeRng('P|' + gid + '|' + seed + '|' + k), level); } catch (e) { err = e; } }
  if (!P) throw err;
  PCACHE_UI[key] = P; PORDER.push(key); while (PORDER.length > 8) delete PCACHE_UI[PORDER.shift()];
  return P;
}
