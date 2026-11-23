// Expansion pieces (Mosquito M, Ladybug L, Pillbug P), opt-in via { expansions: [...] }.
// Expected results follow the official Gen4 rules; each position's geometry is in a comment.
// Directions: d0 = (+1,0)  d1 = (0,+1)  d2 = (-1,+1)  d3 = (-1,0)  d4 = (0,-1)  d5 = (+1,-1)
// Neighbours of 0,0: 1,0 / 0,1 / -1,1 / -1,0 / 0,-1 / 1,-1.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { R, B, sorted, pocketRing } = require("./helpers.cjs");
const { fingerprint } = require("./base-moves-fixture.cjs");

const X = { expansions: ["M", "L", "P"] };
const withLast = last => ({ ...X, last });
const dx = (board, cell, opts = X) => sorted(R.destinations(board, cell, opts));
const abil = (board, cell, opts = X) => [...R.abilities(board, cell, opts)].map(m => ({ id: m.id, from: m.from, to: m.to, by: m.by }));
const abilTo = (board, cell, id, opts = X) => sorted(abil(board, cell, opts).filter(m => m.id === id).map(m => m.to));
const key = m => m.id + "|" + m.from + "|" + m.to;

// Pillbug position used by several tests: white pillbug at 0,0, its queen at -1,0, black queen
// at 0,-1 (touches both), black ant at 1,0. Lifting any one of the three neighbours keeps the
// hive connected through the pillbug. Empty cells next to the pillbug: 0,1 / -1,1 / 1,-1.
const pillbugBoard = (extra = {}) => B({ "-1,0": "wQ1", "0,0": "wP1", "0,-1": "bQ1", "1,0": "bA1", ...extra });

test.describe("Options and pieces in hand", () => {
  test("expansions on adds one mosquito, ladybug and pillbug to the hand; off gives the base set", () => {
    assert.deepEqual(sorted(R.available({}, "w", 0, X)), sorted(["wQ1", "wA1", "wB1", "wG1", "wS1", "wM1", "wL1", "wP1"]));
    assert.deepEqual(sorted(R.available({}, "w", 0)), sorted(["wQ1", "wA1", "wB1", "wG1", "wS1"]));
    assert.deepEqual(sorted(R.available({}, "w", 0, { expansions: [] })), sorted(R.available({}, "w", 0)));
  });
  test("a subset turns on only the named pieces; unknown letters are ignored", () => {
    assert.deepEqual(sorted(R.available({}, "b", 1, { expansions: ["P"] })).filter(id => /[MLP]/.test(id[1])), ["bP1"]);
    assert.deepEqual(sorted(R.available({}, "b", 1, { expansions: ["X", "Q"] })), sorted(R.available({}, "b", 1)));
  });
  test("one of each expansion piece: once placed it is no longer in hand; base stock is unchanged", () => {
    assert.deepEqual({ ...R.stock }, { Q: 1, A: 3, B: 2, G: 3, S: 2 });
    assert.deepEqual({ ...R.expansionStock }, { M: 1, L: 1, P: 1 });
    const a = R.available(B({ "0,0": "wP1", "1,0": "bQ1" }), "w", 2, X);
    assert.ok(!a.some(id => id.startsWith("wP")));
    assert.ok(a.includes("wM1") && a.includes("wL1"));
  });
  test("queen by the 4th turn still applies with expansions on", () => {
    const b = B({ "0,0": "wP1", "1,0": "bA1", "-1,0": "wM1", "2,0": "bA2", "-2,0": "wL1", "3,0": "bG1" });
    assert.deepEqual(sorted(R.available(b, "w", 6, X)), ["wQ1"]);
  });
  test("an expansion piece can be placed and cannot move before its queen is on the board", () => {
    const first = R.moves({}, "w", 0, X);
    assert.ok(first.some(m => m.id === "wL1" && m.to === "0,0"));
    const b = B({ "0,0": "wP1", "1,0": "bQ1", "-1,0": "wA1" });
    assert.deepEqual(dx(b, "0,0"), []);
    assert.deepEqual(abil(b, "0,0"), [], "no pillbug ability before the queen is placed either");
  });
});

