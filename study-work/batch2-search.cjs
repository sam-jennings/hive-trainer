// Scratch search for drills batch 2. Same random aggressive playouts as batch1-search.cjs,
// tested against the themes batch 1 left thin plus the new trap / replace / unpin objectives.
// Usage: node study-work/batch2-search.cjs <seed> <games> <out.json>
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({});
for(const f of ['rules','positions','objectives'])vm.runInContext(fs.readFileSync('hive-study/dist/'+f+'.js','utf8'),ctx);
const {R,P,O}=vm.runInContext('({R:HiveRules,P:Positions,O:Objectives})',ctx);
const [seedArg='777',gamesArg='600',out='study-work/batch2-found.json']=process.argv.slice(2);
const used=new Set(Object.values(P).map(p=>JSON.stringify(p.h)));
const found=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{};
for(const file of ['study-work/batch1-found.json',out])if(fs.existsSync(file))
 for(const list of Object.values(JSON.parse(fs.readFileSync(file,'utf8'))))for(const c of list)used.add(JSON.stringify(c.h));
const CAP=6;let gameCats=new Set();
function take(cat,h,extra){
 const key=JSON.stringify(h);
 if(used.has(key)||gameCats.has(cat)||(found[cat]||[]).length>=CAP)return false;gameCats.add(cat);
 (found[cat]??=[]).push({h:h.slice(),...extra});used.add(key);
 console.log(cat,h.length,JSON.stringify(extra).slice(0,90));return true;
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
 const all=R.moves(b,'w',len);
 const black=R.pieces(b).filter(id=>id[0]==='b'),white=R.pieces(b).filter(id=>id[0]==='w');
 const solve=p=>all.filter(m=>O.succeeds(b,m,{h,...p}));
 if(O.winsNow(b,'w',len))return;
 if(O.winsNow(b,'b',len+1)){
  // Defences that do not move the queen (pin, block, or moving a neighbour away).
  if(!full('defendX')){
   const good=solve({task:'defend'});
   if(good.length&&good.length<=4&&good.every(m=>m.id!=='wQ1'))take('defendX',h,{task:'defend',good:good.length,legal:all.length});
  }
  return;
 }
 if(!full('mate2')&&R.ring(b,q)>=4){const good=solve({task:'mate2'});if(good.length&&good.length<=3)take('mate2',h,{task:'mate2',good:good.length});}
 if(!full('trap')&&O.mobile(b,'bQ1')&&R.ring(b,q)>=3){const good=solve({task:'trap'});if(good.length&&good.length<=3)take('trap',h,{task:'trap',target:'bQ1',good:good.length});}
 if(!full('counter')){const good=solve({task:'counter'});if(good.length&&good.length<=2)take('counter',h,{task:'counter',good:good.length});}
 if(!full('draw')){const good=solve({task:'draw'});if(good.length&&good.length<=2)take('draw',h,{task:'draw',good:good.length});}
 if(!full('shutout')){const good=solve({task:'shutout'});if(good.length&&good.length<=3)take('shutout',h,{task:'shutout',good:good.length});}
 // Pin replacement: a white piece holds a pin; another white move takes the pin over.
 if(!full('replace'))for(const t of black.filter(id=>O.pinned(b,id)))for(const f of white.filter(id=>O.mobile(b,id)&&id[1]!=='Q')){
  if(O.pinned(R.lift(b,R.locate(b,f)),t))continue;
  const good=solve({task:'replace',target:t,free:f});
  if(good.length&&good.length<=3&&take('replace',h,{task:'replace',target:t,free:f,good:good.length}))break;
 }
 // Release a pinned white piece by moving a bug that hangs off it.
 if(!full('unpin'))for(const t of white.filter(id=>O.pinned(b,id)&&id[1]!=='Q')){
  const good=solve({task:'unpin',target:t});
  if(good.length&&good.length<=3&&take('unpin',h,{task:'unpin',target:t,good:good.length}))break;
 }
 // Fill a pocket to free a pinned white ant (book p. 36, Figs 6.1.7-6.1.8).
 if(!full('fillA'))for(const t of white.filter(id=>id[1]==='A'&&O.pinned(b,id))){
  const k=R.locate(b,t);if(O.hasPocket(b,k)||R.ring(b,k)<3)continue;
  const good=solve({task:'fill',target:t});
  if(good.length&&good.length<=3&&take('fillA',h,{task:'fill',target:t,good:good.length}))break;
 }
 // Second beetle covers a defender while the first holds the queen.
 const guard=R.top(b,q);
 if(!full('pair')&&guard.startsWith('wB'))for(const t of black.filter(id=>id!=='bQ1'&&O.mobile(b,id))){
  const good=solve({task:'pair',target:t,guard});
  if(good.length===1&&take('pair',h,{task:'pair',target:t,guard}))break;
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
