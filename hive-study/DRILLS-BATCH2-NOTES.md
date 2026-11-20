# Drills batch 2

Date: 2026-11-20. Adds 26 board-position drills, so the trainer goes from 78 to 104 drills. No new courses were added. The rules engine (`dist/rules.js`) and the UI (`app.js`, `board.js`, `style.css`, `index.html`, `training.js`) are unchanged.

## Totals

| | Before | After |
|---|---|---|
| Board-position drills (engine-verified) | 57 | 83 |
| Decision drills | 21 | 21 |
| All drills | 78 | 104 |
| Courses | 21 | 21 |
| ui-check exercise flows | 78 | 104 |
| `node --test hive-study/tests/` | 107 | 114 (7 new objective tests) |

## Drills added

"Verified" means the same as in batch 1. `check-positions.cjs` replays every ply of the history as a legal move and rebuilds the board. It then tests every legal White move against the drill's objective. There must be at least one solution and at least one legal wrong move, and every wrong move must get feedback. "Claim" means the extra assertions this batch added (see "Checker changes" below).

Source: none of the positions is copied from a book figure. All of them come from random playouts (see "How the positions were found"). The source column gives the Ingersoll section or figure each drill's idea is taken from, with the printed page number.

| Course | Id | Title | Type | Source (Ingersoll) | What is verified |
|---|---|---|---|---|---|
| The block | trap1 | Shut the queen's door | trap (new) | §4.1 Gate, p. 19, Figs 4.1.1–4.1.2 | The black queen can move at the start (claim). Only the 2 ant moves leave her on top, unpinned and with no legal slide |
| The block | trap2 | Gate her from afar | trap | §4.1 Gate, p. 19; §6.3 Block, p. 47 | As trap1 (2 solutions, a long ant run) |
| The block | trap3 | One cell closes two gates | trap | §4.1 Gate, p. 19, Fig 4.1.2 (one gate protecting the next) | As trap1. She has 3 empty sides, and 1 solution gates both of her exits |
| The block | trap4 | Freeze the defender queen | trap | §4.1 Gate, p. 19 | As trap1 (3 solutions: a spider walk or either of 2 ant runs) |
| Control placement | replace1 | Hand the pin to a second ant | replace (new) | §6.1 pin replacement, p. 35, Figs 6.1.5–6.1.6 | At the start the target is pinned and the named ant holds the pin alone (claim). After the 1 solution the target stays pinned with that ant lifted, and the ant can move |
| Control placement | replace2 | Keep the queen pinned | replace | §6.1, p. 35; §7.17 Pin Revisited, p. 199 | As replace1. The pinned bug is the black queen |
| Control placement | replace3 | The classic hopper replacement | replace | §6.1, p. 35, Fig 6.1.5 (hopper replacement) | As replace1. The 1 solution is a grasshopper jump |
| Control placement | replace4 | Free the ant that holds the spider | replace | §6.1, p. 35, Fig 6.1.6 | As replace1 (after the solution Black has 10 legal moves) |
| The fill | fillA1 | Release the ant | fill | §6.1.3 Releasing a pin, p. 36, Figs 6.1.7–6.1.8; §6.4 Fill, p. 51 | The target is a white piece, pinned at the start (new claim, also applied to the 4 older fill drills). The 1 solution completes a 4-in-a-row pocket and the ant can move |
| The fill | fillA2 | Fill the elbow | fill | §6.1.3, p. 36, Fig 6.1.7 (fill inside the elbow) | As fillA1 |
| The fill | fillA3 | Slide round to free the ant | fill | §6.1.3, p. 36; §4.5 Pocket, p. 23 | As fillA1. The filling ant was already a neighbour |
| The fill | unpin1 | Release the spider | unpin (new) | §6.1.3, p. 36; §6.2, p. 42, Fig 6.2.2 ("by moving away … released the pin") | The target is a white piece, pinned at the start (claim). The 1 solution moves a bug from beside it to a cell away from it, and the target can then move |
| The fill | unpin2 | Move the bug, free the spider | unpin | as unpin1 | As unpin1 |
| The fill | unpin3 | Untangle the hoppers | unpin | as unpin1 | As unpin1 (the grasshopper at the end of a 3-hopper line jumps away) |
| Tempo and counterattack | twoMove4 | Two sides, two turns | mate2 | §7.12 Counting Tempo, p. 149 | Not a mate in 1 (claim). After the 1 solution all 23 Black replies leave White a surround |
| Tempo and counterattack | twoMove5 | The quiet spider | mate2 | §7.12, p. 149; §7.8 Squeeze, p. 119 | As twoMove4. The solution does not touch the black queen, and Black has only 2 replies |
| Tempo and counterattack | twoMove6 | Step off the stack | mate2 | §7.12, p. 149 | As twoMove4. A beetle steps off its own ant |
| Queen defence | def9 | Open a second side | defend | §7.2 Defending the Queen, p. 73 | Black threatens a grasshopper jump into the last side (claim). The 2 solutions, both spider walks, leave no Black surround. No queen move defends |
| Queen defence | def10 | Walk the spider out | defend | §7.2, p. 73 | As def9. The threat is a black ant |
| Queen defence | def11 | Two gaps are too many | defend | §7.2, p. 73 | As def9. The threat is a black grasshopper |
| Tempo and counterattack | counter2 | Spider off your queen, onto hers | counter | §7.4 Counter Attack, p. 89 | The 1 solution lowers the white queen's count (3→2) and raises the black queen's (2→3) |
| Tempo and counterattack | counter3 | Switch sides with one walk | counter | §7.4, p. 89 | As counter2 (3→2 and 2→3) |
| The shutout | shutout2 | Pin the last mover | shutout | §7.5 The Shutout, p. 97 | Black has 1 legal move at the start. After the 1 solution Black has 0 moves and 0 placements |
| The shutout | shutout3 | Pin the queen, close the entries | shutout | §7.5, p. 97 | Black has 11 legal moves at the start (2 queen slides, 9 placements on 3 cells). After the 1 solution it has 0 |
| The two-beetle attack | pair2 | Cover the black beetle | pair | §7.10 Two Beetle Attack, p. 131 | The guard beetle stays on the black queen. The 1 solution covers the black beetle, which could reach the white queen's cell |
| The two-beetle attack | pair3 | Cover the free hopper | pair | §7.10, p. 131 | As pair2. The target is a mobile black grasshopper |