test.describe("Pillbug movement", () => {
  test("moves one space like the queen", () => {
    // Pillbug at 1,0 next to the queen at 0,0 (black queen at -1,0): it slides to 0,1 or 1,-1.
    const b = B({ "0,0": "wQ1", "1,0": "wP1", "-1,0": "bQ1" });
    assert.deepEqual(dx(b, "1,0"), ["0,1", "1,-1"]);
  });
  test("cannot slide through a gate, exactly like the queen", () => {
    const pill = dx(pocketRing("wP1"), "0,0");
    assert.ok(!pill.includes("0,1"));
    assert.deepEqual(pill, sorted(R.destinations(pocketRing("wQ1"), "0,0")));
  });
  test("pinned by the One Hive rule: no movement", () => {
    assert.deepEqual(dx(B({ "-1,0": "wQ1", "0,0": "wP1", "1,0": "bQ1" }), "0,0"), []);
  });
});

test.describe("Pillbug special ability", () => {
  test("moves an adjacent enemy piece over itself into any empty cell next to it", () => {
    assert.deepEqual(abilTo(pillbugBoard(), "0,0", "bA1"), ["-1,1", "0,1", "1,-1"]);
    assert.ok(abil(pillbugBoard(), "0,0").every(m => m.by === "wP1"));
  });
  test("moves an adjacent friendly piece too (its own queen)", () => {
    assert.deepEqual(abilTo(pillbugBoard(), "0,0", "wQ1"), ["-1,1", "0,1", "1,-1"]);
  });
  test("never drops the piece back where it was or on top of another piece", () => {
    for (const m of abil(pillbugBoard(), "0,0")) {
      assert.notEqual(m.to, m.from);
      assert.ok(!pillbugBoard()[m.to], m.to + " is empty");
    }
  });
  test("ability moves are in moves(), once each, and play() applies them", () => {
    const list = R.moves(pillbugBoard(), "w", 8, X);
    assert.equal(new Set(list.map(key)).size, list.length, "no duplicate moves");
    const m = list.find(x => x.id === "bA1" && x.to === "0,1");
    assert.equal(m.by, "wP1");
    const after = R.play(pillbugBoard(), m);
    assert.deepEqual([...after["0,1"]], ["bA1"]);
    assert.equal(after["1,0"], undefined);
    // wQ1 -1,0 -> -1,1 is also an ordinary queen step: listed once (the ordinary move is kept).
    assert.equal(list.filter(x => x.id === "wQ1" && x.from === "-1,0" && x.to === "-1,1").length, 1);
  });
  test("cannot move the piece the opponent just moved", () => {
    const opts = withLast({ id: "bA1", from: "1,1", to: "1,0" });
    assert.deepEqual(abilTo(pillbugBoard(), "0,0", "bA1", opts), []);
    assert.equal(abilTo(pillbugBoard(), "0,0", "bQ1", opts).length, 3, "other pieces still can be moved");
  });
  test("a piece the opponent just PLACED is not frozen (placing is not moving)", () => {
    assert.equal(abilTo(pillbugBoard(), "0,0", "bA1", withLast({ id: "bA1", from: null, to: "1,0" })).length, 3);
  });
  test("cannot move a piece under a beetle, or the beetle on top of a stack", () => {
    const b = pillbugBoard({ "1,0": ["bA1", "bB1"] });
    assert.deepEqual(abil(b, "0,0").filter(m => m.from === "1,0"), []);
  });
  test("cannot move a piece if that splits the hive", () => {
    // bG1 at 2,0 touches only the ant at 1,0, so lifting the ant would leave bG1 alone.
    const b = pillbugBoard({ "2,0": "bG1" });
    assert.deepEqual(abilTo(b, "0,0", "bA1"), []);
    assert.equal(abilTo(b, "0,0", "bQ1").length, 3);
  });
  test("cannot lift a piece up through a gate of stacks", () => {
    // The ant at 1,0 climbs onto 0,0 between 0,1 and 1,-1; both are stacks of 2 -> blocked.
    const gate = pillbugBoard({ "0,1": ["wA1", "wB1"], "1,-1": ["bS1", "bB1"] });
    assert.deepEqual(abilTo(gate, "0,0", "bA1"), []);
    // With one side only 1 high the gap is passable.
    const open = pillbugBoard({ "0,1": ["wA1", "wB1"], "1,-1": "bS1" });
    assert.ok(abilTo(open, "0,0", "bA1").length > 0);
  });
  test("cannot drop a piece down through a gate of stacks", () => {
    // Dropping into 1,-1 from 0,0 passes between 0,-1 and 1,0: both stacks of 2 -> blocked.
    const b = pillbugBoard({ "0,-1": ["bQ1", "bB1"], "1,0": ["bA1", "bB2"] });
    assert.deepEqual(abilTo(b, "0,0", "wQ1"), ["-1,1", "0,1"]);
  });
  test("the moved piece is frozen on the next turn: it cannot move", () => {
    const m = R.moves(pillbugBoard(), "w", 8, X).find(x => x.id === "bA1" && x.to === "0,1");
    const after = R.play(pillbugBoard(), m);
    assert.deepEqual(dx(after, "0,1", withLast(m)), []);
    assert.ok(!R.moves(after, "b", 9, withLast(m)).some(x => x.id === "bA1"));
    // Without the freeze (e.g. a turn later) the ant can move again.
    assert.ok(dx(after, "0,1", withLast({ id: "wQ1", from: "-1,0", to: "-1,1" })).length > 0);
  });
  test("the moved piece is frozen on the next turn: the other pillbug cannot move it", () => {
    // Black pillbug at 0,0; the black ant at 1,0 was just moved there (from 2,-1) by the white
    // pillbug at 1,-1.
    const b = B({ "-1,0": "bQ1", "0,0": "bP1", "0,-1": "wQ1", "1,0": "bA1", "1,-1": "wP1" });
    const opts = withLast({ id: "bA1", from: "2,-1", to: "1,0", by: "wP1" });
    assert.deepEqual(abilTo(b, "0,0", "bA1", opts), []);
    assert.ok(abilTo(b, "0,0", "bA1").length > 0, "without the freeze it could");
  });
  test("a pillbug that was just moved (by the other pillbug) cannot move or use its ability", () => {
    const opts = withLast({ id: "wP1", from: "1,1", to: "0,0", by: "bP1" });
    assert.deepEqual(abil(pillbugBoard(), "0,0", opts), []);
    assert.deepEqual(dx(pillbugBoard(), "0,0", opts), []);
  });
  test("a pillbug covered by a beetle cannot use its ability", () => {
    const b = pillbugBoard({ "0,0": ["wP1", "bB1"] });
    assert.deepEqual(abil(b, "0,0"), []);
    assert.ok(!R.moves(b, "w", 8, X).some(m => m.by));
  });
  test("a pillbug pinned by the One Hive rule can still use its ability", () => {
    // 0,0 joins -1,0 and the 1,0 / 2,0 pair, so it cannot move, but it can move its queen.
    const b = B({ "-1,0": "wQ1", "0,0": "wP1", "1,0": "bQ1", "2,0": "bA1" });
    assert.deepEqual(dx(b, "0,0"), []);
    assert.deepEqual(abilTo(b, "0,0", "wQ1"), ["-1,1", "0,-1", "0,1", "1,-1"]);
    assert.deepEqual(abilTo(b, "0,0", "bQ1"), [], "lifting bQ1 would strand bA1");
  });
  test("with the pillbug not enabled there is no ability", () => {
    const opts = { expansions: ["M", "L"] };
    assert.deepEqual(abil(pillbugBoard(), "0,0", opts), []);
    assert.ok(!R.moves(pillbugBoard(), "w", 8, opts).some(m => m.by));
  });
});

