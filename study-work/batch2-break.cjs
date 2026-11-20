// Scratch: copy hive-study into $KIROCREW_SCRATCH, break one batch-2 drill per copy, and
// confirm check-positions.cjs rejects every broken copy. Never touches the real files.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve('hive-study'),scratch=process.env.KIROCREW_SCRATCH;
if(!scratch)throw new Error('KIROCREW_SCRATCH is not set');
const drop2=id=>src=>src.replace(new RegExp('(  '+id+':\\{"h":\\[.*?)(,\\["[wb][A-Z]\\d","-?\\d+,-?\\d+"\\]){2}\\]'),'$1]');
const field=(id,from,to)=>src=>src.replace(new RegExp('(  '+id+':\\{.*?)'+from.replace(/[[\]{}()*+?.\\^$|]/g,'\\$&')),'$1'+to);
const breaks={
 // Trap claimed where the black queen is already pinned (cannot move at the start).
 replace2_as_trap:['positions.js',field('replace2','"task":"replace"','"task":"trap"')],
 // Pin replacement where the named free piece is not the one holding the pin.
 replace1_wrong_free:['positions.js',field('replace1','"free":"wA1"','"free":"wB2"')],
 // Pin replacement naming a black "free" piece.
 replace3_black_free:['positions.js',field('replace3','"free":"wA3"','"free":"bQ1"')],
 // Unpin target that is not pinned at the start.
 unpin1_free_target:['positions.js',field('unpin1','"target":"wS1"','"target":"wA1"')],
 // Fill target that is not pinned at the start.
 fillA1_free_target:['positions.js',field('fillA1','"target":"wA1"','"target":"wA2"')],
 // Positions moved back two plies: the verified solution should disappear.
 // (unpin2 moved back two plies is still a valid unpin position, so it is not used here.)
 // Unpin target of the wrong colour.
 unpin2_black_target:['positions.js',field('unpin2','"target":"wS2"','"target":"bS1"')],
 twoMove5_history:['positions.js',drop2('twoMove5')],
 trap3_history:['positions.js',drop2('trap3')],
 // Wrong guard beetle for the two-beetle drill.
 pair2_guard:['positions.js',field('pair2','"guard":"wB1"','"guard":"wB2"')],
 // Wrong objective on a real position: the shutout solution does not also counterattack.
 shutout2_as_counter:['positions.js',field('shutout2','"task":"shutout"','"task":"counter"')]
};
let ok=true;
for(const [name,[file,edit]] of Object.entries(breaks)){
 const dir=path.join(scratch,'break2-'+name);
 fs.rmSync(dir,{recursive:true,force:true});
 fs.cpSync(path.join(root,'dist'),path.join(dir,'dist'),{recursive:true});
 fs.copyFileSync(path.join(root,'check-positions.cjs'),path.join(dir,'check-positions.cjs'));
 const f=path.join(dir,'dist',file),before=fs.readFileSync(f,'utf8'),after=edit(before);
 if(after===before)throw new Error(name+': edit did not apply');
 fs.writeFileSync(f,after);
 const r=spawnSync(process.execPath,[path.join(dir,'check-positions.cjs')],{encoding:'utf8'});
 const msg=(r.stderr.match(/AssertionError \[ERR_ASSERTION\][^\n]*/)||[r.stderr.split('\n')[0]])[0].replace(/\s+/g,' ').trim();
 console.log(name.padEnd(20),r.status===0?'PASSED (unexpected)':'FAILED as expected:',r.status===0?'':msg.slice(0,140));
 if(r.status===0)ok=false;
 fs.rmSync(dir,{recursive:true,force:true});
}
process.exit(ok?0:1);
