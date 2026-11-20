// Position objectives evaluate the board after any legal candidate move.
const Objectives = (() => {
  const R = HiveRules;
  const nextTo = (a,b) => R.neighbors(a).includes(b);
  const mobile = (b,id) => {
    const k = R.locate(b,id);
    return !!k && R.top(b,k) === id && R.destinations(b,k).length > 0;
  };
  const pinned = (b,id) => {
    const k = R.locate(b,id);
    return !!k && R.top(b,k) === id && !R.connected(R.lift(b,k));
  };
  const reaches = (b,id,to) => mobile(b,id) && R.destinations(b,R.locate(b,id)).includes(to);
  function hasPocket(b,k) {
    const occupied = R.neighbors(k).map(n => !!b[n]);
    return occupied.some((_,i) => [0,1,2,3].every(d => occupied[(i+d)%6]));
  }
  function freed(b,n,side) {
    return R.pieces(b).filter(id => id[0]===side && pinned(b,id) && mobile(n,id));
  }
  // True when `side` has a legal move that surrounds the other queen right now.
  function winsNow(b,side,ply) {
    const q = R.locate(b,(side==="w"?"b":"w")+"Q1");
    if(!q || R.ring(b,q)<5) return false;
    return R.moves(b,side,ply).some(m => R.outcome(R.play(b,m))===side);
  }
  // True when `target` is pinned on a board where the top piece of `cell` is lifted away.
  const pinnedWithout = (b,cell,target) => pinned(R.lift(b,cell),target);
  const tests = {
    elbow(b,n,m) { return m.id==="wQ1" && !m.from && m.to!=="-1,0"; },
    cOpening(b,n,m) { return m.id==="bQ1" && m.to==="1,1"; },
    zOpening(b,n,m) { return m.id==="bQ1" && m.to==="2,-1"; },
    deploy(b,n,m,p) { return !m.from && m.id[1]===p.kind && reaches(n,m.id,p.cell); },
    block(b,n,m,p) {
      return m.id!=="wQ1" && !n[p.cell] && nextTo(m.to,p.cell) && R.ring(n,p.cell)===5 && mobile(n,p.target) && !reaches(n,p.target,p.cell);
    },
    fill(b,n,m,p) {
      const cell=R.locate(n,p.target);
      return nextTo(m.to,cell) && hasPocket(n,cell) && mobile(n,p.target);
    },
    ring(b,n,m,p) {
      return !n[p.cell] && R.ring(n,p.cell)===6 && freed(b,n,"w").length>=2 && !freed(b,n,"b").length;
    },
    deny(b,n,m,p) {
      return !n[p.cell] && pinned(n,p.target) && !R.placements(n,"b").includes(p.cell);
    },
    pivot(b,n,m,p) {
      return !!m.from && m.id===p.target && m.to!==p.cell && reaches(n,m.id,p.cell);
    },
    pair(b,n,m,p) {
      return m.id[1]==="B" && m.to===R.locate(b,p.target) && R.top(n,R.locate(n,"bQ1"))===p.guard;
    },
    counter(b,n,m) {
      if(!m.from || m.id==="wQ1")return false;
      const w=R.locate(b,"wQ1"), q=R.locate(b,"bQ1");
      return R.ring(n,w)<R.ring(b,w) && R.ring(n,q)>R.ring(b,q);
    },
    shutout(b,n,m,p) { return R.moves(n,"b",p.h.length+1).length===0; },
    draw(b,n) { return R.outcome(n)==="draw"; },
    // Black has no reply that surrounds the white queen.
    defend(b,n,m,p) { return !winsNow(n,"b",p.h.length+1); },
    // Every legal Black reply leaves White a surround next turn.
    mate2(b,n,m,p) {
      const ply=p.h.length, replies=R.moves(n,"b",ply+1);
      return replies.length>0 && replies.every(r => {
        const x=R.play(n,r), o=R.outcome(x);
        return o==="w" || (!o && winsNow(x,"w",ply+2));
      });
    },
    // The black queen stays uncovered and unpinned but has no legal move (a gate, not a pin).
    trap(b,n) {
      const q=R.locate(n,"bQ1");
      return R.top(n,q)==="bQ1" && R.connected(R.lift(n,q)) && R.destinations(n,q).length===0;
    },
    // Pin replacement: the target stays pinned even if the `free` piece leaves, and that piece can move.
    replace(b,n,m,p) {
      return m.id!==p.free && pinned(n,p.target) && pinnedWithout(n,R.locate(n,p.free),p.target) && mobile(n,p.free);
    },
    // Release your own pinned piece by moving a bug that hangs off it, without building a pocket.
    unpin(b,n,m,p) {
      const k=R.locate(n,p.target);
      return !!m.from && m.id!==p.target && nextTo(m.from,k) && !nextTo(m.to,k) && mobile(n,p.target);
    }
  };
  function succeeds(b,m,p) {
    const n=R.play(b,m);
    return (p.task==="draw" || !R.outcome(n)) && tests[p.task](b,n,m,p);
  }
  return {succeeds, mobile, pinned, reaches, hasPocket, freed, winsNow};
})();

