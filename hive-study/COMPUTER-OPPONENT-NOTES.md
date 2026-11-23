# Play vs computer

Built 2026-11-21. You can now play a full base-game Hive match against the computer at `#play` (the new **Play** link in the nav). Nothing is committed or pushed yet.

## Files

| File | Change |
|---|---|
| `hive-study/dist/ai.js` | New. The computer opponent, `HiveAI`. |
| `hive-study/dist/app.js` | New Play screen (`playPage`, `playBoard`, `playCoach`, `gTurn`, `gComputer`, `gHuman`, `gCell`, `playAction`), plus routing for `#play`, cells, actions and the reserve dialog. |
| `hive-study/dist/index.html` | Adds the Play nav link and loads `ai.js` after `rules.js`. |
| `hive-study/dist/style.css` | Adds `.seg`, `.game-over`, `.last-move` and `.game-settings`. |
| `hive-study/check-ai.cjs` | New self-play check. |
| `study-work/browser-check.cjs` | New step g. A local run now also fails on any console error. |
| `Hive-Study.html` | Rebuilt. |

`rules.js` was not changed.

## Design

`ai.js` contains no rules logic. Everything about the rules comes from `rules.js`:

- Legal moves: `HiveRules.moves`.
- Applying a move: `play`.
- Game result: `outcome`.
- Evaluation helpers: `locate`, `ring`, `connected`, `lift`, `neighbors`.

Because the computer only ever picks from the `rules.js` move list, the queen-by-turn-4 rule and the one-hive rule always hold. `choose(board, side, ply, level, {rand, timeMs, maxNodes})` returns `null` only when `rules.js` lists no move, and the screen then shows that the computer passes.

The evaluation scores a position from the mover's point of view:

- Surround counts: the opponent's queen counts in favour, your own queen counts against, slightly more heavily. Each count is weighted by the table 0/2/5/10/18/32.
- Unpinned pieces: a piece that `connected(lift(...))` allows to lift scores by kind (ant 5, beetle 4, queen 3, grasshopper 2, spider 2). This stands in for mobility.
- Beetles on top of a stack get a bonus, and a much larger one when covering the enemy queen.
- Free ants and beetles within 2 cells of the enemy queen get a bonus.
- Win scores ±100000. Draw scores -20.

## Levels

| Level | How it plays |
|---|---|
| Easy | Takes a winning move if it has one. Otherwise picks a random legal move, skipping moves that lose or draw at once and moves that crowd its own queen. |
| Medium | Looks 1 ply ahead: scores every move with a little noise. Of the top 8, it plays the first one that does not give the opponent an immediate win. |
| Hard | Looks 2 plies ahead: its move, then the opponent's best reply. Candidates are searched best-first with an alpha cut-off. The search stops at the node cap (4000 positions) or the time cap (700 ms in the app), but the first candidate is always searched completely. |

The noise uses a seeded random function, `HiveAI.rng(seed)`, so self-play games can be repeated exactly.

## Play screen

The screen reuses the board, reserve dialog, buttons and coach panel from the other pages, so it looks the same.

- **Settings:** you choose a colour (White moves first) and a level. A change starts a new game right away if you haven't moved yet. Otherwise it is held for the next New game, and the screen says so.
- **Turns:** the turn pill reads "Your move · White" or "Computer (Black) thinking…". The computer moves about 350 ms after your move, so you see your own move first.
- **Moves:** "Computer played: …" names the computer's last move, and every move is also announced to screen readers.
- **Passing:** when you have no legal move, the board says so and a "Pass the turn" button appears. When the computer cannot move, it passes and says so. If both sides are stuck in a row, the game is a draw.
- **Game over:** a banner says "You win!", "The computer wins." or "Draw.", with the reason.
- **New game and Undo:** Undo takes back your last move and the computer's reply, and it also works after the game ends. It cancels a computer move that is still pending.
- **Saving:** games are not saved to localStorage.

## Self-play results

Command: `node hive-study/check-ai.cjs`. It plays 100 games in one process with seeds 1001–1100, alternating colours within each pairing. A game that reaches 200 plies counts as a draw. The search is capped at 4000 positions per move with no time cap, so results are the same on every machine. It took 299 s.

| Pairing | Games | Result | Draws (capped) | Avg plies |
|---|---|---|---|---|
| Easy vs Easy | 10 | White 0, Black 1 | 9 (9) | 192 |
| Medium vs Easy | 30 | Medium 28, Easy 0 | 2 (2) | 70 |
| Hard vs Easy | 30 | Hard 27, Easy 0 | 3 (3) | 65 |
| Hard vs Medium | 30 | Hard 13, Medium 0 | 17 (16) | 131 |

