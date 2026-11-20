# Drills batch 1

Date: 2026-11-20. Adds 30 board-position drills, so the trainer goes from 48 to 78 drills. No new courses were needed. The rules engine (`dist/rules.js`) and the UI (`app.js`, `board.js`, `style.css`, `index.html`) are unchanged.

## Totals

| | Before | After |
|---|---|---|
| Board-position drills (engine-verified) | 27 | 57 |
| Decision drills | 21 | 21 |
| All drills | 48 | 78 |
| Courses | 21 | 21 |
| ui-check exercise flows | 48 | 78 |

## Drills added

"Verified" means `check-positions.cjs` replays every ply of the history as a legal move, rebuilds the board, and then tests every legal White move against the drill's objective. There must be at least one solution and at least one legal wrong move, and every wrong move must have feedback.

| Course | Id | Title | Type | What is verified |
|---|---|---|---|---|
| The surround | win4 | Run the ant round | win (mate in 1) | Only the ant move surrounds the black queen; every other legal move does not |
| The surround | win5 | The long jump | win | Only the grasshopper's jump over four bugs (both queens included) wins |
| The surround | win6 | Three steps to the queen | win | Only the three-slide spider route wins |
| The surround | win7 | Beetle steps in | win | Only the beetle step into the last side wins |
| The surround | win8 | The queen finishes | win | Only the white queen's own slide wins |
| The pin | pin4 | Pin the queen | pin | Black queen is mobile at the start; the one solution makes lifting her split the hive |
| The pin | pin5 | Spider pin | pin | A mobile black grasshopper is pinned by a spider placed after a three-slide walk (1 solution) |
| The pin | pin6 | Jump into a pin | pin | A mobile black spider is pinned by a grasshopper landing (1 solution) |
| The pin | pin7 | Pin the beetle first | pin | A mobile black beetle (5 moves) is pinned, so it cannot climb either (1 solution) |
| The pin | pin8 | Catch the free ant | pin | A black ant with 19 destinations is pinned (2 solutions) |
| The cover | cover4 | Beetle on the queen | cover | A white beetle steps from a stack onto the mobile black queen |
| The cover | cover5 | Cover the spider | cover | A beetle covers the mobile black spider |
| The cover | cover6 | Cover the grasshopper | cover | A beetle covers the mobile black grasshopper |
| The cover | cover7 | Free your queen's stack | cover | A white beetle climbs onto the black beetle that sits on the white queen |
| Queen defence | def4 | Escape the beetle | def (beetle threat) | A black beetle can climb onto the white queen; only one queen slide leaves no beetle in range |
| Queen defence | def5 | Out of the beetle's reach | def (beetle threat) | As def4, in a different position |
| Queen defence | def6 | Make room for the queen | defend (new) | Black has a move that surrounds the white queen now; the solutions leave Black no such move |
| Queen defence | def7 | Step away from your own queen | defend (new) | Three black pieces can fill the last side; only 2 of 8 legal moves defend |
| Queen defence | def8 | Stop the ant | defend (new) | One black ant threatens; moving a neighbour away or pinning the ant (6 solutions) defends |
| Purposeful placement | placeG2 | Line up a second hopper | deploy | The placed grasshopper has a legal jump into the marked liberty |
| Purposeful placement | placeS2 | Send a spider to the queen | deploy | The placed spider has an exact three-slide route to the marked liberty |
| The hop around | pivot2 | Jump to a new line | pivot | The hopper cannot reach the ring now; after the solution jump it can |
| The hop around | pivot3 | Hop round the corner | pivot | As pivot2 (2 solutions) |
| The block | block2 | Close the gate with a placement | block | The liberty stays empty with 5 neighbours; the black ant stays mobile but cannot reach it |
| The block | block3 | Gate the liberty with a move | block | As block2, with board moves instead of placements |
| The fill | fillG2 | Give the hopper a pocket | fill | The pinned white grasshopper gets a 4-in-a-row pocket and a legal jump |
| The fill | fillG3 | Reinforce the hopper's pocket | fill | As fillG2, solved by a reserve placement |
| Tempo and counterattack | twoMove1 | Leave one gap Black cannot use | mate2 (new) | Not a mate in 1; after the solution every legal Black reply leaves White a winning surround |
| Tempo and counterattack | twoMove2 | Beetle on top, ant on the side | mate2 (new) | As twoMove1, with the white beetle already on the black queen |
| Tempo and counterattack | twoMove3 | One fills, one finishes | mate2 (new) | As twoMove1 (2 solutions) |

## Code changes

- `dist/positions.js`: a new `Object.assign(Positions, {...})` block with the 30 positions, in the same history format as before.
- `dist/lessons.js`: the ids are added to the pin, cover, def and win courses.
- `dist/curriculum.js`: the drill text (title, goal, hint, why, check, 3 answers, and `miss` for task drills) is added to the existing `Object.assign(Drills, ...)`. The ids are added to the place, hop, block, fill and tempo courses. `hopReply` stays last in its course and `pill2` stays the last exercise, because ui-check asserts both.
- `dist/objectives.js`: two new objectives on top of the existing pure rules functions (the engine itself is unchanged):
  - `defend`: after White's move, Black has no legal move that surrounds the white queen.
  - `mate2`: Black has at least one legal reply, and every reply either surrounds the black queen or leaves White a legal surround next turn. A reply that draws or wins for Black fails.
  - `winsNow(board, side, ply)` is a helper that both objectives share. It is exported.
