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
let replies = 0, lines = 0, multi = 0, learnerMoves = 0, oppReplies = 0;
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
  if (r.pins) assert.equal(R.destinations(next, R.locate(next,r.pins)).length, 0, tag+" / "+key+" should pin "+r.pins);
  if (r.frees) assert.ok(R.destinations(next, R.locate(next,r.frees)).length > 0, tag+" / "+key+" should leave "+r.frees+" mobile");
}
// Multi-move line: steps[] of learner decisions; after each book move (except the last) the
// opponent's book reply steps[k].then.move is played. A step may accept several book moves, so
// every combination of book moves is replayed ("variants"). Every opponent reply and every listed
// alternative must be legal in every variant; every listed learner move must be legal in at least
// one variant (a move can be unavailable after another book choice) and each variant must offer
// at least one legal book move.
function checkLine(o, board0) {
  assert.ok(Array.isArray(o.steps) && o.steps.length >= 2, o.id+" needs 2+ steps");
  assert.ok(!o.replies, o.id+": a line keeps its replies inside steps");
  let variants = [{board:board0, firsts:o.h.slice(0,2).map(m=>m[1])}];
  const start = o.h.length;
  o.steps.forEach((st, k) => {
    const tag = o.id+" move "+(k+1), ply = start+2*k, side = ply%2 ? "b" : "w", last = k === o.steps.length-1;
    assert.ok(st.goal && st.hint && st.other, tag+" needs goal, hint and other");
    assert.ok(st.replies.length >= 2, tag+" needs 2+ replies");
    assert.ok(st.replies.some(r => r.verdict==="best"), tag+" needs a best reply");
    const keys = new Map();
    for (const r of st.replies) {
      assert.ok(r.name && r.why && verdicts.includes(r.verdict) && r.moves.length, tag+" bad reply "+r.name);
      for (const [piece,to] of r.moves) {
        const key = piece+"@"+to;
        assert.ok(!keys.has(key), tag+" move listed twice: "+key); keys.set(key,false);
      }
    }
    const next = [];
    variants.forEach((v, vi) => {
      const legal = R.moves(v.board, side, ply);
      let best = 0;
      for (const r of st.replies) for (const [piece,to] of r.moves) {
        const move = legal.find(m => m.id===piece && m.to===to);
        if (!move) continue;
        const key = piece+"@"+to, after = R.play(v.board, move);
        keys.set(key, true);
        assert.ok(R.connected(after));
        checkClaims(after, r, key, v.firsts.length===2 ? v.firsts : [...v.firsts, to].slice(0,2), tag);
        if (r.verdict === "best") { best++; next.push({board:after, firsts:v.firsts.length<2?[...v.firsts,to]:v.firsts}); }
      }
      assert.ok(best > 0, tag+": no legal book move in variant "+(vi+1));
    });
    for (const [key, ok] of keys) assert.ok(ok, tag+": illegal reply "+key+" (not legal in any position this line reaches)");
    lines += keys.size; replies += st.replies.length; learnerMoves++;
    if (last) { assert.ok(!st.then, tag+": the last step has no opponent reply"); return; }
    assert.ok(st.then && st.then.move && st.then.why, tag+" needs then.move and then.why");
    variants = next.map(v => {
      for (const a of st.then.alts||[]) { assert.ok(a.why, tag+" alt needs why"); playOne(v.board, ply+1, a.move, tag+" opponent alternative"); }
      return {board:playOne(v.board, ply+1, st.then.move, tag+" opponent reply"), firsts:v.firsts.length<2?[...v.firsts,st.then.move[1]].slice(0,2):v.firsts};
    });
    oppReplies++;
    assert.ok(variants.length <= 64, o.id+": too many book-move combinations");
  });
  multi++;
  console.log(o.id+" · "+start+" plies · "+o.steps.length+" learner moves · "+variants.length+" book paths replayed");
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
console.log("OK · "+O.length+" openers ("+multi+" multi-move lines) · "+replies+" replies · "+lines+" reply moves verified · "+learnerMoves+" learner moves and "+oppReplies+" opponent replies in lines");
