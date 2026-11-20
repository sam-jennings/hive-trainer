// Movement of each base piece (official Hive rules: Queen Bee, Beetle, Grasshopper, Spider, Soldier Ant).
// Gate / freedom-to-move cases live in sliding.test.cjs; one-hive cases in hive.test.cjs.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { R, B, sorted, dests, adjacent, touchesHive, pocketRing, closedRing } = require("./helpers.cjs");

describe("Queen Bee: slides exactly one space", () => {
  test("two-piece hive: queen can slide to the two cells that keep contact", () => {
    const b = B({ "0,0": "wQ1", "1,0": "bQ1" });
    assert.deepEqual(dests(b, "0,0"), sorted(["0,1", "1,-1"]));
  });
  test("end of a line: every destination is adjacent to the start", () => {
    const b = B({ "0,0": "wQ1", "1,0": "bQ1", "2,0": "bA1" });
    const d = dests(b, "0,0");
    assert.deepEqual(d, sorted(["0,1", "1,-1"]));
    assert.ok(d.every(c => adjacent(c, "0,0")));
  });
  test("queen in a closed ring can step outward but not into the ring's centre", () => {
    assert.deepEqual(dests(closedRing("wQ1"), "1,0"), sorted(["1,1", "2,-1"]));
  });
  test("queen never climbs onto the hive", () => {
    const b = B({ "0,0": "wQ1", "1,0": "bQ1", "2,0": "bA1" });
    assert.ok(!R.destinations(b, "0,0").includes("1,0"));
  });
});

describe("Beetle: one space, may climb on top of the hive", () => {
  test("ground beetle can slide either way or climb onto its neighbour", () => {
    const b = B({ "0,0": "wQ1", "1,0": "wB1", "-1,0": "bQ1" });
    assert.deepEqual(dests(b, "1,0"), sorted(["0,0", "0,1", "1,-1"]));
  });
  test("climbing puts the beetle on top of the stack", () => {
    const b = B({ "0,0": "wQ1", "1,0": "wB1", "-1,0": "bQ1" });
    const next = R.play(b, { id: "wB1", from: "1,0", to: "0,0" });
    assert.deepEqual([...next["0,0"]], ["wQ1", "wB1"]);
    assert.equal(next["1,0"], undefined);
  });
  test("beetle on top of the hive can move to any of the six neighbours", () => {
    const b = B({ "0,0": ["wQ1", "wB1"], "-1,0": "bQ1" });
    const d = dests(b, "0,0");
    assert.equal(d.length, 6);
    assert.ok(d.includes("-1,0"), "can move across the top onto the black queen");
    assert.ok(d.includes("1,0"), "can climb down to an empty cell");
  });
  test("beetle on top of an articulation stack is not pinned (the stack stays behind)", () => {
    const b = B({ "0,0": "wQ1", "1,0": ["bA1", "wB1"], "2,0": "bQ1" });
    const d = dests(b, "1,0");
    assert.ok(d.includes("0,0") && d.includes("2,0"));
    assert.ok(d.length > 2);
  });
  test("ground beetle that holds the hive together is pinned", () => {
    const b = B({ "0,0": "wQ1", "1,0": "wB1", "2,0": "bQ1" });
    assert.deepEqual(dests(b, "1,0"), []);
  });
  test("beetle can climb onto another beetle (stack of three)", () => {
    const b = B({ "0,0": ["wQ1", "bB1"], "1,0": "wB1", "-1,0": "bQ1" });
    assert.ok(R.destinations(b, "1,0").includes("0,0"));
    const next = R.play(b, { id: "wB1", from: "1,0", to: "0,0" });
    assert.deepEqual([...next["0,0"]], ["wQ1", "bB1", "wB1"]);
  });
  test("beetle moves only one space", () => {
    const b = B({ "0,0": ["wQ1", "wB1"], "-1,0": "bQ1", "-2,0": "bA1" });
    assert.ok(R.destinations(b, "0,0").every(c => adjacent(c, "0,0")));
  });
});

