// Passing, winning, drawing and stacking under a beetle.
// The engine has no explicit pass action: a side must pass exactly when moves() is empty.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { R, B, sorted } = require("./helpers.cjs");

// Six neighbours of 0,0 in engine order.
const RING = ["1,0", "0,1", "-1,1", "-1,0", "0,-1", "1,-1"];
const fill = (b, cells, ids) => { cells.forEach((c, i) => { b[c] = [ids[i]]; }); return b; };

describe("passing when no move is legal", () => {
  // White's only piece, the queen, is buried under a black beetle, and every empty edge cell
  // touches a black top piece, so White can neither move nor place.
  const shut = () => B({ "0,0": ["wQ1", "bB1"], "1,0": "bQ1" });
  test("a side with no movement and no legal placement has no moves (must pass)", () => {
    assert.deepEqual(R.moves(shut(), "w", 4).length, 0);
  });
  test("having no moves is not a loss: the game is still live", () => {
    assert.equal(R.outcome(shut()), null);
  });
  test("the other side still has legal moves", () => {
    assert.ok(R.moves(shut(), "b", 5).length > 0);
  });
  test("one usable placement cell means no pass", () => {
    const b = shut();
    b["-1,-1"] = ["wA1"]; // not touching any black top: gives White a placement edge and a movable ant
    b["0,-1"] = ["wG1"]; // links the ant to the hive
    assert.ok(R.placements(b, "w").length > 0);
    assert.ok(R.moves(b, "w", 6).length > 0);
  });
  test("queen pinned between two enemy pieces, with every edge cell touching black: must pass", () => {
    // Pieces still in hand do not help: no empty cell touches White without also touching Black.
    const b = B({ "-1,0": "bA1", "0,0": "wQ1", "1,0": "bQ1" });
    assert.deepEqual(R.placements(b, "w").length, 0);
    assert.deepEqual(R.moves(b, "w", 2).length, 0);
  });
});

describe("winning by surrounding the queen", () => {
  test("empty board has no result", () => {
    assert.equal(R.outcome({}), null);
  });
  test("no result while a queen is still in hand", () => {
    assert.equal(R.outcome(B({ "0,0": "wA1", "1,0": "bA1" })), null);
  });
  test("white queen with five neighbours: game goes on", () => {
    const b = fill(B({ "0,0": "wQ1" }), RING.slice(0, 5), ["bQ1", "bA1", "bA2", "bG1", "bG2"]);
    assert.equal(R.outcome(b), null);
  });
  test("white queen surrounded on all six sides: Black wins", () => {
    const b = fill(B({ "0,0": "wQ1" }), RING, ["bQ1", "bA1", "bA2", "bG1", "bG2", "bS1"]);
    assert.equal(R.outcome(b), "b");
  });
  test("black queen surrounded: White wins", () => {
    const b = fill(B({ "0,0": "bQ1" }), RING, ["wQ1", "wA1", "wA2", "wG1", "wG2", "wS1"]);
    assert.equal(R.outcome(b), "w");
  });
  test("the surrounding pieces may be of either colour, including the queen's own", () => {
    const b = fill(B({ "0,0": "bQ1" }), RING, ["bA1", "bA2", "bG1", "wQ1", "wA1", "bS1"]);
    assert.equal(R.outcome(b), "w");
  });
  test("a stack counts as one occupied neighbour", () => {
    const b = fill(B({ "0,0": "bQ1" }), RING, ["wQ1", "wA1", "wA2", "wG1", "wG2", "wS1"]);
    b["1,0"] = ["wQ1", "bB1"];
    assert.equal(R.outcome(b), "w");
  });
  test("a beetle on top of a queen does not count as one of its six neighbours", () => {
    const b = fill(B({ "0,0": ["bQ1", "wB1"] }), RING.slice(0, 5), ["wQ1", "wA1", "wA2", "wG1", "wG2"]);
    assert.equal(R.outcome(b), null);
  });
  test("a queen covered by a beetle can still be surrounded", () => {
    const b = fill(B({ "0,0": ["bQ1", "wB1"] }), RING, ["wQ1", "wA1", "wA2", "wG1", "wG2", "wS1"]);
    assert.equal(R.outcome(b), "w");
  });
  test("placing into the last liberty wins immediately", () => {
    const b = fill(B({ "0,0": "bQ1", "2,-1": "wA3" }), RING.slice(0, 5), ["wQ1", "wA1", "wA2", "wG1", "bG2"]);
    assert.equal(R.outcome(b), null);
    // 1,-1 is the last liberty. A drop there would touch Black, so the outside ant slides in.
    // (Only a piece from outside the ring wins: a ring piece moving in reopens its own cell.)
    const win = R.moves(b, "w", 10).find(m => m.from === "2,-1" && m.to === "1,-1");
    assert.ok(win, "white ant can slide into the last liberty");
    assert.equal(R.outcome(R.play(b, win)), "w");
  });
  test("a ring piece stepping into the last liberty does not win (it reopens its own cell)", () => {
    const b = fill(B({ "0,0": "bQ1", "2,-1": "wA3" }), RING.slice(0, 5), ["wQ1", "wA1", "wA2", "wG1", "bG2"]);
    const ringMove = R.moves(b, "w", 10).find(m => RING.includes(m.from) && m.to === "1,-1");
    assert.ok(ringMove, "some ring piece can reach 1,-1");
    assert.equal(R.outcome(R.play(b, ringMove)), null);
  });
});

