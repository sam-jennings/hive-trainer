# Opener card click and board scroll: not a bug

Date: 2026-11-20

## Result

The premise was false. Clicking an opener card in the "Opening library" already scrolls back up to the board, so the app was not changed and the page was not rebuilt.

## Evidence

- In `hive-study/dist/app.js:273`, the card click handler runs `startOpener(el.dataset.opener);render();window.scrollTo(0,0)`. "Next opener" uses the same `window.scrollTo(0,0)` (line 202). The built `Hive-Study.html` contains the same code.
- `window.scrollTo(0,0)` is an instant jump, not a smooth scroll. `style.css` also sets `scroll-behavior:auto` under `prefers-reduced-motion:reduce`, so reduced motion is already respected.
- The earlier note came from the check script itself. `clickEl` and `clickCell` call `scrollIntoView({block:"center"})` before each click. In `07-show-book-move.png` the script had just centred the "Get a hint" and "Show book move" buttons, which pushed the board partly off screen.

## New check: step `e` in `study-work/browser-check.cjs`

The step scrolls the library heading to the top of the viewport. It then picks a card that the other steps don't use (`first-bug`) and checks that the card is the topmost element at its centre. It clicks the card with a real mouse click and does not scroll the card into view first. After the click it requires the `.board-plane svg` bounding rect to sit inside the viewport. The step also fails if the page was not scrolled down before the click (scrollY < 50), since a click from the top would prove nothing.

Measured locally (headless Edge, 1366x900): clicked at scrollY 756. Afterwards scrollY was 0 and the board rect ran from top 282 to bottom 682, inside the 900 px viewport. Screenshot: `08-card-click-board.png`.

The overall pass count is now 7 steps instead of 6. Step `e` runs before `d` and solves nothing, so the solved count in `d` (3 of 12) is unchanged.

## Files touched

- `study-work/browser-check.cjs`: added step `e`. The overall pass now requires 7 steps.
- `hive-study/BROWSER-CHECK-NOTES.md`: corrected the line that called the card click a usability issue.
- `hive-study/FIX-CARD-SCROLL-NOTES.md`: this file.
- The app itself (`hive-study/dist/`, `Hive-Study.html`) was not changed.

## Check results

| Check | Result |
|---|---|
| `node study-work/browser-check.cjs` (local) | ALL PASS 7/7, 0 console errors, 0 uncaught exceptions |
| `node study-work/browser-check.cjs --live` | see below |
