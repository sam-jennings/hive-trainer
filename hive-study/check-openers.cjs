// Replays every opener line and every counter-reply through HiveRules. Fails on any illegal move
// or on a reply whose stated opening type / pin does not hold on the board. Run: node check-openers.cjs
// Multi-move lines (entries with steps[]): every learner move, every opponent reply and every listed
// opponent alternative is replayed too, along every combination of book moves (see checkLine).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const scope = vm.createContext({});
for (const name of ["rules","openers"]) vm.runInContext(fs.readFileSync(path.join(__dirname,"dist",name+".js"),"utf8"),scope);
const {R,O} = vm.runInContext("({R:HiveRules,O:Openers})",scope);
const verdicts = ["best","playable","weak"];
const xy = k => { const [q,r] = k.split(",").map(Number); return [q+r/2, r*Math.sqrt(3)/2]; };
// Ingersoll ch. 9: classify by each queen's cell relative to the two first bugs.
function openingType(board, wFirst, bFirst) {
  const place = (side, own, opp) => {
    const q = R.locate(board, side+"Q1");
    if (!q || !R.neighbors(own).includes(q)) return "X";
    const [oq,or] = own.split(",").map(Number), [pq,pr] = opp.split(",").map(Number);
    return q === [2*oq-pq, 2*or-pr].join(",") ? "inline" : "elbow";
  };
  const w = place("w", wFirst, bFirst), b = place("b", bFirst, wFirst);
  if (w === "X" || b === "X") return "X";
  if (w === "inline") return b === "inline" ? "I" : "J";
  if (b === "inline") return "F";
  const [ax,ay] = xy(wFirst), [bx,by] = xy(bFirst);
  const side = k => { const [x,y] = xy(R.locate(board,k)); return Math.sign((bx-ax)*(y-ay)-(by-ay)*(x-ax)); };
  return side("wQ1") === side("bQ1") ? "C" : "Z";
}
assert.ok(O.length > 0, "no openers");
assert.equal(new Set(O.map(o=>o.id)).size, O.length, "duplicate opener id");
let replies = 0, lines = 0, multi = 0, learnerMoves = 0, oppReplies = 0, replays = 0, oppMoves = 0, branching = 0, branchRoutes = 0;
// Plays one [piece, to] for the side to move at this ply; fails if it is not legal there.
function playOne(board, ply, [piece,to], tag) {
  const side = ply%2 ? "b" : "w";
  assert.equal(piece[0], side, tag+": "+piece+" is the wrong colour for ply "+(ply+1));
  const move = R.moves(board,side,ply).find(m => m.id===piece && m.to===to);
  assert.ok(move, tag+": illegal move at ply "+(ply+1)+": "+piece+" to "+to);
  const next = R.play(board,move);
  assert.ok(R.connected(next), tag+": hive broken");
  assert.equal(R.outcome(next), null, tag+": game ended inside the line");
  return next;
}
function checkClaims(next, r, key, firsts, tag) {
  if (r.type) assert.equal(openingType(next, firsts[0], firsts[1]), r.type, tag+" / "+key+" opening type");
  for (const p of [].concat(r.pins||[])) assert.equal(R.destinations(next, R.locate(next,p)).length, 0, tag+" / "+key+" should pin "+p);
  for (const p of [].concat(r.frees||[])) assert.ok(R.destinations(next, R.locate(next,p)).length > 0, tag+" / "+key+" should leave "+p+" mobile");
}
// Branching lines: a step's then may hold branches[] (2+ opponent replies) instead of move. Such a
// step must be the last of its steps[]; each branch has name, move, why and its own steps[] (2+
// learner moves). routesOf lists every root-to-leaf route as {steps, thens, label}.
let branchPoints = 0, branchReplies = 0;
function routesOf(o, steps, acc=[], thens=[], label=[], depth=0) {
  assert.ok(Array.isArray(steps) && steps.length, o.id+": empty steps[]");
  const k = steps.findIndex(st => st.then && st.then.branches);
  const head = k < 0 ? steps : steps.slice(0, k+1);
  const t = [...thens, ...head.map(st => st.then || null)];
  if (k < 0) return [{steps:[...acc,...head], thens:t, label:label.join(" > ") || "main"}];
  const st = steps[k], bs = st.then.branches;
  assert.equal(k, steps.length-1, o.id+": a branching step must be the last of its steps[]");
  assert.ok(!st.then.move && !st.then.alts, o.id+": a branching step has branches[] instead of move/alts");
  assert.ok(Array.isArray(bs) && bs.length >= 2, o.id+": a branching step needs 2+ branches");
  assert.equal(new Set(bs.map(b => b.move && b.move.join("@"))).size, bs.length, o.id+": two branches play the same move");
  assert.ok(depth < 4, o.id+": branches nested too deep");
  return bs.flatMap((b, i) => {
    assert.ok(b.name && b.why && Array.isArray(b.move) && b.move.length === 2, o.id+" branch "+(i+1)+" needs name, move and why");
    assert.ok(Array.isArray(b.steps) && b.steps.length >= 2, o.id+" branch '"+b.name+"' needs 2+ learner moves");
    const tt = [...t]; tt[tt.length-1] = b;
    return routesOf(o, b.steps, [...acc,...head], tt, [...label, b.name], depth+1);
  });
}
// Multi-move line: steps[] of learner decisions; after each book move (except the last) the
// opponent's book reply steps[k].then.move is played. A step may accept several book moves, so
// every combination of book moves is replayed ("variants"). Every opponent reply and every listed
// alternative must be legal in every variant; every listed learner move must be legal in at least
// one variant (a move can be unavailable after another book choice) and each variant must offer
// at least one legal book move.
function checkLine(o, board0) {
  assert.ok(Array.isArray(o.steps) && o.steps.length >= 1, o.id+" needs steps");
  assert.ok(!o.replies, o.id+": a line keeps its replies inside steps");
  const start = o.h.length, routes = routesOf(o, o.steps), stepKeys = new Map(), thenSeen = new Set();
  for (const rt of routes) assert.ok(rt.steps.length >= 2, o.id+" ["+rt.label+"] needs 2+ learner moves");
  let paths = 0;
  for (const rt of routes) {
  let variants = [{board:board0, firsts:o.h.slice(0,2).map(m=>m[1])}];
  rt.steps.forEach((st, k) => {
    const tag = o.id+(routes.length > 1 ? " ["+rt.label+"]" : "")+" move "+(k+1), ply = start+2*k, side = ply%2 ? "b" : "w", last = k === rt.steps.length-1;
    const th = rt.thens[k];
    assert.ok(st.goal && st.hint && st.other, tag+" needs goal, hint and other");
    assert.ok(st.replies.length >= 2, tag+" needs 2+ replies");
    assert.ok(st.replies.some(r => r.verdict==="best"), tag+" needs a best reply");
    // A step object can sit on several routes; its listed moves are pooled across all of them.
    const fresh = !stepKeys.has(st), keys = stepKeys.get(st) || new Map();
    stepKeys.set(st, keys);
    if (fresh) {
      for (const r of st.replies) {
        assert.ok(r.name && r.why && verdicts.includes(r.verdict) && r.moves.length, tag+" bad reply "+r.name);
        for (const [piece,to] of r.moves) {
          const key = piece+"@"+to;
          assert.ok(!keys.has(key), tag+" move listed twice: "+key); keys.set(key,{ok:false,tag});
        }
      }
      replies += st.replies.length; learnerMoves++;
    }
    const next = [];
    variants.forEach((v, vi) => {
      const legal = R.moves(v.board, side, ply);
      let best = 0;
      for (const r of st.replies) for (const [piece,to] of r.moves) {
        const move = legal.find(m => m.id===piece && m.to===to);
        if (!move) continue;
        const key = piece+"@"+to, after = R.play(v.board, move);
        keys.get(key).ok = true; replays++;
        assert.ok(R.connected(after));
        assert.equal(R.outcome(after), null, tag+" / "+key+": game ended inside the line");
        checkClaims(after, r, key, v.firsts.length===2 ? v.firsts : [...v.firsts, to].slice(0,2), tag);
        if (r.verdict === "best") { best++; next.push({board:after, firsts:v.firsts.length<2?[...v.firsts,to]:v.firsts}); }
      }
      assert.ok(best > 0, tag+": no legal book move in variant "+(vi+1));
    });
    if (last) { assert.ok(!st.then, tag+": the last step has no opponent reply"); return; }
    assert.ok(th && th.move && th.why, tag+" needs then.move and then.why (or then.branches)");
    variants = next.map(v => {
      for (const a of th.alts||[]) { assert.ok(a.why, tag+" alt needs why"); playOne(v.board, ply+1, a.move, tag+" opponent alternative"); oppMoves++; }
      oppMoves++;
      return {board:playOne(v.board, ply+1, th.move, tag+" opponent reply"), firsts:v.firsts.length<2?[...v.firsts,th.move[1]].slice(0,2):v.firsts};
    });
    if (!thenSeen.has(th)) { thenSeen.add(th); oppReplies++; if (th.name) branchReplies++; }
    assert.ok(variants.length <= 64, o.id+": too many book-move combinations");
  });
  paths += variants.length;
  }
  for (const keys of stepKeys.values()) for (const [key, v] of keys) assert.ok(v.ok, v.tag+": illegal reply "+key+" (not legal in any position this line reaches)");
  for (const keys of stepKeys.values()) lines += keys.size;
  if (routes.length > 1) { branching++; branchRoutes += routes.length; }
  multi++;
  console.log(o.id+" · "+start+" plies · "+stepKeys.size+" learner steps"+(routes.length > 1 ? " · "+routes.length+" branch routes ("+routes.map(r => r.label).join(" | ")+")" : "")+" · "+paths+" book paths replayed");
}
for (const o of O) {
  for (const f of ["id","name","group","pages","summary","goal","hint","other"]) assert.ok(o[f], o.id+" missing "+f);
  let board = {};
  o.h.forEach(([piece,to],ply) => {
    const side = ply%2 ? "b" : "w";
    assert.equal(piece[0], side, o.id+" ply "+(ply+1)+" wrong colour");
    const move = R.moves(board,side,ply).find(m => m.id===piece && m.to===to);
    assert.ok(move, o.id+" illegal move at ply "+(ply+1)+": "+piece+" to "+to);
    board = R.play(board,move);
    assert.ok(R.connected(board));
    assert.equal(R.outcome(board), null, o.id+" game ended inside the line");
  });
  if (o.steps) { checkLine(o, board); continue; }
  const ply = o.h.length, side = ply%2 ? "b" : "w", legal = R.moves(board,side,ply);
  assert.ok(o.replies.length >= 3, o.id+" needs 3+ replies");
  assert.ok(o.replies.some(r => r.verdict==="best"), o.id+" needs a best reply");
  const seen = new Set();
  for (const r of o.replies) {
    assert.ok(r.name && r.why && verdicts.includes(r.verdict) && r.moves.length, o.id+" bad reply "+r.name);
    for (const [piece,to] of r.moves) {
      const key = piece+"@"+to;
      assert.ok(!seen.has(key), o.id+" move listed twice: "+key); seen.add(key);
      const move = legal.find(m => m.id===piece && m.to===to);
      assert.ok(move, o.id+" / "+r.name+": illegal reply "+key);
      const next = R.play(board,move);
      assert.ok(R.connected(next));
      if (r.type) assert.equal(openingType(next, o.h[0][1], o.h[1][1]), r.type, o.id+" / "+key+" opening type");
      if (r.pins) assert.equal(R.destinations(next, R.locate(next,r.pins)).length, 0, o.id+" / "+key+" should pin "+r.pins);
      if (r.frees) assert.ok(R.destinations(next, R.locate(next,r.frees)).length > 0, o.id+" / "+key+" should leave "+r.frees+" mobile");
      lines++;
    }
    replies++;
  }
  assert.ok(legal.length > seen.size || o.replies.some(r=>r.verdict!=="best"), o.id+" needs real alternatives");
  console.log(o.id+" · "+ply+" plies · "+o.replies.length+" replies · "+seen.size+" reply moves legal");
}
console.log("OK · "+O.length+" openers ("+multi+" multi-move lines, "+branching+" branching) · "+replies+" replies · "+lines+" reply moves verified · "+learnerMoves+" learner moves and "+oppReplies+" opponent replies in lines ("+branchReplies+" of them branches, "+branchRoutes+" branch routes) · "+replays+" learner-move and "+oppMoves+" opponent-move replays along every path");
