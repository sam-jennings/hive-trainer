// Axial coordinates. Each occupied cell holds a stack, bottom piece first.
// Expansion pieces (Mosquito M, Ladybug L, Pillbug P) are OPT-IN: pass an options object
// { expansions: ["M","L","P"] (or a subset), last: <previous move {id,from,to}> } as the last
// argument of moves / destinations / available / abilities. Without it (or with an empty list)
// every function behaves exactly as the base game. See hive-study/EXPANSIONS-NOTES.md.
const HiveRules = (() => {
  const dirs = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
  const stock = {Q:1, A:3, B:2, G:3, S:2};
  const names = {Q:"Queen", A:"Ant", B:"Beetle", G:"Grasshopper", S:"Spider"};
  const expansionStock = {M:1, L:1, P:1};
  const expansionNames = {M:"Mosquito", L:"Ladybug", P:"Pillbug"};
  const enabled = (opts,kind) => !!opts && Array.isArray(opts.expansions) && opts.expansions.includes(kind) && kind in expansionStock;
  const anyEnabled = opts => !!opts && Array.isArray(opts.expansions) && opts.expansions.some(k => k in expansionStock);
  // Gen4: a piece that physically moved on the previous turn (directly or by a pillbug) cannot move,
  // be moved by a pillbug, or use its ability this turn. A placement is not a move, so it does not freeze.
  const frozen = (opts,id) => anyEnabled(opts) && !!opts.last && !!opts.last.from && opts.last.id === id;
  const neighborCache = new Map();
  const neighbors = cell => {
    if (neighborCache.has(cell)) return neighborCache.get(cell);
    const [q,r] = cell.split(",").map(Number);
    const result = dirs.map(([dq,dr]) => [q+dq, r+dr].join(","));
    neighborCache.set(cell,result);
    return result;
  };
  const at = (cell,dir) => neighbors(cell)[(dir+6)%6];
  const top = (board,cell) => board[cell]?.at(-1);
  const pieces = board => Object.values(board).flat();
  const locate = (board, id) => Object.keys(board).find(k => board[k].includes(id));
  const ring = (board,cell) => neighbors(cell).filter(k => board[k]).length;
  const lift = (board,cell) => {
    const b = {...board};
    if (b[cell].length === 1) delete b[cell];
    else b[cell] = b[cell].slice(0,-1);
    return b;
  };
  function connected(b) {
    const cells = Object.keys(b);
    if (!cells.length) return true;
    const seen = new Set([cells[0]]);
    for (const cell of seen) for (const n of neighbors(cell)) if (b[n]) seen.add(n);
    return seen.size === cells.length;
  }
  function steps(b,cell) {
    const next = [];
    for (let i=0;i<6;i++) {
      if (b[at(cell,i)]) continue;
      const left = !!b[at(cell,i-1)], right = !!b[at(cell,i+1)];
      if (left !== right) next.push(at(cell,i));
    }
    return next;
  }
  // One beetle-style step from `cell` in direction i on board b (mover already lifted): the mover
  // sits at height b[cell].length; blocked when both flanking stacks are higher than both ends.
  function climbOk(b,cell,i) {
    const n = at(cell,i);
    const height = Math.max(b[cell]?.length||0,b[n]?.length||0);
    const left = b[at(cell,i-1)]?.length||0, right=b[at(cell,i+1)]?.length||0;
    return (height>0 || left+right>0) && Math.min(left,right)<=height;
  }
  // Movement of a base kind from `cell` on the lifted board b (the original base-game code).
  function baseDestinations(b,cell,kind) {
    if (kind==="Q") return steps(b,cell);
    if (kind==="G") {
      const land=[];
      for(let i=0;i<6;i++) {
        let n=at(cell,i);
        if(!b[n]) continue;
        while(b[n]) n=at(n,i);
        land.push(n);
      }
      return land;
    }
    if (kind==="B") return neighbors(cell).filter((n,i)=>climbOk(b,cell,i));
    if (kind==="S") {
      const end=new Set();
      function walk(path) {
        if(path.length===4) { end.add(path[3]); return; }
        for(const n of steps(b,path.at(-1))) if(!path.includes(n)) walk([...path,n]);
      }
      walk([cell]);
      return [...end];
    }
    const seen=new Set([cell]);
    for(const pos of seen) for(const n of steps(b,pos)) seen.add(n);
    seen.delete(cell);
    return [...seen];
  }
  // Ladybug: exactly 2 steps on top of the hive, then 1 step down into an empty cell
  // (freedom to move at height applies to each step); it may not end where it started.
  function ladybug(b,cell) {
    const end=new Set();
    neighbors(cell).forEach((a,i)=>{
      if(!b[a] || !climbOk(b,cell,i)) return;
      neighbors(a).forEach((c,j)=>{
        if(!b[c] || !climbOk(b,a,j)) return;
        neighbors(c).forEach((d,k)=>{ if(!b[d] && d!==cell && climbOk(b,c,k)) end.add(d); });
      });
    });
    return [...end];
  }
  // Movement of any kind, including enabled expansion kinds. `board` is the full board, b the lifted one.
  function kindDestinations(board,b,cell,kind,opts) {
    if (kind==="L" && enabled(opts,"L")) return ladybug(b,cell);
    if (kind==="P" && enabled(opts,"P")) return steps(b,cell);
    if (kind==="M" && enabled(opts,"M")) {
      // On top of the hive the mosquito moves only as a beetle.
      if (board[cell].length>1) return baseDestinations(b,cell,"B");
      // On the ground it copies the top piece of each adjacent stack; copying a mosquito gives nothing.
      const copied=new Set(neighbors(cell).map(n=>top(board,n)).filter(Boolean).map(t=>t[1]).filter(k=>k!=="M"));
      const out=new Set();
      for (const k of copied) for (const d of kindDestinations(board,b,cell,k,opts)) out.add(d);
      return [...out];
    }
    return baseDestinations(b,cell,kind);
  }
  function destinations(board,cell,opts) {
    const id=top(board,cell);
    if (!id || !locate(board,id[0]+"Q1")) return [];
    if (frozen(opts,id)) return [];
    const b=lift(board,cell);
    if (!connected(b)) return [];
    if (!anyEnabled(opts)) return baseDestinations(b,cell,id[1]);
    return kindDestinations(board,b,cell,id[1],opts);
  }
  // Pillbug special ability (also a ground mosquito touching a pillbug): move an adjacent unstacked
  // piece up onto the pillbug and down into an empty cell next to it. Returns moves {id,from,to,by}.
  // The pillbug itself need not be free to move (One Hive applies to the moved piece only), but it
  // must not be covered, not have moved last turn, and its owner's queen must be on the board.
  function abilities(board,cell,opts) {
    if (!enabled(opts,"P")) return [];
    const id=top(board,cell);
    if (!id || board[cell].length!==1 || !locate(board,id[0]+"Q1") || frozen(opts,id)) return [];
    const isPillbug = id[1]==="P" || (id[1]==="M" && enabled(opts,"M") && neighbors(cell).some(n=>top(board,n)?.[1]==="P"));
    if (!isPillbug) return [];
    const out=[];
    neighbors(cell).forEach((from,i)=>{
      const stack=board[from];
      if (!stack || stack.length!==1 || frozen(opts,stack[0])) return;
      const b=lift(board,from);
      if (!connected(b)) return;
      if (!climbOk(b,from,(i+3)%6)) return;          // up onto the pillbug (no gate of stacks)
      neighbors(cell).forEach((to,k)=>{
        if (b[to] || to===from || !climbOk(b,cell,k)) return;   // down into an empty cell
        out.push({id:stack[0],from,to,by:id});
      });
    });
    return out;
  }
  function placements(board,side) {
    const cells=Object.keys(board);
    if(!cells.length) return ["0,0"];
    const edge=new Set(cells.flatMap(neighbors).filter(n=>!board[n]));
    if(cells.length===1) return [...edge];
    return [...edge].filter(n=>neighbors(n).every(k=>!board[k]||top(board,k)[0]===side));
  }
  function available(board,side,ply,opts) {
    const ids=pieces(board);
    const mustQueen=Math.floor(ply/2)>=3&&!ids.includes(side+"Q1");
    const kinds=anyEnabled(opts) ? {...stock, ...Object.fromEntries(Object.entries(expansionStock).filter(([k])=>enabled(opts,k)))} : stock;
    return Object.entries(kinds).flatMap(([kind,count])=>{
      const next=ids.filter(id=>id.startsWith(side+kind)).length+1;
      return next>count || (mustQueen && kind!=="Q") ? [] : [side+kind+next];
    });
  }
  function moves(board,side,ply,opts) {
    const drops=placements(board,side);
    const all=available(board,side,ply,opts).flatMap(id=>drops.map(to=>({id,from:null,to})));
    for(const from of Object.keys(board)) {
      const id=top(board,from);
      if(id[0]===side) for(const to of destinations(board,from,opts)) all.push({id,from,to});
    }
    if (enabled(opts,"P")) {
      // Ability moves that give the same board as a move already listed are left out.
      const seen=new Set(all.filter(m=>m.from).map(m=>m.id+"|"+m.from+"|"+m.to));
      for(const cell of Object.keys(board)) {
        if(top(board,cell)[0]!==side) continue;
        for(const m of abilities(board,cell,opts)) {
          const k=m.id+"|"+m.from+"|"+m.to;
          if(!seen.has(k)) { seen.add(k); all.push(m); }
        }
      }
    }
    return all;
  }
  function play(board,{id,from,to}) {
    const b=from ? lift(board,from) : {...board};
    b[to]=[...(b[to]||[]),id];
    return b;
  }
  function outcome(board) {
    const surrounded=side=>{
      const cell=locate(board,side+"Q1");
      return cell && ring(board,cell)===6;
    };
    const white=surrounded("w"), black=surrounded("b");
    return white&&black ? "draw" : white ? "b" : black ? "w" : null;
  }
  return {at,neighbors,top,stock,names,expansionStock,expansionNames,pieces,locate,ring,lift,connected,destinations,abilities,placements,available,moves,play,outcome};
})();
if(typeof module!=="undefined") module.exports=HiveRules;
