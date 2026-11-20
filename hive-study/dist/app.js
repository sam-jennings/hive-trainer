(() => {
"use strict";
const R=HiveRules, I=Art.icon, main=document.querySelector("#main"), dialog=document.querySelector("#reserve");
const ids=Courses.flatMap(c=>c.ids), key="hive-study.progress.v1";
const course=id=>Courses.find(c=>c.ids.includes(id));
const page=()=>["guide","progress","openers"].includes(location.hash.slice(1))?location.hash.slice(1):"practice";
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
let oprog=readOpeners(),o=null;
const opener=()=>Openers.find(x=>x.id===o.id);
// A single-move opener is treated as a line of one step; multi-move lines carry steps[].
const stepsOf=x=>x.steps||[x];
const step=()=>stepsOf(opener())[o.step];
const replyFor=m=>step().replies.find(r=>r.moves.some(([id,to])=>id===m.id&&to===m.to));
const isBest=m=>replyFor(m)?.verdict==="best";
const findMove=(b,ply,[piece,to])=>R.moves(b,ply%2?"b":"w",ply).find(m=>m.id===piece&&m.to===to);
function startOpener(id){
 const x=Openers.find(k=>k.id===id);let b={};
 x.h.forEach((mv,ply)=>{b=R.play(b,findMove(b,ply,mv))});
 const ply=x.h.length,side=ply%2?"b":"w";
 o={id,base:b,board:b,ply,side,step:0,legal:R.moves(b,side,ply),selected:null,mode:"move",reply:null,hint:false,solution:false,assisted:false,stepHelp:false,info:"",last:x.h.at(-1)?.[1]||null,flip:false,played:x.h.map(([p])=>p),results:[],prev:null};
}
function stepGrade(res){
 const tail=res.help?" with a hint":"";
 return res.first==="best"?"Book move, first try"+tail:(verdictLabel[res.first]||"Not a book reply")+" first, then the book move"+tail;
}
function recordOpener(){
 oprog={...readOpeners(),...oprog};
 if(oprog[o.id]!=="independent")oprog[o.id]=o.assisted?"guided":"independent";
 try{localStorage.setItem(okey,JSON.stringify(oprog))}catch{storageMessage="Progress is available for this session. Browser storage is unavailable."}
}
function openerSolution(){const m=o.legal.find(isBest);return (m.from?"Move the ":"Place the reserve ")+sayId(m.id).toLowerCase()+" on the gold space."}
function openerBoard(){
 const side=o.side==="w"?"White":"Black";
 const prompt=o.mode!=="move"?"Your reply is shown on the board.":o.solution?"Play the gold destination to try the book move.":o.selected?"Choose a highlighted destination.":"Select a piece or open your reserve.";
 return '<section class="board-card" aria-label="Opening board"><div class="board-bar"><div class="board-heading">'+I("board",20)+'Opening board</div><span class="turn-pill"><b class="'+(o.side==="b"?"black-token":"")+'"></b>'+(o.mode==="move"?side+" to move":"After your reply")+'</span></div><div class="board-plane">'+StudyBoard.draw({board:o.board,fromBoard:o.base,selected:o.selected,legal:o.legal,target:null,focusCell:Object.keys(o.base).length?null:"0,0",flip:o.flip,mode:o.mode==="move"?"move":"observe",last:o.last,solution:o.solution,pass:isBest})+'</div><div class="board-tools"><span class="board-instruction">'+I("pointer",15)+prompt+'</span><span class="board-buttons"><button class="tool" data-action="o-reserve" '+(o.mode!=="move"?"disabled":"")+' title="Choose a reserve piece">'+I("layers",16)+'Reserve</button><button class="tool rotate-tool" data-action="o-flip" title="Rotate the board" aria-label="Rotate the board">'+I("rotate",16)+'</button></span></div></section>';
}
function openerGoal(){const x=opener();return (x.steps&&step().goal)||x.goal}
function openerCoach(){
 const x=opener(),i=Openers.indexOf(x),st=step(),n=stepsOf(x).length,multi=!!x.steps;
 const line=o.played.length?o.played.map((id,k)=>(k+1)+". "+sayId(id)).join(" · "):"Empty board. White places first.";
 const opp=o.side==="w"?"Black":"White";
 let body='<div class="coach-body"><p class="micro">'+x.summary+'</p><p class="micro"><b>Line so far:</b> '+line+'</p>',actions="";
 if(o.mode==="move"){
  if(o.prev)body+='<div class="notice good"><b>Move '+o.step+': '+o.prev.reply.name+' · Book move.</b> '+o.prev.reply.why+'</div><div class="objective-label">'+I("board",17)+opp+' replied: '+sayId(o.prev.answer.id)+' to ('+o.prev.answer.to+')</div><p class="micro">'+o.prev.why+'</p>'+
   (o.prev.alts.length?'<details class="reply-note"><summary>Other replies '+opp+' could play</summary>'+o.prev.alts.map(a=>'<p class="micro"><b>'+sayId(a.move[0])+' to ('+a.move[1]+'):</b> '+a.why+'</p>').join("")+'</details>':'');
  body+=(o.info?'<p class="micro">'+o.info+'</p>':'')+(o.hint?'<div class="hint-box"><div class="hint-title">'+I("bulb",16)+(o.solution?"Book move":"Hint")+'</div><div>'+(o.solution?openerSolution():st.hint||x.hint)+'</div></div>':'')+'</div>';
  actions='<div class="action-stack '+(o.hint?"":"two")+'">'+(o.solution?"":!o.hint?btn("o-hint","Get a hint","bulb","gold full"):btn("o-reveal","Show book move","eye","gold full"))+(o.hint?"":btn("o-reveal","Show book move","eye","plain full"))+'</div>';
 }else{
  const r=o.reply,good=r?.verdict==="best";
  body+='<div class="objective-label">'+I(good?"check":"eye",17)+(multi?"Move "+(o.step+1)+": ":"")+(r?r.name+" · "+verdictLabel[r.verdict]:"Not a book reply")+'</div><div class="notice'+(good?" good":"")+'">'+(r?r.why:st.other||x.other)+'</div>';
  if(good&&multi)body+='<div class="subtle-label">'+I("chart",16)+'Line summary</div><ol class="micro line-summary">'+o.results.map((res,k)=>'<li><b>Move '+(k+1)+':</b> '+stepGrade(res)+'</li>').join("")+'</ol>';
  if(good)body+='<div class="subtle-label">'+I("book",16)+(multi?'All replies for the last move':'All replies in this line')+'</div>'+st.replies.map(rr=>'<details class="reply-note"><summary>'+rr.name+' · '+verdictLabel[rr.verdict]+'</summary><p class="micro">'+rr.why+'</p></details>').join("");
  body+='</div>';
  actions='<div class="action-stack">'+(good?btn("o-next",i===Openers.length-1?"Back to first opener":"Next opener","board","green full"):"")+(good&&multi?btn("o-replay","Replay line","reset","plain full"):btn("o-retry",good?"Try another reply":"Try another move","reset",good?"plain full":"gold full"))+'</div>';
 }
 return '<aside class="coach" aria-label="Opener coach"><div class="desktop-title"><div class="panel-eyebrow"><span class="tag sage">'+I("target",14)+x.group+'</span><span class="meta">Opener '+(i+1)+' of '+Openers.length+(multi?' · Move '+(o.step+1)+' of '+n:'')+'</span></div><h2>'+x.name+'</h2><p class="goal">'+openerGoal()+'</p></div>'+body+actions+'<span class="reading">Ingersoll, 2nd ed. · pp. '+x.pages+'</span></aside>';
}
function openerCard(x){
 return '<button class="course-card '+(x.id===o.id?"current":"")+'" data-opener="'+x.id+'"><span class="course-top"><span class="course-icon sage">'+I("target",22)+'</span><span class="course-name">'+x.name+'</span></span><span class="course-sub">'+x.group+' · '+(x.steps?x.steps.length+'-move line':x.replies.length+' replies')+'</span><span class="mini-progress"><span>'+({guided:"Found with guidance",independent:"Found unaided"}[oprog[x.id]]||"Not solved yet")+'</span></span></button>';
}
function openersPage(){
 if(!o)startOpener(Openers[0].id);
 const x=opener();
 return '<div class="hero"><div><h1>Openers trainer</h1><p>Pick an opening, see it on the board and play your reply.</p></div></div><div class="workspace"><div class="mobile-task"><div><span class="tag sage">'+I("target",14)+x.group+'</span><h2>'+x.name+'</h2></div><p>'+openerGoal()+'</p></div>'+openerBoard()+openerCoach()+'</div><div class="section-head"><h2>Opening library</h2><span class="meta">'+Object.keys(oprog).length+' of '+Openers.length+' openers solved</span></div><div class="course-grid">'+Openers.map(openerCard).join("")+'</div>';
}
function openerPlay(m){
 const x=opener(),st=step(),r=replyFor(m)||null;
 o.board=R.play(o.base,m);o.last=m.to;o.selected=null;o.hint=false;o.solution=false;o.info="";o.reply=r;
 o.results[o.step]??={first:r?r.verdict:"other",help:false};
 if(r?.verdict!=="best"){
  o.assisted=true;o.mode="result";
  notify(r?r.name+". "+verdictLabel[r.verdict]+". "+r.why:st.other||x.other);
 }else{
  o.results[o.step].help=o.stepHelp;
  if(o.step<stepsOf(x).length-1){
   // Book move inside a line: the opponent's book reply is played at once and the next step starts.
   const a=findMove(o.board,o.ply+1,st.then.move);
   o.played.push(m.id,a.id);o.board=R.play(o.board,a);o.base=o.board;o.ply+=2;o.step++;
   o.legal=R.moves(o.base,o.side,o.ply);o.last=a.to;o.mode="move";o.reply=null;o.stepHelp=false;
   o.prev={reply:r,answer:a,why:st.then.why,alts:st.then.alts||[]};
   notify(r.name+". Book move. "+(o.side==="w"?"Black":"White")+" replied: "+sayId(a.id)+" to "+a.to+". "+st.then.why+" Move "+(o.step+1)+" of "+stepsOf(x).length+".");
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
 if(a==="o-replay")startOpener(o.id);
 if(a==="o-next"){const i=Openers.indexOf(opener());startOpener(Openers[(i+1)%Openers.length].id);window.scrollTo(0,0)}
 render();
}
function render(){
 const p=page(),active=document.activeElement;
 const prev=active&&active!==document.body?["data-cell","data-action","data-answer"].map(k=>[k,active.getAttribute(k)]).find(([k,v])=>v!==null):null;
 byId("editionLabel").textContent=p==="openers"?"Opening study":p!=="practice"?"Study guide":course(s.id).stage===5?"Expansion study":"Base game";
 main.innerHTML=p==="guide"?guide():p==="progress"?stats():p==="openers"?openersPage():practice();
 document.querySelectorAll("[data-nav]").forEach(a=>{const on=a.dataset.nav===p;a.classList.toggle("active",on);if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
 if(prev){const el=main.querySelector('['+prev[0]+'="'+prev[1]+'"]:not(:disabled)');if(el)el.focus({preventScroll:true})}
 document.title=(p==="practice"?"Tactics studio":p==="guide"?"Field guide":p==="openers"?"Openers trainer":"Your progress")+" · Hive Study";
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
 const choices=R.available(st.base,st.side,st.ply);
 byId("reserveList").innerHTML=choices.map(id=>'<button class="btn reserve-choice" data-reserve="'+id+'"><span><svg aria-hidden="true" width="27" height="27" viewBox="-24 -24 48 48" style="color:'+StudyBoard.colors[id[1]][0]+'">'+Art.bug[id[1]]+'</svg>'+R.names[id[1]]+'</span><small>'+(R.stock[id[1]]-Number(id.slice(2))+1)+' left</small></button>').join("")||'<p>All your pieces are on the board.</p>';
 dialog.showModal();
}
function startCourse(id){mixed=false;queue=null;const c=Courses.find(x=>x.id===id);begin(c.ids.find(k=>!progress[k])||c.ids[0]);window.scrollTo(0,0)}
function action(a){
 if(a.startsWith("o-"))return openerAction(a);
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
 if(b){const st=page()==="openers"?o:s;st.selected=b.dataset.reserve;st.solution=false;st.info="Choose a highlighted placement for your reserve "+R.names[st.selected[1]].toLowerCase()+".";dialog.close();render();notify(st.info)}
 else if(e.target.closest("#closeReserve")||e.target===dialog)dialog.close();
});
window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0)});
window.addEventListener("storage",e=>{if(e.key===key){progress=readProgress();render()}if(e.key===okey){oprog=readOpeners();render()}});
byId("mark").innerHTML=Art.mark;document.querySelectorAll("[data-icon]").forEach(el=>el.innerHTML=I(el.dataset.icon,18));
const first=ids.find(id=>!progress[id])||ids[0];const initialPage=page();
if(initialPage==="practice")begin(first);
else{const original=location.hash;history.replaceState(null,"","#practice");begin(first);history.replaceState(null,"",original);render()}
})();

