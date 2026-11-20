const fs=require("fs"),vm=require("vm"),assert=require("assert/strict");
const html=fs.readFileSync("Hive-Study.html","utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);
const handlers={},memory={},els={};
function elem(id){
 return els[id]??={innerHTML:"",textContent:"",dataset:{},setAttribute(){},removeAttribute(){},classList:{toggle(){}},addEventListener(event,fn){handlers[id+event]=fn},querySelector(){return null},showModal(){this.open=true},close(){this.open=false}};
}
const env=vm.createContext({document:{querySelector:elem,getElementById:elem,querySelectorAll:()=>[],activeElement:null},window:{addEventListener(name,fn){handlers["window:"+name]=fn},scrollTo(){}},location:{hash:"#practice"},localStorage:{getItem:k=>memory[k],setItem:(k,v)=>memory[k]=v}});
vm.runInContext(scripts[0][1],env);
const htmlNow=()=>elem("#main").innerHTML;
const click=(key,value,where="#main")=>{
 const el={dataset:{[key]:value},hasAttribute:k=>k==="data-"+key};
 handlers[where+"click"]({target:{closest:()=>el}});
};
const solution=(id,b,stage)=>{
 const expr="HiveRules.moves(b,Positions[id].h.length%2?'b':'w',Positions[id].h.length+stage*2).find(m=>Training.succeeds(id,b,m,stage))";
 return vm.runInContext(expr,Object.assign(env,{id,b,stage}));
};
function play(m){
 if(m.from)click("cell",m.from);
 else{click("action","reserve");assert.equal(elem("#reserve").open,true);click("reserve",m.id,"#reserve")}
 click("cell",m.to);
}
const ids=vm.runInContext("Courses.flatMap(c=>c.ids)",env);
for(const id of ids){
 click("drill",id);
 if(vm.runInContext("Drills["+JSON.stringify(id)+"].type",env)==="decision"){
   assert.ok(htmlNow().includes('Analysis exercise'));
   click("decision","1"); assert.ok(htmlNow().includes('class="notice"'));
   click("action","hint"); assert.ok(htmlNow().includes('hint-box'));
   click("action","reveal"); click("decision","0");
   assert.ok(htmlNow().includes("Exercise complete")); click("action","next"); continue;
 }
 assert.ok(htmlNow().includes('Interactive Hive position'));
 const b=vm.runInContext("Training.setup("+JSON.stringify(id)+")",env);
 const sol=solution(id,b,0);
 const bad=vm.runInContext("HiveRules.moves(b,Positions[id].h.length%2?'b':'w',Positions[id].h.length).find(m=>!Training.succeeds(id,b,m))",env);
 play(bad);
 assert.ok(htmlNow().includes("Try another move"),id+" wrong move");
 click("action","retry");click("action","hint");assert.ok(htmlNow().includes("hint-box"));
 click("action","reveal");assert.ok(htmlNow().includes("gold destination"));
 click("cell",sol.to);
 if(id==="cover3"){
  assert.ok(htmlNow().includes("Black replied"));
  const next=vm.runInContext("(()=>{const n=HiveRules.play(b,sol);return HiveRules.play(n,Training.response(n,Positions.cover3.h.length+1))})()",Object.assign(env,{sol}));
  play(solution(id,next,1));
 }
 assert.ok(htmlNow().includes("Tactic played"),id);
 click("answer","1");assert.ok(htmlNow().includes("try another explanation"));
 click("answer","0");assert.ok(htmlNow().includes("Exercise complete"));
}
const p=JSON.parse(memory["hive-study.progress.v1"]);
assert.equal(Object.keys(p).length,ids.length);
function route(hash){env.location.hash=hash;handlers["window:hashchange"]()}
route("#guide");
assert.equal((htmlNow().match(/class="path-stage"/g)||[]).length,6);
assert.equal((htmlNow().match(/class="reading"/g)||[]).length,21);
assert.ok(htmlNow().includes("Ingersoll"));
route("#progress");assert.ok(htmlNow().includes(ids.length+" / "+ids.length));assert.ok(!htmlNow().includes("undefined"));
route("#practice");
click("drill","hopReply");click("decision","0");click("action","next");assert.ok(htmlNow().includes("Find breathing room"),"cross-course next");
click("drill","pill2");click("decision","0");click("action","next");assert.equal(env.location.hash,"progress","last exercise");
route("#practice");click("drill","mos1");assert.ok(htmlNow().includes("Local position"));click("action","mix");assert.ok(htmlNow().includes("Mixed exercise 1"));
const old={pin1:"independent",cover3:"guided"};memory["hive-study.progress.v1"]=JSON.stringify(old);handlers["window:storage"]({key:"hive-study.progress.v1"});
route("#progress");assert.ok(htmlNow().includes("2 / "+ids.length));route("#practice");click("drill","strength1");click("decision","0");
const migrated=JSON.parse(memory["hive-study.progress.v1"]);assert.equal(migrated.pin1,"independent");assert.equal(migrated.cover3,"guided");assert.equal(migrated.strength1,"independent");



console.log(ids.length+" complete exercise flows passed, including cases, move feedback, hints, both sides, multi-turn play and progress saving.");

