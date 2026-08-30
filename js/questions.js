/* The question bank — British-leaning, mixed topics (football, pubs, tea,
 * geography, retail, transport, daft physical Fermis).
 *
 * Each entry follows the data model in plan.md section 3:
 *   framework       - ordered napkin rows for one good solution
 *                     { label, op: 'x' | '/', model_value, unit, plausible_range: [lo, hi] }
 *   framework_notes - one line justifying each row's value / range
 *   narrative       - spoken-aloud reveal lines, one clause / one number, ending on the answer
 *   estimate_range  - "you basically got it" band (scored against before the ratio bands)
 *   actual_answer   - the real figure
 *   answer_type     - 'measured' (a real published count) | 'consensus-estimate' (no ground truth)
 *   as_of           - year the answer / source is from
 *   reference_anchors - [{ label, value }] tap-to-insert numbers for the scribble pad
 *
 * The daily question is a shared date-keyed rotation (see window.NAPKIN.dailyOrder
 * at the bottom of this file + storage.dayNumber), so this array's order doesn't
 * matter — dailyOrder does.
 */
window.NAPKIN = window.NAPKIN || {};
window.NAPKIN.questions = [
  {
    id: "q0001",
    category: "sport",
    difficulty: "easy",
    question: "How many people attend Premier League matches on a normal weekend?",
    clarifications: [
      "A full round — all 10 fixtures.",
      "Bums on seats across every ground, not the TV audience."
    ],
    reference_anchors: [
      { label: "matches in a full PL round", value: 10 },
      { label: "seats at Old Trafford", value: 74000 },
      { label: "seats at the smallest PL ground", value: 11000 }
    ],
    framework: [
      { label: "Matches in the round", op: "x", model_value: 10, unit: "matches", plausible_range: [10, 10] },
      { label: "Average crowd per match", op: "x", model_value: 40000, unit: "fans/match", plausible_range: [30000, 50000] }
    ],
    framework_notes: [
      "20 clubs means 10 matches in a complete round.",
      "Average Premier League attendance is around 40,000 — from ~11,000 at the smallest grounds to 74,000 at Old Trafford."
    ],
    narrative: [
      "A full Premier League weekend is 10 matches.",
      "The average crowd is about 40,000 — a blend of 25,000-seat grounds and 60,000-plus giants.",
      "10 times 40,000 is 400,000.",
      "Official figures put a typical round near 400,000 — among the highest average attendances in world football."
    ],
    estimate_range: [300000, 550000],
    actual_answer: 400000,
    answer_type: "measured",
    as_of: 2023,
    source: "Premier League attendance data (average ~40,000 per match, 2022–23 season).",
    sanity_check: "400,000 people at the football on one weekend — about the population of Coventry."
  },

  {
    id: "q0002",
    category: "sport",
    difficulty: "hard",
    question: "How many matchday pies are sold across English football on a Saturday?",
    clarifications: [
      "A busy Saturday across the top four divisions (Premier League + EFL) — roughly 40 matches.",
      "One pie or pasty per person who buys one."
    ],
    reference_anchors: [
      { label: "matches on a full English Saturday", value: 40 },
      { label: "a League Two crowd", value: 5000 }
    ],
    framework: [
      { label: "Matches that Saturday", op: "x", model_value: 40, unit: "matches", plausible_range: [30, 50] },
      { label: "Average crowd", op: "x", model_value: 15000, unit: "fans/match", plausible_range: [8000, 25000] },
      { label: "Fraction who buy a pie", op: "x", model_value: 0.15, unit: "fraction", plausible_range: [0.05, 0.3] }
    ],
    framework_notes: [
      "Premier League + Championship + League One + League Two on a full Saturday is about 40 games.",
      "Blend a 40,000 top-flight crowd with 5,000 in League Two — call it 15,000 average.",
      "Maybe one fan in seven actually queues up for a pie."
    ],
    narrative: [
      "A full Saturday across England's top four divisions is about 40 matches.",
      "Average crowd, blending the Premier League down to League Two, is maybe 15,000.",
      "That's 600,000 people through the turnstiles.",
      "If one in seven buys a pie, that's about 90,000 pies.",
      "Nobody counts them — but that's the right ballpark for a proper matchday tradition."
    ],
    estimate_range: [30000, 250000],
    actual_answer: 90000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "No official figure; estimate from EFL/PL attendance data and matchday catering norms.",
    sanity_check: "90,000 pies is roughly one per seven fans — about right for a cold Saturday."
  },

  {
    id: "q0003",
    category: "everyday-life",
    difficulty: "easy",
    question: "How many cups of tea are drunk in the UK per day?",
    clarifications: [
      "The whole UK — about 67 million people.",
      "Any cup of tea, at home or out, in a normal day."
    ],
    reference_anchors: [
      { label: "UK population", value: 67000000 },
      { label: "days in a year", value: 365 }
    ],
    framework: [
      { label: "UK population", op: "x", model_value: 67000000, unit: "people", plausible_range: [65000000, 68000000] },
      { label: "Cups per person per day", op: "x", model_value: 1.5, unit: "cups/person", plausible_range: [0.5, 3] }
    ],
    framework_notes: [
      "The UK is about 67 million people.",
      "Committed tea drinkers manage several a day, plenty of people drink none — blend it to roughly 1.5 each."
    ],
    narrative: [
      "The UK is about 67 million people.",
      "Tea-drinkers get through several cups a day; plenty drink none. Blend it to about 1.5 each.",
      "67 million times 1.5 is roughly 100 million.",
      "The figure everyone quotes is 100 million cups of tea a day — around 36 billion a year."
    ],
    estimate_range: [40000000, 200000000],
    actual_answer: 100000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "UK Tea & Infusions Association (~100 million cups per day, widely cited).",
    sanity_check: "100 million cups a day is about 1.5 per person — sounds like Britain."
  },

  {
    id: "q0004",
    category: "operations",
    difficulty: "medium",
    question: "How many pints are pulled in UK pubs on a Friday night?",
    clarifications: [
      "One Friday evening, every pub and bar in the UK.",
      "Pints of beer and cider served over the bar."
    ],
    reference_anchors: [
      { label: "pubs and bars in the UK", value: 45000 },
      { label: "pints in a barrel", value: 288 }
    ],
    framework: [
      { label: "Pubs and bars", op: "x", model_value: 45000, unit: "pubs", plausible_range: [40000, 50000] },
      { label: "Drinkers per pub that evening", op: "x", model_value: 60, unit: "people/pub", plausible_range: [20, 150] },
      { label: "Pints each", op: "x", model_value: 3, unit: "pints/person", plausible_range: [1, 5] }
    ],
    framework_notes: [
      "The UK has around 45,000 pubs and bars.",
      "A pub might see 60 drinkers over a Friday evening — from a quiet local to a heaving city bar.",
      "Three pints each is a fair Friday-night average."
    ],
    narrative: [
      "There are about 45,000 pubs and bars in the UK.",
      "On a Friday night a pub might see 60 drinkers pass through.",
      "That's 2.7 million people out for a pint.",
      "At three pints each, that's roughly 8 million pints in one evening.",
      "No one tallies them all — but that's the right order for a national Friday night."
    ],
    estimate_range: [2000000, 30000000],
    actual_answer: 8000000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Estimate from British Beer & Pub Association pub counts and typical Friday trade.",
    sanity_check: "8 million pints across 45,000 pubs is under 200 a pub in an evening — plausible."
  },

  {
    id: "q0005",
    category: "physical-estimation",
    difficulty: "hard",
    question: "How long is the coastline of mainland Great Britain, in miles?",
    clarifications: [
      "The mainland coast of England, Scotland and Wales, following the shore.",
      "Not counting the separate islands."
    ],
    reference_anchors: [
      { label: "length of Britain, miles", value: 600 },
      { label: "width of Britain, miles", value: 300 }
    ],
    framework: [
      { label: "Smooth loop around the island", op: "x", model_value: 1800, unit: "miles", plausible_range: [1400, 2400] },
      { label: "Crinkliness multiplier", op: "x", model_value: 6, unit: "x", plausible_range: [3, 10] }
    ],
    framework_notes: [
      "Treat Britain as a lozenge about 600 miles by 300 — a smooth loop round it is roughly 1,800 miles.",
      "The real coast is all firths, estuaries and headlands — multiply the smooth figure by around 6."
    ],
    narrative: [
      "Britain is roughly 600 miles top to bottom and 300 across.",
      "A smooth loop around that shape is about 1,800 miles.",
      "But the real coast is all firths, estuaries and headlands — crinkle it up by a factor of about 6.",
      "That gives roughly 11,000 miles.",
      "Ordnance Survey puts the mainland coastline near 11,000 — and it climbs higher the finer you measure. That's the 'coastline paradox'."
    ],
    estimate_range: [5000, 25000],
    actual_answer: 11000,
    answer_type: "measured",
    as_of: 2020,
    source: "Ordnance Survey (~11,073 miles for the GB mainland); the figure grows with finer measurement.",
    sanity_check: "11,000 miles is nearly halfway round the planet — mad, but that's a very wiggly coast."
  },

  {
    id: "q0006",
    category: "operations",
    difficulty: "medium",
    question: "How many sausage rolls does Greggs sell in the UK per day?",
    clarifications: [
      "Across every Greggs shop in the UK — around 2,400 of them.",
      "A normal trading day."
    ],
    reference_anchors: [
      { label: "Greggs shops in the UK", value: 2400 },
      { label: "days in a week", value: 7 }
    ],
    framework: [
      { label: "Greggs shops", op: "x", model_value: 2400, unit: "shops", plausible_range: [2200, 2600] },
      { label: "Sausage rolls per shop per day", op: "x", model_value: 160, unit: "rolls/shop", plausible_range: [80, 300] }
    ],
    framework_notes: [
      "Greggs has roughly 2,400 shops across the UK.",
      "A shop might shift about 160 sausage rolls a day — more at a busy station, fewer on a quiet high street."
    ],
    narrative: [
      "Greggs has about 2,400 shops across the UK.",
      "A typical shop sells on the order of 160 sausage rolls a day.",
      "That's around 380,000 a day.",
      "Greggs has said it sells roughly 2.5 million sausage rolls a week — which works out about the same."
    ],
    estimate_range: [150000, 800000],
    actual_answer: 380000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Greggs public statements (~2.5 million sausage rolls per week).",
    sanity_check: "380,000 a day is ~140 million a year — for the UK's biggest bakery chain, believable."
  },

  {
    id: "q0007",
    category: "operations",
    difficulty: "medium",
    question: "How many journeys are made on London's public transport on a weekday?",
    clarifications: [
      "A normal weekday.",
      "Every tap-in and boarding across Transport for London — Tube, bus, DLR, Overground, trams."
    ],
    reference_anchors: [
      { label: "population of London", value: 9000000 },
      { label: "Tube stations", value: 272 }
    ],
    framework: [
      { label: "People making a TfL trip", op: "x", model_value: 5000000, unit: "people", plausible_range: [4000000, 7000000] },
      { label: "Journey legs each", op: "x", model_value: 2.2, unit: "legs/person", plausible_range: [1.5, 3] }
    ],
    framework_notes: [
      "On a weekday maybe 5 million people make at least one TfL journey.",
      "Most do a there-and-back, some change lines or hop buses — average about 2.2 legs each."
    ],
    narrative: [
      "On a weekday roughly 5 million people travel on London's network.",
      "Most do a there-and-back, some change lines or hop on a bus — call it 2.2 journeys each.",
      "That's about 11 million journeys a day.",
      "TfL reports around 10 to 12 million on a typical weekday, split roughly half Tube, half bus."
    ],
    estimate_range: [5000000, 20000000],
    actual_answer: 11000000,
    answer_type: "measured",
    as_of: 2023,
    source: "Transport for London journey statistics (~10–12 million journeys per weekday).",
    sanity_check: "11 million journeys for a city of 9 million — a bit over one each — checks out."
  },

  {
    id: "q0008",
    category: "sport",
    difficulty: "hard",
    question: "How many blades of grass are on a football pitch?",
    clarifications: [
      "A full-size professional pitch, roughly 105 m by 68 m.",
      "Healthy, mown turf."
    ],
    reference_anchors: [
      { label: "pitch length, metres", value: 105 },
      { label: "pitch width, metres", value: 68 }
    ],
    framework: [
      { label: "Pitch area", op: "x", model_value: 7140, unit: "m²", plausible_range: [6000, 8000] },
      { label: "Blades per square metre", op: "x", model_value: 20000, unit: "blades/m²", plausible_range: [10000, 50000] }
    ],
    framework_notes: [
      "A pitch is about 105 by 68 metres — call it 7,000 square metres.",
      "Dense mown ryegrass runs maybe 20,000 blades per square metre — a couple per square centimetre."
    ],
    narrative: [
      "A football pitch is about 105 by 68 metres — roughly 7,000 square metres.",
      "Mown turf carries something like 20,000 blades per square metre.",
      "7,000 times 20,000 is about 140 million.",
      "So a pitch holds on the order of a hundred million blades of grass. Nobody's counted — but that's the Fermi answer."
    ],
    estimate_range: [20000000, 1000000000],
    actual_answer: 140000000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Fermi estimate; turf-grass shoot density is typically 10,000–75,000 per m².",
    sanity_check: "140 million blades on 7,000 m² is about two per square centimetre — right for a lawn."
  }
];

// The shared daily rotation: the same question for everyone on a given calendar
// day, keyed to the date (see storage.dayNumber / storage.EPOCH). Cycles when it
// runs out. Day 0 — launch day — is the Greggs one.
window.NAPKIN.dailyOrder = [
  "q0006", // Greggs sausage rolls per day
  "q0003", // cups of tea in the UK per day
  "q0001", // Premier League matchday attendance
  "q0004", // pints pulled on a Friday night
  "q0007", // TfL journeys per weekday
  "q0002", // matchday pies across English football
  "q0005", // coastline of mainland Britain
  "q0008"  // blades of grass on a football pitch
];
