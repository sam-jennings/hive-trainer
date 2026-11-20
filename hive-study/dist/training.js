const Training = (() => {
 const R=HiveRules;
 function setup(id) {
   return Positions[id].h.reduce((b,[piece,to])=>R.play(b,{id:piece,from:R.locate(b,piece),to}),{});
 }
 function threatened(b) {
   const queen=R.locate(b,"wQ1");
   return Object.keys(b).some(k=>R.top(b,k).startsWith("bB")&&R.destinations(b,k).includes(queen));
 }
 function blackWin(b,ply) {
   if(R.ring(b,R.locate(b,"wQ1"))<5) return false;
   return R.moves(b,"b",ply).some(m=>R.outcome(R.play(b,m))==="b");
 }
 function direct(b,m) {
   const q=R.locate(b,"bQ1");
   return !m.from && R.neighbors(q).includes(m.to) && !R.neighbors(m.to).some(n=>n!==q&&R.top(b,n)?.[0]==="w");
 }
 function response(b,ply) {
   const legal=R.moves(b,"b",ply);
   const [id,to]=Positions.cover3.reply;
   const preferred=legal.find(m=>m.id===id&&m.to===to);
   return [preferred,...legal].filter(Boolean).find(m=>{
     const next=R.play(b,m);
     return !R.outcome(next)&&R.moves(next,"w",ply+1).some(drop=>direct(next,drop));
   });
 }
 function succeeds(id,b,m,stage=0) {
   if(Positions[id].task) return Objectives.succeeds(b,m,Positions[id]);
   const n=R.play(b,m), p=Positions[id], target=p.target&&R.locate(n,p.target);
   if(id.startsWith("win")) return R.outcome(n)==="w";
   if(R.outcome(n)==="b"||R.outcome(n)==="draw") return false;
   if(id.startsWith("pin")||id==="def3"){
     const pinned=R.top(n,target)===p.target&&!R.connected(R.lift(n,target));
     return pinned && (id!=="def3" || !blackWin(n,p.h.length+1));
   }
   if(id.startsWith("cover")){
     if(stage===1) return direct(b,m);
     const covered=m.id.startsWith("wB")&&m.to===target&&R.top(n,target)===m.id;
     return covered && (id!=="cover3"||!!response(n,p.h.length+1));
   }
   if(m.id!=="wQ1")return false;
   if(id==="def1")return R.ring(n,m.to)<=R.ring(b,m.from)-2;
   return !threatened(n);
 }
 function explainMiss(id,b,m,stage) {
   const n=R.play(b,m),t=Positions[id].target,k=t&&R.locate(n,t);
   if(Positions[id].task) return Drills[id].miss;
   if(R.outcome(n)==="draw")return "Both queens are surrounded. This move draws the game.";
   if(R.outcome(n)==="b")return "This surrounds your own queen and gives Black the game.";
   if(id.startsWith("win"))return "The black queen still has "+(6-R.ring(n,R.locate(n,"bQ1")))+" open side(s). Check whether your move vacated one of her neighbours.";
   if(id.startsWith("pin")||id==="def3"){
      if(R.top(n,k)!==t)return "You covered the attacker. For this exercise, keep it on top and make lifting it disconnect the hive.";
      if(id==="def3"&&blackWin(n,Positions[id].h.length+1))return "Black still has a legal move into your queen’s final liberty.";
      return R.destinations(n,k).length?"The marked piece still has "+R.destinations(n,k).length+" legal destinations. Lifting it leaves the hive connected.":"The target has no legal move, but lifting it leaves the hive connected. Try creating a pin through the One Hive rule.";
   }
   if(id.startsWith("cover"))return stage?"The drop needs to touch the covered queen and use that stack as its only friendly contact.":"The marked black piece is still free of the required cover. Look for a beetle climb onto its cell.";
   if(m.id!=="wQ1")return "Your queen stayed in her original cell. Test one of her legal slides.";
   if(id==="def1")return "The queen now has "+R.ring(n,m.to)+" occupied neighbours. Look for a slide that reduces the original count by at least two.";
   return "A black beetle can still climb onto your queen in one move.";
 }
 return {setup,succeeds,response,explainMiss};
})();

