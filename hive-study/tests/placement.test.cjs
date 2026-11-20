// Placement rules, the queen-by-turn-4 rule and "no moving before your queen is placed".
// Ply numbering follows the engine: ply 0 = White's 1st turn, ply 1 = Black's 1st, ply 6 = White's 4th,
// ply 7 = Black's 4th.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { R, B, sorted, places, adjacent } = require("./helpers.cjs");

describe("where a new piece may be placed", () => {
  test("first piece of the game goes in the single starting cell", () => {
    assert.deepEqual(places({}, "w"), ["0,0"]);
  });
  test("turn-1 exception: Black's first piece may touch White's", () => {
    assert.deepEqual(places(B({ "0,0": "wA1" }), "b"), sorted(R.neighbors("0,0")));
  });
  test("from White's 2nd turn a new piece may not touch an enemy piece", () => {
    const b = B({ "0,0": "wA1", "1,0": "bA1" });
    assert.deepEqual(places(b, "w"), sorted(["-1,1", "-1,0", "0,-1"]));
  });
  test("Black likewise may not place next to White after its first turn", () => {
    const b = B({ "0,0": "wA1", "1,0": "bA1" });
    assert.deepEqual(places(b, "b"), sorted(["2,0", "1,1", "2,-1"]));
  });
  test("every placement touches a friendly piece and no enemy piece", () => {
    const b = B({ "0,0": "wQ1", "1,0": "bQ1", "-1,0": "wA1", "2,0": "bA1", "-1,1": "wG1", "2,-1": "bS1" });
    for (const side of ["w", "b"]) {
      for (const c of R.placements(b, side)) {
        const tops = R.neighbors(c).filter(n => b[n]).map(n => R.top(b, n)[0]);
        assert.ok(tops.length > 0, c + " touches the hive");
        assert.ok(tops.every(t => t === side), side + " at " + c + " touches only friendly tops");
      }
    }
  });
  test("a piece cannot be placed on an occupied cell (only beetles stack, by moving)", () => {
    const b = B({ "0,0": ["bQ1", "wB1"], "-1,0": "wQ1" });
    const p = R.placements(b, "w");
    assert.ok(!p.includes("0,0") && !p.includes("-1,0"));
  });
  test("a stack counts as the colour of its top piece: white beetle on black lets White place beside it", () => {
    const b = B({ "0,0": ["bQ1", "wB1"], "-1,0": "wQ1" });
    assert.ok(R.placements(b, "w").includes("1,0"));
  });
  test("...and the covered black piece gives Black no placement there", () => {
    const b = B({ "0,0": ["bQ1", "wB1"], "-1,0": "wQ1" });
    assert.deepEqual(places(b, "b"), []);
  });
});

describe("pieces in hand (stock)", () => {
  test("each side has the base set: 1 queen, 3 ants, 2 beetles, 3 grasshoppers, 2 spiders", () => {
    assert.deepEqual({ ...R.stock }, { Q: 1, A: 3, B: 2, G: 3, S: 2 });
  });
  test("on White's first turn one of each kind is available, queen included", () => {
    assert.deepEqual(sorted(R.available({}, "w", 0)), sorted(["wQ1", "wA1", "wB1", "wG1", "wS1"]));
  });
  test("next copy of a kind gets the next number", () => {
    assert.ok(R.available(B({ "0,0": "wA1" }), "w", 2).includes("wA2"));
  });
  test("no fourth ant once three are on the board", () => {
    const b = B({ "0,0": "wQ1", "1,0": "wA1", "2,0": "wA2", "3,0": "wA3" });
    assert.ok(!R.available(b, "w", 8).some(id => id.startsWith("wA")));
  });
  test("no third beetle and no second queen", () => {
    const b = B({ "0,0": ["wQ1", "wB2"], "1,0": "wB1" });
    const a = R.available(b, "w", 8);
    assert.ok(!a.some(id => id.startsWith("wB") || id.startsWith("wQ")));
  });
  test("covered pieces still count against the stock", () => {
    const b = B({ "0,0": ["wQ1", "bB1"], "1,0": "bB2" });
    assert.ok(!R.available(b, "b", 8).some(id => id.startsWith("bB")));
  });
});

describe("queen must be placed by your fourth turn", () => {
  const noQueens = () => B({ "0,0": "wA1", "1,0": "bA1", "-1,0": "wG1", "2,0": "bG1", "-2,0": "wS1", "3,0": "bS1" });
  test("White's 4th turn (ply 6) without the queen: only the queen may be placed", () => {
    assert.deepEqual(sorted(R.available(noQueens(), "w", 6)), ["wQ1"]);
  });
  test("Black's 4th turn (ply 7) without the queen: only the queen may be placed", () => {
    const b = noQueens();
    b["-3,0"] = ["wB1"];
    assert.deepEqual(sorted(R.available(b, "b", 7)), ["bQ1"]);
  });
  test("White's 3rd turn (ply 4) is not yet forced", () => {
    const a = R.available(noQueens(), "w", 4);
    assert.ok(a.includes("wQ1") && a.length > 1);
  });
  test("Black's 3rd turn (ply 5) is not yet forced", () => {
    const a = R.available(noQueens(), "b", 5);
    assert.ok(a.includes("bQ1") && a.length > 1);
  });
  test("on the forced turn every legal move is a queen placement", () => {
    const m = R.moves(noQueens(), "w", 6);
    assert.ok(m.length > 0);
    assert.ok(m.every(x => x.id === "wQ1" && x.from === null));
  });
  test("once the queen is down, the 4th turn is unrestricted", () => {
    const b = noQueens();
    b["-3,0"] = ["wQ1"];
    assert.ok(R.available(b, "w", 6).length > 1);
  });
});

describe("no moving pieces before your queen is placed", () => {
  test("ant cannot move while its own queen is in hand, even if the enemy queen is down", () => {
    const b = B({ "0,0": "wA1", "1,0": "bQ1" });
    assert.deepEqual(R.destinations(b, "0,0").length, 0);
  });
  test("the side whose queen is down may move in the same position", () => {
    const b = B({ "0,0": "wA1", "1,0": "bQ1" });
    assert.deepEqual(sorted(R.destinations(b, "1,0")), sorted(["0,1", "1,-1"]));
  });
  test("beetle, grasshopper and spider are also frozen without their queen", () => {
    const b = B({ "0,0": "bQ1", "1,0": "wB1", "-1,0": "wG1", "0,1": "wS1" });
    for (const cell of ["1,0", "-1,0", "0,1"]) assert.deepEqual(R.destinations(b, cell).length, 0, cell);
  });
  test("moves() offers only placements to a side without its queen", () => {
    const b = B({ "0,0": "wA1", "1,0": "bQ1", "-1,0": "wG1", "2,0": "bA1" });
    const m = R.moves(b, "w", 4);
    assert.ok(m.length > 0 && m.every(x => x.from === null));
  });
  test("after placing the queen, board moves become available", () => {
    const b = B({ "0,0": "wA1", "1,0": "bQ1", "-1,0": "wQ1", "2,0": "bA1" });
    assert.ok(R.moves(b, "w", 4).some(x => x.from !== null));
  });
  test("placement of a new piece is always adjacent to the hive", () => {
    const b = B({ "0,0": "wA1", "1,0": "bQ1" });
    assert.ok(R.placements(b, "w").every(c => R.neighbors(c).some(n => b[n])));
    assert.ok(R.placements(b, "w").every(c => !adjacent(c, "1,0")));
  });
});
