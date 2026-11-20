# Openers trainer: scope

## What the words mean here

- **Opener**: a short opening line (the first 0 to 6 placements or moves) that ends with one side to move at a moment the book treats as an opening decision. Example: "both sides opened with a grasshopper and White placed the queen in an elbow".
- **Counter-opener (reply)**: a move the side to move can play from there. Each opener lists 3 or more replies. Each reply is graded:
  - `best`: the book move. Playing it completes the drill.
  - `playable`: sound but not the book's first choice. The learner gets the reason and tries again.
  - `weak`: a known mistake. The learner gets the reason and tries again.
  - Any other legal move gets the opener's general `other` feedback.

The learner plays whichever side makes the decision (Black in most queen-placement drills, White in first-move and attack drills).

## Source

Ingersoll, *Play Hive Like a Champion*, 2nd ed.: ch. 9 Opening Theory (pp. 223-227), 5.5-5.6 opening strategy for White and Black (pp. 29-31), 6.5.1 the opening (pp. 57-58), 8.1.1 starting with an ant and 8.4 wasting tempo (pp. 209-210, 217-219).

The book classifies openings by where each queen goes relative to the two first bugs:

- **Elbow** placement: the queen, your first bug and the other first bug form a bend. **Inline** placement: the three form a straight line.
- **C**: both queens in an elbow, on the same side of the centre line. **Z**: both elbow, opposite sides.
- **I**: both inline. **J**: White inline, Black elbow. **F**: White elbow, Black inline.
- **X**: a queen is not placed next to its own first bug (or is delayed).
- The side that places its queen last chooses the opening.

## Openers

Built now (v1, base game, all verified):

| # | Opener | Learner | Replies |
|---|--------|---------|---------|
| 1 | Your first bug (empty board) | White | grasshopper (best), beetle (best), spider (playable), ant (weak), queen (weak) |
| 2 | Against White's elbow queen | Black | Z (best), C (playable), F (weak), delayed queen / X (weak) |
| 3 | Against White's inline queen | Black | J, either elbow (best), I (weak), delayed queen / X (weak) |
| 4 | White places the queen last | White | Z (best), C (playable), queen off the first bug / X (weak), delay again (weak) |
| 5 | Z Opening: pin the black queen | White | ant pins the queen (best), develop another bug (playable), ant beside the queen but no pin (weak) |

Planned next (to reach 10+):

| # | Opener | Learner | Notes |
|---|--------|---------|-------|
| 6 | C Opening: take your critical space | Black | p. 224, fig. 9.2.1. Occupy space A before White takes B. |
| 7 | C Opening: White takes the critical space | White | Same position, White's side. |
| 8 | Elbow vs inline: play into the elbow | White | p. 224, fig. 9.1.8. A bug inside the elbow frees the defender; inline gives no such space. |
| 9 | J Opening: spider attack above or below | White | p. 226. |
| 10 | F Opening: attack the inline queen | White | p. 226. Black's defenders are a spider and an ant. |
| 11 | I Opening: White keeps the initiative | White | p. 225. |
| 12 | Don't waste tempo: leave the ant | White | pp. 217-218. Moving the same ant again is the weak reply. |
| 13 | Black: get your ants into play | Black | pp. 30-31. |
| 14 | Answering an X Opening | Black | p. 227. Punish White's delayed queen. |

## Assumptions

- **The exact cells are mine.** The book's diagrams are pictures, so I could not read exact positions from the PDF. Each line follows the book's description (which bugs, elbow or inline, which side of the centre line), and the rules engine checks it, but the cells are my own reconstruction, not copies of the figures.
- **Base game only.** The engine supports queen, ant, beetle, grasshopper and spider. Book examples that use the ladybug or mosquito are rebuilt with base bugs, and the 3 Bug Defense (p. 227, needs both) is left out.
- **Z is best for Black and C is playable.** The book calls C a reasonable choice if a draw is acceptable. The drill assumes the learner is playing to win, so Z is the book move.
- **"Develop another bug" is playable.** In opener 5 the book stresses pinning the queen as fast as possible. Placing a new bug instead is graded playable, not weak.
- **Queen on turn one.** The engine allows it. Tournament rules don't, so it is graded weak, not blocked.
- **Most lines are one decision deep for now.** The learner plays one reply per opener. Longer lines (reply, answer, reply) are possible later by adding plies to `h`.

## How a line is stored

