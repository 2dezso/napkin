---
name: Napkin
description: A daily estimation game played on the back of a paper napkin, in pencil, marked in red.
colors:
  oak-table: "#d9bb8d"
  napkin-tissue: "#fbf8f1"
  napkin-card: "#fffdf8"
  graphite: "#3a3b40"
  ink: "#2c2a24"
  faint-ink: "#524c40"
  red-pencil: "#c2463a"
  red-pencil-deep: "#7d2219"
  emboss-brown: "#92734a"
  rule-tan: "#d9d1bd"
  tick-green: "#3d7d45"
typography:
  display:
    fontFamily: "Patrick Hand, Segoe Print, Bradley Hand, cursive"
    fontSize: "clamp(1.7rem, 6vw, 2.4rem)"
    fontWeight: 400
    lineHeight: 1.15
  hand:
    fontFamily: "Patrick Hand, Segoe Print, Bradley Hand, cursive"
    fontSize: "1.4rem"
    fontWeight: 400
    lineHeight: 1.5
  score:
    fontFamily: "Patrick Hand, Segoe Print, Bradley Hand, cursive"
    fontSize: "clamp(5rem, 22vw, 6.6rem)"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  napkin: "3px"
  button: "4px"
  pill: "999px"
  stamp: "10px"
spacing:
  xs: "0.4rem"
  sm: "0.8rem"
  md: "1.2rem"
  lg: "1.8rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.napkin-card}"
    rounded: "{rounded.button}"
    padding: "0.75rem 1.2rem"
  button-ghost:
    backgroundColor: "{colors.napkin-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0.75rem 1.2rem"
  stamp:
    backgroundColor: "{colors.red-pencil}"
    textColor: "{colors.napkin-card}"
    rounded: "{rounded.stamp}"
    padding: "0.1rem 1.2rem"
  tool-chip:
    backgroundColor: "{colors.napkin-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.38rem 0.8rem"
---

# Design System: Napkin

## Overview

**Creative North Star: "The Back-of-a-Napkin Sum"**

Everything you see is a paper napkin on a light oak table, written on in graphite and marked in red pencil. The player works the question out by hand on the napkin, the app circles the numbers it reads, and the verdict arrives as a rubber stamp. It should feel like scribbling in a café, never like a worksheet or a dashboard.

Two inks carry all the meaning. Graphite is what the player wrote. Red pencil is what the app marked: circles, underlines, the stamp, the gap on the ruler. Nothing else is coloured for emphasis. Motion is playful and physical: things are written on, circled, slammed down, pinned or scrunched.

**Key Characteristics:**
- One world, one table: every surface that carries content is a napkin.
- Handwriting for anything the player or the pencil "wrote"; plain system type for small print.
- Red pencil is the only marking colour.
- Tactile, slightly imperfect edges and gentle tilts; never pixel-straight paper.
- Suspense is built on purpose, and always skippable.

## Colors

A warm neutral world with a single red accent.

