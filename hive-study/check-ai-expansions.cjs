// Self-play check for the computer opponent with the expansion pieces ON (Mosquito, Ladybug, Pillbug).
// Plays 20 seeded games (default) and checks that every move the AI returns is in rules.js's legal
// list for that position, computed by a separate referee copy of rules.js with
// { expansions: ["M","L","P"], last: <previous move> }, and that it passes only when that list is empty.
//   node hive-study/check-ai-expansions.cjs [--games 20]
// Exit 0 = 0 illegal moves. Strength is not checked (the evaluation was tuned for the base game).
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const DIST = path.join(__dirname, "dist");
const GAMES = Number(arg("--games", 20)), CAP = 200, NODES = 4000, EXP = ["M", "L", "P"];
const rulesSrc = fs.readFileSync(path.join(DIST, "rules.js"), "utf8");
const ref = vm.createContext({}); vm.runInContext(rulesSrc + ";this.R=HiveRules;", ref);
const R = ref.R;
const box = vm.createContext({}); vm.runInContext(rulesSrc + "\n" + fs.readFileSync(path.join(DIST, "ai.js"), "utf8") + ";this.AI=HiveAI;", box);
const AI = box.AI;
const copy = x => JSON.parse(JSON.stringify(x));
const same = (a, b) => a.id === b.id && (a.from || null) === (b.from || null) && a.to === b.to;
const label = m => m ? m.id + " " + (m.from ? m.from + "->" : "drop ") + m.to + (m.by ? " by " + m.by : "") : "pass";
const pairings = [["easy", "easy"], ["medium", "easy"], ["hard", "easy"], ["hard", "medium"], ["medium", "medium"]];

const illegal = [], results = [];
const used = { M: 0, L: 0, P: 0, ability: 0 };
const t0 = Date.now();
for (let g = 0; g < GAMES; g++) {
  const [a, b] = pairings[Math.floor(g / 2) % pairings.length], swap = g % 2 === 1;
  const level = { w: swap ? b : a, b: swap ? a : b }, rand = AI.rng(7000 + g);
  let board = {}, ply = 0, passes = 0, last = null, res = "cap";
  const history = [];
  while (ply < CAP) {
    const side = ply % 2 ? "b" : "w", rules = { expansions: EXP, last };
    const legal = R.moves(board, side, ply, rules);
    const m = AI.choose(copy(board), side, ply, level[side], { rand, timeMs: Infinity, maxNodes: NODES, history: copy(history), rules: copy(rules) });
    history.push(board);
    if (!m) {
      if (legal.length) { illegal.push({ g, ply, move: "pass", why: legal.length + " legal moves" }); res = "illegal"; break; }
      if (++passes >= 2) { res = "draw"; break; }
      ply++; last = null; continue;
    }
    const ok = legal.find(l => same(l, m));
    if (!ok) { illegal.push({ g, ply, move: label(m), why: "not in rules.js's " + legal.length + " legal moves" }); res = "illegal"; break; }
    if (ok.by) used.ability++;
    if (ok.from && "MLP".includes(ok.id[1])) used[ok.id[1]]++;
    passes = 0; board = R.play(board, ok); last = ok; ply++;
    const out = R.outcome(board);
    if (out) { res = out === "draw" ? "draw" : (level[out] + " (" + out + ")"); break; }
  }
  results.push({ game: g + 1, white: level.w, black: level.b, result: res, plies: ply });
  console.log("game " + (g + 1) + ": " + level.w + " (w) vs " + level.b + " (b) -> " + res + " in " + ply + " plies");
}
console.log("\nExpansion pieces moved: mosquito " + used.M + ", ladybug " + used.L + ", pillbug " + used.P + "; pillbug-ability moves " + used.ability);
console.log("Illegal moves: " + illegal.length + " (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)");
illegal.forEach(x => console.log("  " + JSON.stringify(x)));
console.log(illegal.length ? "FAIL" : "PASS");
process.exit(illegal.length ? 1 : 0);