Before this batch, Control placement, The shutout and The two-beetle attack each had one board drill, and Tempo had one counter drill. No drill gated the queen herself, and no fill drill freed an ant. Each of these now has two to four more.

## Code changes

- `dist/objectives.js`: three new objectives on top of the existing pure rules functions. The engine is unchanged.
  - `trap`: after White's move the black queen is on top of her cell, lifting her would not split the hive, and she has no legal destination. This is a gate, not a pin or a cover.
  - `replace`: White did not move the `free` piece. The `target` is pinned, it stays pinned on a board with `free` lifted, and `free` is mobile.
  - `unpin`: White moved a piece from a cell next to the `target` to a cell that does not touch it, and the target is now mobile. A pocket fill does not count, because there the mover ends next to the target.
- `dist/positions.js`: a new `Object.assign(Positions, {...})` block with the 26 positions, in the same history format as before (`free` is a new field used only by `replace`).
- `dist/lessons.js`: def9–def11 added to Queen defence.
- `dist/curriculum.js`: drill text (title, goal, hint, why, check, 3 answers, miss) added to the existing `Object.assign(Drills, ...)`. Ids added to the block, fill, entries, tempo, beetles and shut courses. In each course the board drills go before the decision drill. `hopReply` stays last in its course and `pill2` stays the last exercise.
- `check-positions.cjs`: new claim checks, run before the solution search:
  - `trap`: the black queen must be mobile at the start.
  - `replace`: `free` must be white, the target must be pinned at the start, and the target must not be pinned with `free` lifted. This proves `free` is the piece holding the pin.
  - `unpin` and `fill`: the target must be white and pinned at the start. The fill check also passes on the 4 batch-1 fill drills.
- `tests/objectives.test.cjs` (new): 7 tests. A pinned queen and a covered queen are not traps. trap3's solution meets the definition. Moving the pin holder itself never counts as a replacement. The replaced pin survives when the holder is lifted. A pocket fill is not an unpin. unpin1 frees its spider.
- `Hive-Study.html` rebuilt.

The UI needed no change. Task drills already go through `Objectives.succeeds` and use `miss` feedback, and the board marks `target` (the black queen for trap, the pinned piece for replace and unpin, the white queen for def and counter).

## Broken copies are rejected (scratch only)

`node study-work/batch2-break.cjs` copies `hive-study/dist` and the checker into `$KIROCREW_SCRATCH`. It breaks one claim per copy, runs the checker, and then deletes the copy. Every broken copy failed:

```
replace2_as_trap     FAILED as expected: AssertionError [ERR_ASSERTION]: replace2 black queen begins mobile
replace1_wrong_free  FAILED as expected: AssertionError [ERR_ASSERTION]: replace1 free piece holds the pin alone at the start
replace3_black_free  FAILED as expected: AssertionError [ERR_ASSERTION]: replace3 free piece is white
unpin1_free_target   FAILED as expected: AssertionError [ERR_ASSERTION]: unpin1 release target begins pinned
fillA1_free_target   FAILED as expected: AssertionError [ERR_ASSERTION]: fillA1 release target begins pinned
unpin2_black_target  FAILED as expected: AssertionError [ERR_ASSERTION]: unpin2 release target is white
twoMove5_history     FAILED as expected: AssertionError [ERR_ASSERTION]: twoMove5 needs a solution
trap3_history        FAILED as expected: AssertionError [ERR_ASSERTION]: trap3 needs a solution
pair2_guard          FAILED as expected: AssertionError [ERR_ASSERTION]: pair2 needs a solution
shutout2_as_counter  FAILED as expected: AssertionError [ERR_ASSERTION]: shutout2 needs a solution
```

