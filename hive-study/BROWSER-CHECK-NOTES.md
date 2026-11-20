# Openers trainer: real-browser check (headless Edge)

Run 2026-11-20. This is the first time a real browser has played openers lines end to end. The earlier checks (`study-work/ui-check.cjs`, `hive-study/check-openers-ui.cjs`) only used a simulated DOM.

## Command

Run from the Hive folder:

```
node study-work/browser-check.cjs          # local Hive-Study.html (file:///...#openers)
node study-work/browser-check.cjs --live   # https://sam-jennings.github.io/hive-trainer/Hive-Study.html#openers
```

How the script works:

- It needs Node 22 or later, which has a built-in `WebSocket` and `fetch`. It uses no npm packages.
- It starts headless Microsoft Edge with `--remote-debugging-port=0` and a fresh `--user-data-dir` under `$KIROCREW_SCRATCH`. Each run therefore starts with empty localStorage.
- It reads the DevTools port from `DevToolsActivePort` and drives the page over the Chrome DevTools Protocol (CDP).
- The viewport is 1366x900.
- Exit code 0 means every step passed.
- Screenshots and `result.json` go to `$KIROCREW_SCRATCH/browser-check/<local|live>/`.
- When it finishes it calls `Browser.close`, then `taskkill /T /F` on the Edge process tree (this runs even when a step fails), then deletes the profile folder.

How it plays:

- Every action is a real mouse press and release (`Input.dispatchMouseEvent`) at a screen position. The script never calls an app function.
- Before each click it checks that the topmost element at that point (`elementFromPoint`) is the element it meant to click, so an overlay or a wrong position fails the step.
- Cell to screen position: board.js lays out the hexes as `x = sqrt(3)*36*(q + s/2)`, `y = 54*s` in the SVG's own coordinates. The script converts that point to the screen with `svg.getScreenCTM()`, then requires the element hit there to carry the expected `data-cell`.
- Moves come from `hive-study/dist/openers.js`, loaded as data. If the piece is already on the board, the script clicks the piece and then its destination. Otherwise it clicks Reserve, picks the piece in the dialog, then clicks the cell.
- It records console errors from `Runtime.exceptionThrown`, `Runtime.consoleAPICalled` (error and assert) and `Log.entryAdded` (error level). Any uncaught exception fails the run.

## Steps and results

| Step | What it checks | Local | Live |
|---|---|---|---|
| load | The page shows "Openers trainer", "Opening library" and "0 of 12 openers solved", and the library has as many `[data-opener]` cards as `openers.js` has openers (12). | PASS | PASS |
| a1 single-move: book reply | Opens `elbow-queen` (title, goal, "Black to move"). Reserve → bQ1 → 2,-1 shows "Z Opening · Book move", "Try another reply", "Next opener" and "1 of 12 openers solved". | PASS | PASS |
| a2 reset, weak reply, retry | "Try another reply" brings back "Get a hint". Reserve → bQ1 → 2,0 shows "F Opening · Weak", its explanation and "Try another move". Clicking that brings back "Get a hint", "Show book move" and "Black to move", and 2,0 is empty again. | PASS | PASS |
| b multi-move line | `z-attack-line`, 3 moves. Move 1: place wA1 at -1,2. Black's reply bS1 2,0 is drawn automatically, with "Move 1: … · Book move", "Black replied: Black spider 1 to (2,0)" and "Move 2 of 3". Move 2: click wA1 on the board, then 2,-2 (a real board move, not a placement). Black's reply bA1 3,0 is drawn, with "Move 3 of 3". Move 3: place wA2 at -1,0. The end shows "Line summary" with 3x "Book move, first try", "Replay line" and "2 of 12 openers solved". | PASS | PASS |
| c Get a hint / Show book move | `white-last`. "Get a hint" shows the hint box with the opener's hint text and "Show book move". "Show book move" shows "Place the reserve white queen 1 on the gold space." and the 0,-1 destination with the gold stroke (#ffcd52). Clicking the gold space shows "Z Opening · Book move" and "3 of 12 openers solved". | PASS | PASS |
| d progress saved | `Page.reload` still shows "3 of 12 openers solved". The cards read elbow-queen "Found unaided", z-attack-line "Found unaided" and white-last "Found with guidance". | PASS | PASS |

Overall: local 6/6 and live 6/6. Step `e` (card click brings the board into view) was added later. See `FIX-CARD-SCROLL-NOTES.md` for its results.

- Console errors: 0 local, 0 live.
- Uncaught exceptions: 0 local, 0 live.

## Screenshots checked by eye

These matched the expected screen:

- `local/03-single-weak.png`: the black queen is inline at 2,0. The coach shows "F Opening · Weak", the explanation and "Try another move". The library shows "1 of 12 openers solved".
- `live/05-line-summary.png`: the board has wA1 at 2,-2 pinning the black queen, bS1 and bA1 on the black row, and wA2 placed. The header reads "Opener 10 of 12 · Move 3 of 3". The Line summary shows all 3 moves as "Book move, first try".
- `local/07-show-book-move.png`: the gold dashed destination is at 0,-1, the other legal spots are green, and the box says "Book move: Place the reserve white queen 1 on the gold space." The elbow-queen card reads "Found unaided".

The other screenshots are in the same folders: 01-loaded, 02-single-book, 04-line-auto-reply, 06-hint and 08-after-reload.

## Bugs found

None. Every expected text appeared, every computed cell position hit the intended clickable element, and no errors were logged.

Two observations, not bugs:

- Correction: an earlier version of these notes said that clicking an opener card in the library does not scroll back up to the board. That was wrong. The card handler (`hive-study/dist/app.js:273`) calls `window.scrollTo(0,0)`, the same call "Next opener" uses. The board in `07-show-book-move.png` is partly off screen because the script scrolls each button to the centre before clicking it. The app does not cause it. Step `e` now checks this; see `FIX-CARD-SCROLL-NOTES.md`.
- After "Show book move" the coach has no buttons left. This is intended (`o.solution` hides them), and the board prompt says to play the gold space.

## Limits

- Only headless Edge (Chromium) on Windows was tested. Firefox, Safari, a headed window and mobile were not.
- Only one viewport was tested (1366x900, desktop layout). The mobile layout (`.mobile-task`) was not checked.
- Only mouse clicks were used. Keyboard play (Enter/Space on cells) and screen-reader output were not covered.
- Coverage: 3 of the 12 openers (1 single-move, 1 three-move line, 1 hint/reveal opener) and one weak reply. The other openers and lines are covered only by the simulated-DOM check, `hive-study/check-openers-ui.cjs`.
- Each run uses a fresh profile, so this does not test a profile that already holds older progress data.
- The live run tests whatever GitHub Pages was serving at the time. The script does not compare the live file with the local one.