All data lives in `dist/openers.js`. Adding an opener means adding one entry there; no code changes needed:

```js
{id:"elbow-queen", group:"Queen placement", pages:"223-225",
 name:"Against White's elbow queen", summary:"...", goal:"...", hint:"...",
 h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"]],          // the opener, White first, axial "q,r"
 replies:[
  {name:"Z Opening", verdict:"best", type:"Z", moves:[["bQ1","2,-1"]], why:"..."},
  ...],
 other:"feedback for any unlisted move"}
```

- `h` uses the same piece ids and coordinates as `positions.js`. A piece's next id is what the reserve hands out (`bQ1`, `wA2`, ...).
- A reply can accept several moves (for example either elbow cell).
- Optional claims the checker enforces: `type` (C/Z/I/J/F/X opening after the reply), `pins` (that piece has no legal move after the reply), `frees` (that piece can still move).

## How the learner is quizzed

1. Pick an opener from the Opening library on the **Openers** screen (nav bar, `#openers`).
2. The board shows the line played so far, with the side to move. The coach panel shows the goal and the moves played.
3. The learner plays a reply on the board: select a piece or open the reserve, then pick a highlighted space. Only legal moves can be played.
4. The coach shows the reply's name, grade and why. If it isn't best, they choose **Try another move**. If it is best, the coach lists every reply with its explanation, plus **Next opener**.
5. **Get a hint** and then **Show book move** (the gold space) are there when needed. Progress is saved per opener in the browser as "Found unaided" or "Found with guidance" (`hive-study.openers.v1`).

## How lines are checked

`node hive-study/check-openers.cjs` loads `rules.js` and `openers.js`, then for every opener:

- replays `h` through `HiveRules.moves`, so every ply must be legal for the side to move, the hive stays connected, and the game is not over;
- requires 3+ replies, at least one `best`, a reason for each, and no move listed twice;
- checks every reply move is legal from the final position;
- checks each `type`, `pins` and `frees` claim against the real board. The opening type is worked out from the queen cells, so an opener labelled Z that is really C fails.

It exits non-zero on the first failure. Last run: 5 openers, 19 replies, 24 reply moves, all pass.

## Not in v1

- Openers 6-14 above.
- Multi-move lines where the computer plays the opponent's answer.
- A mixed or review mode for openers.
- Expansion pieces.

## Update: multi-move lines (2026-11-19)

The "one decision deep" assumption and the "Multi-move lines" item under *Not in v1* above are now out of date. Three multi-move lines have been added (the learner plays 3 moves each, and the opponent's book reply is played automatically between them). Format, screen behaviour and checks are in `OPENERS-MULTIMOVE-NOTES.md`.

| # | Line | Learner | Moves | Source |
|---|------|---------|-------|--------|
| 6 | Z Opening as White: ant, pin, keep going | White | ant in, ant pins the queen, second ant | pp. 29-30, 217-219, 224-225 |
| 7 | Z Opening as Black: queen, defender, ant | Black | Z queen, hopper defender, ant in | pp. 30-31, 219, 223-225 |
| 8 | F Opening as White: ant, pin, second ant | White | ant in, ant pins the queen, second ant | pp. 29-30, 224, 226 |

Assumptions for these lines (on top of the ones above):

- **The opponent's moves are mine.** The book gives no move-by-move sequences for these openings, only principles and final diagrams. Each opponent reply is a plausible move that fits the book's description (for example "Black gets ants into play quickly", "in the F Opening Black's defenders are a spider and an ant"), not a quoted game.
- **"Ant into play" is the book move for White's first move after the queens.** The book says White must immobilise the black queen as fast as possible; only the ant can reach a pinning space next move, so any ant placement counts as best and other bugs are playable.
- **Second ant is best on White's third move.** Based on "games often go to the side with the most free ants" (p. 225) and "once the White ants enter the game, Black is in serious trouble" (p. 226). Other new bugs are playable; moving the pinning ant again is weak (wasting tempo, pp. 217-218).
- **Black's best defender square is the one beside the queen and the first hopper.** The book says to keep a hopper or beetle next to the queen (p. 30) but does not name a cell. I chose the cell that also touches Black's first bug because the queen stays mobile there (the checker confirms); the far-side cells are playable because the queen then pins herself (also confirmed). The beetle there is graded playable, not best, to keep the beetles for later; that grading is my call.
- **An ant first is playable for Black's second move**, and a spider defender is weak (p. 219: spiders and ants make poor defenders).
