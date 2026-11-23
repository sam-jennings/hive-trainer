# Expansion pieces: Mosquito, Ladybug, Pillbug

Built 2026-11-21. `rules.js` now knows the three official expansion pieces, as an opt-in option. With the option off (the default) the engine gives exactly the same results as before. Nothing is committed or pushed.

## How to turn them on

Every rules function that needs it takes one extra, optional last argument:

```js
const opts = { expansions: ["M", "L", "P"], last: previousMove };   // or a subset, e.g. ["P"]
HiveRules.moves(board, side, ply, opts);
HiveRules.destinations(board, cell, opts);
HiveRules.available(board, side, ply, opts);
HiveRules.abilities(board, cell, opts);   // new: pillbug-ability moves of the piece at cell
```

- `expansions`: the letters to enable. Unknown letters are ignored. Missing, empty or no `opts` = base game.
- `last`: the move played on the previous turn (`{id, from, to}`, as returned by `moves()`), or `null`. Only used when expansions are on, for the pillbug freeze rules.
- Pieces in hand: one of each enabled piece per side (`wM1`, `wL1`, `wP1`). `stock` and `names` are unchanged; the new pieces are in `expansionStock` and `expansionNames`.
- A pillbug-ability move is `{id, from, to, by}`: `id` is the piece being moved, `by` is the pillbug (or mosquito) that moves it. `play()` is unchanged and applies it like any move.
- Ability moves that give the same board as a move already in the list (e.g. the pillbug moving its own queen to a cell the queen can step to itself) are listed once, as the ordinary move.

## Rules implemented (official Gen4 rules)

- **Mosquito.** On the ground it moves as any piece it touches (the top piece of each adjacent stack), and it may combine them: its destinations are the union. Touching only a mosquito, it cannot move. On top of the hive it moves only as a beetle. Touching a pillbug (on the ground), it can also use the pillbug's ability.
- **Ladybug.** Exactly three steps: two on top of the hive, then one down into an empty cell. Freedom to move at height applies to every step. It cannot end where it started.
- **Pillbug.** Moves one space like the queen. Instead of moving it may use its ability: lift an adjacent piece (either colour) up onto itself and set it down in an empty cell next to itself. Not allowed when:
  - the piece moved on the previous turn (directly or by a pillbug);
  - the piece is part of a stack (under a beetle, or a beetle on top of something);
  - lifting the piece would split the hive;
  - the lift up, or the drop down, passes between two stacks that are both higher than the pillbug (beetle gate at height 1);
  - the pillbug itself moved on the previous turn, or is covered by a beetle;
  - the owner's queen is not on the board yet.
- **Freeze.** A piece that physically moved on the previous turn, directly or by a pillbug, cannot move, be moved by a pillbug, or use the ability on this turn.
- All base rules still apply to the new pieces: One Hive, freedom to move, placement, queen by turn 4, no moving before your queen is placed.

## Choices where the rule text is ambiguous

1. **Pinned pillbug.** A pillbug pinned by the One Hive rule *can* still use its ability: the ability moves the other piece, not the pillbug (official rule sheet and FAQ). The brief's "a pillbug that is pinned cannot use it" is read as *pinned under a beetle*, which is the official restriction. The same holds for a mosquito copying the ability.
2. **Just placed is not just moved.** The official text says "the piece most recently moved". A placement is not a move, so a piece placed on the previous turn can be moved by a pillbug, and is not frozen. This is one condition in `frozen()` in `rules.js` if a stricter reading is wanted.
3. **Mosquito copies the top of each stack only.** A piece under a beetle is not "touched", so a mosquito next to a pillbug covered by a beetle copies the beetle, not the pillbug.
4. **Queen must be placed to use the ability.** The ability is your turn's move, and you cannot move before your queen is placed.
5. **Gate for the ability.** Checked with the same height formula as the beetle (blocked when both flanking stacks are higher than both ends of the step), once for the lift and once for the drop. Two ordinary (height 1) pieces never block the ability.
6. **Mosquito combining.** Its destinations are the union of every copied piece's moves, as allowed by the rules ("moves as any piece it touches").
7. **Duplicate moves.** A pillbug moving its own piece to a cell that piece could reach itself is listed once (same board, same freeze).

## Tests

`node --test hive-study/tests/` now runs **165 tests: 165 pass, 0 fail** (121 before, plus 44 in `expansions.test.cjs`).

