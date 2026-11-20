// Scratch: score batch-2 candidates and print the facts the drill text relies on.
// Usage: node study-work/batch2-eval.cjs [found.json] [cat#i ...]
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({});
for(const f of ['rules','positions','objectives'])vm.runInContext(fs.readFileSync('hive-study/dist/'+f+'.js','utf8'),ctx);
const {R,O}=vm.runInContext('({R:HiveRules,O:Objectives})',ctx);
const [file='study-work/batch2-found.json',...only]=process.argv.slice(2);
const found=JSON.parse(fs.readFileSync(file,'utf8'));
const fmt=m=>m.id+(m.from?' '+m.from:' reserve')+'>'+m.to;
const setup=h=>h.reduce((b,[p,to])=>R.play(b,{id:p,from:R.locate(b,p),to}),{});
for(const [cat,list] of Object.entries(found))list.forEach((c,i)=>{
 const ref=cat+'#'+i;if(only.length&&!only.includes(ref))return;
 const {good:_g,legal:_l,...p}=c,b=setup(p.h),len=p.h.length;
 const legal=R.moves(b,'w',len),good=legal.filter(m=>O.succeeds(b,m,p));
 const wq=R.locate(b,'wQ1'),bq=R.locate(b,'bQ1');
 const out=[ref,'len='+len,'cells='+Object.keys(b).length,'good '+good.length+'/'+legal.length,'wQ@'+wq+' ring '+R.ring(b,wq),'bQ@'+bq+' ring '+R.ring(b,bq)+' top '+R.top(b,bq)];
 if(p.target){const k=R.locate(b,p.target);out.push('target '+p.target+'@'+k+' dests '+R.destinations(b,k).length+' pinned '+O.pinned(b,p.target)+' nbrs '+R.neighbors(k).filter(n=>b[n]).map(n=>R.top(b,n)).join(','));}
 if(p.free)out.push('free '+p.free+'@'+R.locate(b,p.free));
 if(p.guard)out.push('guard '+p.guard);
 out.push('SOL: '+good.map(fmt).join(', '));
 if(p.task==='defend')out.push('threats: '+R.moves(b,'b',len+1).filter(m=>R.outcome(R.play(b,m))==='b').map(fmt).join(', '));
 if(p.task==='mate2')for(const m of good){const n=R.play(b,m);out.push('after '+fmt(m)+': bQ ring '+R.ring(n,R.locate(n,'bQ1'))+' replies '+R.moves(n,'b',len+1).length);}
 if(p.task==='trap')out.push('bQ dests '+R.destinations(b,bq).join(' ')+' empty '+R.neighbors(bq).filter(k=>!b[k]).join(' '));
 if(p.task==='shutout')out.push('black legal now '+R.moves(b,'b',len+1).length+' reserve '+R.moves(b,'b',len+1).filter(m=>!m.from).length);
 console.log(out.join(' | '));
});
