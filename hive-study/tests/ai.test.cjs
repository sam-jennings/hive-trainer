// Computer opponent (dist/ai.js) on small hand-built positions: it must finish a won game and
// stop an opponent's finish when it can. Legality is checked against rules.js from helpers.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { R, B } = require("./helpers.cjs");

const dist = path.join(__dirname, "..", "dist");
const box = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(dist, "rules.js"), "utf8") + "\n" + fs.readFileSync(path.join(dist, "ai.js"), "utf8"), box);
const AI = vm.runInContext("HiveAI", box);
const LEVELS = ["easy", "medium", "hard"];
const same = (a, b) => a.id === b.id && (a.from || null) === (b.from || null) && a.to === b.to;
const winsFor = (b, side, ply) => R.moves(b, side, ply).filter(m => R.outcome(R.play(b, m)) === side);
const choose = (b, side, ply, level, seed) =>
  AI.choose(JSON.parse(JSON.stringify(b)), side, ply, level, { rand: AI.rng(seed), timeMs: Infinity, maxNodes: 4000 });

// Black queen at 0,0 on 5 neighbours; the last liberty 1,-1 is reachable only by the outside white ant.
const whiteToWin = () => B({
  "0,0": "bQ1", "1,0": "wQ1", "0,1": "wA1", "-1,1": "wA2", "-1,0": "wG1", "0,-1": "bG2", "2,-1": "wA3",
});
// White queen at 0,0 on 5 neighbours; the black ant at 2,-1 threatens to slide into 1,-1.
// White's beetle at 2,0 can climb onto that ant and pin it (moving into 1,-1 itself would lose).
const whiteMustBlock = () => B({
  "0,0": "wQ1", "1,0": "bQ1", "0,1": "bA1", "-1,1": "bA2", "-1,0": "wG1", "0,-1": "wG2", "2,-1": "bA3", "2,0": "wB1",
});

describe("computer opponent: finishing and defending", () => {
  test("positions are what they claim", () => {
    assert.ok(R.connected(whiteToWin()) && R.connected(whiteMustBlock()));
    assert.equal(winsFor(whiteToWin(), "w", 10).length > 0, true, "white has a winning move");
    assert.ok(winsFor(whiteMustBlock(), "b", 15).length > 0, "black threatens to win next move");
    const blocks = R.moves(whiteMustBlock(), "w", 14).filter(m => {
      const after = R.play(whiteMustBlock(), m);
      return !R.outcome(after) && winsFor(after, "b", 15).length === 0;
    });
    assert.ok(blocks.length > 0, "white has at least one blocking move");
  });
  for (const level of LEVELS) {
    test(level + " plays the immediate win (5 seeds)", () => {
      for (let seed = 1; seed <= 5; seed++) {
        const b = whiteToWin(), m = choose(b, "w", 10, level, seed);
        assert.ok(R.moves(b, "w", 10).some(l => same(l, m)), "legal");
        assert.equal(R.outcome(R.play(b, m)), "w", level + " seed " + seed + " played " + JSON.stringify(m));
      }
    });
  }
  for (const level of ["medium", "hard"]) {
    test(level + " blocks the opponent's immediate win (5 seeds)", () => {
      for (let seed = 1; seed <= 5; seed++) {
        const b = whiteMustBlock(), m = choose(b, "w", 14, level, seed);
        assert.ok(R.moves(b, "w", 14).some(l => same(l, m)), "legal");
        const after = R.play(b, m);
        assert.notEqual(R.outcome(after), "b", "did not fill its own last liberty");
        assert.equal(winsFor(after, "b", 15).length, 0, level + " seed " + seed + " played " + JSON.stringify(m));
      }
    });
  }
  test("hard prefers keeping a finisher ready: queen on 5 with an outside piece that reaches the gap scores far higher", () => {
    const b = whiteToWin();
    const withFinisher = AI.evaluate(b, "w", "w");
    const noFinisher = AI.evaluate(B({ "0,0": "bQ1", "1,0": "wQ1", "0,1": "wA1", "-1,1": "wA2", "-1,0": "wG1", "0,-1": "bG2" }), "w", "w");
    assert.ok(withFinisher > noFinisher + 1000, withFinisher + " vs " + noFinisher);
  });
});
