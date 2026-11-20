# Publish notes

- Repository (public): https://github.com/sam-jennings/hive-trainer
- Live site: https://sam-jennings.github.io/hive-trainer/ (root `index.html` redirects to `Hive-Study.html`)
- Branch: `gh-pages`, which is also the default branch. Pages serves it from the root `/`. This environment blocks pushes to `main`/`master`, so there is no `main`.

## Excluded (see `.gitignore`)

- `*.pdf`: "Play Hive Like a Champion" by Randy Ingersoll is a copyrighted book. The openers content cites it by page only.
- `node_modules/`, OS and editor junk, `*.tmp`, `*.log`, `*.dmp`.
- `study-work/browser-qa/` and `study-work/browser-qa-edge/`: headless-browser profiles and crash dumps from UI checks.
- `study-work/transfers/` and `study-work/transfer-current/`: a third-party file-transfer helper script, not part of the trainer.
- `study-work/site-source/` (an empty checkout) and `hive-study/.openai/` (another tool's hosting config).
- `hive-study/.git-empty-unused/`: `hive-study/` had its own empty git repo (no commits), which stopped the parent repo from adding its files. It was renamed rather than deleted. Rename it back to `.git` to restore it.

There were no multi-MB dumps. The first commit had 53 files (about 630 KB), no PDF, no file over 5 MB, and no matches for typical secret or token patterns.

## Build status read on 2026-11-20

- `pages/builds/latest`: `built`, commit `8c47b79`, about 34 s, no error.
- `GET https://sam-jennings.github.io/hive-trainer/` returned 200 with title "Hive Trainer" (the redirect page).
- `GET .../Hive-Study.html` returned 200, 203,469 bytes (the same size as the local file), with title "Hive Study – Tactics studio".

## Publish an update

```
node study-work/standalone.cjs        # rebuild Hive-Study.html from hive-study/dist/
node --test hive-study/tests/          # plus the other checks listed in README.md
git add -A
git status                             # check that no PDF or scratch files appear
git commit -m "Update trainer"
git push origin gh-pages
```

Pages rebuilds on its own after each push. Check progress with `gh api repos/sam-jennings/hive-trainer/pages/builds/latest`.
