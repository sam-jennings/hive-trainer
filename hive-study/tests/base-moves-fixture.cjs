// Shared by expansions.test.cjs and by the one-off script that wrote base-moves.json.
// Plays seeded random base games and hashes every position's sorted legal-move list, so the
// current rules.js (with expansions off) can be compared with the hashes the PRE-expansion
// rules.js produced. base-moves.json was written on 2026-11-21 from the old rules.js, saved
// before the expansion change: node -e "..." with fingerprint(oldRules) (see EXPANSIONS-NOTES.md).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fnv(h, s) {
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
// movesOf(board, side, ply) -> the legal-move list to fingerprint.
function fingerprint(R, movesOf, games = 120, maxPly = 70) {
  const out = [];
  for (let g = 0; g < games; g++) {
    const rand = rng(5000 + g);
    let b = {}, ply = 0, h = 2166136261, positions = 0, total = 0;
    while (ply < maxPly) {
      const side = ply % 2 ? "b" : "w";
      const list = movesOf(b, side, ply).map(m => m.id + "|" + m.from + "|" + m.to).sort();
      h = fnv(h, list.join(";") + "#");
      positions++; total += list.length;
      if (!list.length) { ply++; continue; }
      const [id, from, to] = list[Math.floor(rand() * list.length)].split("|");
      b = R.play(b, { id, from: from === "null" ? null : from, to });
      ply++;
      if (R.outcome(b)) break;
    }
    out.push({ game: g, positions, moves: total, hash: h });
  }
  return out;
}
module.exports = { fingerprint };
