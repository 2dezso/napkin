# Daily Guesstimate — Build Plan

A Wordle-style daily practice app for PM-interview estimation questions
("How many windows are on the Empire State Building?" / "How many pizzas
are delivered in NYC per day?"). One question a day. You answer it by
**building a napkin** — a few rows of your own assumptions that multiply
out to an estimate — then see the real answer, a narrated version of one
good way to get there, and where your napkin and the model's diverged.
Doing the working-out *is* how you play; there's no bare "type a number"
box (a slider fallback exists for eyeball days).

---

## 1. Core Loop

1. App shows **today's question**.
2. You build your **napkin**: add a row per variable — a short label, a
   number, and a ×/÷ operator. The running product of your rows *is* your
   estimate. There is no separate "type your guess" field; the estimate is
   whatever your napkin multiplies out to. (A slider is available as a
   fallback for "I'll just eyeball it" days.)
   - Stuck on where to start? A **"show me the framework"** button reveals
     the model solution's variable *labels* — not its numbers — and flags
     the attempt as **assisted** in your history and on the share card.
3. You hit "Reveal."
4. App shows:
   - The actual answer (with source/method, and whether it's a *measured*
     figure or itself a *consensus estimate*).
   - A worked **narrative breakdown** of the model's path (clarify →
     framework → assumptions → math → sanity check), revealed line by line.
   - **Your napkin vs. the model's napkin**, side by side.
   - How far off you were (see scoring, below).
5. Result gets logged to your history (streak, accuracy trend over time).

---

## 2. MVP Feature List (V1 — personal use)