### Primary
- **Red Pencil** (#c2463a): every mark the app makes: number circles, score underline, the verdict stamp, the player's ✗, the real-figure ring, the gap bracket.

### Neutral
- **Oak Table** (#d9bb8d): the page background, with faint plank seams and grain.
- **Napkin Tissue** (#fbf8f1): the napkin sheet, over a pressed diamond emboss and quarter-fold creases.
- **Napkin Card** (#fffdf8): flatter cards such as modals.
- **Graphite** (#3a3b40): everything the player wrote, and the running dot on the ruler.
- **Ink** (#2c2a24): primary text and the main button.
- **Faint Ink** (#524c40): secondary text, at least 4.5:1 on oak and tissue.
- **Emboss Brown** (#92734a): the dotted pressed border of the napkin (used at about 50% opacity).
- **Rule Tan** (#d9d1bd): hairlines and dividers.
- **Tick Green** (#3d7d45): only the fact-check tick.

### Named Rules
**The Two Inks Rule.** Graphite means "you wrote this", red pencil means "the app marked this". Any other accent colour needs a reason the napkin world would supply.

## Typography

**Display and Hand Font:** Patrick Hand (bundled in `assets/fonts`, with Segoe Print and cursive fallbacks)
**Body Font:** the system sans stack

**Character:** a readable, slightly scrappy handwriting for everything that feels written, with a quiet system sans for small print, sources and controls' fine text.

### Hierarchy
- **Display** (400, clamp(1.7rem, 6vw, 2.4rem), 1.15): the daily question.
- **Hand** (400, 1.4rem, 1.5): the pad, the model's working, result facts.
- **Score** (400, clamp(5rem, 22vw, 6.6rem), 1): the result score and the scrambling total.
- **Body** (400, 1rem, 1.5): explanatory copy, at most 65 to 75 characters a line.
- **Label** (400, 0.78rem): sources, hints, tick labels.

### Named Rules
**The Handwriting Rule.** Numbers that matter, the question, verdicts and quips are in the hand font. Buttons' fine print and sources are not.

## Layout

A single centred column, 640px at most, on the table. Napkins are full column width with generous inner padding (about 1.8rem top, 1.5rem sides) and a slight tilt of about one degree, alternating direction between the player's napkin and the model's. Sections are separated by spacing, not dividers. The top bar is sticky so the collection tab stays visible. On phones everything stacks; the pencil lying on the table clears the Lock button with extra space.

## Elevation & Depth

Depth is real-world: paper lying on a table. Napkins carry a two-layer drop shadow (a tight 2px contact shadow plus a soft 22px spread) applied after the edge displacement so the shadow follows the ragged edge. Buttons sit on a hard 5px underside like a pressed key. Overlays dim the table with a dark wash.

### Shadow Vocabulary
- **Napkin** (`drop-shadow(0 2px 1.5px rgba(50,30,10,.35)) drop-shadow(0 22px 16px rgba(50,30,10,.3))`): every napkin sheet.
- **Stamp** (`box-shadow: 0 6px 0 #7d2219, 0 14px 18px rgba(40,25,8,.35)`): the verdict stamp, raised like a rubber block.
- **Key** (`box-shadow: 0 5px 0 #0f0e0d`): primary buttons.

### Named Rules
**The Flat Paper Rule.** Napkins never glow or blur. Shadows always fall down and to the table.

## Shapes

Paper has near-square corners (3px) but an edge that is displaced by a turbulence filter, so it is never quite straight. Borders are a dotted emboss pressed 11px inside the edge. Controls are either small 4px keys or full pills. Red marks are hand-drawn: irregular ellipses around numbers, double wavy underlines under scores, a rounded-rectangle stamp rotated about 4 degrees.

## Components

### Buttons
- **Shape:** 4px corners with a hard underside (5px) that presses down on active.
- **Primary:** Ink background, Napkin Card text, hand font at 1.55rem ("Lock it in").
- **Ghost:** Napkin Card background with Ink text ("Share your napkin", "Go again").
- **Disabled:** 55% opacity, no underside.

### Tool chips and pills
- Full pill, Napkin Card background, 1px Rule Tan border; the number pills on the pad ribbon are tappable to mute or flip ×÷.

### The napkin pad
- A textarea written in the hand font over a mirror layer that circles each recognised number in red pencil with a quick pop. No ruled lines: napkins have none. Below it, a wavy graphite squiggle, the running sum, and the total in the hand font with a red underline.

### The stamp
- Red Pencil block, Napkin Card text, 10px corners, rotated about 4 degrees, slams in from 3x scale.

### The ruler
- An adaptive log scale in a pale card: graphite axis and ticks, the player's red ✗ dropping in, the model's graphite dot crawling along it, the real figure as a red ring, a red bracket and label for the gap.

### The result napkin
- One napkin holds everything: big score with red underline, the stamp, "You said X. The real figure is Y. N% too low.", the quip, the source in small print, the crowd line and share buttons.

## Do's and Don'ts

### Do:
- **Do** use red pencil only for marks the app makes, and graphite for what the player wrote.
- **Do** write numbers, verdicts and quips in the hand font.
- **Do** keep every napkin slightly tilted and its edge rough (the `#rough` displacement filter).
- **Do** make suspense skippable and respect reduced motion: the reveal jumps to its finished state.
- **Do** keep secondary text at 4.5:1 or better on oak and tissue.

### Don't:
- **Don't** add ruled lines, notebook pages, cards-in-cards or dashboard chrome.
- **Don't** use the word "math" in player-facing copy; say sums, working it out, scribbling.
- **Don't** add a bare "type a number" route to the main flow.
- **Don't** colour anything else for emphasis (no greens, blues or gradients) outside the tick mark.
- **Don't** show the answer or the model's conclusion before the reveal's moment.
