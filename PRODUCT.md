# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two audiences, served equally. (1) Casual daily-game players, Wordle-style and mostly British, who want a funny couple of minutes. (2) Aspiring product managers and estimation-question fans who want real Fermi practice; this group is the target for paid expansion.

## Product Purpose
Napkin is a daily estimation game. One shared question a day ("how many pints are pulled in UK pubs on a Friday?"). The player types their working on a scribble pad, and the app multiplies every number it finds into an estimate. A reveal then shows the real figure, a narrated model route, a 0-100 score and a pub-verdict tier. Success is a daily habit that also builds real estimation skill.

## Positioning
The player shows their working rather than guessing a number. Fermi practice is delivered by a funny coach who roasts misses and credits near-hits. Wordle-style daily guessers have no working-out mechanic, and interview-prep tools have no humour.

## Operating Context
- One shared, date-keyed question per day (same for everyone, derived from the date).
- Input is a single free-text pad. Numbers are parsed and multiplied; `per`, `over`, `/` and `÷` divide. `1 in 4`, `25%`, `5k` and `2.5M` all normalise. An interpretation ribbon shows each number found.
- Modes: Daily, Practice (past questions), Interview (a laddered run with no help), challenge-a-friend links, Stats, and a community results distribution.
- History, streak and results are stored locally, with invisible cloud backup (Firebase) and a feedback form (Web3Forms).

## Capabilities and Constraints
- Static site, plain HTML/CSS/JS with no build step, deployed on GitHub Pages at napkinmath.co.uk.
- No accounts: anonymous and localStorage-first.
- Practice is a planned paid unlock (placeholder exists). Pricing and the paid-expansion scope are undecided.
- Interview mode is the natural home for PM-candidate value.

## Brand Commitments
- British voice is binding: UK spelling, football and pub references, dry humour.
- Napkin and pencil identity, including hand-drawn marks and red marking.
- Never use the word "math" in player-facing copy (say sums, working it out, scribbling). The napkinmath.co.uk domain and Firebase ids still carry it; renaming the domain is an open decision.
- The reveal must land big and be funny, and the pad must feel like writing rather than a worksheet.

## Evidence on Hand
- A bank of 68 questions in `js/questions.js`, with a no-repeat line bank of roast and credit quips in `js/scoring.js`.
- Design history is in `plan.md`. No user testimonials, usage metrics or pricing data exist, so don't fabricate any.

## Product Principles
1. Showing your working is the game. Never add a bare "type a number" shortcut to the main flow.
2. Feel beats features. Keep it playful, smooth and never worksheet-like.
3. Humour carries the learning. Give credit when close and take the mickey when miles off.
4. Shared daily ritual first. Everyone gets the same question, and results are shareable.
5. Casual fun stays free and frictionless. Paid value goes to people serious about PM practice.

## Accessibility & Inclusion
No product-specific requirement established.
