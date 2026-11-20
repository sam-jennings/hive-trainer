# Openers trainer: batch 2

Four new openers from the planned list in `OPENERS-SCOPE.md`. The Openers screen now has **12 openers**: 9 single-move ones and the 3 multi-move lines. Only data changed (`dist/openers.js`); no UI or engine code was touched.

## Openers added

| Opener (id) | Planned # | Learner | Book pages | Replies (best / playable / weak) |
|---|---|---|---|---|
| Answering an X Opening (`x-answer`) | 14 | Black | 30, 223-224, 227 | 3: queen in an elbow (best), queen inline (playable), delay your queen too (weak) |
| C Opening: take your critical space (`c-take-a`) | 6 (and the elbow lesson of 8) | Black | 224-225 | 4: ant takes space A, pins the white queen (best); occupy space B yourself, self-pins your queen (playable); ant into the gap between the queens, frees White's hopper (weak); new bug away from the critical spaces (weak) |
| C Opening: White takes the critical space (`c-take-b`) | 7 | White | 224-225 | 5: ant takes space B, pins the black queen (best); pin from the far side (playable); ant beside the queen, no pin (weak); new bug away from the queens (weak); walk the queen (weak) |
| Don't waste tempo: leave the ant (`tempo-leave-ant`) | 12 | White | 217-218 | 4: second ant, pin kept (best); other new bug (playable); shift the pin to the new hopper (weak); move the ant beside the queen (weak) |

All four are single-move openers. They show the decision itself (who takes the critical space first, whether to move the ant again), so one move is enough; no `steps[]` were needed.

## Reply counts, all openers

| Opener | Replies |
|---|---|
| first-bug | 5 |
| elbow-queen | 4 |
| inline-queen | 3 |
| white-last | 4 |
| z-pin | 3 |
| x-answer (new) | 3 |
| c-take-a (new) | 4 |
| c-take-b (new) | 5 |
| tempo-leave-ant (new) | 4 |
| z-attack-line | 3 steps: 3 / 3 / 4 |
| z-defence-line | 3 steps: 4 / 5 / 3 |
| f-attack-line | 3 steps: 3 / 3 / 3 |

Every opener and every line step already had 3 or more replies, so no top-up was needed (`inline-queen` is at exactly 3).

## Checks (run one at a time, from the Hive folder)

1. `node study-work/standalone.cjs`: rebuilt `Hive-Study.html` the same way as before (146,998 bytes; contains the new openers).
2. `node hive-study/check-openers.cjs`: `OK · 12 openers (3 multi-move lines) · 66 replies · 153 reply moves verified · 9 learner moves and 6 opponent replies in lines`. Every start position and every reply move is replayed through `HiveRules`, and every `pins` / `frees` claim is checked on the board (for example, that the ant on space A really pins the white queen, and that a bug in the gap really frees White's first hopper).
3. `node hive-study/check-openers-ui.cjs`: `12 opener flows passed (3 multi-move lines, 6 automatic opponent replies), with wrong moves, retry, hints, book move, summary and saved progress.`
4. `node hive-study/check-positions.cjs`: passes (last lines: pair, shutout, draw verified).
5. `node study-work/ui-check.cjs`: `48 complete exercise flows passed ...`.

All exit 0.

Extra checks in the session's scratch folder (not in the project), with the rules engine: after White's "new bug away from the queens" in `c-take-b`, Black's ant can reach space A next move; after Black's "new bug away" in `c-take-a`, White's ant can reach space B next move. These back up the "why" text for those replies. The first try for the `c-take-a` "new bug away" cell (2,1) turned out to pin Black's own ant, so it was changed to 2,0, which leaves it free.

## Assumptions

- **Cells are my reconstruction.** The C Opening position follows figure 9.2.1 (queens in an elbow above the centre line, critical spaces A and B above the gap between them): `wG1 0,0`, `bG1 1,0`, `wQ1 0,-1`, `bQ1 2,-1`, A = `1,-2`, B = `2,-2`, gap = `1,-1`. The ants and the extra White spider that lead up to the decision are mine; the book gives only the figure.
- **Ant on the critical space also pins.** In this position the critical space touches only the opposing queen, so taking it pins her too. The book says only that whoever takes their critical space first is better off; the pin is what the engine shows for these cells.
- **"Pin from the far side" is playable, not best** (`c-take-b`). It pins the black queen but leaves space B empty. The book does not discuss this move; the grade is my call.
- **"Occupy space B yourself" is playable** (`c-take-a`). It denies White the space but pins your own queen (the checker confirms). The book does not discuss this; the grade is my call.
- **The gap between the queens is weak.** Based on fig. 9.1.8 (p. 224): a bug moved inside the elbow frees the defending white hopper. The checker confirms `wG1` can move afterwards.
- **`tempo-leave-ant` follows the idea of figs. 8.4.1-8.4.5, not the actual game.** Black's new hopper and the cells are mine. "Shift the pin" mirrors fig. 8.4.5 (moving the ant again shifts the pin from one bug to another).
- **Inline queen against an X Opening is playable** (`x-answer`). The book does not cover Black's queen choice against an X Opening; getting the queen in early is the main point (p. 227), and the inline weakness comes from p. 224. No opening `type` is claimed for these replies, because with no white queen every reply counts as an X Opening.

## What's left

- Planned openers not built: 8 as its own drill (its lesson is folded into `c-take-a`), 9 (J Opening spider attack), 10 (F Opening as a single move; the F line already exists), 11 (I Opening), 13 (Black: ants into play; partly covered by `z-defence-line` move 3).
- The J Opening drill was skipped because the book says only that a spider attack above or below is "one advantage" of the J Opening; it does not say the spider is better than an ant, so I could not grade the replies without inventing a claim.
- No check in a real browser this round; the UI check uses a fake DOM.
- New openers appear in the library before the multi-move lines (data order); no UI change was made for grouping.
