// Freedom to move: a sliding piece must physically fit. It cannot pass between two pieces that
// both touch the cell it leaves and the cell it enters (a "gate"), and it must keep contact with
// the hive while sliding. Grasshoppers jump and ignore gates; beetles obey the same rule at height.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { R, B, sorted, dests, pocketRing, closedRing, touchesHive } = require("./helpers.cjs");

describe("gates at ground level", () => {
  test("queen cannot slide through a gate into a pocket", () => {
    assert.deepEqual(dests(pocketRing("wQ1"), "0,0"), sorted(["-1,0", "1,-1"]));
  });
  test("queen surrounded on five sides cannot slide into the sixth", () => {
    const b = B({ "0,0": "wQ1", "1,0": "bQ1", "0,1": "bA1", "-1,1": "wA1", "-1,0": "bG1", "0,-1": "wG1" });
    assert.deepEqual(dests(b, "0,0"), []);
  });
  test("ant cannot enter a hole whose only opening is a gate", () => {
    assert.ok(!R.destinations(pocketRing("wA1"), "0,0").includes("0,1"));
  });
  test("ant cannot enter the centre of a closed ring", () => {
    const d = R.destinations(closedRing("wA1"), "1,0");
    assert.ok(!d.includes("0,0"), "centre is gated");
    assert.ok(d.includes("-2,0"), "but the far side of the outside is reachable");
  });
  test("spider cannot route through a gate", () => {
    assert.deepEqual(dests(pocketRing("wS1"), "0,0"), sorted(["-2,2", "2,0"]));
  });
  test("a one-cell corridor between two rows is too narrow to slide along", () => {
    // Rows at r=-1 and r=1 flank the corridor cells -1,0 .. 2,0, joined at the far end by 3,0.
    // The queen at 0,0 cannot slide to 1,0 (1,-1 and 0,1 both touch both cells) nor back to -1,0
    // (0,-1 and -1,1 do), even though both cells are empty and on the hive's edge.
    const b = B({
      "0,0": "wQ1",
      "0,-1": "bQ1", "1,-1": "bA1", "2,-1": "bA2", "3,-1": "bG1",
      "-1,1": "wA1", "0,1": "wA2", "1,1": "wG1", "2,1": "wG2",
      "3,0": "bG2",
    });
    assert.deepEqual(dests(b, "0,0"), []);
  });
  test("ground beetle cannot slide through a gate but can climb over it", () => {
    assert.deepEqual(dests(pocketRing("wB1"), "0,0"), sorted(["1,0", "-1,1", "-1,0", "1,-1"]));
  });
  test("grasshopper ignores gates", () => {
    const b = pocketRing("bA2");
    b["0,-1"] = ["wG2"];
    assert.ok(R.destinations(b, "0,-1").includes("0,1"));
  });
});

describe("gates at height (beetle on the hive)", () => {
  const high = () => B({ "0,0": ["wQ1", "wB1"], "1,0": "bQ1", "1,-1": ["bA1", "bB1"], "0,1": ["wA1", "wB2"] });
  test("beetle on level 2 cannot pass between two level-2 stacks onto a level-1 piece", () => {
    assert.deepEqual(dests(high(), "0,0"), sorted(["0,1", "-1,1", "-1,0", "0,-1", "1,-1"]));
  });
  test("with one side lowered the same move is allowed", () => {
    const b = high();
    b["0,1"] = ["wA1"];
    assert.ok(R.destinations(b, "0,0").includes("1,0"));
  });
  test("beetle can climb up onto one of the tall gate stacks", () => {
    assert.ok(R.destinations(high(), "0,0").includes("1,-1"));
  });
});

describe("contact while sliding", () => {
  test("queen cannot slide to a cell that only touches the hive through itself", () => {
    const b = B({ "0,0": "wQ1", "1,0": "bQ1" });
    for (const c of ["-1,0", "0,-1", "-1,1"]) assert.ok(!R.destinations(b, "0,0").includes(c), c);
  });
  test("every slide destination of queen, spider and ant touches the hive after lifting", () => {
    const cases = [[pocketRing("wQ1"), "0,0"], [pocketRing("wS1"), "0,0"], [pocketRing("wA1"), "0,0"], [closedRing("wA1"), "1,0"]];
    for (const [b, from] of cases) {
      const lifted = R.lift(b, from);
      for (const c of R.destinations(b, from)) assert.ok(touchesHive(lifted, c), from + "->" + c);
    }
  });
  test("ant cannot cross open space to reach a cell beside its own start", () => {
    // 0,-1 touches only 0,0 (the ant's start), so it is not on the hive's edge once the ant lifts.
    assert.ok(!R.destinations(pocketRing("wA1"), "0,0").includes("0,-1"));
  });
});
