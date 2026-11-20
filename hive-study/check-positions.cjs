const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const scope = vm.createContext({});
for (const name of ["rules","positions","objectives","lessons","curriculum","decisions","training"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,"dist",name+".js"),"utf8"),scope);
}
const {R,P,C,D,T,O} = vm.runInContext("({R:HiveRules,P:Positions,C:Courses,D:Drills,T:Training,O:Objectives})",scope);
const ids=C.flatMap(c=>c.ids);
assert.equal(new Set(ids).size, ids.length);
assert.deepEqual([...ids].sort(),Object.keys(D).sort());
const boardIds=ids.filter(id=>D[id].type!=="decision");
assert.equal(new Set(boardIds.map(id=>JSON.stringify(P[id].h))).size,boardIds.length);
for(const id of ids) {
  const pos=P[id],d= D[id];
  if(d.type==="decision"){assert.equal(d.options.length,3);assert.ok(d.options.every(([answer,feedback])=>answer&&feedback));assert.ok(d.facts.length>=2&&d.why&&d.hint);continue}
  assert.equal(d.answers.length,3);
  if(pos.task)assert.ok(d.miss,id+" needs miss feedback");
  let board={};
  pos.h.forEach(([piece,to],ply)=>{
    assert.equal(R.outcome(board),null,id+" starts from a live game");
    const side=ply%2?"b":"w";
    const legal=R.moves(board,side,ply);
    const move=legal.find(m=>m.id===piece && m.to===to);
    assert.ok(move,id+" illegal history at ply "+(ply+1));
    board=R.play(board,move);
    assert.ok(R.connected(board));
  });
  const toMove=pos.h.length%2?"b":"w";
  assert.equal(R.outcome(board),null);
  assert.deepEqual(board,T.setup(id));
  const target=pos.target&&R.locate(board,pos.target);
  if(target&&!pos.task)assert.ok(R.destinations(board,target).length>0,id+" target begins mobile");
  // Claim checks for the batch-2 objectives.
  if(pos.task==="trap")assert.ok(O.mobile(board,"bQ1"),id+" black queen begins mobile");
  if(pos.task==="replace"){
    assert.equal(pos.free[0],"w",id+" free piece is white");
    assert.ok(O.pinned(board,pos.target),id+" target begins pinned");
    assert.ok(!O.pinned(R.lift(board,R.locate(board,pos.free)),pos.target),id+" free piece holds the pin alone at the start");
  }
  if(pos.task==="unpin"||pos.task==="fill"){
    assert.equal(pos.target[0],"w",id+" release target is white");
    assert.ok(O.pinned(board,pos.target),id+" release target begins pinned");
  }
  const legal=R.moves(board,toMove,pos.h.length);
  const good=legal.filter(m=>T.succeeds(id,board,m));
  assert.ok(good.length>0,id+" needs a solution");
  assert.ok(good.length<legal.length,id+" needs meaningful alternatives");
  for(const m of legal.filter(m=>!T.succeeds(id,board,m)))assert.ok(T.explainMiss(id,board,m,0).length>0);
  if(id==="cover3")for(const m of good){
    const cover=R.play(board,m),reply=T.response(cover,pos.h.length+1);
    assert.ok(reply);
    const next=R.play(cover,reply);
    const drops=R.moves(next,"w",pos.h.length+2).filter(m=>T.succeeds(id,next,m,1));
    assert.ok(drops.length>0);
    assert.ok(drops.every(m=>m.from===null));
  }
  if(id==="def3")assert.ok(R.moves(board,"b",pos.h.length+1).some(m=>R.outcome(R.play(board,m))==="b"));
  // Claim checks for the batch-1 objectives: the threat is real / the finish is not a mate in one.
  if(pos.task==="defend")assert.ok(O.winsNow(board,"b",pos.h.length+1),id+" Black must threaten an immediate surround");
  if(pos.task==="mate2"){
    assert.ok(!O.winsNow(board,"w",pos.h.length),id+" must not already be a mate in one");
    for(const m of good)assert.ok(R.moves(R.play(board,m),"b",pos.h.length+1).length>0,id+" Black must have a reply");
  }
  console.log(id+" · "+pos.h.length+" verified plies · "+good.length+" solutions");
}

console.log(boardIds.length+" board drills verified, "+(ids.length-boardIds.length)+" decision drills checked, "+ids.length+" total.");
