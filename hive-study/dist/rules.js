// Axial coordinates. Each occupied cell holds a stack, bottom piece first.
const HiveRules = (() => {
  const dirs = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
  const stock = {Q:1, A:3, B:2, G:3, S:2};
  const names = {Q:"Queen", A:"Ant", B:"Beetle", G:"Grasshopper", S:"Spider"};
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
  function destinations(board,cell) {
    const id=top(board,cell);
    if (!id || !locate(board,id[0]+"Q1")) return [];
    const b=lift(board,cell);
    if (!connected(b)) return [];
    if (id[1]==="Q") return steps(b,cell);
    if (id[1]==="G") {
      const land=[];
      for(let i=0;i<6;i++) {
        let n=at(cell,i);
        if(!b[n]) continue;
        while(b[n]) n=at(n,i);
        land.push(n);
      }
      return land;
    }
    if (id[1]==="B") {
      return neighbors(cell).filter((n,i)=>{
        const height = Math.max(b[cell]?.length||0,b[n]?.length||0);
        const left = b[at(cell,i-1)]?.length||0, right=b[at(cell,i+1)]?.length||0;
        return (height>0 || left+right>0) && Math.min(left,right)<=height;
      });
    }
    if (id[1]==="S") {
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
  function placements(board,side) {
    const cells=Object.keys(board);
    if(!cells.length) return ["0,0"];
    const edge=new Set(cells.flatMap(neighbors).filter(n=>!board[n]));
    if(cells.length===1) return [...edge];
    return [...edge].filter(n=>neighbors(n).every(k=>!board[k]||top(board,k)[0]===side));
  }
  function available(board,side,ply) {
    const ids=pieces(board);
    const mustQueen=Math.floor(ply/2)>=3&&!ids.includes(side+"Q1");
    return Object.entries(stock).flatMap(([kind,count])=>{
      const next=ids.filter(id=>id.startsWith(side+kind)).length+1;
      return next>count || (mustQueen && kind!=="Q") ? [] : [side+kind+next];
    });
  }
  function moves(board,side,ply) {
    const drops=placements(board,side);
    const all=available(board,side,ply).flatMap(id=>drops.map(to=>({id,from:null,to})));
    for(const from of Object.keys(board)) {
      const id=top(board,from);
      if(id[0]===side) for(const to of destinations(board,from)) all.push({id,from,to});
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
  return {at,neighbors,top,stock,names,pieces,locate,ring,lift,connected,destinations,placements,available,moves,play,outcome};
})();
if(typeof module!=="undefined") module.exports=HiveRules;
