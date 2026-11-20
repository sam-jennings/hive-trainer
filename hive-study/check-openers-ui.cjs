// Drives the Openers screen of the built Hive-Study.html in a fake DOM: every opener and every
// multi-move line, with a wrong move + retry, hint, show book move, the opponent's automatic reply,
// the end-of-line summary and saved progress. Run from the Hive folder: node hive-study/check-openers-ui.cjs
const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict"), path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "..", "Hive-Study.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
const handlers = {}, memory = {}, els = {};
function elem(id) {
  return els[id] ??= {innerHTML:"",textContent:"",dataset:{},setAttribute(){},removeAttribute(){},classList:{toggle(){}},addEventListener(ev,fn){handlers[id+ev]=fn},querySelector(){return null},showModal(){this.open=true},close(){this.open=false}};
}
const env = vm.createContext({document:{querySelector:elem,getElementById:elem,querySelectorAll:()=>[],activeElement:null},window:{addEventListener(n,fn){handlers["window:"+n]=fn},scrollTo(){}},location:{hash:"#openers"},history:{replaceState(a,b,url){env.location.hash=url}},localStorage:{getItem:k=>memory[k],setItem:(k,v)=>memory[k]=v}});
vm.runInContext(scripts[0][1], env);
const page = () => elem("#main").innerHTML;
const click = (key, value, where="#main") => { const el={dataset:{[key]:value},hasAttribute:k=>k==="data-"+key}; handlers[where+"click"]({target:{closest:()=>el}}); };
const R = vm.runInContext("HiveRules", env), O = vm.runInContext("Openers", env);
function legalMove(board, ply, [piece,to]) { return R.moves(board, ply%2?"b":"w", ply).find(m=>m.id===piece&&m.to===to); }
function play(m) {
  if (m.from) click("cell", m.from);
  else { click("action","o-reserve"); assert.equal(elem("#reserve").open, true); click("reserve", m.id, "#reserve"); }
  click("cell", m.to);
}
let lineSteps = 0;
for (const x of O) {
  click("opener", x.id);
  assert.ok(page().includes(x.name), x.id+" title");
  let board = {}; x.h.forEach((mv,ply)=>{board=R.play(board,legalMove(board,ply,mv))});
  let ply = x.h.length;
  const steps = x.steps || [x];
  steps.forEach((st, k) => {
    if (x.steps) assert.ok(page().includes("Move "+(k+1)+" of "+steps.length), x.id+" step counter "+(k+1));
    const legal = R.moves(board, ply%2?"b":"w", ply);
    const bestOf = m => st.replies.find(r=>r.moves.some(([p,t])=>p===m.id&&t===m.to))?.verdict==="best";
    const wrong = legal.find(m => !bestOf(m));
    assert.ok(wrong, x.id+" step "+(k+1)+" has no wrong move to test");
    play(wrong);
    assert.ok(page().includes("Try another move"), x.id+" step "+(k+1)+" wrong move feedback");
    click("action","o-retry");
    assert.ok(page().includes("Get a hint"), x.id+" retry returns to move");
    if (k === 0) { click("action","o-hint"); assert.ok(page().includes("hint-box"), x.id+" hint"); click("action","o-reveal"); assert.ok(page().includes("gold space"), x.id+" reveal"); }
    const best = legal.find(bestOf);
    if (k === 0) click("cell", best.to); else play(best);
    board = R.play(board, best);
    if (k < steps.length-1) {
      const a = legalMove(board, ply+1, st.then.move); board = R.play(board, a); ply += 2; lineSteps++;
      assert.ok(page().includes("replied:"), x.id+" opponent reply shown after step "+(k+1));
      const label = (a.id[0]==="w"?"White ":"Black ")+R.names[a.id[1]].toLowerCase()+" "+a.id.slice(2)+" at "+a.to;
      assert.ok(page().includes('aria-label="'+label+'"'), x.id+" auto reply on the board: "+label);
    }
  });
  assert.ok(page().includes("Book move"), x.id+" completed");
  if (x.steps) {
    assert.ok(page().includes("Line summary"), x.id+" summary");
    assert.ok(page().includes("Move 1:</b> Weak first") || page().includes("Move 1:</b> Playable first") || page().includes("Move 1:</b> Not a book reply first"), x.id+" summary step 1 grade");
    assert.ok(page().includes("Replay line"), x.id+" replay button");
    click("action","o-replay"); assert.ok(page().includes("Move 1 of "+steps.length), x.id+" replay restarts");
  }
}
const saved = JSON.parse(memory["hive-study.openers.v1"]);
assert.equal(Object.keys(saved).length, O.length, "progress saved for every opener");
assert.ok(Object.values(saved).every(v => v==="guided"), "wrong first moves are saved as guided");
assert.ok(!page().includes("undefined"), "no undefined text");
// Unaided run of one line: every step book on the first try upgrades its progress to "independent".
{
  const x = O.find(k => k.steps); click("opener", x.id);
  let board = {}; x.h.forEach((mv,ply)=>{board=R.play(board,legalMove(board,ply,mv))});
  let ply = x.h.length;
  x.steps.forEach((st,k) => {
    const best = R.moves(board, ply%2?"b":"w", ply).find(m => st.replies.some(r => r.verdict==="best" && r.moves.some(([p,t])=>p===m.id&&t===m.to)));
    play(best); board = R.play(board, best);
    if (st.then) { board = R.play(board, legalMove(board, ply+1, st.then.move)); ply += 2; }
  });
  assert.equal((page().match(/Book move, first try/g)||[]).length, x.steps.length, "summary shows every step as book, first try");
  assert.equal(JSON.parse(memory["hive-study.openers.v1"])[x.id], "independent", "unaided line saved as independent");
}
console.log(O.length+" opener flows passed ("+O.filter(x=>x.steps).length+" multi-move lines, "+lineSteps+" automatic opponent replies), with wrong moves, retry, hints, book move, summary and saved progress.");
