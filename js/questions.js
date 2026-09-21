/* The question bank — British-leaning, mixed topics (football, pubs, tea,
 * geography, retail, transport, daft physical Fermis).
 *
 * Each entry follows the data model in plan.md section 3:
 *   framework       - ordered napkin rows for one good solution. Deliberately
 *                     a few steps long (4-5), even a slightly long-winded route
 *                     to the answer — this is meant to model genuine step-by-step
 *                     reasoning, not the leanest possible two-variable shortcut.
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
      "A full round of matches, not just a single game.",
      "Bums on seats across every ground, not the TV audience."
    ],
    reference_anchors: [
      { label: "clubs in the Premier League", value: 20 },
      { label: "seats at Old Trafford", value: 74000 },
      { label: "seats at the smallest PL ground", value: 11000 }
    ],
    framework: [
      { label: "Clubs in the Premier League", op: "x", model_value: 20, unit: "clubs", plausible_range: [20, 20] },
      { label: "Teams per match", op: "/", model_value: 2, unit: "teams/match", plausible_range: [2, 2] },
      { label: "Average stadium capacity", op: "x", model_value: 42000, unit: "seats", plausible_range: [30000, 55000] },
      { label: "Average how full grounds are", op: "x", model_value: 0.95, unit: "fraction", plausible_range: [0.85, 1.0] }
    ],
    framework_notes: [
      "20 clubs make up the Premier League.",
      "Two teams contest each match, so clubs ÷ 2 gives the number of fixtures in a round.",
      "The average Premier League ground holds around 42,000.",
      "Most match­days sell close to capacity — 95% is a fair average fill rate."
    ],
    narrative: [
      "20 clubs make up the Premier League.",
      "Two teams a match, so that's 10 fixtures in a full round.",
      "The average ground holds around 42,000.",
      "Most Premier League games sell close to full — call it 95% average.",
      "10 matches × 42,000 × 0.95 comes out around 400,000.",
      "That matches the real figures almost exactly — English top-flight football fills its grounds."
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
      "A busy Saturday across the top four divisions (Premier League + EFL).",
      "One pie or pasty per person who buys one."
    ],
    reference_anchors: [
      { label: "divisions playing (PL + EFL)", value: 4 },
      { label: "a League Two crowd", value: 5000 }
    ],
    framework: [
      { label: "Divisions playing that Saturday", op: "x", model_value: 4, unit: "divisions", plausible_range: [4, 4] },
      { label: "Matches per division", op: "x", model_value: 10, unit: "matches", plausible_range: [8, 12] },
      { label: "Average crowd per match", op: "x", model_value: 15000, unit: "fans/match", plausible_range: [8000, 25000] },
      { label: "Fraction who queue at a food kiosk", op: "x", model_value: 0.35, unit: "fraction", plausible_range: [0.2, 0.5] },
      { label: "Of those, fraction who pick a pie", op: "x", model_value: 0.43, unit: "fraction", plausible_range: [0.25, 0.6] }
    ],
    framework_notes: [
      "Four divisions (Premier League, Championship, League One, League Two) play a full Saturday.",
      "Call it 10 matches a division on average.",
      "Blending 40,000 top-flight crowds with 5,000 in League Two gives roughly 15,000 average.",
      "Maybe a third of fans queue at a food kiosk at all that afternoon.",
      "Of kiosk buyers, less than half pick a pie specifically over chips, a burger or tea."
    ],
    narrative: [
      "Four divisions play English football on a Saturday: Premier League down to League Two.",
      "Call it 10 matches a division — 40 games in total.",
      "Average crowd across all four, blending 40,000 crowds with 5,000 ones, is about 15,000.",
      "Maybe a third of fans queue at a food kiosk at all.",
      "Of those, less than half actually pick a pie over chips, a burger or just a tea.",
      "40 × 15,000 × 0.35 × 0.43 lands around 90,000 pies — nobody counts them, but that's the honest long way round."
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
      "The whole UK, all ages included.",
      "Any cup of tea, at home or out, in a normal day."
    ],
    reference_anchors: [
      { label: "UK population", value: 67000000 },
      { label: "days in a year", value: 365 }
    ],
    framework: [
      { label: "UK population", op: "x", model_value: 67000000, unit: "people", plausible_range: [65000000, 68000000] },
      { label: "Fraction who are adults", op: "x", model_value: 0.78, unit: "fraction", plausible_range: [0.7, 0.85] },
      { label: "Fraction of adults who drink tea regularly", op: "x", model_value: 0.85, unit: "fraction", plausible_range: [0.6, 0.95] },
      { label: "Cups per tea-drinking adult per day", op: "x", model_value: 2.3, unit: "cups/person", plausible_range: [1.5, 4] }
    ],
    framework_notes: [
      "The UK is about 67 million people.",
      "Roughly 78% are adults — children drink far less tea.",
      "About 85% of adults are regular tea drinkers.",
      "A regular drinker gets through something like 2 to 3 cups a day."
    ],
    narrative: [
      "Start with 67 million people in the UK.",
      "About 78% are adults — kids drink less tea.",
      "Of those adults, maybe 85% are regular tea drinkers.",
      "A regular drinker gets through something like 2 to 3 cups a day — call it 2.3.",
      "67 million × 0.78 × 0.85 × 2.3 lands just over 100 million cups a day — matching the number everyone quotes."
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
      { label: "Pubs and bars in the UK", op: "x", model_value: 45000, unit: "pubs", plausible_range: [40000, 50000] },
      { label: "Average pub capacity", op: "x", model_value: 70, unit: "people", plausible_range: [40, 150] },
      { label: "Fill rate on a Friday evening", op: "x", model_value: 0.6, unit: "fraction", plausible_range: [0.3, 0.9] },
      { label: "Turnover through the evening", op: "x", model_value: 1.4, unit: "x", plausible_range: [1, 2] },
      { label: "Pints per person across their visit", op: "x", model_value: 3, unit: "pints/person", plausible_range: [1, 5] }
    ],
    framework_notes: [
      "The UK has around 45,000 pubs and bars.",
      "An average pub holds maybe 70 people.",
      "Call a Friday evening 60% full on average, blending packed city bars with quiet locals.",
      "People come and go all night, so tables and seats turn over roughly 1.4 times.",
      "Across a visit, a drinker gets through about three pints."
    ],
    narrative: [
      "There are about 45,000 pubs and bars in the UK.",
      "An average one holds maybe 70 people.",
      "On a Friday evening call it 60% full on average — some rammed, some quiet.",
      "People come and go all night, so count on about 1.4x turnover through the evening.",
      "Across their visit, a drinker gets through about 3 pints.",
      "Multiply it all out and you land close to 8 million pints in one evening — nobody's counting, but that's the honest long way there."
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
      { label: "Length of Britain, north to south", op: "x", model_value: 600, unit: "miles", plausible_range: [500, 700] },
      { label: "Loop-to-length ratio for this shape", op: "x", model_value: 3, unit: "x", plausible_range: [2.5, 4] },
      { label: "Base wiggle factor for an ordinary coastline", op: "x", model_value: 3, unit: "x", plausible_range: [2, 4] },
      { label: "Extra crinkle from Scotland's lochs and fjords", op: "x", model_value: 2, unit: "x", plausible_range: [1.5, 3] }
    ],
    framework_notes: [
      "Britain runs about 600 miles north to south.",
      "For a shape this elongated, a smooth loop around it works out to roughly 3 times that length.",
      "A normal coastline wiggles about 3x more than a smooth loop, from ordinary headlands and bays.",
      "Scotland's sea lochs and fjords add a further crinkle on top — call it another 2x."
    ],
    narrative: [
      "Britain is roughly 600 miles from top to bottom.",
      "For a shape this stretched, a smooth loop around it works out to about 3 times that length — 1,800 miles.",
      "Any real coastline wiggles more than a smooth loop; a normal factor is about 3x for headlands and bays.",
      "Scotland alone adds sea lochs and fjords on top of that — call it another 2x.",
      "600 × 3 × 3 × 2 comes out around 11,000 miles.",
      "Ordnance Survey's mainland figure is almost exactly that — and it only grows if you measure with a finer ruler. That's the coastline paradox."
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
      "Across every Greggs shop in the UK.",
      "A normal trading day."
    ],
    reference_anchors: [
      { label: "Greggs shops in the UK", value: 2400 },
      { label: "days in a week", value: 7 }
    ],
    framework: [
      { label: "Greggs shops in the UK", op: "x", model_value: 2400, unit: "shops", plausible_range: [2200, 2600] },
      { label: "Average customers per shop per day", op: "x", model_value: 600, unit: "customers/shop", plausible_range: [300, 900] },
      { label: "Fraction who buy something hot and savoury", op: "x", model_value: 0.55, unit: "fraction", plausible_range: [0.3, 0.7] },
      { label: "Of those, fraction who pick a sausage roll", op: "x", model_value: 0.48, unit: "fraction", plausible_range: [0.3, 0.65] }
    ],
    framework_notes: [
      "Greggs runs about 2,400 shops across the UK.",
      "A shop might see 600 customers through the door on an average day.",
      "Around 55% buy something hot and savoury rather than just a coffee or a sandwich.",
      "Sausage rolls are Greggs' best-seller among savouries — call it roughly half of those buyers."
    ],
    narrative: [
      "Greggs has about 2,400 shops across the UK.",
      "A shop might see 600 customers through the door on an average day.",
      "Around 55% of them buy something hot and savoury rather than just a coffee or a sandwich.",
      "Of those, sausage rolls are the best-seller — call it roughly half.",
      "2,400 × 600 × 0.55 × 0.48 comes out around 380,000.",
      "Greggs has said it sells about 2.5 million sausage rolls a week — which lines up almost exactly."
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
      { label: "Population of Greater London", op: "x", model_value: 9000000, unit: "people", plausible_range: [8000000, 9500000] },
      { label: "Fraction of Londoners using TfL that day", op: "x", model_value: 0.45, unit: "fraction", plausible_range: [0.35, 0.6] },
      { label: "Uplift for commuters/tourists from outside London", op: "x", model_value: 1.25, unit: "x", plausible_range: [1.1, 1.6] },
      { label: "Journey legs per traveller", op: "x", model_value: 2.2, unit: "legs/person", plausible_range: [1.5, 3] }
    ],
    framework_notes: [
      "Greater London holds about 9 million people.",
      "Maybe 45% of residents use TfL at all on a given weekday.",
      "Commuters and tourists from outside London add a further 25% on top of that.",
      "Most trips are a there-and-back, some involve a change — average about 2.2 legs each."
    ],
    narrative: [
      "Greater London holds about 9 million people.",
      "On a weekday maybe 45% of them use TfL at all.",
      "On top of residents, add commuters and tourists coming in from outside London — call it a 25% uplift.",
      "That gives just over 5 million people travelling on the network that day.",
      "Most make a there-and-back, some change lines — call it 2.2 journey legs each.",
      "Multiply it through and you land around 11 million, which is exactly what TfL reports for a typical weekday."
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
      "A full-size professional pitch.",
      "Healthy, mown turf."
    ],
    reference_anchors: [
      { label: "pitch length, metres", value: 105 },
      { label: "pitch width, metres", value: 68 }
    ],
    framework: [
      { label: "Pitch length", op: "x", model_value: 105, unit: "metres", plausible_range: [95, 115] },
      { label: "Pitch width", op: "x", model_value: 68, unit: "metres", plausible_range: [60, 75] },
      { label: "Square centimetres in a square metre", op: "x", model_value: 10000, unit: "cm²/m²", plausible_range: [10000, 10000] },
      { label: "Blades of grass per square centimetre", op: "x", model_value: 2, unit: "blades/cm²", plausible_range: [1, 5] }
    ],
    framework_notes: [
      "A pitch is about 105 metres long.",
      "And about 68 metres wide, giving the playing area.",
      "There are 10,000 square centimetres in a square metre — the scale grass is actually counted at.",
      "Mown turf carries roughly 2 blades per square centimetre."
    ],
    narrative: [
      "A football pitch is about 105 metres long.",
      "And about 68 metres wide.",
      "Multiply those and you get roughly 7,140 square metres of turf.",
      "There are 10,000 square centimetres in a square metre — worth converting, since grass is counted at the centimetre scale.",
      "Mown turf carries maybe 2 blades per square centimetre.",
      "7,140 × 10,000 × 2 comes out to about 140 million blades — nobody's counted, but that's the Fermi answer."
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
// runs out. Swapped so today (2026-09-21, day 22, slot 6) lands on Greggs.
window.NAPKIN.dailyOrder = [
  "q0005", // coastline of mainland Britain
  "q0003", // cups of tea in the UK per day
  "q0001", // Premier League matchday attendance
  "q0004", // pints pulled on a Friday night
  "q0007", // TfL journeys per weekday
  "q0002", // matchday pies across English football
  "q0006", // Greggs sausage rolls per day
  "q0008"  // blades of grass on a football pitch
];

// Universal reference facts, always available from the pad — deliberately
// narrow (population/area/time only) and NOT tied to any one question.
// Anything more specific than this belongs in that question's own
// `reference_anchors` instead, not here.
window.NAPKIN.commonFacts = [
  { label: "seconds in a day", value: 86400 },
  { label: "days in a year", value: 365 },
  { label: "world population", value: 8100000000 },
  { label: "UK population", value: 67000000 },
  { label: "Greater London population", value: 9000000 },
  { label: "Greater London area, km²", value: 1570 }
];
