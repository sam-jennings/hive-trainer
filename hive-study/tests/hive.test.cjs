// One Hive rule: the pieces must stay linked at all times, including while a piece is in transit.
// A piece whose removal would split the hive (an articulation point) is pinned.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { R, B, dests, pocketRing, closedRing } = require("./helpers.cjs");

describe("connected()", () => {
  test("a line of pieces is connected", () => {
    assert.equal(R.connected(B({ "0,0": "wQ1", "1,0": "bQ1", "2,0": "bA1" })), true);
  });
  test("two separate groups are not connected", () => {
    assert.equal(R.connected(B({ "0,0": "wQ1", "2,0": "bQ1" })), false);
  });
  test("an empty board counts as connected", () => {
    assert.equal(R.connected({}), true);
  });
});

describe("pinned pieces (articulation points)", () => {
  test("queen in the middle of a line cannot move", () => {
    const b = B({ "-1,0": "bA1", "0,0": "wQ1", "1,0": "bQ1" });
    assert.deepEqual(dests(b, "0,0"), []);
  });
  test("piece at the end of the same line can move", () => {
    const b = B({ "-1,0": "wA1", "0,0": "wQ1", "1,0": "bQ1" });
    assert.ok(R.destinations(b, "-1,0").length > 0);
  });
  test("hub of a three-armed star is pinned", () => {
    const b = B({ "0,0": "wA1", "1,0": "wQ1", "-1,1": "bQ1", "0,-1": "bA1" });
    assert.deepEqual(dests(b, "0,0"), []);
  });
  test("pinned even when the destination would reconnect the two halves", () => {
    // 1,0 and -1,1 both touch 0,1, but lifting the ant splits them for the duration of the move.
    const b = B({ "0,0": "wA1", "1,0": "wQ1", "-1,1": "bQ1" });
    assert.deepEqual(dests(b, "0,0"), []);
  });
  test("a grasshopper that links the hive cannot jump", () => {
    const b = B({ "-1,0": "bQ1", "0,0": "wG1", "1,0": "wQ1" });
    assert.deepEqual(dests(b, "0,0"), []);
  });
  test("a piece in a closed ring is not pinned (the ring stays linked)", () => {
    assert.ok(R.destinations(closedRing("wA1"), "1,0").length > 0);
  });
  test("moves() never lists a move for a pinned piece", () => {
    const b = B({ "-1,0": "bA1", "0,0": "wQ1", "1,0": "bQ1", "-2,0": "wA1" });
    // wQ1 at 0,0 links -1,0/-2,0 to 1,0.
    assert.ok(R.moves(b, "w", 6).every(m => m.from !== "0,0"));
  });
  test("a pinned piece becomes free once the hive is bridged", () => {
    const b = B({ "-1,0": "bA1", "0,0": "wQ1", "1,0": "bQ1" });
    b["0,-1"] = ["bG1"]; // 0,-1 touches both -1,0 and 0,0 ... but not 1,0
    b["1,-1"] = ["bG2"]; // 1,-1 touches 0,-1 and 1,0, closing a loop around the queen
    assert.ok(R.destinations(b, "0,0").length > 0);
  });
});

describe("every legal move keeps one hive", () => {
  const positions = {
    pocketAnt: () => pocketRing("wA1"),
    pocketSpider: () => pocketRing("wS1"),
    pocketBeetle: () => pocketRing("wB1"),
    closedRingQueen: () => closedRing("wQ1"),
    line: () => B({ "-1,0": "wS1", "0,0": "wQ1", "1,0": "bQ1", "2,0": "bA1", "3,0": "wA1", "4,0": "bG1" }),
    stacked: () => B({ "0,0": ["wQ1", "bB1"], "1,0": "bQ1", "-1,0": "wB1", "-1,1": "wG1", "2,0": "bA1" }),
  };
  for (const [name, make] of Object.entries(positions)) {
    test(name + ": board is still connected after each white and black move", () => {
      const b = make();
      for (const side of ["w", "b"]) {
        for (const m of R.moves(b, side, 8)) {
          assert.ok(R.connected(R.play(b, m)), side + " " + m.id + " " + m.from + "->" + m.to);
        }
      }
    });
  }
});
