const StudyBoard = (() => {
 const R=HiveRules,r=36,dx=Math.sqrt(3)*r;
 const expansionNames={M:"Mosquito",L:"Ladybug",P:"Pillbug"};
 const colors={M:["#315f6a","#95cbd0"],L:["#984e46","#eaa79b"],P:["#685e85","#c1b1d9"],A:["#2d6581","#89bbd2"],B:["#6b5293","#bf9bdc"],G:["#4d7330","#9ac378"],S:["#925b36","#d7a079"],Q:["#a77719","#ebc469"]};
 const pts=(radius,off=0)=>Array.from({length:6},(_,i)=>{const a=(i*60-90)*Math.PI/180;return [(radius*Math.cos(a)).toFixed(2),(radius*Math.sin(a)+off).toFixed(2)].join(",")}).join(" ");
 const hex=pts(r-1),edge=pts(r-1.6,3);
 const xy=(key,flip)=>{const [q,s]=key.split(",").map(Number),f=flip?-1:1;return [dx*(q+s/2)*f,r*1.5*s*f]};
 const legend=id=>(id[0]==="w"?"White ":"Black ")+(R.names[id[1]]||expansionNames[id[1]]).toLowerCase()+" "+id.slice(2);
 function draw(state) {
   const {board,selected,legal,target,flip,mode,fromBoard,last,solution,focusCell}=state;
   const cells=Object.keys(board),opts=mode==="move"&&selected?legal.filter(m=>m.id===selected):[];
   const ends=new Set(opts.map(m=>m.to));
   const all=[...new Set([...cells,...Object.keys(fromBoard),...(focusCell?[focusCell]:[]),...ends])].map(k=>xy(k,flip));
   const need=Math.max(1,...Object.values(board).map(s=>s.length));
   const xmin=Math.min(...all.map(a=>a[0]))-dx*.78,xmax=Math.max(...all.map(a=>a[0]))+dx*.78;
   const ymin=Math.min(...all.map(a=>a[1]))-r*1.2-(need-1)*7,ymax=Math.max(...all.map(a=>a[1]))+r*1.3;
   const vw=Math.max(485,xmax-xmin,(ymax-ymin)*1.85),vh=vw/1.85,cx=(xmax+xmin)/2,cy=(ymax+ymin)/2;
   const x=cx-vw/2,y=cy-vh/2;
   const pp=(k)=>'translate('+xy(k,flip).join(' ')+')';
   const selectedCell=selected?R.locate(board,selected):null;
   const ans=solution?legal.find(state.pass):null;
   const defs='<defs><linearGradient id="ivory" x2=".55" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#fff9e6"/><stop offset="1" stop-color="#e3d9bb"/></linearGradient><linearGradient id="ebony" x2=".5" y2="1"><stop stop-color="#384342"/><stop offset="1" stop-color="#202a29"/></linearGradient><filter id="drop" x="-35%" y="-25%" width="175%" height="175%"><feDropShadow dx="0.7" dy="3" stdDeviation="2.3" flood-color="#071e18" flood-opacity=".55"/></filter><radialGradient id="gridFade"><stop offset="0" stop-color="white"/><stop offset="1" stop-color="#555"/></radialGradient><pattern id="hexGrid" patternUnits="userSpaceOnUse" width="'+dx+'" height="'+(3*r)+'"><g fill="none" stroke="#b4c6a8" stroke-width=".75" opacity=".25">'+[[0,0],[dx,0],[dx/2,r*1.5],[0,r*3],[dx,r*3]].map(([a,b])=>'<polygon transform="translate('+a+' '+b+')" points="'+pts(r)+'"/>').join('')+'</g></pattern><mask id="fade"><rect x="'+x+'" y="'+y+'" width="'+vw+'" height="'+vh+'" fill="url(#gridFade)"/></mask></defs>';
   let html=defs+'<rect x="'+x+'" y="'+y+'" width="'+vw+'" height="'+vh+'" fill="url(#hexGrid)" mask="url(#fade)"/>';
   const interactive=(key,label)=>state.readOnly?' role="img" aria-label="'+label+'"':' role="button" tabindex="0" data-cell="'+key+'" aria-label="'+label+'"';
   function spot(k){
     const highlight=ans?.to===k;
     return '<g class="destination" transform="'+pp(k)+'"'+interactive(k,'Move '+legend(selected)+' to '+k)+'><polygon class="spot-outline" points="'+pts(r-3)+'" stroke="'+(highlight?'#ffcd52':'#a8d0a7')+'" fill="'+(highlight?'#c5a043':'#709d72')+'" fill-opacity=".23" stroke-width="1.8" stroke-dasharray="4 3"/><circle r="'+(highlight?6:4.8)+'" fill="'+(highlight?'#ffda70':'#d2e8bc')+'"/></g>';
   }
   for(const k of ends)if(!board[k])html+=spot(k);
   if(focusCell && !board[focusCell]) html+='<g pointer-events="none" transform="'+pp(focusCell)+'"><title>Marked space</title><circle r="12" stroke="#ffdb77" stroke-width="3" fill="none"/><circle r="3" fill="#ffdb77"/></g>';
   const sorted=cells.sort((a,b)=>xy(a,flip)[1]-xy(b,flip)[1]);
   for(const k of sorted) {
     const stack=board[k],id=stack.at(-1),white=id[0]==="w",goal=target&&stack.includes(target);
     const canLand=ends.has(k),sel=k===selectedCell,bright=sel||goal||ans?.to===k;
     const label=stack.map(legend).join(' under ')+(goal?', marked target':'')+(canLand?', legal climb':'')+' at '+k;
     html+='<g class="board-piece" transform="'+pp(k)+'"'+interactive(k,label)+'><title>'+label+'</title>';
     stack.forEach((piece,i)=>{
       const w=piece[0]==='w',lift=-(i*6);
       html+='<g transform="translate(0 '+lift+')"><polygon points="'+edge+'" fill="'+(w?'#b6a98a':'#121d1a')+'" filter="url(#drop)"/><polygon class="'+(i===stack.length-1?'tile-edge':'')+'" points="'+hex+'" fill="url(#'+(w?'ivory':'ebony')+')" stroke="'+(i===stack.length-1&&bright?'#f3c760':w?'#fff7dd':'#68716a')+'" stroke-width="'+(i===stack.length-1&&bright?3.1:1.25)+'"/><polygon points="'+pts(r-4.3)+'" fill="none" stroke="'+(w?'#c2b79b':'#58615a')+'" stroke-width=".8" opacity=".85"/></g>';
     });
     html+='<g transform="translate(0 '+(-(stack.length-1)*6)+')"><g transform="translate(0 -2) scale(.93)" color="'+colors[id[1]][white?0:1]+'">'+Art.bug[id[1]]+'</g><text x="0" y="26" text-anchor="middle" font-size="6.9" font-weight="700" fill="'+(white?'#756f60':'#b8c2b6')+'">'+id.slice(1)+'</text>';
     if(goal)html+='<g transform="translate(22 -20)"><circle r="6.1" fill="#efc869" stroke="#564a29" stroke-width="1"/><circle r="2.3" fill="#514322"/></g>';
     if(stack.length>1)html+='<g transform="translate(-21 -19)"><circle r="7.2" fill="#456454" stroke="#e5e3ca"/><text y="2.8" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="white">'+stack.length+'</text></g>';
     if(canLand)html+='<polygon class="spot-outline" points="'+pts(r-5)+'" fill="none" stroke="'+(ans?.to===k?'#ffce5b':'#9cdaa4')+'" stroke-width="3.8" stroke-dasharray="4 2"/>';
     if(last===k&&!sel&&!goal) html+='<circle cx="20" cy="15" r="3" fill="#a1c19c"/>';
     html+='</g></g>';
   }
   return '<svg xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Interactive Hive position" viewBox="'+[x,y,vw,vh].join(' ')+'">'+html+'</svg>';
 }
 return {draw,legend,colors};
})();

