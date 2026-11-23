# Computer opponent: finishing fix and Pass-button check

2026-11-21. These changes are local only: nothing is committed or pushed. `rules.js` was not changed.

## Cause

Immediate wins were never the problem. `choose()` already plays a winning move at every level, Easy included, and Hard's 2-ply search already scores an opponent's mate-in-1 as −WIN. The stall came from the evaluation and from how short the search is:

1. **The eval did not tell a finishable 5 from a dead 5.** A queen on 5 of 6 neighbours scored the same whether or not the attacker had a piece that could reach the last gap. A ring piece stepping into the gap reopens its own cell, and a drop there is illegal because the gap touches the enemy queen. So the gap has to be filled by a piece from outside the ring, or by a beetle standing on a ring stack. Bringing one up takes 2–3 moves, and that is past a 1–2 ply horizon. Moving a ring piece away to free one costs about 40 eval points, so the AI never did it.
2. **Wrong pull.** Free ants and beetles got a bonus only within 2 cells of the enemy queen. A beetle that climbed onto a ring stack *lost* that bonus, even though that is exactly where it can finish from.
3. **Shuffling.** In quiet positions, several of them with the opponent fully locked and passing, Hard moved one piece back and forth (for example `wS2 -1,3 ↔ -2,6` for 15 moves) because nothing scored as progress. The capped games did not all stall at 5: at the cap the queens were often on only 1–3 neighbours.

## Fix (all in `hive-study/dist/ai.js`)

- **`finishers(b, att, qc)`** counts the queen's empty neighbours that `att` can fill with a non-ring piece, a beetle on a ring stack, a beetle on the queen, or a legal drop. It uses only `rules.js` `destinations`/`placements`, and it pre-filters by distance so it stays cheap. It runs only when the queen has 4 or more neighbours.
- **`evaluate(b, side, toMove)`** scores finishing threats:
  - Queen on 5 with a finisher: ±WIN/2 if the attacker is to move (a win next move), else ±60.
  - Queen on 4 with finishers: a smaller bonus.
  - Hard's leaves have Hard to move, so the 2-ply search now sees "mate-in-2" setups. Medium's candidates have the opponent to move, so any move that leaves the opponent a finisher sorts to the bottom.
- **Pull toward the enemy queen.** Free ants, beetles, spiders and queens now get a bonus that rises as they get closer (5 − distance; ants ×0.8). A beetle on a ring stack gets +5.
- **Repetition penalty.** The new `opts.history` takes the game's earlier boards. A candidate that returns to one of them costs 6 points per earlier occurrence. The Play screen passes its Undo snapshots, and `check-ai.cjs` passes every earlier board.
- **Medium** checks up to 40 candidates instead of 8 for "does this hand over an instant win" when its own queen is on 5.
- The 700 ms in-app time cap and the 4000-position cap are unchanged.

## Before / after: `node hive-study/check-ai.cjs` (100 games, same seeds, 200-ply cap = draw)

| Pairing | Before (W–L–D, capped) | After (W–L–D, capped) | Avg plies before → after |
|---|---|---|---|
| Easy vs Easy | White 0, Black 1, draws 9 (9) | White 0, Black 1, draws 9 (9) | 192 → 192 |
| Medium vs Easy | 28–0–2 (2) | **30–0–0 (0)** | 70 → 35 |
| Hard vs Easy | 27–0–3 (3) | **30–0–0 (0)** | 65 → 40 |
| Hard vs Medium | 13–0–17 (16) | **19–6–5 (5)** | 131 → 81 |

- Illegal moves: 0 before, 0 after.
- Capped Hard-vs-Medium draws went from 16 to 5, which meets the target of at most 5 out of 30.
- **Hard now loses some games to Medium (6 of 30).** Medium got the same finishing eval, so it now converts the chances Hard gives it, where before those games ended at the cap. Hard still wins about 3 to 1.

**Move times (node.js):**

| Level | Before: avg / max | After, no time cap: avg / max | After, 700 ms app cap: avg / max |
|---|---|---|---|
| Hard | 74.6 / 1041 ms | 93.3 / 1554 ms | **83.7 / 727 ms** |
| Medium | 9.5 / 79 ms | 9.4 / 74 ms | — |
| Easy | 0.4 / 3 ms | 0.7 / 4 ms | — |

The 700 ms column comes from a scratch re-run of the 30 Hard-vs-Medium games. It gave the same results.

## New tests

**`hive-study/tests/ai.test.cjs`** has 7 tests, and they run in `node --test hive-study/tests/`:

- The positions are what they claim: the win exists, the threat exists, and a block exists.
- Easy, Medium and Hard each play the immediate win (5 seeds each).
- Medium and Hard each block the opponent's immediate win (5 seeds each). The only block is a beetle climbing onto the threatening ant. Moving into the gap itself would lose.
- The eval scores a queen on 5 with an outside finisher more than 1000 points above the same queen on 5 with no finisher.

**`study-work/browser-check.cjs` step h** tests the human Pass button in headless Edge:

1. Makes one real move on `#play`.
2. Pauses at a CDP breakpoint on the Undo handler. `app.js` keeps its state inside a closure, so the setup has to happen there. It swaps the Undo snapshot for a turn-3 position: the white queen is pinned between bA1 and bQ1, and every edge cell touches Black.
3. Real-clicks Undo. The page shows "You have no legal move, so you must pass." and "Pass the turn", and Reserve is disabled.
4. Real-clicks Pass. The computer then played "Black beetle 1 placed at (-1,-1)" and the game reached Turn 4 with no game over. White was still stuck, so Pass was offered again.

The check now expects 10 steps.

## Check results (run one at a time, final build)

| Check | Result |
|---|---|
| `node study-work/standalone.cjs` | Hive-Study.html rebuilt |
| `node --test hive-study/tests/` | 121/121 pass (114 + 7 new) |
| `node hive-study/check-positions.cjs` | 104 drills verified (83 board + 21 decision) |
| `node study-work/ui-check.cjs` | 104 exercise flows pass |
| `node hive-study/check-openers.cjs` | OK, 17 openers |
| `node hive-study/check-openers-ui.cjs` | 17 opener flows pass |
| `node hive-study/check-ai.cjs` | PASS (table above), 190 s |
| `node study-work/browser-check.cjs` (local) | ALL PASS, 10/10 steps, 0 console errors, 0 uncaught exceptions |

No browser-check Edge is left running. The 8 `msedge.exe` processes still open are the user's own browser: none of them uses the check's profile.

## Files changed

- `hive-study/dist/ai.js`: the fix.
- `hive-study/dist/app.js`: one line, so the Play screen passes `history` to `choose()`.
- `hive-study/check-ai.cjs`: passes `history`.
- `study-work/browser-check.cjs`: step h, plus a `Debugger.paused` hook.
- `hive-study/tests/ai.test.cjs`: new.
- `Hive-Study.html`: rebuilt.
- `COMPUTER-OPPONENT-NOTES.md`: known-gaps list updated.

## What's left

- The 5 remaining capped Hard-vs-Medium games are quiet positions with queens on 1–4 neighbours. Both sides are still 1–2 ply players with no plan. A deeper search, or one that extends when the opponent has few or no moves, would be the next step.
- Hard losing 6 of 30 to Medium points to tactical holes in Hard's 2-ply search, now that Medium finishes well. This is not yet analysed.
- The repetition penalty only uses the boards the caller passes. In the app those are the Undo snapshots, which are the positions before the human's moves. That is enough to stop A↔B shuffles, but it is not a full repetition rule.
- Step h only checks Pass in the local browser run. `--live` will fail steps g and h until the new build is published.
