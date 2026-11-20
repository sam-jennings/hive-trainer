// Scratch: print the chosen batch-1 candidates as Positions entries, with a board summary.
const fs=require('node:fs'),R=require('../hive-study/dist/rules.js');
const f=JSON.parse(fs.readFileSync('study-work/batch1-found.json','utf8'));
const pick={win4:'winA#0',win5:'winG#5',win6:'winS#0',win7:'winB#1',win8:'winQ#0',
 twoMove1:'mate2#3',twoMove2:'mate2#0',twoMove3:'mate2#4',
 pin4:'pinQ#2',pin5:'pinG#4',pin6:'pinS#4',pin7:'pinB#2',pin8:'pinA#4',
 cover4:'coverQ#2',cover5:'coverS#3',cover6:'coverG#3',cover7:'coverB#3',
 def4:'escape#2',def5:'escape#4',def6:'defend#0',def7:'defend#3',def8:'defend#5',
 block2:'block#5',block3:'block#4',placeG2:'deployG#4',placeS2:'deployS#5',pivot2:'pivot#0',pivot3:'pivot#4',fillG2:'fill#4',fillG3:'fill#2'};
const lines=[];
for(const [id,ref] of Object.entries(pick)){
 const [cat,i]=ref.split('#'),{good,legal,kinds,...d}=f[cat][+i];
 if(id.startsWith('twoMove'))d.target='bQ1';
 lines.push('  '+id+':'+JSON.stringify(d)+',');
 const b=d.h.reduce((x,[p,to])=>R.play(x,{id:p,from:R.locate(x,p),to}),{});
 const desc=Object.entries(b).map(([k,s])=>k+'='+s.join('/')).join(' ');
 console.error(id,'|',desc);
}
fs.writeFileSync('study-work/batch1-positions.txt',lines.join('\n').replace(/,$/,'')+'\n');
