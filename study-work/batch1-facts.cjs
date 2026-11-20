// Scratch: facts about each picked position, used to write accurate drill text.
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({});
for(const f of ['rules','positions','lessons','objectives','curriculum','decisions','training'])vm.runInContext(fs.readFileSync('hive-study/dist/'+f+'.js','utf8'),ctx);
const {R,P,T,O}=vm.runInContext('({R:HiveRules,P:Positions,T:Training,O:Objectives})',ctx);
const src=fs.readFileSync('study-work/batch1-positions.txt','utf8');
const picks=vm.runInNewContext('({'+src+'})');
const fmt=m=>m.id+(m.from?' '+m.from:' reserve')+'>'+m.to;
for(const [id,p] of Object.entries(picks)){
 P[id]=p;
 const b=T.setup(id),len=p.h.length,legal=R.moves(b,'w',len),good=legal.filter(m=>T.succeeds(id,b,m));
 const wq=R.locate(b,'wQ1'),bq=R.locate(b,'bQ1');
 const out=[id,'len='+len,'legal='+legal.length,'wQ@'+wq+' ring '+R.ring(b,wq),'bQ@'+bq+' ring '+R.ring(b,bq),'good: '+good.map(fmt).join(', ')];
 if(p.target)out.push('target '+p.target+'@'+R.locate(b,p.target)+' dests '+(R.locate(b,p.target)&&R.destinations(b,R.locate(b,p.target)).length));
 if(p.task==='defend'){
  const threats=R.moves(b,'b',len+1).filter(m=>R.outcome(R.play(b,m))==='b');
  out.push('threats: '+threats.map(fmt).join(', '));
  out.push('after good: wQ ring '+good.map(m=>R.ring(R.play(b,m),R.locate(R.play(b,m),'wQ1'))).join('/'));
 }
 if(p.task==='mate2'){
  for(const m of good){const n=R.play(b,m);out.push('after '+fmt(m)+': bQ ring '+R.ring(n,R.locate(n,'bQ1'))+', black replies '+R.moves(n,'b',len+1).length+', white wins-in-1 now '+O.winsNow(n,'w',len+2)+', bQ mobile '+O.mobile(n,'bQ1'));}
  out.push('white mate-in-1 at start: '+O.winsNow(b,'w',len));
 }
 if(id.startsWith('win'))out.push('bQ empty: '+R.neighbors(bq).filter(k=>!b[k]).join(' '));
 if(p.task==='fill'){const k=R.locate(b,p.target);out.push('target pinned '+O.pinned(b,p.target));}
 console.log(out.join(' | '));
 delete P[id];
}