A first version also moved unpin2 back two plies. The checker accepted that copy, and it was right to: at that ply wS2 is still pinned and there is still exactly one unpinning move. So that case was replaced by a wrong-colour target. This also shows the limit of the checker: it verifies the objective, not the wording of the drill text.

## Check commands and output (run one at a time, from the Hive folder)

```
node --test hive-study/tests/
ℹ tests 114 · ℹ suites 22 · ℹ pass 114 · ℹ fail 0

node hive-study/check-positions.cjs
… (one line per board drill, e.g. "trap3 · 10 verified plies · 1 solutions")
83 board drills verified, 21 decision drills checked, 104 total.

node study-work/standalone.cjs        (exit 0, rebuilds Hive-Study.html)

node study-work/ui-check.cjs
104 complete exercise flows passed, including cases, move feedback, hints, both sides, multi-turn play and progress saving.

node hive-study/check-openers.cjs
OK · 12 openers (3 multi-move lines) · 66 replies · 153 reply moves verified · 9 learner moves and 6 opponent replies in lines

node hive-study/check-openers-ui.cjs
12 opener flows passed (3 multi-move lines, 6 automatic opponent replies), with wrong moves, retry, hints, book move, summary and saved progress.
```

## How the positions were found

`study-work/batch2-search.cjs` uses the same seeded, attack-weighted random playouts as batch 1. It tests each White-to-move position against trap, replace, unpin, fill (ant targets), mate2, defend (only positions where no queen move defends), counter, draw, shutout and pair. Each category keeps at most 6 candidates, and a candidate needs 1 to 4 solutions. It skips every history already in `positions.js` or in `batch1-found.json`. Two runs were made, with seeds 777 and 9191 and 1,500 games each. The results are in `study-work/batch2-found.json`. `batch2-eval.cjs` scores every candidate. `batch2-pick.cjs` writes the chosen 26 entries to `study-work/batch2-positions.txt` and prints the facts the drill text uses (solution moves, ring counts, neighbours, threats, stacks, Black's move count after the solution). A few extra facts were checked with one-off node commands: the black mobile pieces in the shutout drills, and that the black beetle in pair2 can reach the white queen's cell.

## Assumptions and judgement calls

- **Book sourcing is by idea, not by figure.** The book's diagrams are images, and its games are given only as partial move lists, so no figure could be rebuilt as a legal full history in the time available. Each drill is tied to the section and figure whose idea it trains: gates (p. 19), pin replacement (p. 35), releasing a pin (p. 36) and so on. The board itself comes from a random playout.
- **Judgement call:** the trap drills are in "The block" and not in a new course. That course is about gates (book §6.3, pp. 47–50), and adding a 22nd course would break ui-check's fixed count of 21 readings.
- **Judgement call:** the replace drills are in "Control placement". That course already covers §7.17 Pin Revisited (pp. 199–208) and has the `replacePin` decision drill on the same idea. The unpin drills are in "The fill" because that course is about releasing your own pinned pieces.
- `trap` excludes a pinned queen on purpose, because pin4 already covers pinning the queen.
- `unpin` requires the mover to end away from the target, so it never overlaps with `fill`.
- The three new defend drills (def9–def11) all defend by moving a white neighbour away, because the search only kept positions where no queen move works. A pin or block defence that is not a queen move did not come up within the 4-solution limit.
- replace1's only solution takes a white ant away from the black queen. The drill text says this, and quotes the book's warning that a pin replacement costs tempo.
- Some drills come from the same random game at different plies. In each pair the boards and themes differ, and check-positions confirms every history is unique:
  - unpin1 is trap1 at ply 10 (trap1 is at ply 20).
  - fillA1 is the first 12 plies of replace2 (26).
  - shutout3 is pair2 at ply 16 (pair2 is at ply 22).
  - unpin2 shares its first 10 plies with counter2 (18).
- No draw position turned up in the 3,000 games, so the "Play for a draw" course still has one board drill.

## What's left

- A second draw drill. This needs a targeted search, for example from positions where the queens share a liberty, because random playouts never found one.
- Rebuild a few book figures exactly. This would need the full game records cited in the book (the U!HV / HV game ids) or a hand-built legal history for each figure.
- A non-queen-move defence by pin or block (a `defend` drill where the solution pins the attacker).
- A two-stage replacement: place the new bug, then move the freed ant to a target on the next turn, like cover3.
- Ring and deny still have one board drill each. Both need parameters (`cell`), so a search has to pick the loop cell or entry cell.
