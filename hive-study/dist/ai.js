// Computer opponent. It has no rules logic of its own: the legal moves, playing a move and the game
// result all come from rules.js (HiveRules.moves / play / outcome / locate / ring / connected / lift).
// This file only scores the positions rules.js produces and picks one of the moves rules.js lists.
// choose() returns null when rules.js lists no move: the computer must pass.
const HiveAI = (() => {
  const R = typeof HiveRules !== "undefined" ? HiveRules : require("./rules.js");
  const other = side => side === "w" ? "b" : "w";
  const WIN = 100000, DRAW = -20;
  // Value of N occupied cells around a queen (6 is a win, scored separately).
  const SURROUND = [0, 2, 5, 10, 18, 32, 0];
  // Rough worth of an unpinned piece of each kind (a pinned piece is worth nothing for mobility).
  // M, L, P are only used when the game has expansion pieces (opts.rules.expansions).
  const VALUE = { Q: 3, A: 5, B: 4, G: 2, S: 2, M: 4, L: 3, P: 3 };
  // Rules options for the position after move m (expansions: m becomes the "last move"; that
  // freezes the moved piece for the reply). Undefined for a base game, so rules.js runs unchanged.
  const nextRules = (rules, m) => rules && { ...rules, last: m };
  // Rules options for heuristics only (no freeze), or undefined for a base game.
  const pieceRules = rules => rules && { expansions: rules.expansions };
  const levels = [
    { id: "easy", name: "Easy", about: "Random legal moves. Takes a win when it sees one." },
    { id: "medium", name: "Medium", about: "Looks one move ahead and avoids handing you an instant win." },
    { id: "hard", name: "Hard", about: "Looks two moves ahead: its move and your best reply." }
  ];
  // Seeded random numbers (mulberry32), so self-play runs can be repeated exactly.
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (list, rand) => list[Math.floor(rand() * list.length)];
  const REPEAT = 6;
  const key = b => Object.keys(b).sort().map(k => k + ":" + b[k].join("")).join("|");
  const dist = (a, b) => {
    const [q1, r1] = a.split(",").map(Number), [q2, r2] = b.split(",").map(Number);
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
  };

  // Empty cells around the queen at `qc` that `att` can fill with a piece from OUTSIDE the ring
  // (a ring piece stepping in reopens its own cell). Uses rules.js destinations / placements only.
  // Checks only pieces that could plausibly reach a gap, so it stays cheap enough for leaf scoring.
  function finishers(b, att, qc, rules) {
    const ringCells = R.neighbors(qc), gaps = ringCells.filter(n => !b[n]);
    const hit = new Set();
    const extra = rules ? Object.keys(R.expansionStock || {}).filter(k => (rules.expansions || []).includes(k)).length : 0;
    const inHand = R.pieces(b).filter(id => id[0] === att).length < 11 + extra;
    if (inHand) { const drops = R.placements(b, att); for (const g of gaps) if (drops.includes(g)) hit.add(g); }
    for (const cell of Object.keys(b)) {
      const id = R.top(b, cell);
      // A ring piece stepping in reopens its own cell, unless it is a beetle on top of a stack
      // (or on the queen itself).
      if (id[0] !== att || (ringCells.includes(cell) && b[cell].length === 1)) continue;
      const near = Math.min(...gaps.map(g => dist(cell, g)));
      const kind = id[1];
      if ((kind === "Q" || kind === "B") && near > 1) continue;
      if (kind === "S" && near > 3) continue;
      if (kind === "G" && !gaps.some(g => { const [a, c] = cell.split(",").map(Number), [x, y] = g.split(",").map(Number); return a === x || c === y || a + c === x + y; })) continue;
      for (const to of R.destinations(b, cell, pieceRules(rules))) if (gaps.includes(to)) hit.add(to);
      if (hit.size === gaps.length) break;
    }
    return hit.size;
  }

  // Score a position for `side`: higher is better. Uses only rules.js queries.
  // `toMove` (optional) is the side whose turn it is in `b`; it decides how much a finishing
  // threat is worth (a threat for the side to move is a win next move).
  function evaluate(b, side, toMove, rules) {
    const res = R.outcome(b), opp = other(side);
    if (res === side) return WIN;
    if (res === opp) return -WIN;
    if (res === "draw") return DRAW;
    const mine = R.locate(b, side + "Q1"), theirs = R.locate(b, opp + "Q1");
    let s = 0;
    if (theirs) s += 3 * SURROUND[R.ring(b, theirs)];
    if (mine) s -= 3.3 * SURROUND[R.ring(b, mine)];
    // Finishing threats: a queen on 5 (or 4) neighbours only matters if the attacker can actually get
    // a piece from outside the ring into a gap. Without this the attacker sits at 5 and shuffles.
    for (const [qc, att, sign] of [[theirs, side, 1], [mine, opp, -1]]) {
      if (!qc) continue;
      const n = R.ring(b, qc);
      if (n < 4) continue;
      const f = finishers(b, att, qc, rules);
      if (!f) continue;
      if (n === 5) s += sign * (toMove === att ? WIN / 2 : 60);
      else s += sign * (f >= 2 ? (toMove === att ? 40 : 15) : 6);
    }
    for (const cell of Object.keys(b)) {
      const stack = b[cell], id = stack.at(-1), own = id[0] === side, sign = own ? 1 : -1;
      const enemyQueen = own ? theirs : mine;
      // Pinned pieces: lifting them would split the hive (rules.js connected/lift).
      const free = R.connected(R.lift(b, cell));
      if (free) s += sign * 0.6 * VALUE[id[1]];
      if (id[1] === "B" && stack.length > 1) {
        s += sign * 2;
        if (stack.includes((own ? opp : side) + "Q1")) s += sign * 12;
      }
      // Pull free movers toward the enemy queen, so a piece is on hand to fill the last gap.
      // Ants reach anywhere, so they are pulled gently; beetles, spiders and queens need to be close.
      if (enemyQueen && free && id[1] !== "G") {
        const d = dist(cell, enemyQueen);
        if (d > 1) s += sign * (id[1] === "A" ? 0.8 : 1) * Math.max(0, 5 - d);
        // A beetle on top of a stack in the ring keeps the ring filled when it steps into a gap.
        else if (d === 1 && stack.length > 1) s += sign * 5;
      }
    }
    return s;
  }

  // Does `side` have a move that wins on the spot?
  function hasWin(b, side, ply, rules) {
    return R.moves(b, side, ply, rules).some(m => R.outcome(R.play(b, m)) === side);
  }

  // Pick a move for `side` to play at `ply`. Options: rand (0..1 function), timeMs (wall-clock cap
  // for the search), maxNodes (cap on positions scored; deterministic, used by self-play),
  // rules (optional rules.js options for expansion games: { expansions, last }; omit for the base game).
  function choose(board, side, ply, level = "medium", opts = {}) {
    const rand = opts.rand || Math.random, timeMs = opts.timeMs ?? 700, maxNodes = opts.maxNodes ?? 4000;
    const rules = opts.rules, pr = pieceRules(rules);
    const t0 = Date.now(), opp = other(side);
    let nodes = 0;
    const out = () => Date.now() - t0 > timeMs || nodes > maxNodes;
    const legal = R.moves(board, side, ply, rules);
    if (!legal.length) return null;
    const after = legal.map(m => ({ m, b: R.play(board, m) }));
    const win = after.find(x => R.outcome(x.b) === side);
    if (win) return win.m;

    if (level === "easy") {
      // Random, but skip moves that lose or draw at once, and avoid crowding its own queen.
      const queen = R.locate(board, side + "Q1");
      const ok = after.filter(x => !R.outcome(x.b));
      const calm = ok.filter(x => !(queen && x.m.id[1] !== "Q" && R.neighbors(queen).includes(x.m.to)));
      return pick(calm.length ? calm : ok.length ? ok : after, rand).m;
    }

    // One move ahead: score every reply-free position, with a little noise so games vary.
    // (The opponent is to move in these positions, so a finisher left for them scores -WIN/2.)
    const noise = level === "hard" ? 0.5 : 2;
    // opts.history: earlier boards of this game. Going back to one costs a little per repeat, so a
    // side with nothing better to do tries something new instead of shuffling one piece forever.
    const seen = new Map();
    for (const h of opts.history || []) { const k = key(h); seen.set(k, (seen.get(k) || 0) + 1); }
    const scored = after.map(x => ({ ...x, v: evaluate(x.b, side, opp, pr), n: (rand() - 0.5) * noise - REPEAT * (seen.get(key(x.b)) || 0) }));
    nodes += scored.length;
    scored.sort((a, b) => (b.v + b.n) - (a.v + a.n));

    if (level === "medium") {
      // Take the best-scoring move that does not give the opponent an immediate win.
      // Checks up to 8 candidates, more when the opponent is threatening (a queen on 5).
      const threat = (q => q && R.ring(board, q) >= 5)(R.locate(board, side + "Q1"));
      for (const x of scored.slice(0, threat ? 40 : 8)) {
        if (out() && x !== scored[0]) break;
        nodes += 1;
        if (!hasWin(x.b, opp, ply + 1, nextRules(rules, x.m))) return x.m;
      }
      return scored[0].m;
    }

    // Hard: two moves ahead (its move, then the opponent's best reply), best first, alpha cut-off,
    // stopped by the time/node cap. The first candidate is always searched completely.
    // Leaves have Hard to move, so a finisher it still holds there counts as nearly a win (mate-in-2).
    let best = null, bestV = -Infinity;
    for (const x of scored) {
      if (best && out()) break;
      const replies = R.moves(x.b, opp, ply + 1, nextRules(rules, x.m));
      let worst = Infinity;
      if (!replies.length) { worst = evaluate(x.b, side, side, pr); nodes++; }
      for (const r of replies) {
        const v = evaluate(R.play(x.b, r), side, side, pr);
        nodes++;
        if (v < worst) worst = v;
        if (worst + x.n <= bestV) break;
      }
      if (worst + x.n > bestV) { bestV = worst + x.n; best = x.m; }
    }
    return best;
  }

  return { levels, choose, evaluate, rng };
})();
if (typeof module !== "undefined") module.exports = HiveAI;
