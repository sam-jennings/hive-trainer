// Scratch: write the chosen batch-2 candidates as Positions entries and print board facts for the drill text.
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({});
for(const f of ['rules','positions','objectives'])vm.runInContext(fs.readFileSync('hive-study/dist/'+f+'.js','utf8'),ctx);
const {R,O}=vm.runInContext('({R:HiveRules,O:Objectives})',ctx);
const f=JSON.parse(fs.readFileSync('study-work/batch2-found.json','utf8'));
const pick={trap1:'trap#0',trap2:'trap#3',trap3:'trap#4',trap4:'trap#5',
 replace1:'replace#1',replace2:'replace#3',replace3:'replace#5',replace4:'replace#4',
 unpin1:'unpin#0',unpin2:'unpin#2',unpin3:'unpin#3',fillA1:'fillA#1',fillA2:'fillA#3',fillA3:'fillA#5',
 twoMove4:'mate2#1',twoMove5:'mate2#2',twoMove6:'mate2#5',def9:'defendX#1',def10:'defendX#2',def11:'defendX#4',
 counter2:'counter#1',counter3:'counter#2',shutout2:'shutout#0',shutout3:'shutout#4',pair2:'pair#2',pair3:'pair#5'};
const fmt=m=>m.id+(m.from?' '+m.from:' reserve')+'>'+m.to;
const lines=[];
for(const [id,ref] of Object.entries(pick)){
 const [cat,i]=ref.split('#'),{good,legal,...d}=f[cat][+i];
 if(id.startsWith('twoMove'))d.target='bQ1';
 lines.push('  '+id+':'+JSON.stringify(d)+',');
 const b=d.h.reduce((x,[p,to])=>R.play(x,{id:p,from:R.locate(x,p),to}),{}),len=d.h.length;
 const sol=R.moves(b,'w',len).filter(m=>O.succeeds(b,m,d));
 const ring=k=>R.neighbors(k).map(n=>b[n]?R.top(b,n):'.').join(' ');
 const wq=R.locate(b,'wQ1'),bq=R.locate(b,'bQ1');
 console.log('\n'+id+' ('+ref+') len '+len+' | SOL '+sol.map(fmt).join(', '));
 console.log('  wQ '+wq+' ['+ring(wq)+']  bQ '+bq+' ['+ring(bq)+']');
 if(d.target&&d.target!=='bQ1'){const k=R.locate(b,d.target);console.log('  target '+d.target+' '+k+' ['+ring(k)+']');}
 if(d.free){const k=R.locate(b,d.free);console.log('  free '+d.free+' '+k+' ['+ring(k)+']');}
 for(const m of sol){const n=R.play(b,m);console.log('  after '+fmt(m)+': to-cell nbrs ['+R.neighbors(m.to).map(k=>n[k]?R.top(n,k):'.').join(' ')+'] wQ ring '+R.ring(n,R.locate(n,'wQ1'))+' bQ ring '+R.ring(n,R.locate(n,'bQ1'))+' black moves '+R.moves(n,'b',len+1).length);}
 console.log('  stacks: '+Object.entries(b).filter(([,s])=>s.length>1).map(([k,s])=>k+'='+s.join('/')).join(' ')+' | reserve-ish white pieces on board '+R.pieces(b).filter(p=>p[0]==='w').join(','));
}
fs.writeFileSync('study-work/batch2-positions.txt',lines.join('\n').replace(/,$/,'')+'\n');