- `check-positions.cjs`: new claim checks. A `defend` drill must start with a real Black threat to win in one. A `mate2` drill must not already be a mate in one, and Black must have a reply after each solution. Every task drill must have `miss` feedback. The check now prints a totals line at the end.
- `Hive-Study.html` has been rebuilt.

## Broken copies are rejected (scratch only)

`node study-work/batch1-break.cjs` copies `hive-study/dist` and the check into `$KIROCREW_SCRATCH`. It breaks one claim per copy, runs the check, then deletes the copy. Every broken copy failed:

```
twoMove3_history FAILED as expected: AssertionError [ERR_ASSERTION]: twoMove3 needs a solution
def7_history     FAILED as expected: AssertionError [ERR_ASSERTION]: def7 Black must threaten an immediate surround
cover5_target    FAILED as expected: AssertionError [ERR_ASSERTION]: cover5 target begins mobile
pin5_target      FAILED as expected: AssertionError [ERR_ASSERTION]: pin5 needs a solution
win4_as_mate2    FAILED as expected: AssertionError [ERR_ASSERTION]: win4 needs a solution
pin6_as_defend   FAILED as expected: AssertionError [ERR_ASSERTION]: pin6 needs meaningful alternatives
```

The "not already a mate in one" assertion did not fire on its own in these runs. `win4_as_mate2` failed earlier, on "needs a solution".

## Check commands and output (run one at a time)

```
node --test hive-study/tests/
ℹ tests 107 · ℹ suites 19 · ℹ pass 107 · ℹ fail 0

node hive-study/check-positions.cjs
… (one line per board drill, e.g. "twoMove1 · 24 verified plies · 1 solutions")
57 board drills verified, 21 decision drills checked, 78 total.

node study-work/standalone.cjs        (exit 0, rebuilds Hive-Study.html)

node study-work/ui-check.cjs
78 complete exercise flows passed, including cases, move feedback, hints, both sides, multi-turn play and progress saving.

node hive-study/check-openers.cjs
OK · 12 openers (3 multi-move lines) · 66 replies · 153 reply moves verified · 9 learner moves and 6 opponent replies in lines

node hive-study/check-openers-ui.cjs
12 opener flows passed (3 multi-move lines, 6 automatic opponent replies), with wrong moves, retry, hints, book move, summary and saved progress.
```

## How the positions were found

`study-work/batch1-search.cjs` plays seeded random games weighted towards attacking moves (the same method as the earlier `find.cjs` and `expand-search.cjs`). It tests every White-to-move position against each objective and keeps at most one candidate per category per game. It also rejects positions that are spread out, or already used. `batch1-eval.cjs` scores candidates with the app's own `Training.succeeds`. `batch1-pick.cjs` writes the chosen entries, and `batch1-facts.cjs` prints the facts the drill text relies on (solution moves, empty sides, threats, stacks). Unused candidates are in `study-work/batch1-found.json` for the next batch.

## Assumptions and judgement calls

- The positions come from random playouts, not from the Ingersoll book. The themes follow the book's chapters (pin, cover, surround, block, fill, hop, placement) and standard Hive tactics. The hints and explanations state only facts the engine checks, or facts read off the board with `batch1-facts.cjs`.
- **Judgement call:** the mate-in-2 drills are in "Tempo and counterattack" (book pp. 89–96, 149–154) and not in a new course. That course is about counting turns, and a forced finish in two is a turn count. If you would rather have a separate "Forcing finishes" course, that is a data-only change, but ui-check's hard-coded count of 21 readings would also need updating.
- **Judgement call:** the "defend" drills accept any move that removes every immediate Black surround. They do not judge which defence is strategically best. In def8, for example, both the grasshopper moving away and the ant pin count as correct.
- The `def4`/`def5` beetle-escape drills use the existing `def` rule in `training.js`: only queen moves count, and no black beetle may be able to reach her new cell next turn.
- Some drills come from the same random game at different plies: cover4/def6 (16 plies apart) and pin8/fillG2 (12 apart). Their boards and themes are different, and check-positions confirms every history is unique.
- `mate2` treats a Black reply that surrounds its own queen as a White win. It treats a reply that draws or wins for Black as a failed solution. Black passing (no legal reply) is excluded: a solution must leave Black at least one legal move.

## Ideas for the next batch (78 → 100+)

- More `mate2` and `defend` positions. The search finds them quickly, and both have room for a second defence type, such as a pin or a block that does not move the queen.
- Unpin drills: free one of your own pinned pieces by moving the piece that pins it, as opposed to filling a pocket. This needs a small `unpin` objective.
- Gate and sliding-trap drills where the queen herself is gated in. "Make the queen immobile without covering her" is a checkable objective.
- Ant-block drills on a placement entry (`deny`), and a second `ring` and `counter` position.
- Beetle-on-queen follow-ups: hold the queen and drop a reserve bug beside her in one more turn (a two-stage drill, like cover3).
- Use the remaining `batch1-found.json` candidates (deployA had too many solutions to make a useful drill, and was skipped).
