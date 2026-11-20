# Openers trainer: multi-move lines

Some openers now ask for several moves in a row. The learner plays a move, the opponent's book reply is played on the board automatically, and the learner plays the next move. The old single-move openers work as before.

Built: 3 lines, 3 learner moves each (9 learner moves, 6 automatic opponent replies). Total on the Openers screen: 8 (5 single-move openers + 3 lines).

## Data format

A line is an entry in `dist/openers.js` with `steps` instead of `replies`. No code change is needed to add one.

```js
{id:"z-attack-line", group:"Multi-move line", pages:"29-30, 224-225",
 name:"...", summary:"...", goal:"overall goal", hint:"default hint", other:"default feedback",
 h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"],["bQ1","2,-1"]],   // start position, as for openers
 steps:[
  {goal:"Move 1: ...", hint:"...", other:"feedback for unlisted moves",
   replies:[                                                        // same as an opener's replies
    {name:"Ant into play", verdict:"best", moves:[["wA1","-1,2"],["wA1","-2,2"]], why:"..."},
    {name:"Walk the queen", verdict:"weak", moves:[["wQ1","0,1"]], why:"..."}],
   then:{move:["bS1","2,0"], why:"what the opponent's reply does",   // played automatically
         alts:[{move:["bA1","3,-1"], why:"..."}]}},                   // optional, shown as notes only
  {goal:"Move 2: ...", ..., then:{...}},
  {goal:"Move 3: ...", ...}                                           // last step: no "then"
 ]}
```

- `replies` per step work exactly like an opener's: `best` / `playable` / `weak`, optional `type`, `pins`, `frees`.
- A step may have several book moves. The line continues from the move the learner actually played; the checker replays every combination.
- Opponent alternatives (`then.alts`) are shown to the learner but never played.

## How the screen behaves

- The library card says "3-move line". The coach header shows "Opener 6 of 8 · Move 2 of 3" and the step's own goal.
- Each learner move is graded with the reply's name, grade and reason. A playable, weak or unlisted move shows the reason and **Try another move**, which resets that step only.
- A book move on a step that isn't the last: the opponent's reply is played at once and marked on the board. The coach shows "Move 1: ... · Book move", what the opponent replied and why, and a fold-out of the opponent's other options. The next step starts.
- **Get a hint** / **Show book move** (gold space) work per step.
- After the last book move: a line summary ("Move 1: Weak first, then the book move with a hint", "Move 2: Book move, first try", ...), all replies for the last move, **Next opener** and **Replay line**.
- Progress is saved per line in the same place as openers (`hive-study.openers.v1`): "Found unaided" only if every step was the book move on the first try with no hint, otherwise "Found with guidance". The per-step summary is not saved.

Try it: open `Hive-Study.html` (or `dist/index.html`), choose **Openers**, then one of the three "Multi-move line" cards at the end of the library.

## What was checked

- `node hive-study/check-openers.cjs`: replays every line's start position, every listed learner move, every opponent reply and every opponent alternative through `HiveRules`, along every combination of book moves (10 + 1 + 10 paths). Fails on any illegal move, a game that ends inside a line, a missing book move, a duplicate move, or a false `type` / `pins` / `frees` claim. Result: OK, 8 openers (3 lines), 50 replies, 108 reply moves, 9 learner moves, 6 opponent replies.
- Broken-line proof (in the session's scratch folder, not the project): one copy with an illegal opponent reply (`bA1` to `1,-1`, touching White) fails with "z-attack-line move 2 opponent reply: illegal move at ply 8"; one copy with an impossible learner move (`bA1` to `-2,1`) fails with "z-defence-line move 3: illegal reply". Both exit 1.
- `node hive-study/check-openers-ui.cjs` (new): drives the Openers screen of the built `Hive-Study.html` for all 8 openers, with a wrong move, retry, hint and book move on each step, the automatic replies on the board, the summary, Replay line, and saved progress (guided and unaided). Passes.
- `node hive-study/check-positions.cjs` and `node study-work/ui-check.cjs` (existing, 48 exercise flows): pass.
- `Hive-Study.html` rebuilt with `node study-work/standalone.cjs` (run from the Hive folder). `study-work/` was not changed.

## Assumptions

- A line only moves on after the book move. A playable move is graded and the learner tries again, as in the single-move flow; the line does not branch into the playable move's own continuation.
- The opponent's replies and the exact cells are my own reconstructions from the book's principles; see the *Update: multi-move lines* section of `OPENERS-SCOPE.md`.
- A listed learner move only needs to be legal in at least one position the line can reach (one book choice can make another step's move unavailable). Opponent replies and alternatives must be legal in all of them.

## Not done

- No branching lines (the opponent always plays one book reply; alternatives are notes only).
- No per-step history saved, and no mixed/review mode for openers.
- No visual check in a real browser this round; the UI check uses a fake DOM.
- The planned single-move openers in the "Planned next" table of `OPENERS-SCOPE.md` (C, J, I, X openings and others) are not built.
