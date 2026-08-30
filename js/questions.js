/* The question bank.
 *
 * Each entry follows the data model in plan.md section 3:
 *   framework       - ordered napkin rows for one good solution
 *                     { label, op: 'x' | '/', model_value, unit, plausible_range: [lo, hi] }
 *   framework_notes - one line justifying each row's value / range
 *   narrative       - spoken-aloud reveal lines, one clause / one number, ending on the answer
 *   estimate_range  - "you basically got it" band (scored against before ratio bands)
 *   actual_answer   - the real figure
 *   answer_type     - 'measured' (a real published count) | 'consensus-estimate' (no ground truth)
 *   as_of           - year the answer / source is from
 *
 * Only these 5 are fully fleshed out. The remaining ~25 prompts live in plan.md
 * section 6 and get added here using the template in section 5.
 */
window.NAPKIN = window.NAPKIN || {};
window.NAPKIN.questions = [
  {
    id: "q0001",
    category: "physical-estimation",
    difficulty: "easy",
    question: "How many windows are on the Empire State Building?",
    clarifications: [
      "Exterior windows on the office floors — not the observation decks or the spire.",
      "The building as it stands today."
    ],
    reference_anchors: [
      { label: "height to roof (ft)", value: 1250 },
      { label: "a floor's height (ft)", value: 12 }
    ],
    framework: [
      { label: "Standard office floors", op: "x", model_value: 92, unit: "floors", plausible_range: [80, 100] },
      { label: "Windows per floor", op: "x", model_value: 55, unit: "windows/floor", plausible_range: [40, 80] }
    ],
    framework_notes: [
      "~102 floors total, minus ~10 for mechanical, setback and observation levels, leaves ~92 real office floors.",
      "Walk the perimeter of a roughly rectangular floor: about 55 windows at typical spacing."
    ],
    narrative: [
      "Start with the height: about 102 floors.",
      "Knock off ~10 for mechanical, setback and observation levels — call it 92 office floors.",
      "Walk one floor's perimeter: roughly 55 windows.",
      "92 times 55 lands around 5,000…",
      "…and the published count is 6,514 — same ballpark, a touch low because the lower floors are wider."
    ],
    estimate_range: [4500, 7500],
    actual_answer: 6514,
    answer_type: "measured",
    as_of: 2019,
    source: "Empire State Building official fact sheet (6,514 windows).",
    sanity_check: "Thousands of windows for a ~100-floor tower feels right."
  },

  {
    id: "q0002",
    category: "operations",
    difficulty: "medium",
    question: "How many pizzas are delivered in New York City on a normal weekday?",
    clarifications: [
      "The five boroughs, ~8.3M people.",
      "'Delivered' means brought to a home or office — not dine-in or counter pickup.",
      "A regular weekday, not a Super Bowl Sunday."
    ],
    reference_anchors: [
      { label: "NYC population", value: 8300000 },
      { label: "days in a week", value: 7 }
    ],
    framework: [
      { label: "People in NYC", op: "x", model_value: 8300000, unit: "people", plausible_range: [8000000, 8500000] },
      { label: "Pizzas eaten per person per week", op: "x", model_value: 1, unit: "pizzas/person/wk", plausible_range: [0.5, 2] },
      { label: "Share that is delivered (not dine-in or pickup)", op: "x", model_value: 0.25, unit: "fraction", plausible_range: [0.15, 0.4] },
      { label: "Days per week", op: "/", model_value: 7, unit: "days", plausible_range: [7, 7] }
    ],
    framework_notes: [
      "NYC's five boroughs hold about 8.3 million people.",
      "A pizza-heavy town: roughly one whole pizza per person per week on average once you blend kids, offices and night slices.",
      "Of all the pizza eaten, maybe a quarter arrives at a door; the rest is dine-in or pickup.",
      "Divide the weekly total by 7 for a daily number."
    ],
    narrative: [
      "About 8.3 million people live in New York City.",
      "Say each eats roughly one pizza a week — that's 8.3 million pizzas a week.",
      "Only about a quarter show up at your door; the rest are dine-in or pickup. Call it 2 million delivered a week.",
      "Split across 7 days, that's a bit under 300,000 delivered pizzas a day.",
      "There's no official count — but industry estimates for NYC land in the same few-hundred-thousand range."
    ],
    estimate_range: [150000, 500000],
    actual_answer: 300000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "No authoritative figure; consensus of industry estimates around a $1B+ NYC pizza market.",
    sanity_check: "Roughly one delivered pizza per 25 New Yorkers per day. Plausible."
  },

  {
    id: "q0003",
    category: "pm-classic",
    difficulty: "hard",
    question: "How many working piano tuners are there in New York City?",
    clarifications: [
      "The city proper, ~8.3M people.",
      "Full-time-equivalent people who tune pianos for a living."
    ],
    reference_anchors: [
      { label: "NYC population", value: 8300000 },
      { label: "work days in a year", value: 240 }
    ],
    framework: [
      { label: "People in NYC", op: "x", model_value: 8300000, unit: "people", plausible_range: [8000000, 8500000] },
      { label: "Pianos per person", op: "x", model_value: 0.02, unit: "pianos/person", plausible_range: [0.01, 0.05] },
      { label: "Tunings per piano per year", op: "x", model_value: 1, unit: "tunings/piano/yr", plausible_range: [0.5, 2] },
      { label: "Tunings one tuner does per year", op: "/", model_value: 800, unit: "tunings/tuner/yr", plausible_range: [500, 1500] }
    ],
    framework_notes: [
      "About 8.3 million people in the city.",
      "Maybe one piano per 50 people, counting homes, schools, churches, bars and studios.",
      "A piano that gets played is tuned about once a year; plenty are tuned less, so ~1 is a generous average.",
      "A working tuner does ~4 tunings a day, ~5 days a week, ~40 weeks a year — about 800 a year."
    ],
    narrative: [
      "Start with 8.3 million New Yorkers.",
      "Maybe one piano for every 50 people — homes, schools, churches, bars. That's about 165,000 pianos.",
      "Each gets tuned roughly once a year: about 165,000 tunings.",
      "One tuner handles around 800 tunings a year.",
      "165,000 divided by 800 is a bit over 200 working piano tuners.",
      "That's the classic Fermi answer — nobody keeps a real count, but ~100–300 is the accepted ballpark."
    ],
    estimate_range: [50, 500],
    actual_answer: 200,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Classic Fermi problem; no registry exists. Historic phone-book listings ran ~50.",
    sanity_check: "A couple hundred specialists in a metro of millions — same scale as orchestral harpists or clockmakers."
  },

  {
    id: "q0004",
    category: "operations",
    difficulty: "medium",
    question: "How many Google searches happen per second, worldwide?",
    clarifications: [
      "Averaged over a normal day.",
      "Web searches only."
    ],
    reference_anchors: [
      { label: "people online worldwide", value: 5000000000 },
      { label: "seconds in a day", value: 86400 }
    ],
    framework: [
      { label: "Internet users worldwide", op: "x", model_value: 5000000000, unit: "people", plausible_range: [4500000000, 5500000000] },
      { label: "Google searches per user per day", op: "x", model_value: 2, unit: "searches/user", plausible_range: [1, 8] },
      { label: "Seconds in a day", op: "/", model_value: 86400, unit: "seconds", plausible_range: [86400, 86400] }
    ],
    framework_notes: [
      "About 5 billion people are online.",
      "The average user runs maybe 2 Google searches a day — many do zero, power users do dozens.",
      "86,400 seconds in a day."
    ],
    narrative: [
      "About 5 billion people are online.",
      "Say each runs 2 Google searches a day on average.",
      "That's 10 billion searches a day.",
      "Divide by 86,400 seconds in a day…",
      "…and you land around 115,000 searches every second.",
      "Public estimates put it near 99,000 per second — roughly 8.5 billion searches a day."
    ],
    estimate_range: [40000, 400000],
    actual_answer: 99000,
    answer_type: "measured",
    as_of: 2023,
    source: "Widely cited 2023 estimates (~8.5B searches/day). Google's last official figure was ~3.5B/day in 2016.",
    sanity_check: "~100k/second is ~8 billion/day — about one search per internet user per day. Checks out."
  },

  {
    id: "q0005",
    category: "physical-estimation",
    difficulty: "easy",
    question: "How many trees are in Central Park?",
    clarifications: [
      "Central Park, Manhattan — 843 acres.",
      "Standing trees, not shrubs."
    ],
    reference_anchors: [
      { label: "Central Park (acres)", value: 843 },
      { label: "a city block (acres)", value: 3 },
      { label: "trees per acre, dense forest", value: 200 }
    ],
    framework: [
      { label: "Park area", op: "x", model_value: 843, unit: "acres", plausible_range: [800, 850] },
      { label: "Fraction that is tree-covered", op: "x", model_value: 0.5, unit: "fraction", plausible_range: [0.35, 0.65] },
      { label: "Trees per treed acre", op: "x", model_value: 40, unit: "trees/acre", plausible_range: [25, 70] }
    ],
    framework_notes: [
      "Central Park is 843 acres.",
      "Roughly half is lawn, water, ballfields and paths; the other half carries most of the trees.",
      "Landscaped parkland runs ~25–70 trees per acre — denser than a street, far sparser than a forest."
    ],
    narrative: [
      "Central Park covers 843 acres.",
      "Call it half open ground — lawns, water, paths — and half tree-covered.",
      "That's about 420 treed acres.",
      "Landscaped park land carries maybe 40 trees an acre.",
      "420 times 40 is around 17,000 trees.",
      "The Central Park Conservancy's actual census is about 18,000. Close."
    ],
    estimate_range: [10000, 30000],
    actual_answer: 18000,
    answer_type: "measured",
    as_of: 2018,
    source: "Central Park Conservancy tree census (~18,000 trees).",
    sanity_check: "18,000 trees on 843 acres is ~21 per acre overall — right for a designed park with big lawns."
  }
];
