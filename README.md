# Napkin

A Wordle-style daily estimation game. One question a day; you answer it by
**building a napkin** (a few rows of your own assumptions that multiply out to
an estimate), then see the real figure, a narrated walkthrough, and where your
napkin and the model's diverged.

See [plan.md](plan.md) for the full design.

## Run it

No build step, no dependencies. Either:

- **Just open `index.html`** in a browser (double-click). Works from `file://`
  in Chrome, Edge and Firefox — history is saved to that browser's
  `localStorage`.
- **Or serve the folder** with any static server if you prefer a real origin
  (needed if a browser restricts `file://` storage), e.g. once Node is
  installed: `npx serve` — then visit the printed URL.

## Project layout

```
index.html          shell + nav, loads the four scripts in order
assets/styles.css   napkin/doodle styling
js/questions.js     the question bank (window.NAPKIN.questions)
js/scoring.js       ratio -> vibe bands, row-comparison, number helpers
js/storage.js       localStorage: rotation pointer, results, streak, export/import
js/app.js           all UI (napkin screen, reveal, practice, stats)
```

Scripts are plain classic `<script>`s sharing a `window.NAPKIN` namespace — no
modules, so it loads straight off disk.

## Status (per plan.md section 9)

- [x] 1. App shell + 5 fully fleshed questions
- [x] 2. Core loop: napkin input (+ eyeball slider + framework peek) -> animated
      narrative reveal -> vibe score + napkin comparison + share card
- [x] 3. Local persistence: completion-pointer rotation, per-day results,
      streak, stats view, history export/import
- [ ] 4. Flesh out the remaining ~25 questions from plan.md section 6
- [ ] 5. Visual polish pass
- [ ] 6. V2 publishing infra

## Data notes

- Rotation is a **sequential completion pointer**, not day-of-year: miss a day
  and you just break the streak, you don't burn a question.
- `answer_type` is `measured` (a real published count) or `consensus-estimate`
  (no ground truth — the reveal says so).
- History lives only in the browser. Use **Stats -> Export** to back it up.
