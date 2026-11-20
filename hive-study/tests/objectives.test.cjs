// Drill objectives added in batch 2 (dist/objectives.js): trap, replace and unpin.
// These sit on top of the rules engine; the engine itself is tested in the other files.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scope = vm.createContext({});
for (const f of ["rules", "positions", "objectives"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "dist", f + ".js"), "utf8"), scope);
const { R, P, O } = vm.runInContext("({R:HiveRules,P:Positions,O:Objectives})", scope);
const setup = id => P[id].h.reduce((b, [p, to]) => R.play(b, { id: p, from: R.locate(b, p), to }), {});
const solutions = id => { const b = setup(id); return R.moves(b, "w", P[id].h.length).filter(m => O.succeeds(b, m, P[id])); };

describe("trap objective", () => {
  test("a pinned black queen is not a trap", () => {
    // bQ1 links the two white bugs, so it cannot move, but only because of the pin.
    const b = { "-1,0": ["wQ1"], "0,0": ["bQ1"], "1,0": ["wA1"], "2,0": ["wA2"] };
    const m = { id: "wA2", from: "2,0", to: "2,-1" };
    assert.equal(O.succeeds(b, m, { h: [], task: "trap" }), false);
  });
  test("a covered black queen is not a trap", () => {
    const b = { "-1,0": ["wQ1"], "0,0": ["bQ1", "wB1"], "1,0": ["wA1"] };
    assert.equal(O.succeeds(b, { id: "wA1", from: "1,0", to: "1,-1" }, { h: [], task: "trap" }), false);
  });
  test("trap3's single solution leaves the queen on top, unpinned and with no slide", () => {
    const [m] = solutions("trap3"), n = R.play(setup("trap3"), m), q = R.locate(n, "bQ1");
    assert.equal(R.top(n, q), "bQ1");
    assert.equal(R.connected(R.lift(n, q)), true);
    assert.equal(R.destinations(n, q).length, 0);
  });
});

describe("replace objective", () => {
  test("moving the pinning piece itself never counts", () => {
    const b = setup("replace1"), p = P.replace1;
    const own = R.moves(b, "w", p.h.length).filter(m => m.id === p.free);
    assert.ok(own.length > 0);
    assert.ok(own.every(m => !O.succeeds(b, m, p)));
  });
  test("after the solution the target stays pinned with the free piece lifted", () => {
    const p = P.replace1, [m] = solutions("replace1"), n = R.play(setup("replace1"), m);
    assert.equal(O.pinned(R.lift(n, R.locate(n, p.free)), p.target), true);
  });
});

describe("unpin objective", () => {
  test("a pocket fill is not an unpin (the mover must end away from the target)", () => {
    const b = setup("fillA1"), [fill] = solutions("fillA1");
    assert.equal(O.succeeds(b, fill, { ...P.fillA1, task: "unpin" }), false);
  });
  test("unpin1's solution frees the marked spider", () => {
    const [m] = solutions("unpin1"), n = R.play(setup("unpin1"), m);
    assert.equal(O.mobile(n, "wS1"), true);
  });
});
