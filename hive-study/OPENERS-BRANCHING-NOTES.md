# Openers trainer: branching lines

In a branching line the computer does not always give the same reply. At a branch point it plays one of two or three book replies, and the line then continues from that reply. The learner's correct next moves depend on which branch was played.

Built: 5 branching lines with 11 branches in total (one line has 3 branches, four lines have 2). Every branch has 2 learner moves after the branch point, so each run of a line is 3 learner moves. The Openers screen now has **17 openers**: 9 single-move openers, 3 linear lines and 5 branching lines. The 12 existing openers are unchanged.

Not committed or pushed. Publishing waits for you.

## Data format (`dist/openers.js`)

The existing format still works. A step's `then` may now hold `branches` instead of `move`:

```js
then:{branches:[
  {name:"Spider in the upper elbow", move:["bS1","2,-1"], why:"what this reply does",
   steps:[ /* this branch's own learner steps, same format as any steps[] (2+ of them) */ ]},
  {name:"Ant in the lower elbow", move:["bA1","1,1"], why:"...", steps:[ ... ]}
]}
```

Rules, all enforced by `check-openers.cjs`:

- A branching step must be the last entry in its `steps[]`. What follows is in each branch's own `steps`.
- A branch can branch again (nesting depth up to 4; none of the current lines nest).
- Each branch needs a `name`, a `move`, a `why` and 2 or more learner steps. Two branches cannot play the same move.
- A branching step has no `then.move` or `then.alts`.

A **route** is one full path through the line (one branch chosen at every branch point). A linear line or a single-move opener has exactly one route.

- The new lines are added after the main array with `Openers.push(...)`.
- Where the position is the same, they reuse existing steps and replies, so the grading stays identical. For example, the first move of `z-attack-branch` reuses step 1 of `z-attack-line`.
- `pins` / `frees` may now name a list of pieces, e.g. `pins:["bQ1","bA1"]`. The checker checks each piece in the list. The app does not read these fields.

## How the screen behaves (`dist/app.js`)

- **Choosing the branch.** When a line starts, the app chooses its route:
  - first choice: a route not yet solved that is not the route just played;
  - otherwise a route not yet solved;
  - otherwise any route other than the one just played;
  - otherwise any route.

  It picks at random among the candidates. **Replay line** passes the route just played, so a line with 2 branches always switches branch on Replay.
- **During the line.** After the branching reply the coach shows "Black replied: … to (q,r)", then "**Branch 2 of 2: Ant in the lower elbow.** Your next move depends on this reply." The screen reader announcement includes the same text. The header reads "Opener 14 of 17 · Move 2 of 3 · 2 branches".
- **Grading.** Each step is graded from the replies of the branch being played.
- **Summary.** As before, plus "Branch path: Black reply 1: …" and "Branches solved: 1 of 2. Replay line to face a branch you have not solved yet."
- **Progress.**
  - Each route is saved separately under the new key `hive-study.openers.branches.v1`.
  - A branching line counts as solved in `hive-study.openers.v1` (and in the "n of 17 openers solved" count) only when every route has been solved once.
  - It is saved as "independent" only if every route was played without help; otherwise "guided".
  - The library card reads "1 of 2 branches" and later "Found unaided · 2 of 2 branches", and the card subtitle says "· 2 branches".
  - Linear lines and single-move openers save exactly as before.

## Lines added

