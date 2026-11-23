# Play screen: Mosquito, Ladybug and Pillbug vs the computer

Built 2026-11-21. Local only: nothing is committed or pushed. `rules.js` and `ai.js` were not changed, and no engine bug was found.

## What was built

- **Settings.** The Play screen (`#play`) has an "Expansion pieces" group with three checkboxes: Mosquito, Ladybug and Pillbug. All are off by default. Each checkbox shows the piece's glyph (the same `Art.bug` art and colours the board uses), its name and a one-line rules blurb, and the blurb is also the tooltip. The choice works like colour and level: it is kept in `gpref` for the session, not in localStorage. If you haven't moved yet, a change starts a new game at once. Otherwise it waits for New game, and the screen says "These settings apply when you start a new game."
- **Reserve.** With a piece turned on, the Reserve dialog lists it (1 per side). It has its glyph, its name, a small "expansion" tag, and the rules blurb as a tooltip. The intro text names the pieces in play, for example "A full game of Hive with the mosquito, ladybug and pillbug against the computer."
- **Rules options.** `app.js` keeps the last move as an object (`g.lastM = {id, from, to}`, or `null` after a pass) next to the old `g.last` cell, which is still used for the last-move dot. When at least one piece is on, `R.moves` and `R.available` get `{expansions, last: g.lastM}`, and `HiveAI.choose` gets `rules` with the same values. With all boxes off, no options are passed at all, so the engine and AI calls are the same as before.
- **Undo.** Undo snapshots now include `lastM` (`gSnap()`), so Undo restores the freeze too. Older snapshots without the field restore `lastM: null`.
- **Computer.** The computer plays with the same expansion set. The 700 ms time cap and the 4000-node cap are unchanged.
- **Move text.** An ability move reads "Black ant 1 moved by white pillbug 1 from (a) to (b)", both in "Computer played:" and in the screen-reader announcement.

## Interaction design

- **Placing.** It works as before: open Reserve, choose the piece, then click a green spot.
- **Moving the mosquito and ladybug.** Click the piece, then click a green spot, as for any other bug. The mosquito's copied moves (the union of its neighbours' moves, or beetle moves on top) and the ladybug's 2-up-1-down destinations come straight from `rules.js`. Only the destinations are drawn. The ladybug's path is not drawn.
- **Pillbug ability.** You select the piece to be moved, not the pillbug:
  - Click any piece next to your pillbug, yours or the computer's. Its "move with pillbug" targets are drawn in violet with a dotted outline and an up arrow, and the cell's label and tooltip say "Move … with white pillbug 1 to …". Its ordinary moves stay in green dashed spots.
  - The coach text counts both, for example "2 legal destinations and 3 move-with-pillbug targets (violet, with an arrow)".
  - Clicking a violet spot plays the move.
  - When you select your own pillbug, or a mosquito next to one, that can use the ability, the text adds "To use its pillbug power, select a piece next to it."
- **Mosquito as pillbug.** A mosquito next to a pillbug offers the same targets, because `rules.js` lists them. The tooltip then says "Move with the mosquito (as a pillbug)".
- **Computer pieces.** You can select one only when it has ability targets. Otherwise you get the old "belongs to the computer" message.
- **Frozen pieces.**
  - Clicking a computer piece that just moved says "Black ant 1 moved last turn, so a pillbug can't move it this turn." No targets are drawn.
  - Clicking your own piece that the computer's pillbug just moved says "This piece moved last turn (by a pillbug), so it can't move or be moved this turn."
- **Duplicate moves.** When a pillbug move gives the same board as the piece's own move, `rules.js` lists it once, as the ordinary move, so it shows as a green spot.

## Files