test.describe("Mosquito", () => {
  test("next to only a mosquito it cannot move", () => {
    // Line 0,0 (wM1) - 1,0 (bM1) - 2,0 (bQ1) - 3,0 (wQ1): wM1 touches only the black mosquito.
    const b = B({ "0,0": "wM1", "1,0": "bM1", "2,0": "bQ1", "3,0": "wQ1" });
    assert.deepEqual(dx(b, "0,0"), []);
    assert.deepEqual(abil(b, "0,0"), []);
  });
  test("copies the queen", () => {
    const b = B({ "0,0": "wM1", "1,0": "wQ1", "2,0": "bQ1" });
    assert.deepEqual(dx(b, "0,0"), ["0,1", "1,-1"]);
  });
  test("copies every neighbour at once: grasshopper jumps plus queen steps", () => {
    // wM1 0,0 touches bG1 1,0, bQ1 1,-1 and wQ1 0,-1. Jumps: 2,0 / 2,-2 / 0,-2. Steps: 0,1 / -1,0.
    const b = B({ "0,0": "wM1", "1,0": "bG1", "1,-1": "bQ1", "0,-1": "wQ1" });
    assert.deepEqual(dx(b, "0,0"), sorted(["2,0", "2,-2", "0,-2", "0,1", "-1,0"]));
  });
  test("copies the ant", () => {
    const b = B({ "0,0": "wM1", "1,0": "bA1", "2,0": "bQ1", "3,0": "wQ1" });
    // As an ant it can reach the far end of the line (4,0); as nothing else it could.
    assert.ok(dx(b, "0,0").includes("4,0"));
  });
  test("copies the beetle and climbs onto the hive", () => {
    const b = B({ "0,0": "wM1", "1,0": "bB1", "1,-1": "bQ1", "0,-1": "wQ1" });
    const d = dx(b, "0,0");
    for (const c of ["1,0", "1,-1", "0,-1"]) assert.ok(d.includes(c), "climbs onto " + c);
  });
  test("on top of the hive it moves only as a beetle, whatever it touches", () => {
    // The mosquito sits on the black ant at 1,0; next to it are an ant, queens and a grasshopper.
    const spec = { "0,0": "wQ1", "1,0": ["bA1", "wM1"], "2,0": "bQ1", "1,1": "bG1", "3,0": "wA1" };
    const asBeetle = B({ ...spec, "1,0": ["bA1", "wB1"] });
    assert.deepEqual(dx(B(spec), "1,0"), sorted(R.destinations(asBeetle, "1,0")));
    assert.equal(dx(B(spec), "1,0").length, 6, "every neighbour, nothing further away");
  });
  test("copies the ladybug's 2-up-1-down path", () => {
    // wM1 0,0 - bL1 1,0 - bQ1 2,0 - wQ1 3,0: the mosquito touches only the ladybug, so it moves
    // exactly like a ladybug standing at 0,0 (two up, one down).
    const b = B({ "0,0": "wM1", "1,0": "bL1", "2,0": "bQ1", "3,0": "wQ1" });
    const lady = B({ "0,0": "wL1", "1,0": "bL1", "2,0": "bQ1", "3,0": "wQ1" });
    assert.deepEqual(dx(b, "0,0"), dx(lady, "0,0"));
    assert.ok(dx(b, "0,0").includes("2,1") && !dx(b, "0,0").includes("0,1"));
  });
  test("copies the pillbug's movement and its special ability", () => {
    // wM1 at 0,0 touches the black pillbug at 1,0; wQ1 -1,0 and bQ1 0,-1 as in the pillbug board.
    const b = B({ "-1,0": "wQ1", "0,0": "wM1", "0,-1": "bQ1", "1,0": "bP1" });
    const moves = abil(b, "0,0");
    assert.ok(moves.length > 0 && moves.every(m => m.by === "wM1"));
    assert.deepEqual(abilTo(b, "0,0", "bP1"), ["-1,1", "0,1", "1,-1"], "it can even move the pillbug itself");
    assert.ok(R.moves(b, "w", 8, X).some(m => m.by === "wM1"));
  });
  test("pinned next to a pillbug it can still use the copied ability", () => {
    const b = B({ "-1,0": "wQ1", "0,0": "wM1", "1,0": "bP1", "2,0": "bQ1" });
    assert.deepEqual(dx(b, "0,0"), []);
    assert.ok(abilTo(b, "0,0", "wQ1").length > 0);
  });
  test("on top of the hive it cannot use the pillbug ability", () => {
    const b = B({ "-1,0": "wQ1", "0,0": ["bA1", "wM1"], "0,-1": "bQ1", "1,0": "bP1" });
    assert.deepEqual(abil(b, "0,0"), []);
  });
  test("a pillbug under a beetle gives the mosquito the beetle, not the pillbug ability", () => {
    // Chain 0,-1 (wQ1) - 1,-1 (bQ1) - 1,0 (pillbug under a beetle), all touching wM1 at 0,0.
    const b = B({ "0,0": "wM1", "0,-1": "wQ1", "1,-1": "bQ1", "1,0": ["bP1", "bB1"] });
    assert.deepEqual(abil(b, "0,0"), []);
    assert.ok(dx(b, "0,0").includes("1,0"), "climbs like the beetle it touches");
  });
});