- Medium beats Easy in 93% of games and Hard beats Easy in 90%. Neither weaker level won a single game against a stronger one.
- Illegal moves: 0. Every move the AI returned was in the referee's own `rules.js` legal list for that position, and it passed only when that list was empty. The AI runs in a separate VM sandbox and is handed a copy of the board.
- Time per move in node.js: Easy averages 0.4 ms (max 3 ms), Medium 8.9 ms (max 55 ms), Hard 90.7 ms (max 1152 ms). The 1152 ms worst case happened with no time cap. In the app, Hard also stops at 700 ms, so a move stays under about 1 s.

The check exits 1 if there is any illegal move, or if a stronger level wins half or fewer of its games against Easy.

**Broken-copy test.** In scratch, not in the repo, I copied `ai.js` and changed the root move generation to `R.moves(board, side, 0)`, which ignores queen-by-turn-4. `node hive-study/check-ai.cjs --ai <copy> --games 10` caught 10 illegal moves, for example "bS2 drop -1,2 not in rules.js's 7 legal moves" at ply 7, and printed **FAIL** with exit code 1.

## Checks, run one at a time on the final build

| Check | Result |
|---|---|
| `node study-work/standalone.cjs` | OK, Hive-Study.html rebuilt |
| `node --test hive-study/tests/` | 114/114 pass |
| `node hive-study/check-positions.cjs` | 104 drills verified |
| `node study-work/ui-check.cjs` | 104 exercise flows pass |
| `node hive-study/check-openers.cjs` | OK, 17 openers |
| `node hive-study/check-openers-ui.cjs` | 17 opener flows pass |
| `node hive-study/check-ai.cjs` | PASS (table above) |
| `node study-work/browser-check.cjs` (local) | 9/9 steps, 0 console errors, 0 uncaught exceptions, no Edge left running |

**Browser step g** (headless Edge, real mouse clicks):

1. Opens `#play` and clicks Easy and White.
2. Places wG1 through Reserve. The computer replies.
3. Places wQ1. The computer replies.
4. Moves the queen (wQ1 1,0→0,1). The computer replies ("Black queen 1 from (-1,-1) to (-1,0)" in the recorded run).
5. Undo goes back to turn 3, and New game empties the board.

**Simulated-DOM probe** (scratch only, not in the repo): it drove 12 full games through the Play screen's own click handlers, with the human side played by random moves and by Hard. Every computer move it read off the screen was legal in `rules.js`. The "You win!" and "The computer wins." banners matched `rules.js`'s outcome, and Undo cleared the game-over state. The computer passed at least once in these games. The human pass button never came up.

## Known weaknesses

Updated 2026-11-21 after the finishing fix. See `AI-FINISH-FIX-NOTES.md`.

- **Shallow search.** Hard sees only 2 plies, and Medium sees 1 ply plus a check that it isn't handing over an instant win. Neither plans further ahead, for example setting up a pin two moves early.
- **Stuck finishes: fixed.** The evaluation now scores "finishers", meaning pieces that can actually reach a gap around the enemy queen, and it pulls movers toward the queen. A repetition penalty (`opts.history`) stops shuffling. Capped Hard-vs-Medium draws went from 16 to 5 of 30. The 5 left are quiet positions where the queens are not yet on 5 neighbours.
- **Hard loses some games to Medium.** After the fix, Hard vs Medium went 19–6–5. Medium now converts its chances, so Hard's 2-ply tactical holes show. This is not yet analysed.
- **Crude mobility measure.** "Unpinned" plus distance to the enemy queen stand in for mobility, so a free piece trapped in a pocket still scores as free. Grasshopper reach is scored only near a nearly surrounded queen.
- **Repetition is only discouraged.** There is no repetition rule in `rules.js`. The AI only avoids boards it is told about, and Easy ignores the history, so Easy vs Easy still wanders until the cap.
- **Time cap in the app.** The browser uses a 700 ms time cap as well as the node cap, so on a slow device Hard may search fewer candidates than in self-play. Measured with the 700 ms cap: Hard averages 84 ms, max 727 ms.

## What's not done

- The live site has not been checked: nothing is published, and `--live` will fail step g until the new build is on GitHub Pages.
- The human "Pass the turn" path is now covered by browser-check step h: a constructed stuck position, then real clicks on Undo and Pass. It is still not reached in normal play.
- Not tested: the mobile layout (the nav now has 5 links), keyboard-only play, and screen-reader output.
- There is no move history list, no hint or "best move" button, games are not saved across reloads, and the board does not auto-rotate when you play Black (the rotate button works).
- **Engine notes, not changed:**
  - `rules.js` has no repetition draw and no rule for both sides being unable to move. The Play screen calls that case a draw.
  - `available()` decides queen-by-turn-4 from `ply`, so a pass must still advance `ply`. Both the screen and the self-play check do this.
  - No engine bug was found.
