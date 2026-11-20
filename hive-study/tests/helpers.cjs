// Shared helpers for the rules-engine tests. Loads dist/rules.js the same way the check-*.cjs
// scripts do (node:vm), so the tests see exactly the code the browser runs.
// Coordinates are axial "q,r". Direction order used by the engine (and in these comments):
//   d0 = (+1,0)  d1 = (0,+1)  d2 = (-1,+1)  d3 = (-1,0)  d4 = (0,-1)  d5 = (+1,-1)
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scope = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "dist", "rules.js"), "utf8"), scope);
const R = vm.runInContext("HiveRules", scope);

// Build a board from {cell: "wQ1"} or {cell: ["bottom", ..., "top"]}.
function B(spec) {
  const board = {};
  for (const [cell, v] of Object.entries(spec)) board[cell] = Array.isArray(v) ? [...v] : [v];
  return board;
}
// Arrays from the vm context have a different Array prototype, so normalise before deepEqual.
const sorted = list => [...list].map(String).sort();
const dests = (board, cell) => sorted(R.destinations(board, cell));
const places = (board, side) => sorted(R.placements(board, side));
const moveList = (board, side, ply) => R.moves(board, side, ply).map(m => ({ id: m.id, from: m.from, to: m.to }));
const adjacent = (a, b) => R.neighbors(a).includes(b);
const touchesHive = (board, cell) => R.neighbors(cell).some(n => board[n]);

// Shared positions (built fresh each call so tests can't leak state into each other).
// "Pocket ring": five pieces around the empty cell 0,1 plus the mover at 0,0. 0,1 is a hole whose
// only opening (from 0,0) is a gate between 1,0 and -1,1.
// The white queen sits in the ring unless the mover is the white queen itself.
const pocketRing = mover => B({
  "0,0": mover, "1,0": "bQ1", "1,1": "bA1", "0,2": mover === "wQ1" ? "wA3" : "wQ1", "-1,2": "bG1", "-1,1": "wG1",
});
// Six pieces around the empty cell 0,0 (a closed ring). The piece at 1,0 is the one under test.
const closedRing = piece => B({
  "1,0": piece, "0,1": "bQ1", "-1,1": "bA1", "-1,0": piece === "wQ1" ? "wA3" : "wQ1", "0,-1": "bG1", "1,-1": "wG1",
});

module.exports = { R, B, sorted, dests, places, moveList, adjacent, touchesHive, pocketRing, closedRing };