- [ ] One question per day, pulled from a local question bank (JSON or SQLite).
- [ ] **Build-your-own-napkin input**: user adds rows (label + number + ×/÷); running product is their estimate. This *is* the guess mechanic — the working-out isn't optional scratch, it's how you submit.
- [ ] Slider fallback for a bare eyeball guess (no napkin).
- [ ] "Show me the framework" peek button — reveals the model solution's variable labels only, flags the attempt as assisted.
- [ ] Reveal screen: actual answer (+ measured vs. consensus-estimate flag) + narrative breakdown + your-napkin-vs-model's-napkin comparison + vibe score.
- [ ] Local persistence: history of past questions, napkins, guesses, scores, streak count, assisted flag.
- [ ] History export/import as a JSON file (so clearing browser storage doesn't wipe a long streak).
- [ ] Simple stats view: streak, average ratio, error trend over time.
- [ ] "Practice mode": browse any past question anytime (not just today's), untimed, retries allowed.

### V2 (later — publishing to the web)
- [ ] Auth (so multiple people can each have their own history/streak).
- [ ] Server-side daily rotation (same question for everyone, like Wordle) instead of a locally-seeded rotation.
- [ ] Shareable results ("I was 1.8x off today").
- [ ] User-submitted questions + moderation queue.
- [ ] Leaderboard / friends comparison.

---

## 3. Data Model

```json
{
  "id": "q0001",
  "category": "physical-estimation | market-sizing | operations | pm-classic",
  "difficulty": "easy | medium | hard",
  "question": "How many windows are on the Empire State Building?",
  "clarifications": [
    "Assume 'windows' means exterior windows on office floors, not the observation deck."
  ],
  "framework": [
    { "label": "Standard office floors",      "op": "x", "model_value": 92,  "unit": "floors",           "plausible_range": [80, 100] },
    { "label": "Windows per floor",            "op": "x", "model_value": 55,  "unit": "windows/floor",    "plausible_range": [40, 80]  }
  ],
  "framework_notes": [
    "~102 floors total, minus ~10 mechanical/setback/observation floors = ~92 standard floors.",
    "Each standard floor is roughly rectangular; ~55 windows per floor from perimeter / window spacing."
  ],
  "narrative": [
    "Start with the height: about 102 floors.",
    "Knock off ~10 for mechanical, setback, and observation levels -> ~92 real office floors.",
    "Walk the perimeter of one floor: roughly 55 windows.",
    "92 x 55 lands around 5,000...",
    "...and the published count is 6,514. Same ballpark, a bit low because the lower floors are wider."
  ],
  "estimate_range": [4500, 7500],
  "actual_answer": 6514,
  "answer_type": "measured",
  "as_of": 2023,
  "source": "Empire State Building fact sheet",
  "sanity_check": "Order of magnitude (thousands) matches a ~100-floor skyscraper."
}
```

Notes on the fields:

- **`framework`** is an ordered list of variable rows — the model
  solution's own napkin. Each row has a `label`, an `op` (`x` or `/`
  relative to the running product), a `model_value`, a `unit`, and an
  optional `plausible_range` used to tell the user at reveal whether their
  number for that variable was tight or wild. The product of the rows
  should land inside `estimate_range`.
- **`narrative`** is what actually gets animated on the reveal screen —
  short spoken-aloud sentences, one clause / one number each, ending on
  the real answer. Written separately from `framework` so it can read
  like a person talking, not like a spreadsheet.
- **`answer_type`**: `"measured"` (a real published figure, e.g. Empire
  State windows) vs `"consensus-estimate"` (no ground truth exists — e.g.
  "golf balls in a school bus" — the "answer" is just a well-reasoned
  Fermi estimate). The reveal copy is honest about which.
- **`as_of`**: year the answer/source is from. Market-sizing numbers
  drift; the reveal phrases these as "as of 2023, roughly...".
- **`estimate_range`** is the "you basically got it" band. Scoring: land
  inside the range → "Nailed it" regardless of ratio; outside → fall to
  the ratio bands in Section 4. Fermi questions are about
  order-of-magnitude reasoning, not precision.

---

## 4. Scoring Logic

Absolute difference is misleading at this scale (being off by 500 matters
a lot if the answer is 1,000, and nothing if the answer is 1,000,000).
Use a **ratio/log-based score** instead:

```
if estimate_range[0] <= guess <= estimate_range[1]:  "Nailed it"
else:
    ratio = max(guess, actual) / min(guess, actual)
```

- inside `estimate_range` → **Bang on 🎯**
- `ratio ≤ 1.5` → **Bang on 🎯** (tight, even if just outside the band)
- `ratio ≤ 3` → **Solid ballpark 👍**
- `ratio ≤ 10` → **Right idea, wrong number 🤏**
- `ratio > 10` → **Off by a mile 🙈**

Each band carries a pool of `quips` — one is picked at random for the
reveal. Close bands give credit ("You'd survive the interview"), the miss
band takes the piss ("{n}× out — that's Sunday league vs Wembley",
`{n}` = the miss factor). This mirrors how these questions are actually
graded in a real interview — process and ballpark, not decimal precision —
but the tone is a mate reacting, not a marking scheme.

### Reveal: the score lands big

After the narrative animates, a **band-coloured hero panel** scales in:
big emoji, big vibe label, the ratio ("1.2× off" / "spot on"), and the
random quip. Below it: the real figure with a count-up + pop, and a
**log-scale bar** with two markers (you vs actual) so the gap is visible
at a glance.

### Process feedback (not a grade)

Because the guess is submitted *as a napkin*, the reveal can also point at
*which row* drove the miss — without scoring the process. Best-effort
only: match the user's row labels to the model's `framework` rows by rough
label similarity; for any that line up, compare against `plausible_range`
and annotate ("your windows-per-floor was ~3× low; that's most of the
gap"). Unmatched user rows and skipped model rows are just shown as-is.
Never block or penalize a different framework — many are valid.

### Assisted attempts

If the user hit "show me the framework," the result still counts for the
streak but is marked 👀 assisted in history and on the share card.

---

## 5. Question-Writing Template (for filling out the 30 starter questions)

Follow the *Cracking the PM Interview* framework when authoring each entry:

1. **Clarify** — state any scoping assumptions the question needs
   (geography, time period, definition of terms). → `clarifications`
2. **Framework** — the chain of variables that multiply/divide together
   to get from "known" to "unknown." Author these as the structured
   `framework` rows (`label` / `op` / `model_value` / `unit` /
   `plausible_range`). Keep it to 2–4 rows; more than that and the daily
   question is too heavy. → `framework`
3. **Assumptions** — one line per row justifying the `model_value` and the
   `plausible_range` (why 55 windows/floor? why could 40–80 be defensible?).
   → `framework_notes`
4. **Narrative** — rewrite the math as 4–6 spoken-aloud sentences, one
   clause / one number each, ending on the real answer with a beat about
   *why* the model's number and the true number differ. → `narrative`
5. **Sanity check** — a gut check on whether the final number feels right
   (compare to a known reference point). → `sanity_check`
6. **Answer** — the real figure, its `answer_type` (measured vs
   consensus-estimate), `as_of` year, and `source`. For consensus-estimate
   questions, the `narrative`'s final line *is* the answer — say so plainly.
   → `actual_answer` / `answer_type` / `as_of` / `source`

---

## 6. Question Bank — British-leaning, mixed topics

Tone: British frame of reference, plenty of football/sport, and a spread
across everyday life, operations, geography and daft physical Fermis. The
daily order is **shuffled per install** (`storage.deck`, seeded once and
stored) so it feels random but stays stable + keeps the streak logic.

**Built (8, fully fleshed):** PL matchday attendance · matchday pies across
English football · UK cups of tea per day · pints pulled on a Friday night
· GB mainland coastline · Greggs sausage rolls per day · TfL journeys per
weekday · blades of grass on a football pitch.

**More prompts to add** (fill in per the template; verify `measured`
answers, mark the rest `consensus-estimate`):
- **Football / sport:** Premier League season-ticket holders · players in
  the FA's registered pyramid · people who play 5-a-side each week · cost
  of every replica shirt sold in a season · Wembley hot dogs on a cup
  final · miles run by a Premier League team in a match · golf balls lost
  in UK water hazards per year · county-cricket spectators on a weekday.
- **Everyday UK:** roast dinners served on a Sunday · Freddos sold per year
  · miles cycled on London hire bikes per day · wheelie bins in the UK ·
  first-class stamps posted per day · dogs walked in UK parks on a Saturday
  morning · fish-and-chip portions sold on a Friday.
- **Operations / throughput:** parcels delivered in the UK per day · litres
  of tea bags brewed by a big office per year · NHS GP appointments per day
  · pints of milk still delivered to doorsteps · trains through Clapham
  Junction per day · Nando's chickens served per day.
- **Geography / physical:** Tube-tunnel miles · sheep in Wales · trees in
  the New Forest · bricks in a typical terraced street · roundabouts in
  the UK · red phone boxes still standing · steps to the top of the
  Scott Monument (silly-precise, good contrast).

Good workflow: batch first-pass breakdowns with an LLM, then spot-check
every `measured` answer against a real source before publishing.

---

## 7. Suggested Tech Stack

**V1 (built — static, no backend):**
- Plain HTML/JS + `localStorage`. Hosted on GitHub Pages (`?v=N` on the
  asset URLs to dodge the CDN cache).
- **Shared daily rotation, no server.** The question is a pure function of
  the calendar date: `dayNumber = days since EPOCH`, and
  `dailyOrder[dayNumber % dailyOrder.length]` is today's question — the
  *same for everyone*, like Wordle. `dayNumber + 1` is the `Napkin #N`.
  No per-user pointer; what's stored is just the log of what you've played.
  Cycles once the `dailyOrder` list runs out (extend it as the bank grows).
- Streak = consecutive calendar days with a completed question (assisted
  still counts). Today's question is locked once completed for that date.
- History export/import: downloads / restores the full `localStorage`
  history as JSON. The only backup in V1.
- Inline SVG sparkline for the accuracy-over-time stat (no chart lib).

**V2 (published):**
- Add a lightweight backend for **accounts + a server-authoritative daily**
  (so the rotation can't be skewed by a wrong device clock), plus
  server-side streaks and a leaderboard.
- Keep the question bank in a DB so it can grow via user submissions.

---

## 8. Fun/Feel Spec — "Napkin," not Math Class

Core principle: never let the UI feel like a math worksheet. Language,
input, and pacing should all feel like a quick game, not a study session.

### Naming & tone
- Avoid words like "calculate," "formula," "solve," "error." Use "take
  a swing," "make your call," "how close can you get."
- Give the app a light voice/personality in its copy — a wry narrator
  reacting to guesses — rather than neutral system text.
- Score results with vibes instead of percentages on the main UI:
  "Nailed it 🎯" / "Solid ballpark" / "Off by a mile" (precise ratio
  can still show as secondary detail for people who want it).

### Input — the scribble pad (C: one text field, multiply everything)
- The daily guess is a **single `<textarea>`** you just type into — one
  ruled, cream, hand-font pad. It is never rewritten and never moves your
  caret; native Enter / Backspace / undo. That's the whole trick to making
  typing feel like writing.
- The app scans the *whole* blob for numbers and **multiplies them all**.
  `8.3M`, `285k`, `25%`, `1/4`, `1 in 4`, `5 billion` all normalise first.
  A number counts as a **divisor** when `per`, `over`, or a lone `/` / `÷`
  sits before it on its line. Non-number words are free scribble, ignored.
- **Interpretation ribbon** under the pad — one pill per number the app
  grabbed (`8.3M`, `× ¼`, `÷ 7`, `= 296K`). **Tap a pill to mute it**
  (drops out of the math, your text untouched); **tap again to flip ×/÷**.
  Re-resolved every keystroke, so it can't go stale. This is how you fix
  "why did it multiply that" without editing prose.
- **Symbol toolbar** above the pad — `×  ÷  %  1 in  000  K  M` — inserts
  the characters that are painful to type, especially on a phone.
- **Value chips** from the question's anchors — tap to drop a ready-made
  line in (`NYC population 8,300,000`).
- **Running total** rolls when it changes; shown words + digits
  ("≈ 296K" · "296 thousand · 296,428"). Tap it to **hand-write your own
  final number** — result gets a quiet *adjusted* mark.
- **F — finish & ritual:** "Lock it in" with a stamp animation ·
  Cmd/Ctrl-Enter to lock · native undo (surfaced) · one-tap **gut check**
  that shows the question's sanity-check line next to your current total.
- "Stuck?" → the **peek** seeds the pad with the model's variable *labels*
  (no numbers), flags the attempt assisted.
- **Slider fallback** ("Just eyeball it") is still there for a pure gut day.
- *Pass 2 (not built):* tap-a-number-to-rescale steppers, drag-scrub, a
  draggable magnitude bar. All need exact number-span mapping — prove first.

### One question, one shot, under a minute
- Single question per day, single napkin, no retries. This is the Wordle
  mechanic — scarcity + ritual. The napkin keeps it *engaging* without
  making it longer; the target is still "done in under a minute." Resist
  adding multiple questions or retries to V1's daily mode (that's
  "Practice Mode," which is explicitly separate and untimed).

### Reveal: narrative sequence, not a bullet list
Instead of the breakdown displaying as a static list of steps, reveal
it as a short animated story that builds up to the answer line by line,
each beat appearing in sequence (e.g. with a short delay/fade-in per line):

> "Turns out there are about 8.3M people in NYC...
> ...about 1 in 4 order delivery weekly...
> ...that's already 2M orders a week...
> ...spread across 7 days, that's ~285K orders a day."

Implementation notes:
- The `narrative` array in the data model *is* this sequence — authored
  as spoken-aloud sentences, not the structured `framework` rows.
- Animate line-by-line reveal (fade/slide in, ~1-1.5s stagger) ending
  on the actual answer landing with emphasis (e.g. a count-up animation
  to the final number, or a scale/bar visual comparing the user's guess
  to the real answer).
- Keep each line short — one clause, one number. This is closer to a
  comic-style reveal than a report.
- **After** the story, show **your napkin next to the model's napkin** —
  two columns of rows. Where a user row matched a model row by label,
  mark it tight / low / high vs the `plausible_range`. Rows that didn't
  match are just shown side by side, no judgement. This is the "here's
  where your thinking and mine diverged" beat, and it's the payoff for
  making the napkin the input in the first place.

### Shareable result card
After reveal, generate a shareable summary card (image or styled text
block) the user can copy/screenshot/share, styled like a Wordle result:

```
Napkin #47
1.4x off 🔥
3-row napkin · 12-day streak
```

- Number = which day's question (the sequential completion pointer, like
  Wordle's puzzle number).
- Ratio/vibe score, not the raw numbers (keeps it shareable without
  spoiling the answer for others).
- A small nod to *how* you got there — row count, or 👀 if the attempt was
  assisted — since the napkin is the point of this one.
- Streak count, since that's the habit hook.
- Even in V1 (personal/local), build this as a static styled card/image
  export — it's low effort now and means V2 sharing is just "add a
  post button" instead of a rebuild.

### Visual style
- Lean into an actual napkin/doodle aesthetic: hand-drawn-style icons,
  a slightly sketchy/casual font, maybe a subtle paper texture —
  rather than a clean dashboard/spreadsheet look. This does a lot of
  work on its own to signal "casual game" over "productivity tool."

---

## 9. Suggested Build Order (for Claude Code)

1. Scaffold the app shell + question data file with 3-5 fully fleshed-out sample questions — structured `framework` rows + `framework_notes` + `narrative` + `answer_type`/`as_of`/`source` per Sections 3 and 5.
2. Build the core loop:
   - Question screen with the **napkin input** (add/edit/reorder rows, live running product), slider fallback, and the "show me the framework" peek.
   - Reveal: animated `narrative` story → your-napkin-vs-model's-napkin comparison → vibe score → shareable result card.
3. Add local persistence: completion-pointer rotation, per-date result records (napkin, guess, ratio, assisted flag), streak, stats view, history export/import.
4. Flesh out remaining ~25 questions using the template. Verify the `measured` answers against sources; mark the rest `consensus-estimate`.
5. Polish visual style — napkin/doodle aesthetic, count-up/reveal animations, row-scribble feel.
6. Only then: think about V2 publishing infra.
