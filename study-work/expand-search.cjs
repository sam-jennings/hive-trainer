// Scratch search for reachable original teaching positions.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({});
for(const f of ['rules','positions','objectives'])vm.runInContext(fs.readFileSync('hive-study/dist/'+f+'.js','utf8'),ctx);
const {R,P,O}=vm.runInContext('({R:HiveRules,P:Positions,O:Objectives})',ctx);
const out=process.argv[2], found={}, used=new Set(Object.values(P).map(p=>JSON.stringify(p.h)));
const take=(id,h,p)=>{const key=JSON.stringify(h);if(!found[id]&&!used.has(key)){found[id]={h:h.slice(),...p};used.add(key);fs.writeFileSync(out,JSON.stringify(found));console.log(id,h.length)}};
const N=(a,b)=>R.neighbors(a).includes(b);
let seed=71938;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function examine(b,h){
 const w=R.locate(b,'wQ1'),q=R.locate(b,'bQ1'),len=h.length;
 if(!q||!w||used.has(JSON.stringify(h)))return;
 const units=R.pieces(b), cells=Object.keys(b),black=units.filter(id=>id[0]==='b'),white=units.filter(id=>id[0]==='w');
 const all=R.moves(b,'w',len),moves=all.filter(m=>m.from),drops=all.filter(m=>!m.from);
 const occupiedMoves=(s)=>cells.filter(k=>R.top(b,k)[0]===s).flatMap(k=>R.destinations(b,k));
 function tryIt(id,params,ms){
  if(found[id])return;
  if(ms.some(m=>O.succeeds(b,m,{h,...params})))take(id,h,params);
 }
 for(const kind of ['G','S'])if(!found['place'+kind]&&len<19){
  for(const cell of R.neighbors(q).filter(k=>!b[k]))tryIt('place'+kind,{task:'deploy',kind,cell},drops.filter(m=>m.id[1]===kind));
 }
 if(!found.block&&R.ring(b,w)>=3){
  for(const cell of R.neighbors(w).filter(k=>!b[k])){
   for(const target of black.filter(id=>id[1]==='A'&&O.reaches(b,id,cell))){
    tryIt('block',{task:'block',target,cell},all.filter(m=>N(m.to,cell)&&m.to!==w));
   }
  }
 }
 for(const kind of ['G','B'])if(!found['fill'+kind]){
  for(const target of white.filter(id=>id[1]===kind&&O.pinned(b,id))){
    const k=R.locate(b,target);if(O.hasPocket(b,k)||R.ring(b,k)<3)continue;
    tryIt('fill'+kind,{task:'fill',target},all.filter(m=>N(m.to,k)));
  }
 }
 if(!found.ring&&white.filter(id=>O.pinned(b,id)).length>=2){
  const edge=new Set(cells.flatMap(R.neighbors).filter(k=>!b[k]&&R.ring(b,k)===5));
  for(const cell of edge)tryIt('ring',{task:'ring',cell},all.filter(m=>N(m.to,cell)));
 }
 if(!found.deny&&len>=9&&len<=24&&R.available(b,'b',len+1).length){
  for(const target of black.filter(id=>id[1]==='A'&&O.mobile(b,id))){
   const k=R.locate(b,target);
   for(const cell of R.placements(b,'b').filter(x=>N(x,k))) {
    const ms=moves.filter(m=>m.id[1]==='A'&&N(m.to,k));
    // Require a competing pin that still permits the deployment.
    if(ms.some(m=>{const n=R.play(b,m);return O.pinned(n,target)&&R.placements(n,'b').includes(cell)}))
     tryIt('deny',{task:'deny',target,cell},ms);
   }
  }
 }
 if(!found.pivot&&len<22){
  for(const target of white.filter(id=>id[1]==='G'&&O.mobile(b,id))){
   for(const cell of R.neighbors(q).filter(k=>!b[k]&&!O.reaches(b,target,k)))
     tryIt('pivot',{task:'pivot',cell,target},moves.filter(m=>m.id===target));
  }
 }
 if(!found.pair&&R.top(b,q)?.startsWith('wB')){
  for(const target of black.filter(id=>id[1]!=='Q'&&O.mobile(b,id)))tryIt('pair',{task:'pair',target,guard:R.top(b,q)},moves.filter(m=>m.id[1]==='B'&&m.to===R.locate(b,target)));
 }
 if(!found.counter&&R.ring(b,w)>=3&&R.ring(b,q)>=2){
   tryIt('counter',{task:'counter'},moves.filter(m=>N(m.from,w)&&N(m.to,q)));
 }
 if(!found.draw&&R.ring(b,w)===5&&R.ring(b,q)===5)tryIt('draw',{task:'draw'},all);
 if(!found.shutout&&R.placements(b,'b').length<=2&&occupiedMoves('b').length<8)tryIt('shutout',{task:'shutout'},moves);
}
for (const p of Object.values(P)){let b={},h=[];for(const [id,to] of p.h){if(h.length%2===0&&h.length>=6)examine(b,h);b=R.play(b,{id,to,from:R.locate(b,id)});h.push([id,to]);}}
for(let g=0;g<1500&&Object.keys(found).length<12;g++){
 let b={},h=[];
 for(let ply=0;ply<48;ply++){
   if(ply>=6&&ply%2===0)examine(b,h);
   const side=ply%2?'b':'w',enemy=side==='w'?'b':'w', all=R.moves(b,side,ply).filter(m=>ply>=2||m.id[1]!=='Q');
   if(!all.length)break;
   const enemyQ=R.locate(b,enemy+'Q1'),ownQ=R.locate(b,side+'Q1');
   const weights=all.map(m=>(!ownQ&&m.id[1]==='Q'?8:1)*(m.from?1:1.35)*(m.id[1]==='B'&&b[m.to]?4:1)*(enemyQ&&N(enemyQ,m.to)?3:1)*(enemyQ&&m.to===enemyQ?9:1));
   let x=random()*weights.reduce((a,b)=>a+b);let j=0;while(j<all.length-1&&(x-=weights[j])>=0)j++;
   const m=all[j]; b=R.play(b,m); h.push([m.id,m.to]);if(R.outcome(b))break;
 }
}

