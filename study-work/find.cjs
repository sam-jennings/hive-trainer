const R=require('../hive-study/dist/rules.js'),fs=require('fs');
const result={}; let seed=18472;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const pos=(b,id)=>R.locate(b,id);
const mobile=(b,id)=>{const k=pos(b,id);return k&&R.top(b,k)===id&&R.destinations(b,k).length};
const moving=(b,side)=>Object.keys(b).filter(k=>R.top(b,k)[0]===side).flatMap(from=>R.destinations(b,from).map(to=>({id:R.top(b,from),from,to})));
const wins=(b,s)=>R.ring(b,pos(b,(s==='w'?'b':'w')+'Q1'))===5?moving(b,s).filter(m=>R.outcome(R.play(b,m))===s):[];
function save(key,h,extra={}) {
if(result[key]||Object.values(result).some(v=>JSON.stringify(v.h)===JSON.stringify(h)))return;
result[key]={h:[...h],...extra};console.log(key,h.length);fs.writeFileSync('study-work/positions.json',JSON.stringify(result));
}
function inspect(b,h){
const w=pos(b,'wQ1'),q=pos(b,'bQ1'),p=h.length;
if(!w||!q||Object.keys(b).length<7)return;
const xy=Object.keys(b).map(k=>k.split(',').map(Number)).map(([x,y])=>[x+y/2,y*.866]);
if([0,1].some(i=>Math.max(...xy.map(a=>a[i]))-Math.min(...xy.map(a=>a[i]))>7))return;
const all=moving(b,'w');
const pin=(id,m)=>{const n=R.play(b,m),k=pos(n,id);return R.top(n,k)===id&&!R.connected(R.lift(n,k))&&!R.outcome(n)};
for(const [key,id] of [['pin1','bA1'],['pin2','bB1'],['pin3','bG1']]){
if(!result[key]&&p<=20&&mobile(b,id)&&all.some(m=>pin(id,m)&&(key==='pin1'||m.id[1]!=='A')))save(key,h,{target:id});
}
for(const [key,id] of [['cover1','bQ1'],['cover2','bA1'],['cover3','bQ1']]){
 if(result[key]||!mobile(b,id)||p>24)continue;
 const m=all.find(m=>m.id[1]==='B'&&m.to===pos(b,id)&&!R.outcome(R.play(b,m)));
 if(!m)continue;
 if(key!=='cover3'){save(key,h,{target:id});continue;}
 const c=R.play(b,m);
 for(const reply of moving(c,'b').filter(m=>!R.neighbors(q).includes(m.to)&&!R.neighbors(q).includes(m.from)&&!R.outcome(R.play(c,m)))){
 const d=R.play(c,reply);
 const drops=R.placements(d,'w').filter(k=>R.neighbors(q).includes(k)&&!R.neighbors(k).some(n=>n!==q&&R.top(d,n)?.[0]==='w'));
 if(drops.length&&R.available(d,'w',p+2).length){save(key,h,{target:id,reply:[reply.id,reply.to],first:[m.id,m.to]});break;}
 }
}
if(!result.def1&&R.ring(b,w)>=3&&all.some(m=>m.id==='wQ1'&&R.ring(R.play(b,m),m.to)<=R.ring(b,w)-2&&!R.outcome(R.play(b,m))))save('def1',h);
const risk=b=>moving(b,'b').some(m=>m.id[1]==='B'&&m.to===pos(b,'wQ1'));
if(!result.def2&&mobile(b,'wQ1')&&risk(b)&&all.some(m=>m.id==='wQ1'&&!risk(R.play(b,m))&&!R.outcome(R.play(b,m))))save('def2',h);
if(!result.def3&&R.ring(b,w)===5){const killers=[...new Set(wins(b,'b').map(m=>m.id))];if(killers.length===1&&all.some(m=>pin(killers[0],m)&&!wins(R.play(b,m),'b').length))save('def3',h,{target:killers[0]});}
if(R.ring(b,q)===5){const kinds=[...new Set(wins(b,'w').map(m=>m.id[1]))];const key={A:'win1',G:'win2',S:'win3'}[kinds[0]];if(kinds.length===1&&key)save(key,h);}
}
const first=[['wG1','0,0'],['bS1','1,0'],['wQ1','0,-1'],['bQ1','1,1'],['wA1','-1,-1'],['bA1','2,1'],['wB1','-1,0'],['bG1','2,0'],['wS1','0,-2'],['bB1','0,2']];
inspect(first.reduce((b,[id,to])=>R.play(b,{id,to,from:pos(b,id)}),{}),first);
for(let g=0;g<1800&&Object.keys(result).length<12;g++){
let b={},h=[];
for(let p=0;p<36;p++){
const s=p%2?'b':'w',o=p%2?'w':'b';
if(p>=8&&s==='w')inspect(b,h);
const all=R.moves(b,s,p).filter(m=>p>=2||m.id[1]!=='Q');if(!all.length)break;
const q=pos(b,o+'Q1'),w=pos(b,s+'Q1');
const weights=all.map(m=>(m.from?1:2)*(q&&R.neighbors(q).includes(m.to)?3.2:1)*(m.id[1]==='B'&&m.from&&b[m.to]?2.1:1)*(m.from&&m.id[1]==='Q'?.5:1)*(!w&&p>=2&&m.id[1]==='Q'?4:1));
let t=random()*weights.reduce((a,b)=>a+b,0),i=0;while(i<all.length-1&&(t-=weights[i])>=0)i++;const m=all[i];b=R.play(b,m);h.push([m.id,m.to]);if(R.outcome(b))break;
}
}

