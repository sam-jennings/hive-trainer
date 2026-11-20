// Scratch: score batch-1 candidates with the app's own Training.succeeds.
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({});
for(const f of ['rules','positions','lessons','objectives','curriculum','decisions','training'])vm.runInContext(fs.readFileSync('hive-study/dist/'+f+'.js','utf8'),ctx);
const {R,P,T}=vm.runInContext('({R:HiveRules,P:Positions,T:Training})',ctx);
const found=JSON.parse(fs.readFileSync(process.argv[2]||'study-work/batch1-found.json','utf8'));
const prefix={pin:'pin',cover:'cover',win:'win',escape:'def'};
for(const [cat,list] of Object.entries(found))list.forEach((c,i)=>{
 const base=Object.keys(prefix).find(k=>cat.startsWith(k));
 const id=(c.task?'zz':prefix[base])+'_eval_'+cat+i;
 const {good:_g,legal:_l,kinds:_k,...data}=c;
 P[id]=data;
 const b=T.setup(id),legal=R.moves(b,'w',c.h.length),good=legal.filter(m=>T.succeeds(id,b,m));
 const sol=good.map(m=>m.id+(m.from?'':'*')+'>'+m.to).join(' ');
 console.log(cat+'#'+i,'len',c.h.length,'cells',Object.keys(b).length,'good',good.length+'/'+legal.length,JSON.stringify(data).length>0?(data.target||data.cell||''):'',sol.slice(0,80));
 delete P[id];
});
