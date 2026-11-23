// Self-play check for the computer opponent (hive-study/dist/ai.js).
// Plays 100 seeded games in one process (no workers) across level pairings and checks that every
// move the AI returns is in rules.js's legal-move list for that position, and that it passes only
// when rules.js lists no move. The referee uses its own copy of rules.js; the AI is loaded in a
// separate sandbox and is handed a copy of the board, so it cannot change the referee's game.
// Each move also gets a copy of the game's earlier boards (opts.history), as the Play screen passes.
//   node hive-study/check-ai.cjs                 -> checks hive-study/dist/ai.js
//   node hive-study/check-ai.cjs --ai <file>     -> checks another copy (e.g. a deliberately broken one)
//   node hive-study/check-ai.cjs --games 20      -> fewer games (pairings scaled down)
// Exit 0 = 0 illegal moves and each stronger level wins most of its games against Easy.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const DIST = path.join(__dirname, "dist");
const AI_FILE = path.resolve(arg("--ai", path.join(DIST, "ai.js")));
const GAMES = Number(arg("--games", 100));
const CAP = 200;                 // plies; a game that reaches it counts as a draw
const NODES = 4000;              // deterministic search cap per move (same as the app's default)
const rulesSrc = fs.readFileSync(path.join(DIST, "rules.js"), "utf8");

// Referee: rules.js only.
const ref = vm.createContext({}); vm.runInContext(rulesSrc + ";this.R=HiveRules;", ref);
const R = ref.R;
// The AI under test, in its own sandbox with its own rules.js.
const box = vm.createContext({}); vm.runInContext(rulesSrc + "\n" + fs.readFileSync(AI_FILE, "utf8") + ";this.AI=HiveAI;", box);
const AI = box.AI;

// [white level, black level, games]; the colours alternate within a pairing.
const plan = [["easy", "easy", 10], ["medium", "easy", 30], ["hard", "easy", 30], ["hard", "medium", 30]];
const scale = GAMES / 100;
const same = (a, b) => a.id === b.id && (a.from || null) === (b.from || null) && a.to === b.to;
const label = m => m ? m.id + " " + (m.from ? m.from + "->" : "drop ") + m.to : "pass";

const illegal = [], stats = {}, timing = {}, capped = [];
let gameNo = 0, lastPlies = 0;
function playGame(white, black, seed) {
  const level = { w: white, b: black }, rand = AI.rng(seed);
  let board = {}, ply = 0, passes = 0; const history = [];
  while ((lastPlies = ply) < CAP) {
    const side = ply % 2 ? "b" : "w", legal = R.moves(board, side, ply);
    const t = Date.now();
    const m = AI.choose(JSON.parse(JSON.stringify(board)), side, ply, level[side], { rand, timeMs: Infinity, maxNodes: NODES, history: JSON.parse(JSON.stringify(history)) });
    history.push(board);
    const ms = Date.now() - t;
    const tm = timing[level[side]] ??= { moves: 0, total: 0, max: 0 };
    tm.moves++; tm.total += ms; tm.max = Math.max(tm.max, ms);
    if (m === null || m === undefined) {
      if (legal.length) { illegal.push({ game: gameNo, seed, ply, side, level: level[side], move: "pass", why: "passed with " + legal.length + " legal moves" }); return "illegal"; }
      if (++passes >= 2) return "draw";      // neither side can move
      ply++; continue;
    }
    const ok = legal.find(l => same(l, m));
    if (!ok) { illegal.push({ game: gameNo, seed, ply, side, level: level[side], move: label(m), why: legal.length ? "not in rules.js's " + legal.length + " legal moves" : "rules.js says pass" }); return "illegal"; }
    passes = 0;
    board = R.play(board, ok); ply++; lastPlies = ply;
    const res = R.outcome(board);
    if (res) return res;
  }
  const ring = s => { const c = R.locate(board, s + "Q1"); return c ? R.ring(board, c) : "-"; };
  capped.push({ game: gameNo, white, black, ringsWhiteQ: ring("w"), ringsBlackQ: ring("b") });
  return "cap";
}

const t0 = Date.now();
for (const [a, b, n] of plan) {
  const key = a + " vs " + b, count = Math.max(1, Math.round(n * scale));
  const st = stats[key] = { games: 0, [a + "Wins"]: 0, [b + "Wins"]: 0, draws: 0, capped: 0, illegal: 0, plies: 0 };
  if (a === b) { delete st[b + "Wins"]; st.whiteWins = 0; st.blackWins = 0; delete st[a + "Wins"]; }
  for (let i = 0; i < count; i++) {
    gameNo++;
    const swap = i % 2 === 1, white = swap ? b : a, black = swap ? a : b, seed = 1000 + gameNo;
    const before = illegal.length;
    const res = playGame(white, black, seed);
    st.games++; st.plies += lastPlies;
    if (res === "illegal") { st.illegal += illegal.length - before; continue; }
    if (res === "draw") st.draws++;
    else if (res === "cap") { st.draws++; st.capped++; }
    else if (a === b) st[res === "w" ? "whiteWins" : "blackWins"]++;
    else st[(res === "w" ? white : black) + "Wins"]++;
  }
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log("AI file: " + AI_FILE);
console.log("Games: " + gameNo + ", move cap " + CAP + " plies (counts as draw), search cap " + NODES + " positions per move, " + secs + " s\n");
for (const [key, st] of Object.entries(stats)) { st.avgPlies = Math.round(st.plies / st.games); delete st.plies; console.log(key.padEnd(18) + JSON.stringify(st)); }
console.log();
const vsEasy = Object.entries(stats).filter(([k]) => k.endsWith(" vs easy") && !k.startsWith("easy"));
for (const [key, st] of vsEasy) {
  const lvl = key.split(" ")[0];
  console.log(lvl + " beats easy in " + st[lvl + "Wins"] + "/" + st.games + " (" + Math.round(100 * st[lvl + "Wins"] / st.games) + "%)");
}
for (const [lvl, tm] of Object.entries(timing)) console.log(lvl.padEnd(7) + "moves " + tm.moves + ", avg " + (tm.total / tm.moves).toFixed(1) + " ms, max " + tm.max + " ms (node.js)");
console.log("\nCapped games (queen neighbour counts at ply " + CAP + "): " + (capped.filter(c => c.white !== c.black).map(c => "#" + c.game + " " + c.white + "/" + c.black + " wQ " + c.ringsWhiteQ + " bQ " + c.ringsBlackQ).join("; ") || "none besides easy vs easy"));
console.log("\nIllegal moves: " + illegal.length);
illegal.slice(0, 10).forEach(x => console.log("  " + JSON.stringify(x)));
const weak = vsEasy.filter(([key, st]) => st[key.split(" ")[0] + "Wins"] * 2 <= st.games);
if (weak.length) console.log("Too weak against easy: " + weak.map(([k]) => k).join(", "));
const pass = illegal.length === 0 && weak.length === 0;
console.log(pass ? "PASS" : "FAIL");
process.exit(pass ? 0 : 1);
