# Rules engine tests

Automated tests for `HiveRules` (`hive-study/dist/rules.js`). They use only the built-in `node:test` and `node:assert`. Nothing is installed.

## Run

From the `Hive` folder:

```
node --test hive-study/tests/
```

On Node 22 and later (this host runs v24.15.0), `--test` resolves a directory argument the way `require()` does. So `hive-study/tests/index.js` loads every `*.test.cjs` file in the folder. To run the files one process each, use `node --test "hive-study/tests/*.test.cjs"`, which gives the same 107 tests.

The engine is loaded the same way as in `check-positions.cjs`: `node:vm` runs `dist/rules.js`. `Hive-Study.html` contains a byte-identical copy of `rules.js` (checked 2026-11-20), so the tests also cover what the single-file page runs.

## Result (2026-11-20)

107 tests: 107 pass, 0 fail, 0 todo, 0 skip.

| Area | File | Tests |
|---|---|---|
| Queen movement | pieces.test.cjs | 4 |
| Beetle movement, climbing, moving on top | pieces.test.cjs | 7 |
| Grasshopper (straight jumps, stops at the first gap, ignores gates) | pieces.test.cjs | 5 |
| Spider (exactly 3 steps, no backtracking) | pieces.test.cjs | 5 |
| Ant | pieces.test.cjs | 4 |
| One hive: `connected()` | hive.test.cjs | 3 |
| One hive: pinned pieces and articulation points | hive.test.cjs | 8 |
| One hive: every legal move in 6 positions keeps the hive connected | hive.test.cjs | 6 |
| Freedom to move: ground gates, pockets, corridors | sliding.test.cjs | 8 |
| Freedom to move: beetle gates at height | sliding.test.cjs | 3 |
| Contact while sliding | sliding.test.cjs | 3 |
| Placement (turn-1 exceptions, no touching an enemy, stack top colour) | placement.test.cjs | 8 |
| Pieces in hand (stock limits) | placement.test.cjs | 6 |
| Queen placed by the 4th turn | placement.test.cjs | 6 |
| No moving before your queen is placed | placement.test.cjs | 6 |
| Passing when no move is legal | endgame.test.cjs | 5 |
| Win by surrounding the queen | endgame.test.cjs | 11 |
| Draw when both queens are surrounded at once | endgame.test.cjs | 3 |
| Stacking under a beetle | endgame.test.cjs | 6 |

## Where the expected results come from

The expected results follow the official Gen42 base-game rules. Those rules cover:
- One Hive.
- Freedom to move, including the beetle at height.
- The movement of each piece.
- Placement must not touch an enemy piece, except for the second piece of the game.
- The queen must be placed by your 4th turn.
- You cannot move a piece before your queen is placed.
- You must pass only when no move or placement is legal.
- Surrounding a queen wins, and surrounding both queens at once is a draw.

The project folder holds `Play_Hive_Like_a_Champion_-_Randy_Ingersoll.pdf`. That is a strategy book, not the rulebook, and there is no PDF text tool on this host, so the expected values were not cross-checked against it line by line. Each position was worked out by hand, and its geometry is explained in a comment in the test.

## Engine bugs found

None. Every rule the tests cover matches the official rules.

During the run, 2 tests failed at first. In both cases the test was wrong, not the engine. They picked *any* move into the queen's last liberty, and the engine chose a piece from the ring itself. That move reopens the piece's own cell, so correctly it is not a win. The tests now name the outside piece that moves in. A new test also checks that the ring-piece move does not win.

## Behaviour to know about (not bugs)

- Pass: there is no explicit pass action. A side passes exactly when `moves(board, side, ply)` returns `[]`, and the tests check it that way. These tests do not check whether the UI handles a pass.
- Queen on the first turn is allowed. That matches the base rules. The tournament rule that bans a turn-1 queen is not built in.
- `destinations()` does not check whose turn it is. `moves()` filters by side.

## Existing checks (re-run after the tests, one at a time; all exit 0)

- `node hive-study/check-openers.cjs`: 12 openers, 66 replies, 153 reply moves verified.
- `node hive-study/check-positions.cjs`: all drill histories verified.
- `node study-work/ui-check.cjs`: 48 exercise flows passed.
- `node hive-study/check-openers-ui.cjs`: 12 opener flows passed.

No engine or UI code was changed. The only new files are in `hive-study/tests/` and this notes file.

## What's left

- Expansion pieces (Mosquito, Ladybug, Pillbug) are not in the engine and are not tested.
- Some edge cases are not tested: running out of stock combined with a forced pass, and a forced queen placement when there is no legal cell for the queen.
- The tests are not wired into any runner. There is no package.json, so run the command above by hand.
