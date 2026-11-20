// Scratch search for drills batch 1. Random aggressive playouts; each White-to-move
// position is tested against the drill objectives and stored as a candidate.
// Usage: node study-work/batch1-search.cjs <seed> <games> <out.json>
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({});
for(const f of ['rules','positions','objectives'])vm.runInContext(fs.readFileSync('hive-study/dist/'+f+'.js','utf8'),ctx);
const {R,P,O}=vm.runInContext('({R:HiveRules,P:Positions,O:Objectives})',ctx);
const [seedArg='4242',gamesArg='600',out='study-work/batch1-found.json']=process.argv.slice(2);
const used=new Set(Object.values(P).map(p=>JSON.stringify(p.h)));
const found=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{};
for(const list of Object.values(found))for(const c of list)used.add(JSON.stringify(c.h));
const CAP=6;let gameCats=new Set();
function take(cat,h,extra){
 const key=JSON.stringify(h);
 if(used.has(key)||gameCats.has(cat)||(found[cat]||[]).length>=CAP)return;gameCats.add(cat);
 (found[cat]??=[]).push({h:h.slice(),...extra});used.add(key);
 console.log(cat,h.length,JSON.stringify(extra).slice(0,90));
}
const full=cat=>(found[cat]||[]).length>=CAP;
const N=(a,b)=>R.neighbors(a).includes(b);
let seed=Number(seedArg);const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function compact(b){
 const xy=Object.keys(b).map(k=>k.split(',').map(Number)).map(([x,y])=>[x+y/2,y*.866]);
 return [0,1].every(i=>Math.max(...xy.map(a=>a[i]))-Math.min(...xy.map(a=>a[i]))<=7);
}
function examine(b,h){
 const len=h.length,w=R.locate(b,'wQ1'),q=R.locate(b,'bQ1');
 if(!w||!q||len<10||len>36||used.has(JSON.stringify(h))||!compact(b))return;
 const all=R.moves(b,'w',len),moves=all.filter(m=>m.from),drops=all.filter(m=>!m.from);
 const black=R.pieces(b).filter(id=>id[0]==='b'),white=R.pieces(b).filter(id=>id[0]==='w');
 const live=m=>!R.outcome(R.play(b,m));
 const bWins=O.winsNow(b,'b',len+1), wWins=O.winsNow(b,'w',len);
 // Mate in one by a single piece kind.
 if(wWins){
  const kinds=[...new Set(all.filter(m=>R.outcome(R.play(b,m))==='w').map(m=>m.id[1]))];
  if(kinds.length===1&&!bWins)take('win'+kinds[0],h,{});
  return;
 }
 if(bWins){
  const good=all.filter(m=>O.succeeds(b,m,{h,task:'defend'}));
  if(good.length>=1&&good.length<=Math.max(3,all.length/6))take('defend',h,{task:'defend',good:good.length,legal:all.length,kinds:[...new Set(good.map(m=>m.id[1]+(m.from?'':'*')))].join('')});
  return;
 }
 // Pins of a mobile black piece.
 for(const t of black.filter(id=>O.mobile(b,id))){
  const cat='pin'+t[1];if(full(cat))continue;
  const good=all.filter(m=>{const n=R.play(b,m);return !R.outcome(n)&&O.pinned(n,t)});
  if(good.length&&good.length<=3)take(cat,h,{target:t,good:good.length});
 }
 // Beetle covers of a mobile black piece.
 for(const t of black.filter(id=>O.mobile(b,id))){
  const cat='cover'+t[1];if(full(cat))continue;
  const k=R.locate(b,t);
  const good=moves.filter(m=>m.id[1]==='B'&&m.to===k&&live(m));
  if(good.length)take(cat,h,{target:t,good:good.length});
 }
 // Escape a beetle threat with the queen.
 const risk=x=>Object.keys(x).some(k=>R.top(x,k).startsWith('bB')&&R.destinations(x,k).includes(R.locate(x,'wQ1')));
 if(!full('escape')&&O.mobile(b,'wQ1')&&risk(b)){
  const good=moves.filter(m=>m.id==='wQ1'&&live(m)&&!risk(R.play(b,m)));
  if(good.length&&good.length<R.destinations(b,w).length)take('escape',h,{good:good.length});
 }
 // Gate a liberty against an ant.
 if(!full('block')&&R.ring(b,w)>=3)for(const cell of R.neighbors(w).filter(k=>!b[k]))
  for(const target of black.filter(id=>id[1]==='A'&&O.reaches(b,id,cell))){
   const p={h,task:'block',target,cell};
   if(all.some(m=>O.succeeds(b,m,p)))take('block',h,{task:'block',target,cell});
  }
 // Place a reserve piece aimed at a black queen liberty.
 for(const kind of ['G','S','A'])if(!full('deploy'+kind)&&len<=20)
  for(const cell of R.neighbors(q).filter(k=>!b[k])){
   const p={h,task:'deploy',kind,cell};
   if(!white.some(id=>id[1]===kind&&O.reaches(b,id,cell))&&drops.some(m=>O.succeeds(b,m,p))){take('deploy'+kind,h,{task:'deploy',kind,cell});break}
  }
 // Hopper pivot.
 if(!full('pivot'))for(const target of white.filter(id=>id[1]==='G'&&O.mobile(b,id)))
  for(const cell of R.neighbors(q).filter(k=>!b[k]&&!O.reaches(b,target,k))){
   const p={h,task:'pivot',cell,target};
   if(moves.some(m=>O.succeeds(b,m,p)))take('pivot',h,{task:'pivot',cell,target});
  }
 // Fill a pocket to free a pinned white piece.
 if(!full('fill'))for(const target of white.filter(id=>O.pinned(b,id)&&id[1]!=='Q')){
  const k=R.locate(b,target);if(O.hasPocket(b,k)||R.ring(b,k)<3)continue;
  const p={h,task:'fill',target};
  if(all.some(m=>O.succeeds(b,m,p)))take('fill',h,{task:'fill',target});
 }
 // Mate in two (only when the black queen is already crowded).
 if(!full('mate2')&&R.ring(b,q)>=4){
  const p={h,task:'mate2'},good=all.filter(m=>O.succeeds(b,m,p));
  if(good.length&&good.length<=4)take('mate2',h,{task:'mate2',good:good.length,legal:all.length});
 }
}
for(let g=0;g<Number(gamesArg);g++){
 let b={},h=[];gameCats=new Set();
 for(let ply=0;ply<44;ply++){
  if(ply%2===0)examine(b,h);
  const side=ply%2?'b':'w',enemy=side==='w'?'b':'w',all=R.moves(b,side,ply).filter(m=>ply>=2||m.id[1]!=='Q');
  if(!all.length)break;
  const eq=R.locate(b,enemy+'Q1'),oq=R.locate(b,side+'Q1');
  const weights=all.map(m=>(!oq&&m.id[1]==='Q'?8:1)*(m.from?1:1.35)*(m.id[1]==='B'&&b[m.to]?3:1)*(eq&&N(eq,m.to)?3:1)*(oq&&N(oq,m.to)?0.6:1));
  let x=random()*weights.reduce((a,c)=>a+c);let j=0;while(j<all.length-1&&(x-=weights[j])>=0)j++;
  const m=all[j];b=R.play(b,m);h.push([m.id,m.to]);if(R.outcome(b))break;
 }
}
fs.writeFileSync(out,JSON.stringify(found));
console.log(Object.entries(found).map(([k,v])=>k+':'+v.length).join(' '));