| File | Change |
|---|---|
| `hive-study/dist/app.js` | Settings, `gOpts()`, `g.lastM`, `gSnap()`, `gWhy()`, ability selection in `gCell`, reserve names/stock/tooltips for M/L/P, move text |
| `hive-study/dist/board.js` | Violet "ability" spot style for moves that carry `by`. Base moves never have `by`, so other screens are unchanged |
| `hive-study/dist/style.css` | `.exp-choices`, `.exp-choice`, `.exp-tag` |
| `study-work/browser-check.cjs` | Steps i and j. Shared `undoInto()` breakpoint helper (step h now uses it too). Legend knows M/L/P. Expects 12 steps |
| `hive-study/check-ai-expansions.cjs` | Default 20 games |
| `Hive-Study.html` | Rebuilt |

## New browser steps (headless Edge, real mouse clicks)

- **i: turn the pieces on, place a pillbug, use its ability.**
  1. Clicks the three checkboxes, then New game.
  2. Checks that the reserve lists wM1, wL1 and wP1, each with a tooltip.
  3. Places wQ1. The Undo-breakpoint setup then gives a turn-3 position: wG1 at -1,0, wQ1 at 0,0, bQ1 at 1,0.
  4. Places wP1 at 0,-1 through Reserve, and the computer replies. Checked in node beforehand: for every possible black reply, wG1 keeps at least 2 ability targets.
  5. Clicks wG1, checks that violet targets are drawn (stroke `#d2b8ff`), clicks one, and checks that wG1 moved and -1,0 is empty.
  6. Recorded run: 3 targets, 1,-1 -1,-1 0,-2. wG1 went to 1,-1.
- **j: a frozen piece can't be pillbug-moved, and Undo keeps the freeze.**
  1. Sets up a position where bA1 has just moved (2,-1 → 1,-1) next to wP1, and bS1 sits next to wP1 and has not moved.
  2. Clicks bA1: the frozen message shows and there are 0 targets.
  3. Clicks bS1: 3 targets show, and it moves with a real click.
  4. Clicks Undo: bS1 is back, and clicking bA1 again still gives the frozen message and 0 targets.

## Check results (run one at a time on the final build)

| Check | Result |
|---|---|
| `node study-work/standalone.cjs` | Hive-Study.html rebuilt (contains the new settings and ability style) |
| `node --test hive-study/tests/` | 165/165 pass |
| `node hive-study/check-positions.cjs` | 83 board + 21 decision drills, 104 verified |
| `node study-work/ui-check.cjs` | 104 exercise flows pass |
| `node hive-study/check-openers.cjs` | OK, 17 openers, 155 replies, 401 reply moves verified |
| `node hive-study/check-openers-ui.cjs` | 17 opener flows pass, 5 branching lines |
| `node hive-study/check-ai.cjs` (base) | PASS, 0 illegal moves. Medium 30/30 and Hard 30/30 vs Easy, Hard vs Medium 19-6-5, the same as before |
| `node hive-study/check-ai-expansions.cjs` | PASS, 20 games, 0 illegal moves, 44.9 s. Mosquito moved 64 times, ladybug 60, pillbug 14, 31 ability moves. 3 Easy-vs-Easy games hit the 200-ply cap |
| `node study-work/browser-check.cjs` (local) | ALL PASS, 12/12 steps, 0 console errors, 0 uncaught exceptions |

No Edge process with the check's profile is left running. The 8 `msedge.exe` processes still open are the user's own browser, the same count as before the run.

## Gaps

- **Mobile.** Not tested. The three checkbox cards add height to the coach panel. On a phone the panel sits below the board, so the settings are further down the page.
- **Keyboard.** Checkboxes can be reached with Tab and toggled with Space. Board cells, including violet targets, already take Enter/Space. Selecting a computer piece for the ability works the same way. Keyboard-only play was not tested end to end, and screen-reader output was not tested.
- **Display.** The ladybug's 3-step path and the mosquito's copied kind are not drawn. Only the destinations are shown.
- **Pillbug choice.** When both a pillbug and a mosquito could move the same piece to the same cell, the first listed move is played. The board is the same either way.
- **Saving.** The expansion choice is not saved across reloads, like the colour and level settings.
- **Not measured.** AI strength and in-browser move times with expansions on were not measured beyond the 20 node games. The 700 ms cap applies the same way.
- **`--live`.** It will fail steps g–j until the new build is published.
