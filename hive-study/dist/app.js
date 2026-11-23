(() => {
"use strict";
const R=HiveRules, I=Art.icon, main=document.querySelector("#main"), dialog=document.querySelector("#reserve");
const ids=Courses.flatMap(c=>c.ids), key="hive-study.progress.v1";
const course=id=>Courses.find(c=>c.ids.includes(id));
const page=()=>["guide","progress","openers","play"].includes(location.hash.slice(1))?location.hash.slice(1):"practice";
function readProgress(){try {const obj=JSON.parse(localStorage.getItem(key))||{};return Object.fromEntries(ids.filter(id=>["guided","independent"].includes(obj[id])).map(id=>[id,obj[id]]))}catch{return {}}}
let progress=readProgress(),s,queue=null,mixed=false,storageMessage="";
const byId=id=>document.getElementById(id);
const badge=c=>'<span class="tag '+c.color+'">'+I(c.icon,14)+c.name+'</span>';
const btn=(action,label,icon="",style="")=>'<button type="button" class="btn '+style+'" data-action="'+action+'">'+(icon?I(icon,17):"")+label+'</button>';
function notify(msg){byId("announce").textContent=msg}
function begin(id){
 const d=Drills[id], isCase=d.type==="decision", ply=Positions[id]?.h.length||0;
 const b=isCase?{}:Training.setup(id),side=ply%2?"b":"w";
 s={id,initial:b,base:b,board:b,ply,side,stage:0,mode:isCase?"decision":"move",selected:null,legal:isCase?[]:R.moves(b,side,ply),hint:false,solution:false,assisted:false,info:"",feedback:"",wrongAnswers:[],last:null,flip:false,reply:"",finalMove:null};
 s.answerOrder=shuffled([0,1,2]);
 if(page()!=="practice")location.hash="practice";
 else render();
}
function shuffled(items){const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
function record(){
 progress={...readProgress(),...progress};
 if(progress[s.id]!=="independent")progress[s.id]=s.assisted?"guided":"independent";
 try{const latest=readProgress();for(const id of ids)if(latest[id]==="independent")progress[id]=latest[id];localStorage.setItem(key,JSON.stringify(progress))}catch{storageMessage="Progress is available for this session. Browser storage is unavailable."}
}
function correct(m){return Training.succeeds(s.id,s.base,m,s.stage)}
const sayId=id=>StudyBoard.legend(id);
const sideName=()=>s.side==="w"?"White":"Black";
const number=c=>Courses.indexOf(c)+1;
const sequence=()=>mixed?queue:ids;
function nextLabel(){const next=sequence()[sequence().indexOf(s.id)+1];return !next?"View progress":mixed?"Next exercise":course(next)!==course(s.id)?"Next · "+course(next).name:"Next exercise"}
function goal(){if(s.stage===1)return "Place a reserve bug next to the covered queen. The beetle stack must be its only friendly neighbour.";return Drills[s.id].goal}
function title(){return mixed?"Mixed exercise "+(queue.indexOf(s.id)+1):Drills[s.id].title}
function tag(){return mixed?'<span class="tag sage">'+I("mix",14)+'Mixed practice</span>':badge(course(s.id))}
function positionText(){const c=course(s.id);return mixed?(queue.indexOf(s.id)+1)+" of "+queue.length:"Exercise "+(c.ids.indexOf(s.id)+1)+" of "+c.ids.length}
function segments(c){return '<span class="segments">'+c.ids.map(id=>'<span class="'+(progress[id]?'done':'')+'"></span>').join('')+'</span>'}
function courseCard(c){
 const n=c.ids.filter(id=>progress[id]).length;
 return '<button class="course-card '+(!mixed&&c.ids.includes(s.id)?"current":"")+'" data-course="'+c.id+'"><span class="course-top"><span class="course-icon '+c.color+'">'+I(c.icon,22)+'</span><span class="course-name"><span class="order">'+number(c)+'.</span> '+c.name+'</span></span><span class="course-sub">'+c.summary+'</span><span class="mini-progress">'+segments(c)+'<span>'+n+' / '+c.ids.length+'</span></span></button>';
}
function board(){
 const p=Positions[s.id], target=p.target||(s.id.startsWith("win")?"bQ1":s.id.startsWith("def")||p.task==="counter"?"wQ1":p.task==="shutout"||p.task==="draw"?"bQ1":null);
 let prompt=R.locate(s.board,s.side+"Q1")?"Select a piece or open your reserve.":"Open your reserve to choose a piece.";
 if(s.mode==="move"&&s.selected)prompt="Choose a highlighted destination.";
 if(s.mode==="move"&&s.stage&&!s.selected)prompt="Choose a piece from your reserve.";
 if(s.mode==="retry")prompt="Your move is shown on the board.";
 if(s.mode==="quiz"||s.mode==="done")prompt="The board shows your successful move.";
 if(s.solution)prompt="Play the gold destination to try the line.";
 let turn=s.mode==="move"?sideName()+" to move":s.mode==="retry"?"Trial position":s.id==="draw"?"Draw":s.id.startsWith("win")?"White wins":"Position after move";
 return '<section class="board-card" aria-label="Practice board"><div class="board-bar"><div class="board-heading">'+I("board",20)+'Practice board</div><span class="turn-pill"><b class="'+(s.side==="b"?"black-token":"")+'"></b>'+turn+'</span></div><div class="board-plane">'+StudyBoard.draw({board:s.board,fromBoard:s.initial,selected:s.selected,legal:s.legal,target,focusCell:p.cell,flip:s.flip,mode:s.mode,last:s.last,solution:s.solution,pass:correct})+'</div><div class="board-tools"><span class="board-instruction">'+I("pointer",15)+prompt+'</span><span class="board-buttons"><button class="tool" data-action="reserve" '+(s.mode!=="move"?"disabled":"")+' title="Choose a reserve piece">'+I("layers",16)+'Reserve</button><button class="tool rotate-tool" data-action="flip" title="Rotate the board" aria-label="Rotate the board">'+I("rotate",16)+'</button></span></div></section>';
}
function source(c) {
 return '<span class="reading">Ingersoll, 2nd ed. · pp. '+c.pages+'</span>';
}
function grouped(renderCard,grid) {
 return Stages.map((stage,i)=>'<section class="path-stage"><h3>'+stage.name+'</h3><p class="stage-reason">'+stage.reason+'</p><div class="'+grid+'">'+Courses.filter(c=>c.stage===i).map(renderCard).join("")+'</div></section>').join("");
}
function scenario() {
 const d=Drills[s.id],dia=d.diagram;
 const sketch=dia?'<div class="study-sketch">'+StudyBoard.draw({board:dia.tiles,fromBoard:dia.tiles,legal:[],target:dia.target,focusCell:dia.cell,mode:"observe",readOnly:true})+'</div>':'';
 return '<section class="briefing" aria-label="Analysis exercise"><div class="briefing-label">'+I("book",18)+(dia?"Local position":"Position briefing")+'</div>'+sketch+'<dl>'+d.facts.map(([name,value])=>'<div><dt>'+name+'</dt><dd>'+value+'</dd></div>').join("")+'</dl></section>';
}
function coach(){
 const d=Drills[s.id],heads='<div class="desktop-title"><div class="panel-eyebrow">'+tag()+'<span class="meta">'+positionText()+'</span></div><h2>'+title()+'</h2><p class="goal">'+goal()+'</p></div>';
 let body="",actions="";
 if(s.mode==="decision"){
  body='<div class="coach-body"><div class="objective-label">'+I("eye",17)+'Choose your plan</div><div class="choices">'+s.answerOrder.map(i=>'<button data-decision="'+i+'" class="btn choice" '+(s.wrongAnswers.includes(i)?"disabled":"")+'>'+d.options[i][0]+'</button>').join("")+'</div>'+(s.feedback?'<p class="notice">'+s.feedback+'</p>':'')+'</div>';
  if(s.hint)body+='<p class="hint-box">'+(s.solution?d.options[0][0]:d.hint)+'</p>';
  if(!s.solution)actions='<div class="action-stack">'+(s.hint?btn("reveal","Show answer","eye"):btn("hint","Get a hint","bulb"))+'</div>';
 } else if(s.mode==="move"){
  const actionTitle=s.selected?sayId(s.selected):s.stage?"Your placement":"Your move";
  const prompt=s.info||(s.stage?s.reply:!R.locate(s.board,s.side+"Q1")?"Open your reserve and choose the queen, then select a highlighted space.":"Select a "+sideName().toLowerCase()+" piece or open your reserve. Choose a highlighted destination.");
  body='<div class="coach-body"><div class="objective-label">'+I(s.selected?"board":"target",17)+actionTitle+'</div><p class="micro">'+prompt+'</p></div>';
  if(s.hint)body+='<div class="hint-box"><div class="hint-title">'+I("bulb",16)+(s.solution?"Solution":"Hint")+'</div><div>'+ (s.solution?solutionText():s.stage?"Open your reserve and look for a legal space touching the queen stack and no other white piece.":d.hint)+'</div></div>';
  actions='<div class="action-stack '+(s.hint?"":"two")+'">'+(s.solution?"":!s.hint?btn("hint","Get a hint","bulb","gold full"):btn("reveal","Show a move","eye","gold full"))+
   (s.hint?"":btn("reveal","Show solution","eye","plain full"))+'</div>';
 } else if(s.mode==="retry"){
  body='<div class="coach-body"><div class="objective-label">'+I("eye",17)+'After your move</div><div class="notice">'+s.feedback+'</div></div>';
  actions='<div class="action-stack">'+btn("retry","Try another move","reset","gold full")+'</div>';
 } else if(s.mode==="quiz"){
  body='<div class="coach-body"><div class="subtle-label">'+I("check",18)+'Tactic played</div><p class="micro">'+d.check+'</p><div class="choices">'+s.answerOrder.map(i=>'<button data-answer="'+i+'" class="btn choice '+(s.wrongAnswers.includes(i)?"missed":"")+'" '+(s.wrongAnswers.includes(i)?"disabled":"")+'>'+d.answers[i]+'</button>').join("")+'</div>'+
  (s.wrongAnswers.length?'<div class="notice">Look again at the final position and try another explanation.</div>':'')+'</div>';
 } else {
  body='<div class="coach-body"><div class="subtle-label">'+I("check",18)+'Exercise complete</div><p class="micro">'+d.why+'</p><div class="notice good">'+(s.assisted?"Completed with guidance.":"Solved without guidance.")+'</div></div>';
  const last=sequence().at(-1)===s.id;
  actions='<div class="action-stack">'+btn("next",nextLabel(),last?"chart":"board","green full")+btn("replay","Replay exercise","reset","plain full")+'</div>';
 }
 return '<aside class="coach" aria-label="Exercise coach">'+heads+body+actions+source(course(s.id))+'</aside>';
}
function practice(){
 return '<div class="hero"><div><h1>Tactics studio</h1><p>'+(mixed?"Mixed practice":("Lesson "+number(course(s.id))+" of "+Courses.length+" · "+Stages[course(s.id).stage].name))+'</p></div>'+btn("mix","Mixed practice","mix")+'</div><div class="workspace"><div class="mobile-task"><div>'+tag()+'<h2>'+title()+'</h2></div><p>'+goal()+'</p></div>'+(Drills[s.id].type==="decision"?scenario():board())+coach()+'</div><div class="section-head"><h2>Training library</h2><span class="meta">'+Object.keys(progress).length+' of '+ids.length+' exercises completed</span></div>'+grouped(courseCard,"course-grid");
}
function guide(){
 return '<div class="hero"><div><h1>Field guide</h1><p>Follow the learning order or look up a tactic before a game.</p></div></div>'+grouped(c=>'<article class="page-card"><div class="lesson-top"><span class="course-icon '+c.color+'">'+I(c.icon,22)+'</span><h2>'+number(c)+'. '+c.name+'</h2></div><p>'+c.principle+'</p><p class="bottom-help">'+c.watch+'</p>'+source(c)+'<button class="btn" data-course="'+c.id+'">Practise this tactic</button></article>',"page-grid")+'<details class="guide-rules"><summary>Movement and placement reference</summary><ul><li>The queen and beetle move one cell. A beetle can also climb or descend a stack.</li><li>An ant slides any distance around the hive. A spider slides exactly three cells, without retracing its path.</li><li>A grasshopper jumps straight over one or more occupied cells to the first empty cell.</li><li>Ground-level slides need continuous contact. Two occupied flanks close the gate.</li><li>A new bug touches your colour only, except on each side’s first placement. Place your queen by your fourth turn before moving any bugs.</li><li>Keep one connected hive. Surrounding both queens on one move is a draw.</li></ul></details><p class="guide-note">Original exercises. Expansion lessons use tactical scenarios. Printed page references follow Randy Ingersoll’s second edition. Further reading · <a href="https://chatgpt.com/library?file_id=libfile_40bdb4cf89a8819192df2c1db2cc3744&amp;account_id=personal" target="_blank" rel="noopener">Play Hive Like a Champion</a> · <a href="https://www.gen42.com/wp-content/uploads/Hive-rules.pdf" target="_blank" rel="noopener">Official Hive rules</a></p>';
}
function stats(){
 const count=Object.keys(progress).length,solo=Object.values(progress).filter(x=>x==="independent").length;
 return '<div class="hero"><div><h1>Your progress</h1><p>Revisit a position or test a tactic without a hint.</p></div>'+btn("review","Review practice","mix")+'</div><div class="summary-card"><div class="stat-row"><div><strong>'+count+' / '+ids.length+'</strong><span>Exercises completed</span></div><div><strong>'+solo+'</strong><span>Solved unaided</span></div><div><strong>'+(count-solo)+'</strong><span>Completed with guidance</span></div></div><p>'+ (storageMessage||"Your best result for each exercise is saved in this browser.")+'</p></div>'+grouped(c=>'<section class="page-card"><div class="lesson-top"><span class="course-icon '+c.color+'">'+I(c.icon,22)+'</span><h2>'+number(c)+'. '+c.name+'</h2></div>'+segments(c)+'<div class="drill-list">'+c.ids.map(id=>'<button class="drill-link" data-drill="'+id+'"><span>'+Drills[id].title+'</span><span class="meta">'+({guided:"Guided",independent:"Unaided"}[progress[id]]||"Unplayed")+'</span></button>').join("")+'</div></section>',"page-grid");
}
// ---- Openers trainer. Lines live in openers.js and are verified by check-openers.cjs. ----
const okey="hive-study.openers.v1",verdictLabel={best:"Book move",playable:"Playable",weak:"Weak"};
function readOpeners(){try{const obj=JSON.parse(localStorage.getItem(okey))||{};return Object.fromEntries(Openers.filter(x=>["guided","independent"].includes(obj[x.id])).map(x=>[x.id,obj[x.id]]))}catch{return {}}}
// Branching lines: progress per branch route, {lineId:{routeKey:"guided"|"independent"}}.
const bkey="hive-study.openers.branches.v1";
function readBranches(){try{const obj=JSON.parse(localStorage.getItem(bkey))||{};return obj&&typeof obj==="object"?obj:{}}catch{return {}}}
let oprog=readOpeners(),bprog=readBranches(),o=null;
const opener=()=>Openers.find(x=>x.id===o.id);
// A single-move opener is treated as a line of one step; multi-move lines carry steps[].
const stepsOf=x=>x.steps||[x];
// Every route through a line. A step whose then.branches lists several opponent replies is the last
// of its steps[]; each branch carries its own steps[]. Linear lines and single openers have one route.
function routesOf(steps,acc=[],thens=[],key=[],names=[]){
 const k=steps.findIndex(st=>st.then&&st.then.branches),head=k<0?steps:steps.slice(0,k+1);
 const t=[...thens,...head.map(st=>st.then||null)];
 if(k<0)return [{steps:[...acc,...head],thens:t,key:key.join("."),names}];
 const bs=steps[k].then.branches;
 return bs.flatMap((b,i)=>{const tt=[...t];tt[tt.length-1]={...b,branch:{i,n:bs.length,name:b.name}};return routesOf(b.steps,[...acc,...head],tt,[...key,i],[...names,b.name])});
}
const routeCount=x=>routesOf(stepsOf(x)).length;
// Pick the computer's branch for this run: a route not solved yet and not the one just played if
// possible, at random among those.
function pickRoute(x,lastKey){
 const rs=routesOf(stepsOf(x)),done=bprog[x.id]||{};
 const pool=[rs.filter(r=>!done[r.key]&&r.key!==lastKey),rs.filter(r=>!done[r.key]),rs.filter(r=>r.key!==lastKey),rs].find(p=>p.length);
 return pool[Math.floor(Math.random()*pool.length)];
}
const step=()=>o.route.steps[o.step];
const replyFor=m=>step().replies.find(r=>r.moves.some(([id,to])=>id===m.id&&to===m.to));
const isBest=m=>replyFor(m)?.verdict==="best";
const findMove=(b,ply,[piece,to])=>R.moves(b,ply%2?"b":"w",ply).find(m=>m.id===piece&&m.to===to);
function startOpener(id,lastKey=null){
 const x=Openers.find(k=>k.id===id);let b={};
 x.h.forEach((mv,ply)=>{b=R.play(b,findMove(b,ply,mv))});
 const ply=x.h.length,side=ply%2?"b":"w";
 o={id,route:pickRoute(x,lastKey),base:b,board:b,ply,side,step:0,legal:R.moves(b,side,ply),selected:null,mode:"move",reply:null,hint:false,solution:false,assisted:false,stepHelp:false,info:"",last:x.h.at(-1)?.[1]||null,flip:false,played:x.h.map(([p])=>p),results:[],prev:null};
}
function stepGrade(res){
 const tail=res.help?" with a hint":"";
 return res.first==="best"?"Book move, first try"+tail:(verdictLabel[res.first]||"Not a book reply")+" first, then the book move"+tail;
}
function recordOpener(){
 oprog={...readOpeners(),...oprog};
 const x=opener(),n=routeCount(x);
 if(n>1){
  // Branching line: solved once every branch route has been solved at least once.
  bprog={...readBranches(),...bprog};const mine={...(bprog[o.id]||{})};
  if(mine[o.route.key]!=="independent")mine[o.route.key]=o.assisted?"guided":"independent";
  bprog[o.id]=mine;
  const vals=routesOf(stepsOf(x)).map(r=>mine[r.key]);
  if(vals.every(Boolean)&&oprog[o.id]!=="independent")oprog[o.id]=vals.every(v=>v==="independent")?"independent":"guided";
 }else if(oprog[o.id]!=="independent")oprog[o.id]=o.assisted?"guided":"independent";
 try{localStorage.setItem(okey,JSON.stringify(oprog));if(n>1)localStorage.setItem(bkey,JSON.stringify(bprog))}catch{storageMessage="Progress is available for this session. Browser storage is unavailable."}
}
const branchesSolved=x=>routesOf(stepsOf(x)).filter(r=>(bprog[x.id]||{})[r.key]).length;
function openerSolution(){const m=o.legal.find(isBest);return (m.from?"Move the ":"Place the reserve ")+sayId(m.id).toLowerCase()+" on the gold space."}
function openerBoard(){
 const side=o.side==="w"?"White":"Black";
 const prompt=o.mode!=="move"?"Your reply is shown on the board.":o.solution?"Play the gold destination to try the book move.":o.selected?"Choose a highlighted destination.":"Select a piece or open your reserve.";
 return '<section class="board-card" aria-label="Opening board"><div class="board-bar"><div class="board-heading">'+I("board",20)+'Opening board</div><span class="turn-pill"><b class="'+(o.side==="b"?"black-token":"")+'"></b>'+(o.mode==="move"?side+" to move":"After your reply")+'</span></div><div class="board-plane">'+StudyBoard.draw({board:o.board,fromBoard:o.base,selected:o.selected,legal:o.legal,target:null,focusCell:Object.keys(o.base).length?null:"0,0",flip:o.flip,mode:o.mode==="move"?"move":"observe",last:o.last,solution:o.solution,pass:isBest})+'</div><div class="board-tools"><span class="board-instruction">'+I("pointer",15)+prompt+'</span><span class="board-buttons"><button class="tool" data-action="o-reserve" '+(o.mode!=="move"?"disabled":"")+' title="Choose a reserve piece">'+I("layers",16)+'Reserve</button><button class="tool rotate-tool" data-action="o-flip" title="Rotate the board" aria-label="Rotate the board">'+I("rotate",16)+'</button></span></div></section>';
}
function openerGoal(){const x=opener();return (x.steps&&step().goal)||x.goal}
function openerCoach(){
 const x=opener(),i=Openers.indexOf(x),st=step(),n=o.route.steps.length,multi=!!x.steps,nb=routeCount(x);
 const line=o.played.length?o.played.map((id,k)=>(k+1)+". "+sayId(id)).join(" · "):"Empty board. White places first.";
 const opp=o.side==="w"?"Black":"White";
 let body='<div class="coach-body"><p class="micro">'+x.summary+'</p><p class="micro"><b>Line so far:</b> '+line+'</p>',actions="";
 if(o.mode==="move"){
  if(o.prev)body+='<div class="notice good"><b>Move '+o.step+': '+o.prev.reply.name+' · Book move.</b> '+o.prev.reply.why+'</div><div class="objective-label">'+I("board",17)+opp+' replied: '+sayId(o.prev.answer.id)+' to ('+o.prev.answer.to+')</div>'+(o.prev.branch?'<p class="micro branch-taken"><b>Branch '+(o.prev.branch.i+1)+' of '+o.prev.branch.n+': '+o.prev.branch.name+'.</b> Your next move depends on this reply.</p>':'')+'<p class="micro">'+o.prev.why+'</p>'+
   (o.prev.alts.length?'<details class="reply-note"><summary>Other replies '+opp+' could play</summary>'+o.prev.alts.map(a=>'<p class="micro"><b>'+sayId(a.move[0])+' to ('+a.move[1]+'):</b> '+a.why+'</p>').join("")+'</details>':'');
  body+=(o.info?'<p class="micro">'+o.info+'</p>':'')+(o.hint?'<div class="hint-box"><div class="hint-title">'+I("bulb",16)+(o.solution?"Book move":"Hint")+'</div><div>'+(o.solution?openerSolution():st.hint||x.hint)+'</div></div>':'')+'</div>';
  actions='<div class="action-stack '+(o.hint?"":"two")+'">'+(o.solution?"":!o.hint?btn("o-hint","Get a hint","bulb","gold full"):btn("o-reveal","Show book move","eye","gold full"))+(o.hint?"":btn("o-reveal","Show book move","eye","plain full"))+'</div>';
 }else{
  const r=o.reply,good=r?.verdict==="best";
  body+='<div class="objective-label">'+I(good?"check":"eye",17)+(multi?"Move "+(o.step+1)+": ":"")+(r?r.name+" · "+verdictLabel[r.verdict]:"Not a book reply")+'</div><div class="notice'+(good?" good":"")+'">'+(r?r.why:st.other||x.other)+'</div>';
  if(good&&multi)body+='<div class="subtle-label">'+I("chart",16)+'Line summary</div><ol class="micro line-summary">'+o.results.map((res,k)=>'<li><b>Move '+(k+1)+':</b> '+stepGrade(res)+'</li>').join("")+'</ol>'+
   (nb>1?'<p class="micro branch-path"><b>Branch path:</b> '+o.route.names.map((nm,k)=>opp+' reply '+(k+1)+': '+nm).join(" → ")+'</p><p class="micro"><b>Branches solved:</b> '+branchesSolved(x)+' of '+nb+(branchesSolved(x)<nb?'. Replay line to face a branch you have not solved yet.':'. Every branch of this line is solved.')+'</p>':'');
  if(good)body+='<div class="subtle-label">'+I("book",16)+(multi?'All replies for the last move':'All replies in this line')+'</div>'+st.replies.map(rr=>'<details class="reply-note"><summary>'+rr.name+' · '+verdictLabel[rr.verdict]+'</summary><p class="micro">'+rr.why+'</p></details>').join("");
  body+='</div>';
  actions='<div class="action-stack">'+(good?btn("o-next",i===Openers.length-1?"Back to first opener":"Next opener","board","green full"):"")+(good&&multi?btn("o-replay","Replay line","reset","plain full"):btn("o-retry",good?"Try another reply":"Try another move","reset",good?"plain full":"gold full"))+'</div>';
 }
 return '<aside class="coach" aria-label="Opener coach"><div class="desktop-title"><div class="panel-eyebrow"><span class="tag sage">'+I("target",14)+x.group+'</span><span class="meta">Opener '+(i+1)+' of '+Openers.length+(multi?' · Move '+(o.step+1)+' of '+n:'')+(nb>1?' · '+nb+' branches':'')+'</span></div><h2>'+x.name+'</h2><p class="goal">'+openerGoal()+'</p></div>'+body+actions+'<span class="reading">Ingersoll, 2nd ed. · pp. '+x.pages+'</span></aside>';
}
function openerCard(x){
 const nb=routeCount(x),label={guided:"Found with guidance",independent:"Found unaided"}[oprog[x.id]];
 const status=nb>1?(label?label+" · ":"")+branchesSolved(x)+" of "+nb+" branches":label||"Not solved yet";
 return '<button class="course-card '+(x.id===o.id?"current":"")+'" data-opener="'+x.id+'"><span class="course-top"><span class="course-icon sage">'+I("target",22)+'</span><span class="course-name">'+x.name+'</span></span><span class="course-sub">'+x.group+' · '+(x.steps?Math.max(...routesOf(x.steps).map(r=>r.steps.length))+'-move line':x.replies.length+' replies')+(nb>1?' · '+nb+' branches':'')+'</span><span class="mini-progress"><span>'+status+'</span></span></button>';
}
function openersPage(){
 if(!o)startOpener(Openers[0].id);
 const x=opener();
 return '<div class="hero"><div><h1>Openers trainer</h1><p>Pick an opening, see it on the board and play your reply.</p></div></div><div class="workspace"><div class="mobile-task"><div><span class="tag sage">'+I("target",14)+x.group+'</span><h2>'+x.name+'</h2></div><p>'+openerGoal()+'</p></div>'+openerBoard()+openerCoach()+'</div><div class="section-head"><h2>Opening library</h2><span class="meta">'+Object.keys(oprog).length+' of '+Openers.length+' openers solved</span></div><div class="course-grid">'+Openers.map(openerCard).join("")+'</div>';
}
function openerPlay(m){
 const x=opener(),st=step(),r=replyFor(m)||null,then=o.route.thens[o.step],n=o.route.steps.length;
 o.board=R.play(o.base,m);o.last=m.to;o.selected=null;o.hint=false;o.solution=false;o.info="";o.reply=r;
 o.results[o.step]??={first:r?r.verdict:"other",help:false};
 if(r?.verdict!=="best"){
  o.assisted=true;o.mode="result";
  notify(r?r.name+". "+verdictLabel[r.verdict]+". "+r.why:st.other||x.other);
 }else{
  o.results[o.step].help=o.stepHelp;
  if(o.step<n-1){
   // Book move inside a line: the opponent's reply (this route's branch, if the step branches) is
   // played at once and the next step starts.
   const a=findMove(o.board,o.ply+1,then.move);
   o.played.push(m.id,a.id);o.board=R.play(o.board,a);o.base=o.board;o.ply+=2;o.step++;
   o.legal=R.moves(o.base,o.side,o.ply);o.last=a.to;o.mode="move";o.reply=null;o.stepHelp=false;
   o.prev={reply:r,answer:a,why:then.why,alts:then.alts||[],branch:then.branch||null};
   notify(r.name+". Book move. "+(o.side==="w"?"Black":"White")+" replied: "+sayId(a.id)+" to "+a.to+". "+(then.branch?"Branch "+(then.branch.i+1)+" of "+then.branch.n+": "+then.branch.name+". ":"")+then.why+" Move "+(o.step+1)+" of "+n+".");
   render();main.querySelector('[data-action="o-hint"],[data-action="o-reveal"]')?.focus({preventScroll:true});return;
  }
  o.mode="result";recordOpener();
  notify(r.name+". "+verdictLabel[r.verdict]+". "+r.why);
 }
 render();main.querySelector('[data-action="o-next"],[data-action="o-retry"],[data-action="o-replay"]')?.focus({preventScroll:true});
}
function openerCell(k){
 if(o.mode!=="move")return;
 const move=o.selected&&o.legal.find(m=>m.id===o.selected&&m.to===k);
 if(move)return openerPlay(move);
 const id=R.top(o.board,k);if(!id)return;
 if(id[0]!==o.side){o.info=sayId(id)+" belongs to the other side. Select one of your own pieces.";notify(o.info);render();return}
 const opts=o.legal.filter(m=>m.id===id);
 o.selected=o.selected===id?null:id;o.solution=false;
 o.info=!o.selected?"":opts.length?opts.length+" legal destination"+(opts.length===1?"":"s")+". Choose a marked space.":!R.locate(o.base,o.side+"Q1")?"Bugs cannot move until your queen is placed.":!R.connected(R.lift(o.base,k))?"This piece holds the hive together, so it cannot move.":"This piece has no legal destination from here.";
 notify(o.info||"Piece deselected.");render();
}
function openerAction(a){
 if(a==="o-reserve")return reserve(o);
 if(a==="o-flip")o.flip=!o.flip;
 if(a==="o-hint"||a==="o-reveal"){o.assisted=true;o.stepHelp=true;o.hint=true;o.solution=a==="o-reveal";if(o.solution)o.selected=o.legal.find(isBest)?.id||null;notify(o.solution?openerSolution():step().hint||opener().hint)}
 if(a==="o-retry"){o.board=o.base;o.mode="move";o.reply=null;o.last=o.prev?.answer.to||null;o.info=""}
 if(a==="o-replay")startOpener(o.id,o.route.key);
 if(a==="o-next"){const i=Openers.indexOf(opener());startOpener(Openers[(i+1)%Openers.length].id);window.scrollTo(0,0)}
 render();
}
// ---- Play vs computer. Legal moves, passing and the result come from rules.js; ai.js picks the
// computer's move. g is the game; gpref holds the colour and level the next new game uses. ----
const gpref={human:"w",level:"easy",exp:[]};
let g=null,gTok=0;
const gSide=()=>g.ply%2?"b":"w";
const colourName=c=>c==="w"?"White":"Black";
const levelOf=id=>HiveAI.levels.find(l=>l.id===id);
// Expansion pieces (opt-in). With none on, rules.js and ai.js get no options at all, exactly as before.
const EXP=[["M","Mosquito","Moves like any piece it touches (copying a beetle lets it climb). On top of the hive it moves only as a beetle. Next to a pillbug it can use the pillbug's power."],["L","Ladybug","Moves exactly three spaces: two on top of the hive, then one down into an empty space."],["P","Pillbug","Moves one space, or instead lifts an adjacent piece (either colour) over itself into an empty space next to it. Not a piece that just moved, or one in a stack."]];
const expName=k=>R.names[k]||R.expansionNames[k];
const expAbout=k=>EXP.find(e=>e[0]===k)?.[2]||"";
const gOpts=()=>g.exp.length?{expansions:g.exp,last:g.lastM}:undefined;
const moveText=m=>sayId(m.id)+(m.by?" moved by "+sayId(m.by).toLowerCase()+" from ("+m.from+") to ("+m.to+")":m.from?" from ("+m.from+") to ("+m.to+")":" placed at ("+m.to+")");
const gSnap=()=>({board:g.board,ply:g.ply,last:g.last,lastM:g.lastM,lastMove:g.lastMove,passes:g.passes,info:g.info});
function newGame(){
 gTok++;
 g={human:gpref.human,level:gpref.level,exp:[...gpref.exp],board:{},ply:0,history:[],selected:null,legal:[],last:null,lastM:null,flip:g?.flip||false,over:null,thinking:false,info:"",lastMove:"",passes:0};
 gTurn();
}
// Set up the side to move. A computer turn is played after a short pause so the human's move is seen first.
function gTurn(){
 g.base=g.board;g.side=gSide();g.selected=null;g.thinking=false;
 const res=R.outcome(g.board);
 if(res){g.over=res;g.legal=[];return}
 g.legal=R.moves(g.board,g.side,g.ply,gOpts());
 if(!g.legal.length&&g.passes>=1){g.over="stuck";return}
 if(g.side!==g.human){g.thinking=true;const tok=++gTok;setTimeout(()=>gComputer(tok),350)}
}
function gComputer(tok){
 if(tok!==gTok||!g||g.over)return;
 const o={timeMs:700,history:g.history.map(h=>h.board)};if(g.exp.length)o.rules=gOpts();
 const m=HiveAI.choose(g.board,g.side,g.ply,g.level,o);
 if(!m){g.passes++;g.ply++;g.lastM=null;g.info="The computer has no legal move and passes.";g.lastMove=""}
 else{g.passes=0;g.board=R.play(g.board,m);g.ply++;g.last=m.to;g.lastM={id:m.id,from:m.from||null,to:m.to};g.info="";g.lastMove=moveText(m)}
 gTurn();
 notify((m?"Computer played "+g.lastMove+".":g.info)+" "+gStatus());
 if(page()==="play")render();
}
function gStatus(){
 if(g.over==="draw")return "Draw. Both queens were surrounded by the same move.";
 if(g.over==="stuck")return "Draw. Neither side can move.";
 if(g.over)return g.over===g.human?"You win. The computer's queen is surrounded.":"The computer wins. Your queen is surrounded.";
 if(g.thinking)return "The computer is thinking.";
 return g.legal.length?"Your move.":"You have no legal move. Pass the turn.";
}
function gHuman(m){
 g.history.push(gSnap());
 g.board=R.play(g.board,m);g.ply++;g.last=m.to;g.lastM={id:m.id,from:m.from||null,to:m.to};g.passes=0;g.info="";
 const mine=moveText(m);g.lastMove="";
 gTurn();notify("You played "+mine+". "+gStatus());render();
}
// Why a piece (own or the computer's) has no move this turn; in expansion games, a frozen piece first.
function gWhy(id,k,own){
 const fr=g.exp.length&&g.lastM?.from&&g.lastM.id===id;
 if(!own)return fr?sayId(id)+" moved last turn, so a pillbug can't move it this turn.":sayId(id)+" belongs to the computer. Select one of your own pieces.";
 if(fr)return "This piece moved last turn (by a pillbug), so it can't move or be moved this turn.";
 return !R.locate(g.board,g.human+"Q1")?"Bugs cannot move until your queen is placed.":!R.connected(R.lift(g.board,k))?"This piece holds the hive together, so it cannot move.":"This piece has no legal destination from here.";
}
function gCell(k){
 if(g.over||g.thinking||g.side!==g.human)return;
 const move=g.selected&&g.legal.find(m=>m.id===g.selected&&m.to===k);
 if(move)return gHuman(move);
 const id=R.top(g.board,k);if(!id)return;
 const opts=g.legal.filter(m=>m.id===id),own=id[0]===g.human,lifts=opts.filter(m=>m.by).length,steps=opts.length-lifts;
 // A computer piece can be selected only when your pillbug (or a mosquito next to one) can move it.
 if(!own&&!lifts){g.info=gWhy(id,k,false);notify(g.info);render();return}
 g.selected=g.selected===id?null:id;
 const n=(c,w)=>c+" "+w+(c===1?"":"s");
 g.info=!g.selected?"":opts.length?(steps?n(steps,"legal destination"):"")+(steps&&lifts?" and ":"")+(lifts?n(lifts,"move-with-pillbug target")+" (violet, with an arrow)":"")+". Choose a marked space.":gWhy(id,k,true);
 if(g.selected&&own&&g.exp.includes("P")&&R.abilities(g.board,k,gOpts()).length)g.info+=" To use its pillbug power, select a piece next to it.";
 notify(g.info||"Piece deselected.");render();
}
function playBoard(){
 const mine=!g.over&&!g.thinking&&g.side===g.human;
 const prompt=g.over?"Game over. Start a new game or undo your last move.":g.thinking?"The computer is choosing its move.":!g.legal.length?"You have no legal move. Pass the turn.":g.selected?"Choose a highlighted destination.":R.locate(g.board,g.human+"Q1")?"Select a piece or open your reserve.":"Open your reserve to choose a piece.";
 const turn=g.over?"Game over":g.thinking?"Computer ("+colourName(g.side)+") thinking…":"Your move · "+colourName(g.human);
 return '<section class="board-card" aria-label="Game board"><div class="board-bar"><div class="board-heading">'+I("board",20)+'Game board</div><span class="turn-pill"><b class="'+(!g.over&&g.side==="b"?"black-token":"")+'"></b>'+turn+'</span></div><div class="board-plane">'+StudyBoard.draw({board:g.board,fromBoard:g.board,selected:g.selected,legal:g.legal,target:null,focusCell:Object.keys(g.board).length?null:"0,0",flip:g.flip,mode:mine?"move":"observe",last:g.last,solution:false,pass:()=>false})+'</div><div class="board-tools"><span class="board-instruction">'+I("pointer",15)+prompt+'</span><span class="board-buttons"><button class="tool" data-action="g-reserve" '+(mine&&g.legal.length?"":"disabled")+' title="Choose a reserve piece">'+I("layers",16)+'Reserve</button><button class="tool rotate-tool" data-action="g-flip" title="Rotate the board" aria-label="Rotate the board">'+I("rotate",16)+'</button></span></div></section>';
}
function playCoach(){
 const lv=levelOf(g.level),turnNo=Math.floor(g.ply/2)+1,pending=gpref.human!==g.human||gpref.level!==g.level||gpref.exp.join("")!==g.exp.join("");
 const seg=(act,on,label)=>'<button type="button" class="btn" data-action="'+act+'" aria-pressed="'+on+'">'+label+'</button>';
 let body='<div class="coach-body">';
 if(g.over){
  const won=g.over===g.human;
  body+='<div class="notice game-over'+(won?" good":"")+'" role="status">'+I(won?"check":"eye",17)+' <b>'+(won?"You win!":g.over==="draw"||g.over==="stuck"?"Draw.":"The computer wins.")+'</b> '+gStatus().replace(/^(You win|The computer wins|Draw)\. ?/,"")+'</div>';
 }else if(g.thinking)body+='<div class="objective-label">'+I("eye",17)+'The computer is thinking…</div>';
 else if(!g.legal.length)body+='<div class="notice">You have no legal move, so you must pass.</div>'+btn("g-pass","Pass the turn","chevron","gold full");
 else body+='<div class="objective-label">'+I("target",17)+(g.selected?sayId(g.selected):"Your move")+'</div><p class="micro">'+(g.info||(R.locate(g.board,g.human+"Q1")?"Select one of your pieces or open your reserve, then choose a highlighted space.":"Open your reserve and choose a bug. Your queen must be on the board by your fourth turn."))+'</p>';
 if(g.lastMove&&!g.over)body+='<p class="micro last-move"><b>Computer played:</b> '+g.lastMove+'</p>';
 else if(g.lastMove)body+='<p class="micro last-move"><b>Last move:</b> '+g.lastMove+'</p>';
 body+='<div class="game-settings"><div class="subtle-label">'+I("layers",16)+'Your colour</div><div class="seg">'+seg("g-color-w",gpref.human==="w","White · moves first")+seg("g-color-b",gpref.human==="b","Black")+'</div>';
 body+='<div class="subtle-label">'+I("chart",16)+'Difficulty</div><div class="seg">'+HiveAI.levels.map(l=>seg("g-level-"+l.id,gpref.level===l.id,l.name)).join("")+'</div><p class="micro">'+levelOf(gpref.level).about+'</p>';
 body+='<div class="subtle-label">'+I("info",16)+'Expansion pieces</div><div class="exp-choices">'+EXP.map(([k,name,about])=>'<label class="exp-choice" title="'+about+'"><input type="checkbox" data-action="g-exp-'+k+'"'+(gpref.exp.includes(k)?" checked":"")+'><svg aria-hidden="true" width="24" height="24" viewBox="-24 -24 48 48" style="color:'+StudyBoard.colors[k][0]+'">'+Art.bug[k]+'</svg><span><b>'+name+'</b> <small>'+about+'</small></span></label>').join("")+'</div><p class="micro">Off by default. Each one adds one piece per side; the computer plays with the same set.</p>';
 if(pending)body+='<p class="micro">These settings apply when you start a new game.</p>';
 body+='</div></div>';
 const actions='<div class="action-stack two">'+btn("g-new","New game","reset","green full")+'<button type="button" class="btn plain full" data-action="g-undo" '+(g.history.length?"":"disabled")+'>'+I("rotate",17)+'Undo move</button></div>';
 return '<aside class="coach" aria-label="Game coach"><div class="desktop-title"><div class="panel-eyebrow"><span class="tag sage">'+I("surround",14)+'Practice game</span><span class="meta">'+lv.name+' · Turn '+turnNo+'</span></div><h2>You ('+colourName(g.human)+') vs computer</h2><p class="goal">Surround the computer’s queen before it surrounds yours.</p></div>'+body+actions+'</aside>';
}
function playPage(){
 if(!g)newGame();
 return '<div class="hero"><div><h1>Play vs computer</h1><p>'+(g.exp.length?'A full game of Hive with the '+g.exp.map(k=>expName(k).toLowerCase()).join(", ").replace(/, ([^,]*)$/," and $1")+' against the computer.':'A full game of base Hive against the computer.')+' Choose your colour and difficulty.</p></div></div><div class="workspace"><div class="mobile-task"><div><span class="tag sage">'+I("surround",14)+'Practice game</span><h2>You ('+colourName(g.human)+') vs computer</h2></div><p>'+gStatus()+'</p></div>'+playBoard()+playCoach()+'</div>';
}
function playAction(a){
 if(a==="g-reserve")return reserve(g);
 if(a==="g-flip")g.flip=!g.flip;
 if(a==="g-new")newGame();
 if(a==="g-undo"){const h=g.history.pop();if(h){gTok++;Object.assign(g,{lastM:null},h,{over:null});gTurn();notify("Move undone. "+gStatus())}}
 if(a==="g-pass"&&!g.over&&!g.thinking&&g.side===g.human&&!g.legal.length){g.history.push(gSnap());g.passes++;g.ply++;g.lastM=null;g.lastMove="";g.info="You passed.";gTurn();notify("You passed. "+gStatus())}
 const set=a.match(/^g-(color|level)-(\w+)$/);
 if(set){if(set[1]==="color")gpref.human=set[2];else gpref.level=set[2];if(!g.history.length&&!g.over&&(g.human!==gpref.human||g.level!==gpref.level))newGame()}
 const ex=a.match(/^g-exp-([MLP])$/);
 if(ex){const on=new Set(gpref.exp);on.has(ex[1])?on.delete(ex[1]):on.add(ex[1]);gpref.exp=EXP.map(e=>e[0]).filter(k=>on.has(k));if(!g.history.length&&!g.over)newGame()}
 render();
}
function render(){
 const p=page(),active=document.activeElement;
 const prev=active&&active!==document.body?["data-cell","data-action","data-answer"].map(k=>[k,active.getAttribute(k)]).find(([k,v])=>v!==null):null;
 byId("editionLabel").textContent=p==="openers"?"Opening study":p==="play"?"Practice game":p!=="practice"?"Study guide":course(s.id).stage===5?"Expansion study":"Base game";
 main.innerHTML=p==="guide"?guide():p==="progress"?stats():p==="openers"?openersPage():p==="play"?playPage():practice();
 document.querySelectorAll("[data-nav]").forEach(a=>{const on=a.dataset.nav===p;a.classList.toggle("active",on);if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
 if(prev){const el=main.querySelector('['+prev[0]+'="'+prev[1]+'"]:not(:disabled)');if(el)el.focus({preventScroll:true})}
 document.title=(p==="practice"?"Tactics studio":p==="guide"?"Field guide":p==="openers"?"Openers trainer":p==="play"?"Play vs computer":"Your progress")+" · Hive Study";
}
function solutionText(){
 const m=s.legal.find(correct);if(!m)return "Try the next position.";
 return (m.from?"Move the ":"Place the reserve ")+sayId(m.id).toLowerCase()+" on the gold destination ("+m.to+").";
}
function play(m){
 s.selected=null;s.solution=false;s.hint=false;s.info="";s.board=R.play(s.base,m);s.last=m.to;
 if(!correct(m)){
  s.assisted=true;s.mode="retry";s.feedback=Training.explainMiss(s.id,s.base,m,s.stage);notify(s.feedback);
 }else if(s.id==="cover3"&&!s.stage){
  const reply=Training.response(s.board,s.ply+1);s.board=R.play(s.board,reply);s.base=s.board;s.ply+=2;s.stage=1;s.last=reply.to;
  s.legal=R.moves(s.base,"w",s.ply);
  s.reply="Black replied with "+sayId(reply.id).toLowerCase()+" to ("+reply.to+"). Open your reserve to make the direct drop.";notify(s.reply);
 }else{s.mode="quiz";s.finalMove=m;notify("Tactic played. "+Drills[s.id].check)}
 render();
 if(s.mode==="quiz")main.querySelector("[data-answer]")?.focus({preventScroll:true});
}
function cell(k){
 if(page()==="openers")return openerCell(k);
 if(page()==="play")return gCell(k);
 if(s.mode!=="move")return;
 const move=s.selected&&s.legal.find(m=>m.id===s.selected&&m.to===k);
 if(move){play(move);return}
 const id=R.top(s.board,k);if(!id)return;
 if(id[0]!==s.side){
  s.info=sayId(id)+" belongs to the other side. "+(s.board[k].length>1?"Its stack contains "+s.board[k].map(sayId).join(", ")+". ":"")+"Select a "+sideName().toLowerCase()+" piece to move.";notify(s.info);render();return;
 }
 const opts=s.legal.filter(m=>m.id===id);
 s.selected=s.selected===id?null:id;s.solution=false;
 if(s.selected){s.info=opts.length?opts.length+" legal destination"+(opts.length===1?"":"s")+". Choose a marked space or a highlighted stack.":!R.connected(R.lift(s.base,k))?"This piece holds the hive together. Lifting it would disconnect the hive.":"This piece has no legal destination from here."}else s.info="";
 notify(s.info||"Piece deselected.");render();
}
function reserve(st=s){
 const choices=R.available(st.base,st.side,st.ply,st===g?gOpts():undefined);
 byId("reserveList").innerHTML=choices.map(id=>'<button class="btn reserve-choice" data-reserve="'+id+'"'+(R.names[id[1]]?'':' title="'+expAbout(id[1])+'"')+'><span><svg aria-hidden="true" width="27" height="27" viewBox="-24 -24 48 48" style="color:'+StudyBoard.colors[id[1]][0]+'">'+Art.bug[id[1]]+'</svg>'+expName(id[1])+(R.names[id[1]]?'':' <em class="exp-tag">expansion</em>')+'</span><small>'+((R.stock[id[1]]||R.expansionStock[id[1]])-Number(id.slice(2))+1)+' left</small></button>').join("")||'<p>All your pieces are on the board.</p>';
 dialog.showModal();
}
function startCourse(id){mixed=false;queue=null;const c=Courses.find(x=>x.id===id);begin(c.ids.find(k=>!progress[k])||c.ids[0]);window.scrollTo(0,0)}
function action(a){
 if(a.startsWith("o-"))return openerAction(a);
 if(a.startsWith("g-"))return playAction(a);
 if(a==="reserve")return reserve();
 if(a==="flip"){s.flip=!s.flip;render();return}
 if(a==="hint"||a==="reveal"){
  s.assisted=true;s.hint=true;s.solution=a==="reveal";
  if(s.mode==="decision"){notify(s.solution?Drills[s.id].options[0][0]:Drills[s.id].hint);render();return}
  if(s.solution)s.selected=s.legal.find(correct)?.id||null;
  notify(s.solution?solutionText():Drills[s.id].hint);render();return;
 }
 if(a==="retry"){s.board=s.base;s.mode="move";s.info="";s.last=null;render();return}
 if(a==="replay"){begin(s.id);return}
 if(a==="mix"||a==="review"){
  const guided=ids.filter(id=>progress[id]==="guided"),other=ids.filter(id=>progress[id]!=="guided");
  queue=a==="review"?[...shuffled(guided),...shuffled(other)].slice(0,4):shuffled(Courses.filter(c=>(c.stage===5)===(course(s.id).stage===5)).map(c=>shuffled(c.ids)[0])).slice(0,4);
  mixed=true;begin(queue[0]);window.scrollTo(0,0);return;
 }
 if(a==="next"){const seq=sequence(),i=seq.indexOf(s.id);if(i+1<seq.length)begin(seq[i+1]);else location.hash="progress";window.scrollTo(0,0)}
}
main.addEventListener("click",e=>{
 const el=e.target.closest("[data-cell],[data-action],[data-answer],[data-decision],[data-course],[data-drill],[data-opener]");if(!el)return;
 if(el.hasAttribute("data-cell"))return cell(el.dataset.cell);
 if(el.dataset.action)return action(el.dataset.action);
 if(el.dataset.opener){startOpener(el.dataset.opener);render();window.scrollTo(0,0);return}
 if(el.dataset.course)return startCourse(el.dataset.course);
 if(el.dataset.drill){mixed=false;queue=null;begin(el.dataset.drill);window.scrollTo(0,0);return}
 if(el.hasAttribute("data-decision")&&s.mode==="decision"){
   const i=Number(el.dataset.decision),d=Drills[s.id];
   if(i===0){s.mode="done";record();notify(d.why)}
   else{s.assisted=true;s.wrongAnswers.push(i);s.feedback=d.options[i][1];notify(s.feedback)}
   render();main.querySelector(i===0?'[data-action="next"]':'[data-decision]:not(:disabled)')?.focus({preventScroll:true});return;
 }
 if(el.hasAttribute("data-answer")){
   const answer=Number(el.dataset.answer);
   if(answer===0){s.mode="done";record();notify("Correct. "+Drills[s.id].why)}
   else{s.assisted=true;s.wrongAnswers.push(answer);notify("Try another explanation.")}
   render();if(answer===0)main.querySelector('[data-action="next"]')?.focus({preventScroll:true});else main.querySelector('[data-answer]:not(:disabled)')?.focus({preventScroll:true});
 }
});
main.addEventListener("keydown",e=>{if(["Enter"," "].includes(e.key)&&e.target.hasAttribute("data-cell")){e.preventDefault();cell(e.target.dataset.cell)}});
dialog.addEventListener("click",e=>{
 const b=e.target.closest("[data-reserve]");
 if(b){const st=page()==="openers"?o:page()==="play"?g:s;st.selected=b.dataset.reserve;st.solution=false;st.info="Choose a highlighted placement for your reserve "+expName(st.selected[1]).toLowerCase()+".";dialog.close();render();notify(st.info)}
 else if(e.target.closest("#closeReserve")||e.target===dialog)dialog.close();
});
window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0)});
window.addEventListener("storage",e=>{if(e.key===key){progress=readProgress();render()}if(e.key===okey||e.key===bkey){oprog=readOpeners();bprog=readBranches();render()}});
byId("mark").innerHTML=Art.mark;document.querySelectorAll("[data-icon]").forEach(el=>el.innerHTML=I(el.dataset.icon,18));
const first=ids.find(id=>!progress[id])||ids[0];const initialPage=page();
if(initialPage==="practice")begin(first);
else{const original=location.hash;history.replaceState(null,"","#practice");begin(first);history.replaceState(null,"",original);render()}
})();