test.describe("Ladybug", () => {
  test("exact path: two steps on top, one step down", () => {
    // wL1 0,0 - wQ1 1,0 - bQ1 2,0. Up onto 1,0, up onto 2,0, then down to any empty cell by 2,0.
    const b = B({ "0,0": "wL1", "1,0": "wQ1", "2,0": "bQ1" });
    assert.deepEqual(dx(b, "0,0"), sorted(["3,0", "2,1", "1,1", "2,-1", "3,-1"]));
  });
  test("cannot stop after one step on top (cells next to the first piece) or return to its start", () => {
    const d = dx(B({ "0,0": "wL1", "1,0": "wQ1", "2,0": "bQ1" }), "0,0");
    for (const c of ["0,1", "1,-1", "0,0", "1,0", "2,0"]) assert.ok(!d.includes(c), c);
  });
  test("drops into a hole a crawling piece cannot reach", () => {
    // pocketRing: 0,1 is gated for the queen, but the ladybug goes 1,0 -> 1,1 -> down into 0,1.
    assert.ok(!R.destinations(pocketRing("wQ1"), "0,0").includes("0,1"));
    assert.ok(dx(pocketRing("wL1"), "0,0").includes("0,1"));
  });
  test("cannot step down through a gate of stacks", () => {
    // From the top of 2,0, 3,0 lies between 2,1 and 3,-1; both stacks of 2 -> blocked.
    const spec = { "0,0": "wL1", "1,0": "wQ1", "2,0": "bQ1" };
    const gated = B({ ...spec, "2,1": ["bA1", "bB1"], "3,-1": ["bA2", "wB1"] });
    assert.deepEqual(dx(gated, "0,0"), ["1,1", "2,-1"]);
    const flat = B({ ...spec, "2,1": "bA1", "3,-1": "bA2" });
    assert.ok(dx(flat, "0,0").includes("3,0"));
  });
  test("pinned by the One Hive rule: no movement", () => {
    assert.deepEqual(dx(B({ "-1,0": "wQ1", "0,0": "wL1", "1,0": "bQ1" }), "0,0"), []);
  });
});

test.describe("Expansions off: base game unchanged", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "base-moves.json"), "utf8"));
  test("legal-move lists match the pre-expansion rules.js on 120 random games (no options)", () => {
    const now = fingerprint(R, (b, s, p) => R.moves(b, s, p));
    assert.deepEqual(now, fixture.games);
  });
  test("legal-move lists match with an empty expansions list", () => {
    const now = fingerprint(R, (b, s, p) => R.moves(b, s, p, { expansions: [] }), 30);
    assert.deepEqual(now, fixture.games.slice(0, 30));
  });
  test("base pieces move the same with expansions on (bar the frozen last-moved piece)", () => {
    let checked = 0;
    fingerprint(R, (b, s, p) => {
      for (const cell of Object.keys(b)) {
        assert.deepEqual(sorted(R.destinations(b, cell, X)), sorted(R.destinations(b, cell)));
        checked++;
      }
      return R.moves(b, s, p);
    }, 20);
    assert.ok(checked > 1000);
  });
  test("base move objects carry no extra fields", () => {
    assert.ok(R.moves(pillbugBoard(), "w", 8).every(m => Object.keys(m).join() === "id,from,to"));
  });
});