| Line (id) | Learner | Pages | Branch point | Branches | What changes per branch |
|---|---|---|---|---|---|
| Z Opening as White: answer Black's defender (`z-attack-branch`) | White | 29-30, 217-219, 225 | Black's reply to your ant | 3: spider beside queen and hopper (2,0); ant on the far side of the queen (3,-1); spider behind the first hopper (1,1) | Branch 1: pin at 2,-2 / 3,-2. Branch 2: Black's ant has already pinned her own queen, so the book move is to pin that ant (4,-1 / 3,0 / 4,-2), and (2,0) frees the queen. Branch 3: (3,-1) also pins. |
| F Opening as White: pin whichever side is open (`f-attack-branch`) | White | 29-30, 224, 226 | Black's reply to your ant | 2: spider in the upper elbow (2,-1), the existing line; ant in the lower elbow (1,1) | The pin cells change: 3,0 / 2,1 in branch 1, 3,0 / 3,-1 in branch 2. (2,1) pins in branch 1 but is weak in branch 2. |
| White places the queen last: Z, then pin (`white-last-branch`) | White | 29-30, 58, 217-218, 223-225 | Black's reply to your Z queen | 2: spider beside queen and hopper (2,0); spider beside the first hopper only (2,-1) | The ant already on the board pins at 0,2 / 1,2 in branch 1. In branch 2 (2,1) pins too; in branch 1 it is weak. |
| Answering an X Opening: queen, then react (`x-answer-branch`) | Black | 29-31, 219, 224, 227 | White's reply to your queen | 2: White places the queen (-1,1); White delays the queen again (spider -2,1) | Branch 1: hopper defender, then an ant. Branch 2: ant first, then (White is forced to place the queen) your ant pins the white queen at (-1,2). |
| Z Opening as Black: defend from either side (`z-defence-branch`) | Black | 30-31, 219, 223-225 | White's reply to your Z queen | 2: ant from below (-1,2), the existing line; ant from above (0,-1), which then pins from 2,-2 | Same defender move. The last move's ant cells differ: (3,-1) is open only in branch 2. |

Sources are the Ingersoll pages already cited in `OPENERS-SCOPE.md`, `OPENERS-MULTIMOVE-NOTES.md` and `OPENERS-BATCH2-NOTES.md`. The principles used are:

- pin the enemy queen as fast as possible (pp. 29-30);
- free ants decide Z Openings (p. 225);
- ants in play quickly for Black (p. 30);
- hopper or beetle defenders; spiders and ants are poor defenders (pp. 30, 219);
- don't move the same bug twice (pp. 217-218);
- an X Opening costs a tempo (p. 227).

No new book claims were added.

## Judgement calls (mine, not the book's)

- **The cells and the computer's replies are my reconstructions,** as for the earlier lines. The book gives principles and figures, not move-by-move branches. Every cell was checked with the rules engine, and so was every `pins` / `frees` claim.
- **`z-attack-branch`, branch 2.** Black's ant at (3,-1) touches only the queen, so the engine shows the queen is already immobile. I graded "pin Black's ant" as best, because it leaves Black with no free ant. This is based on p. 225 (free ants decide Z Openings); the book does not discuss this position.
  - "Second ant first" is playable.
  - "Pin the queen as well" is weak, because the move adds nothing new.
  - The ant at (2,0) is weak, because it links Black's ant to the hive and frees the queen (the engine confirms).
- **`x-answer-branch`, branch 2.** Pinning the white queen with Black's ant is graded best. The book states the "immobilise the queen" goal for White (pp. 29-30) and says a free ant can pin White's attackers (p. 30). Applying that goal to Black here is my call. "Defender first" on move 2 and "Defender next to your queen" on move 3 are playable.
- **`x-answer-branch`, branch 1.** The defender step mirrors `z-defence-line` move 2. The beetle and "ant first" are playable, and the spider is weak (p. 219).
- **`z-defence-branch`.** The two branches differ only in where White's ant ends up, so the learner's answers differ only in which ant cells are legal on move 3. This is the weakest of the five branchings.
- The branch the computer plays is chosen to cover unsolved branches, not by how likely each reply is in real play. The book gives no frequencies.

## Checks (run one at a time from the Hive folder; all exit 0)

