# Hive Trainer

A browser trainer for the board game Hive: lessons, verified training drills, and an openers / counter-openers trainer where you pick an opening, see the best replies and drill your answer. Every position is checked by the included rules engine.

Live: https://sam-jennings.github.io/hive-trainer/

`Hive-Study.html` is a single self-contained page; the sources are in `hive-study/dist/`.

## Run the checks

```
node --test hive-study/tests/
node hive-study/check-positions.cjs
node study-work/ui-check.cjs
node hive-study/check-openers.cjs
node hive-study/check-openers-ui.cjs
```

## Rebuild

```
node study-work/standalone.cjs
```

This inlines `hive-study/dist/` into `Hive-Study.html`.

The openers content cites "Play Hive Like a Champion" by Randy Ingersoll by page number; the book is not included in this repository.
