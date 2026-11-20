// Scratch: copy hive-study into $KIROCREW_SCRATCH, break one batch-1 drill per copy, and
// confirm check-positions.cjs rejects every broken copy. Never touches the real files.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve('hive-study'),scratch=process.env.KIROCREW_SCRATCH;
if(!scratch)throw new Error('KIROCREW_SCRATCH is not set');
const drop2=id=>src=>src.replace(new RegExp('(  '+id+':\\{"h":\\[.*?)(,\\["[wb][A-Z]\\d","-?\\d+,-?\\d+"\\]){2}\\]'),'$1]');
const breaks={
 // Mate-in-2 position moved back two plies: the forced finish no longer holds.
 twoMove3_history:['positions.js',drop2('twoMove3')],
 // Defence position moved back two plies: Black's threat or the defence changes.
 def7_history:['positions.js',drop2('def7')],
 // Wrong pin target: the stated outcome is false on the board.
 cover5_target:['positions.js',s=>s.replace(/(  cover5:\{.*?)"target":"bS1"\}/,'$1"target":"bQ1"}')],
 pin5_target:['positions.js',s=>s.replace('"target":"bG2"}','"target":"bA1"}')],
 // Mate-in-2 claim on a position that is already a mate in one.
 win4_as_mate2:['positions.js',s=>s.replace(/(  win4:\{"h":\[.*?\])\}/,'$1,"task":"mate2"}')],
 // Defend claim with no Black threat.
 pin6_as_defend:['positions.js',s=>s.replace('"target":"bS1"}','"target":"bS1","task":"defend"}')]
};
let ok=true;
for(const [name,[file,edit]] of Object.entries(breaks)){
 const dir=path.join(scratch,'break-'+name);
 fs.rmSync(dir,{recursive:true,force:true});
 fs.cpSync(path.join(root,'dist'),path.join(dir,'dist'),{recursive:true});
 fs.copyFileSync(path.join(root,'check-positions.cjs'),path.join(dir,'check-positions.cjs'));
 if(name==='win4_as_mate2'||name==='pin6_as_defend'){ // drills need miss text once they carry a task
  const cur=path.join(dir,'dist','curriculum.js');
  const id=name.split('_')[0];
  fs.writeFileSync(cur,fs.readFileSync(cur,'utf8')+'\nDrills.'+id+'.miss="x";\n');
 }
 const f=path.join(dir,'dist',file),before=fs.readFileSync(f,'utf8'),after=edit(before);
 if(after===before)throw new Error(name+': edit did not apply');
 fs.writeFileSync(f,after);
 const r=spawnSync(process.execPath,[path.join(dir,'check-positions.cjs')],{encoding:'utf8'});
 const msg=(r.stderr.match(/AssertionError[^\n]*\n?[^\n]*/)||[r.stderr.split('\n')[0]])[0].replace(/\s+/g,' ').trim();
 console.log(name.padEnd(16),r.status===0?'PASSED (unexpected)':'FAILED as expected:',r.status===0?'':msg.slice(0,140));
 if(r.status===0)ok=false;
 fs.rmSync(dir,{recursive:true,force:true});
}
process.exit(ok?0:1);