describe("draw when both queens are surrounded at once", () => {
  // The queens touch; their shared liberties are 0,1 and 1,-1. Everything else around both is full.
  const twoQueens = () => {
    const b = B({ "0,0": "wQ1", "1,0": "bQ1" });
    fill(b, ["-1,1", "-1,0", "0,-1", "1,-1", "2,0", "1,1", "2,-1"], ["wA1", "wA2", "wG1", "wG2", "bA1", "bA2", "bG1"]);
    return b;
  };
  test("both queens with five neighbours: no result yet", () => {
    assert.equal(R.outcome(twoQueens()), null);
  });
  test("both queens surrounded: the game is a draw", () => {
    const b = twoQueens();
    b["0,1"] = ["bG2"];
    assert.equal(R.outcome(b), "draw");
  });
  test("one move that fills the shared liberty draws", () => {
    const b = twoQueens();
    b["-1,2"] = ["wA3"]; // ant beside the shared liberty 0,1 (a drop there would touch Black)
    const fillShared = R.moves(b, "w", 12).find(m => m.from === "-1,2" && m.to === "0,1");
    assert.ok(fillShared, "the outside white ant can slide into the shared liberty");
    assert.equal(R.outcome(R.play(b, fillShared)), "draw");
  });
});

describe("stacking under a beetle", () => {
  test("top() is the beetle; the covered piece is still on the board", () => {
    const b = B({ "0,0": ["wQ1", "bB1"], "1,0": "bQ1" });
    assert.equal(R.top(b, "0,0"), "bB1");
    assert.equal(R.locate(b, "wQ1"), "0,0");
    assert.deepEqual(sorted(R.pieces(b)), sorted(["wQ1", "bB1", "bQ1"]));
  });
  test("a covered piece cannot move", () => {
    const b = B({ "0,0": ["wA1", "bB1"], "-1,0": "wQ1", "1,0": "bQ1" });
    assert.ok(R.moves(b, "w", 6).every(m => m.from !== "0,0"));
    assert.ok(R.destinations(b, "0,0").length > 0, "destinations from the stack belong to the beetle");
    assert.ok(R.moves(b, "b", 7).some(m => m.from === "0,0" && m.id === "bB1"));
  });
  test("when the beetle leaves, the piece below is uncovered and free again", () => {
    // Four pieces in a loop, so the ant is not pinned once uncovered.
    const b = B({ "0,0": ["wA1", "bB1"], "-1,0": "wQ1", "1,-1": "bQ1" });
    assert.ok(R.destinations(b, "0,0").includes("0,-1"));
    const next = R.play(b, { id: "bB1", from: "0,0", to: "0,-1" });
    assert.deepEqual([...next["0,0"]], ["wA1"]);
    assert.equal(R.top(next, "0,-1"), "bB1");
    assert.ok(R.destinations(next, "0,0").length > 0);
  });
  test("a white piece under a black beetle gives White no placement beside the stack", () => {
    const b = B({ "0,0": ["wA1", "bB1"], "-1,0": "wQ1", "1,0": "bQ1" });
    const p = R.placements(b, "w");
    for (const c of R.neighbors("0,0")) assert.ok(!p.includes(c), c);
  });
  test("moving a beetle off a stack keeps the hive connected", () => {
    const b = B({ "-1,0": "wQ1", "0,0": ["wA1", "bB1"], "1,0": "bQ1" });
    for (const to of R.destinations(b, "0,0")) assert.ok(R.connected(R.play(b, { id: "bB1", from: "0,0", to })), to);
  });
  test("play() never mutates the board it is given", () => {
    const b = B({ "0,0": ["wQ1", "bB1"], "1,0": "bQ1" });
    const before = JSON.stringify(b);
    R.play(b, { id: "bB1", from: "0,0", to: "1,-1" });
    R.play(b, { id: "bA1", from: null, to: "2,0" });
    assert.equal(JSON.stringify(b), before);
  });
});
