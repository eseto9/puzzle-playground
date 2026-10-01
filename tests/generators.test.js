// Run with: node tests/generators.test.js
// Checks that every puzzle generator produces valid, uniquely-solvable puzzles across its difficulty levels.
const path = require('path');
global.LD = require(path.join('..', 'src', 'logic.js'));
global.LD2 = require(path.join('..', 'src', 'logic2.js'));
global.LD3 = require(path.join('..', 'src', 'logic3.js'));
const gens = {
  jungle: { lv: [2, 3], run: (r, l) => { const p = LD.genPuzzle(r, l); if (LD.countSolutions(p.P, p.clues) !== 1) throw new Error('not unique'); } },
  alibi: { lv: [3, 4, 5], run: (r, l) => { const p = LD2.genAlibi(r, l); if (LD2.alCount(p) !== 1) throw new Error('not unique'); } },
  bridge: { lv: [1, 2, 3], run: (r, l) => { const p = LD3.genZip(r, l); const s = LD3.zipSolve(p.n, new Set(p.blocked), p.order, 2, 300000); if (s.count !== 1) throw new Error('not unique'); } },
  dogs: { lv: [1, 2, 3], run: (r, l) => { const p = LD3.genDogs(r, l); if (!LD3.dgState(p, Int8Array.from(p.sol)).every(Boolean)) throw new Error('solution breaks a rule'); } },
  lineup: { lv: [2, 3], run: (r, l) => { const p = LD3.genLineup(r, l); const s = LD3.lnSurvivors(p); if (s.length !== 1 || s[0] !== p.culprit) throw new Error('not unique'); } },
  untangle: { lv: [1, 2, 3], run: (r, l) => { const p = LD3.genUntangle(r, l); if (LD3.unCross(p.solution, p.edges).count !== 0) throw new Error('solution crosses'); } },
  paint: { lv: [1, 2, 3], run: (r, l) => { const p = LD3.genPaint(r, l); LD3.paintPrep(p); if (!LD3.paintSame(p, p.target, p.target)) throw new Error('target mismatch'); } },
  hues: { lv: [1, 2, 3], run: (r, l) => { const p = LD3.genHues(r, l); if (p.rows !== 4 || p.cols !== 4) throw new Error('hues must be 4x4'); } },
};
let fails = 0;
for (const [name, g] of Object.entries(gens)) {
  let n = 0, worst = 0;
  for (const lv of g.lv) for (let i = 0; i < 25; i++) {
    const t = Date.now();
    try { g.run(LD.makeRng(name + lv + '-' + i), lv); n++; } catch (e) { fails++; console.log('FAIL', name, 'level', lv, 'seed', i, e.message); }
    worst = Math.max(worst, Date.now() - t);
  }
  console.log(name.padEnd(9), n + ' puzzles ok, slowest ' + worst + 'ms');
}
console.log(fails ? 'FAILURES: ' + fails : 'All generators OK');
process.exit(fails ? 1 : 0);