describe("Grasshopper: jumps in a straight line over at least one piece", () => {
  test("jumps over a row of pieces to the first empty cell", () => {
    const b = B({ "0,0": "wG1", "1,0": "bQ1", "2,0": "bA1", "0,1": "wQ1" });
    assert.deepEqual(dests(b, "0,0"), sorted(["3,0", "0,2"]));
  });
  test("never slides to an adjacent empty cell", () => {
    const b = B({ "0,0": "wG1", "1,0": "bQ1", "2,0": "bA1", "0,1": "wQ1" });
    assert.ok(R.destinations(b, "0,0").every(c => !adjacent(c, "0,0")));
  });
  test("cannot jump over a gap: it lands in the first empty cell", () => {
    const b = B({ "0,0": "wG1", "1,0": "bQ1", "1,1": "bA1", "2,1": "bA2", "3,0": "bG1", "0,1": "wQ1" });
    const d = dests(b, "0,0");
    assert.deepEqual(d, sorted(["2,0", "0,2"]));
    assert.ok(!d.includes("4,0"), "must not continue over 3,0 after the gap at 2,0");
  });
  test("can jump out of a position surrounded on five sides", () => {
    const b = B({ "0,0": "wG1", "1,0": "wQ1", "0,1": "bQ1", "-1,1": "bA1", "-1,0": "wA1", "0,-1": "bS1" });
    assert.deepEqual(dests(b, "0,0"), sorted(["2,0", "0,2", "-2,2", "-2,0", "0,-2"]));
  });
  test("can jump into a hole that sliding pieces cannot reach", () => {
    const b = pocketRing("bA2");
    b["0,-1"] = ["wG2"];
    assert.ok(R.destinations(b, "0,-1").includes("0,1"));
  });
});

describe("Spider: exactly three steps, no backtracking", () => {
  const line = () => B({ "-1,0": "wS1", "0,0": "wQ1", "1,0": "bQ1", "2,0": "bA1", "3,0": "wA1" });
  test("from the end of a line it reaches the third cell each way round", () => {
    assert.deepEqual(dests(line(), "-1,0"), sorted(["2,-1", "1,1"]));
  });
  test("cells one or two steps away are not destinations", () => {
    const d = dests(line(), "-1,0");
    for (const c of ["0,-1", "1,-1", "-1,1", "0,1"]) assert.ok(!d.includes(c), c);
  });
  test("around a single piece both directions meet on the opposite cell", () => {
    const b = B({ "0,0": "wQ1", "1,0": "wS1" });
    assert.deepEqual(dests(b, "1,0"), ["-1,0"]);
  });
  test("never ends on its starting cell", () => {
    const b = B({ "0,0": "wQ1", "1,0": "wS1" });
    assert.ok(!R.destinations(b, "1,0").includes("1,0"));
  });
  test("spider that holds the hive together is pinned", () => {
    const b = B({ "-1,0": "bQ1", "0,0": "wS1", "1,0": "wQ1" });
    assert.deepEqual(dests(b, "0,0"), []);
  });
});

describe("Soldier Ant: any number of slides around the hive", () => {
  test("reaches every outside cell of a pocketed ring, but not the hole", () => {
    assert.deepEqual(dests(pocketRing("wA1"), "0,0"), sorted([
      "2,0", "1,-1", "2,-1", "2,1", "1,2", "0,3", "-1,3", "-2,3", "-2,2", "-2,1", "-1,0",
    ]));
  });
  test("reaches the whole perimeter of a line except its own start", () => {
    const b = B({ "-1,0": "wA2", "0,0": "wQ1", "1,0": "bQ1", "2,0": "bA1", "3,0": "wA1" });
    assert.deepEqual(dests(b, "-1,0"), sorted([
      "0,-1", "1,-1", "2,-1", "3,-1", "4,-1", "4,0", "3,1", "2,1", "1,1", "0,1", "-1,1",
    ]));
  });
  test("every ant destination is empty, not the start, and touches the hive", () => {
    const b = pocketRing("wA1");
    const lifted = R.lift(b, "0,0");
    for (const c of R.destinations(b, "0,0")) {
      assert.ok(!b[c], c + " is empty");
      assert.notEqual(c, "0,0");
      assert.ok(touchesHive(lifted, c), c + " touches the hive");
    }
  });
  test("ant that holds the hive together is pinned", () => {
    const b = B({ "-1,0": "bQ1", "0,0": "wA1", "1,0": "wQ1" });
    assert.deepEqual(dests(b, "0,0"), []);
  });
});