1. `node --test hive-study/tests/`: 114 tests, 114 pass.
2. `node hive-study/check-positions.cjs`: "83 board drills verified, 21 decision drills checked, 104 total."
3. `node study-work/ui-check.cjs`: "104 complete exercise flows passed …"
4. `node hive-study/check-openers.cjs`, extended. It now walks every route of every line. Along each route it replays the start position, every listed learner move in every reachable position (every combination of book moves), and every opponent reply and alternative, all through `HiveRules`. It checks every `type` / `pins` / `frees` claim and fails if the game ends inside a line. It also checks the branch structure rules listed above. Result:
   > OK · 17 openers (8 multi-move lines, 5 branching) · 155 replies · 401 reply moves verified · 36 learner moves and 28 opponent replies in lines (11 of them branches, 11 branch routes) · 1357 learner-move and 229 opponent-move replays along every path

   Per line: `z-attack-branch` 3 routes / 40 book paths, `f-attack-branch` 2 / 20, `white-last-branch` 2 / 5, `x-answer-branch` 2 / 12, `z-defence-branch` 2 / 2.
5. **Broken-copy proof.** This ran in the session scratch folder, never in the repo (script `break-branches.cjs` there). It copies `check-openers.cjs`, `rules.js` and `openers.js`, applies one fault per copy, and runs the real checker on each. All 4 exit 1:
   - illegal branch reply → "z-attack-branch [Spider behind the first hopper] move 2 opponent reply: illegal move at ply 8: bA1 to 1,-1"
   - impossible learner move in one branch → "x-answer-branch [White delays the queen again] move 3: no legal book move in variant 1"
   - false "queen is free" claim → "z-attack-branch [Ant on the far side of the queen] move 2 / wA1@4,-1 should leave bQ1 mobile"
   - branch with only one learner move → "f-attack-branch branch 'Spider in the upper elbow' needs 2+ learner moves"

   (A first try at the claim fault, `pins:"bG1"`, passed. That was correct: the engine confirms bG1 is genuinely immobile in that position, so the claim was true. The fault was switched to the false "frees" claim above.)
6. `node hive-study/check-openers-ui.cjs` (fake DOM), extended.
   - Every branching line is played through every branch. The test follows whichever branch the screen announces.
   - Each Replay must face a branch not solved yet.
   - It checks the branch path in the summary, "Branches solved: i of n", the card text ("1 of 3 branches" up to "Found with guidance · 3 of 3 branches"), and that every route is saved.

   Result: "17 opener flows passed (8 multi-move lines, 28 automatic opponent replies) … 5 branching lines played through every branch (11 branch runs), each Replay facing a branch not solved yet."
7. `node study-work/browser-check.cjs` (headless Edge, local only), with the new step **f**.
   - `f-attack-branch` is played twice with real clicks. Run 1 got "Ant in the lower elbow"; Replay then got "Spider in the upper elbow".
   - It checks that the branch reply is drawn on the board, the summary shows 3x "Book move, first try", and the card goes from "1 of 2 branches" to "Found unaided · 2 of 2 branches" and survives a reload.
   - Result: 8/8 steps, 0 console errors, 0 uncaught exceptions.
   - Screenshots are in the session scratch folder (`browser-check/local/09-branch-1-reply.png`, `10-…`, `11-branch-2-summary.png`); I checked 09 and 11 by eye.
   - Edge process count was 8 before and 8 after (those are your own windows), so no Edge was left running.

`Hive-Study.html` was rebuilt with `node study-work/standalone.cjs` (226,963 bytes).

Files changed: `hive-study/dist/openers.js`, `hive-study/dist/app.js`, `hive-study/check-openers.cjs`, `hive-study/check-openers-ui.cjs`, `study-work/browser-check.cjs`, `Hive-Study.html`. `rules.js` was not changed.

## Engine bugs

None found.

## Not done

- No `--live` browser run. GitHub Pages still serves the old build until you publish. The live check also expects 8 steps now, so it will fail until the new build is live.
- The branch choice is random. Lines with 3 branches therefore cover all branches in 3 runs only because unsolved branches come first; there is no setting to choose a branch.
- Per-step results are still not saved, only per-route results. There is no mixed or review mode for openers.
- Only one viewport and one browser (headless Edge) were tested. The mobile layout and keyboard play were not checked for branching lines.
- `OPENERS-SCOPE.md` was not updated; this file is the reference for branching lines.