| Area | Tests |
|---|---|
| Options and pieces in hand (on / off / subset / unknown letters, stock, queen by turn 4, no moving before the queen) | 5 |
| Pillbug movement (queen step, gate, pinned) | 3 |
| Pillbug ability (enemy piece, own piece, empty cells only, in `moves()` once + `play()`, just-moved piece, just-placed piece, stacked piece, hive break, gate up, gate down, frozen next turn, frozen vs the other pillbug, pillbug just moved, covered pillbug, pinned pillbug still can, ability off without P) | 16 |
| Mosquito (next to a mosquito only, copies queen, grasshopper + queen union, ant, beetle climb, on top = beetle only, ladybug path, pillbug movement + ability, pinned but ability, no ability on top, covered pillbug gives beetle) | 11 |
| Ladybug (exact 2-up-1-down path, can't stop early or return, drops into a gated hole, gate on the step down, pinned) | 5 |
| Expansions off: base unchanged | 4 |

How "base unchanged" is checked:
- `tests/base-moves.json` holds fingerprints of every legal-move list in 120 seeded random games (8,153 positions, 441,964 moves), written from the **pre-expansion** `rules.js` (saved in scratch before the change). The test replays the same games on the current engine with no options, and 30 of them with `{expansions: []}`, and compares. The replay code is in `tests/base-moves-fixture.cjs`.
- Base pieces have the same destinations with expansions on (20 games, over 1,000 piece checks).
- One-off, in scratch: old vs new `rules.js` on 30,678 random base positions (`moves`, `available`, `destinations` with and without options): 1,134,036 comparisons, 0 differences.
- Mutation run, in scratch: 9 deliberate bugs (no freeze, no gate up, no gate down, stacked target allowed, mosquito copies mosquito, mosquito on top copies, ladybug may stop after 1 up, covered pillbug allowed, no hive check on the target). Each one fails 1-4 of the new tests. `rules.js` was restored byte for byte afterwards.

## Computer opponent

`ai.js` can now play expansion games: `HiveAI.choose(board, side, ply, level, { ..., rules: { expansions, last } })`. Without `rules` it runs exactly as before. It passes the rules on to `moves()` (with `last` set to the move being looked at, so freezes apply in the search) and to its evaluation, and gives the new pieces a mobility value (mosquito 4, ladybug 3, pillbug 3). The evaluation is otherwise still tuned for the base game.

New check `node hive-study/check-ai-expansions.cjs`: 10 seeded games with all three pieces on, refereed by a separate copy of `rules.js`. Result: **0 illegal moves, PASS**, 17 s. Mosquito moved 31 times, ladybug 29, pillbug 7, and 14 pillbug-ability moves were played. 9 games ended with a win, 1 Easy-vs-Easy game hit the 200-ply cap.

## Checks, run one at a time on the final build

| Check | Result |
|---|---|
| `node study-work/standalone.cjs` | OK, `Hive-Study.html` rebuilt; it contains the new `rules.js` and `ai.js` verbatim |
| `node --test hive-study/tests/` | 165/165 pass |
| `node hive-study/check-positions.cjs` | 83 board drills + 21 decision drills, 104 verified |
| `node study-work/ui-check.cjs` | 104 exercise flows pass |
| `node hive-study/check-openers.cjs` | OK, 17 openers, 155 replies, 401 reply moves verified |
| `node hive-study/check-openers-ui.cjs` | 17 opener flows pass, 5 branching lines |
| `node hive-study/check-ai.cjs` (base game) | PASS, 0 illegal moves. Medium 30/30 and Hard 30/30 vs Easy, Hard vs Medium 19-6-5, the same as after the finishing fix |
| `node hive-study/check-ai-expansions.cjs` | PASS, 0 illegal moves in 10 games |
| `node study-work/browser-check.cjs` (local) | ALL PASS, 10/10 steps, 0 console errors; no headless Edge left running |

## Files

| File | Change |
|---|---|
| `hive-study/dist/rules.js` | Expansion pieces, `abilities()`, optional `opts` argument. Base code unchanged in effect (the beetle step test moved into `climbOk()`, same formula). |
| `hive-study/dist/ai.js` | Optional `opts.rules`; values for M, L, P. |
| `hive-study/tests/expansions.test.cjs` | New, 44 tests. |
| `hive-study/tests/base-moves-fixture.cjs`, `hive-study/tests/base-moves.json` | New, base-game fingerprints from the old engine. |
| `hive-study/check-ai-expansions.cjs` | New, 10-game expansion self-play. |
| `Hive-Study.html` | Rebuilt. |

## Not done

- **No UI yet.** The app never passes `opts`, so every screen is still the base game. To add it to the Play screen:
  - a game setting (checkboxes for M / L / P) stored in the game state;
  - pass `{expansions, last: <last move object>}` to `R.moves` and `R.available` (reserve dialog), and `rules` to `HiveAI.choose`. The screen keeps `g.last` as a cell only today, so it also needs the last move object (and `null` after a pass);
  - show ability moves: selecting the pillbug/mosquito should also offer the neighbours it can move, and the move text should say "moved by the pillbug" (`m.by`);
  - `board.js` already draws M / L / P pieces and colours, so no art is needed. `check-openers-ui.cjs` and `browser-check.cjs` build piece labels from `R.names`, which has no M / L / P; use `expansionNames` too if they ever see those pieces.
- **No expansion drills or openers.** All drills, courses and openers stay base-game; their checkers call the engine without options.
- The AI evaluation is not tuned for the new pieces (for example it does not value the pillbug's defence of its own queen), and its strength with expansions was not measured beyond 10 games.
- Not covered: the tournament rule against placing the queen on turn 1, and any repetition rule (neither is in the engine).
