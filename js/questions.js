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
    difficulty: "medium",
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
    difficulty: "medium",
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
  },

  {
    id: "q0010",
    category: "sport",
    difficulty: "medium",
    question: "How many runners finish the London Marathon each year?",
    clarifications: [
      "The main mass-participation race, elite and club runners included.",
      "Finishers only, not everyone who was given a start place."
    ],
    reference_anchors: [
      { label: "start places offered", value: 58000 },
      { label: "record ballot applicants in a single year", value: 578000 }
    ],
    framework: [
      { label: "Start places offered across ballot, charity and good-for-age", op: "x", model_value: 58000, unit: "places", plausible_range: [50000, 62000] },
      { label: "Fraction who actually show up on race day", op: "x", model_value: 0.91, unit: "fraction", plausible_range: [0.85, 0.97] },
      { label: "Fraction of starters who cross the finish line", op: "x", model_value: 0.95, unit: "fraction", plausible_range: [0.9, 0.99] }
    ],
    framework_notes: [
      "London gives out around 58,000 places between the ballot, charities and good-for-age entries.",
      "Not everyone who gets a place starts — illness, injury and life get in the way for about 9%.",
      "Of those who start, the vast majority make it round; the course is generous and well supported."
    ],
    narrative: [
      "London offers around 58,000 start places a year.",
      "About 91% of those actually show up on the day.",
      "And 95% of starters go on to finish.",
      "58,000 × 0.91 × 0.95 comes out around 50,000.",
      "That matches the real finisher counts almost exactly — London routinely reports finisher fields in the high 40,000s to low 50,000s."
    ],
    estimate_range: [35000, 65000],
    actual_answer: 50000,
    answer_type: "measured",
    as_of: 2023,
    source: "London Marathon Events / Virgin Money London Marathon official finisher statistics.",
    sanity_check: "50,000 finishers is roughly the population of a small English town, all limping the next day."
  },
  {
    id: "q0011",
    category: "everyday-life",
    difficulty: "medium",
    question: "How many cups of coffee are drunk in the UK per day?",
    clarifications: [
      "Coffee drunk anywhere — home, office, café — not just bought from shops.",
      "A normal weekday."
    ],
    reference_anchors: [
      { label: "UK population", value: 67000000 },
      { label: "fraction of adults who drink coffee", value: 0.8 }
    ],
    framework: [
      { label: "UK population", op: "x", model_value: 67000000, unit: "people", plausible_range: [65000000, 68000000] },
      { label: "Fraction who drink coffee at all", op: "x", model_value: 0.8, unit: "fraction", plausible_range: [0.6, 0.9] },
      { label: "Average cups per coffee drinker per day", op: "x", model_value: 1.8, unit: "cups/person", plausible_range: [1, 3] }
    ],
    framework_notes: [
      "The UK population is around 67 million.",
      "Roughly 80% of adults drink coffee at least occasionally.",
      "Coffee drinkers tend to have somewhere under two cups a day on average."
    ],
    narrative: [
      "The UK has about 67 million people.",
      "Around 80% of them drink coffee.",
      "And coffee drinkers have about 1.8 cups a day on average.",
      "67,000,000 × 0.8 × 1.8 comes out around 95 million.",
      "The British Coffee Association has long cited exactly that figure — 95 million cups a day."
    ],
    estimate_range: [50000000, 160000000],
    actual_answer: 95000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "British Coffee Association (commonly cited figure: 95 million cups of coffee drunk in the UK daily).",
    sanity_check: "95 million cups is more than one for every person in the country, before you even count the second cup."
  },
  {
    id: "q0012",
    category: "operations",
    difficulty: "medium",
    question: "How many portions of fish and chips are sold in the UK per day?",
    clarifications: [
      "Sold by dedicated fish and chip shops (chippies), not supermarkets or pubs.",
      "A normal trading day."
    ],
    reference_anchors: [
      { label: "fish and chip shops in the UK", value: 10500 },
      { label: "meals served by the sector per year", value: 382000000 }
    ],
    framework: [
      { label: "Fish and chip shops across the UK", op: "x", model_value: 10500, unit: "shops", plausible_range: [9500, 11500] },
      { label: "Average customers through the door per shop per day", op: "x", model_value: 150, unit: "customers/shop", plausible_range: [80, 220] },
      { label: "Fraction who order a fish-and-chips meal, not just sides", op: "x", model_value: 0.65, unit: "fraction", plausible_range: [0.4, 0.8] }
    ],
    framework_notes: [
      "There are around 10,500 fish and chip shops in the UK.",
      "A shop might see 150 customers on a normal day.",
      "Most, but not all, come specifically for fish and chips rather than just a sausage or a can of pop."
    ],
    narrative: [
      "There are about 10,500 chippies across the UK.",
      "Each sees maybe 150 customers on a normal day.",
      "And around 65% of them order the full fish and chips.",
      "10,500 × 150 × 0.65 comes out around 1 million.",
      "The industry's own figures put it at roughly 382 million meals a year — which works out to almost exactly this per day."
    ],
    estimate_range: [500000, 2000000],
    actual_answer: 1000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "National Federation of Fish Friers / Seafish industry statistics (~382 million meals served per year).",
    sanity_check: "A million portions a day is roughly one chippy meal for every person in Birmingham, every single day."
  },
  {
    id: "q0013",
    category: "physical-estimation",
    difficulty: "hard",
    question: "How many grains of sand are on Blackpool beach?",
    clarifications: [
      "The main sandy stretch at low tide, not the whole borough.",
      "Dry, fine sand, counted to a reasonable depth rather than right down to bedrock."
    ],
    reference_anchors: [
      { label: "approximate beach length", value: 4000 },
      { label: "typical grains per cubic metre of fine sand", value: 100000000000 }
    ],
    framework: [
      { label: "Length of the main beach", op: "x", model_value: 4000, unit: "metres", plausible_range: [3000, 6000] },
      { label: "Width of exposed sand at low tide", op: "x", model_value: 200, unit: "metres", plausible_range: [150, 300] },
      { label: "Depth of sand worth counting", op: "x", model_value: 0.5, unit: "metres", plausible_range: [0.3, 1] },
      { label: "Grains of sand per cubic metre", op: "x", model_value: 100000000000, unit: "grains/m3", plausible_range: [50000000000, 200000000000] }
    ],
    framework_notes: [
      "Blackpool's beach runs a good few kilometres along the front.",
      "At low tide the exposed sand is a couple of hundred metres wide.",
      "Half a metre down is a fair depth to count as 'the beach' rather than the geology underneath.",
      "Fine sand packs in at roughly a hundred billion grains per cubic metre."
    ],
    narrative: [
      "The beach runs about 4,000 metres along the front.",
      "And about 200 metres wide at low tide.",
      "Count down half a metre of sand.",
      "Fine sand packs in at roughly 100 billion grains per cubic metre.",
      "4,000 × 200 × 0.5 × 100,000,000,000 comes out to about 40 quadrillion.",
      "Nobody has ever counted it, obviously, but that's squarely in the range physicists quote for a large sandy beach."
    ],
    estimate_range: [10000000000000000, 200000000000000000],
    actual_answer: 40000000000000000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Fermi estimate; fine sand grain density is typically cited around 1×10^11 grains per cubic metre.",
    sanity_check: "40 quadrillion grains on one beach is already more than the estimated number of stars in the observable universe."
  },
  {
    id: "q0014",
    category: "transport",
    difficulty: "medium",
    question: "How many licensed black cabs operate in London?",
    clarifications: [
      "Licensed hackney carriages (black cabs), not minicabs or private hire vehicles.",
      "Currently licensed and on the road, not historic peak numbers."
    ],
    reference_anchors: [
      { label: "London population", value: 9000000 },
      { label: "licensed black cabs per 1,000 residents", value: 1.6 }
    ],
    framework: [
      { label: "London population", op: "x", model_value: 9000000, unit: "people", plausible_range: [8500000, 9500000] },
      { label: "Convert to thousands of residents", op: "/", model_value: 1000, unit: "people/1000", plausible_range: [1000, 1000] },
      { label: "Licensed black cabs per 1,000 residents", op: "x", model_value: 1.6, unit: "cabs/1000 people", plausible_range: [1.2, 2.2] }
    ],
    framework_notes: [
      "Greater London has around 9 million residents.",
      "Dividing by a thousand puts the numbers on a workable scale.",
      "London runs at roughly 1.6 licensed cabs for every thousand people these days, well down on a decade ago."
    ],
    narrative: [
      "London has around 9 million people.",
      "Divide by a thousand to get a manageable unit.",
      "There's roughly 1.6 licensed black cabs per thousand residents nowadays.",
      "9,000 × 1.6 comes out around 14,500.",
      "That matches TfL's own licensing figures closely — down from around 19,000 before the pandemic."
    ],
    estimate_range: [8000, 22000],
    actual_answer: 14500,
    answer_type: "measured",
    as_of: 2023,
    source: "Transport for London taxi and private hire licensing statistics.",
    sanity_check: "14,500 cabs nose to tail would stretch about 40 miles — nearly to Brighton."
  },
  {
    id: "q0015",
    category: "geography",
    difficulty: "medium",
    question: "How many trees are there in the UK?",
    clarifications: [
      "All trees, not just those inside official woodland boundaries.",
      "Great Britain and Northern Ireland combined."
    ],
    reference_anchors: [
      { label: "UK land area", value: 243000 },
      { label: "fraction of UK covered by woodland", value: 0.13 }
    ],
    framework: [
      { label: "UK land area", op: "x", model_value: 243000, unit: "km2", plausible_range: [230000, 250000] },
      { label: "Convert to hectares", op: "x", model_value: 100, unit: "ha/km2", plausible_range: [100, 100] },
      { label: "Fraction of the UK covered by woodland", op: "x", model_value: 0.13, unit: "fraction", plausible_range: [0.1, 0.16] },
      { label: "Average trees per hectare of woodland (plus scattered/hedgerow trees)", op: "x", model_value: 950, unit: "trees/ha", plausible_range: [500, 1200] }
    ],
    framework_notes: [
      "The UK covers about 243,000 square kilometres.",
      "Converting to hectares puts it on the scale foresters actually measure in.",
      "About 13% of the UK is classed as woodland.",
      "Woodland carries several hundred to a thousand trees per hectare once you count everything from saplings to mature oaks."
    ],
    narrative: [
      "The UK covers about 243,000 square kilometres.",
      "That's 24.3 million hectares once converted.",
      "Around 13% of that is woodland.",
      "And woodland carries roughly 950 trees per hectare on average.",
      "24,300,000 × 0.13 × 950 comes out to about 3 billion.",
      "Forest Research's National Forest Inventory landed on almost exactly that using laser survey data — around 3.15 billion trees."
    ],
    estimate_range: [1000000000, 6000000000],
    actual_answer: 3000000000,
    answer_type: "measured",
    as_of: 2017,
    source: "Forest Research, National Forest Inventory report (2017): approximately 3.15 billion trees in Great Britain.",
    sanity_check: "3 billion trees works out to about 45 for every person in the UK."
  },
  {
    id: "q0016",
    category: "animals",
    difficulty: "medium",
    question: "How many sheep are there in the UK?",
    clarifications: [
      "All sheep and lambs on UK farms, not just breeding ewes.",
      "A typical year, not lambing-season peak."
    ],
    reference_anchors: [
      { label: "total UK farm holdings", value: 216000 },
      { label: "fraction of farms that keep sheep", value: 0.28 }
    ],
    framework: [
      { label: "Total farm holdings in the UK", op: "x", model_value: 216000, unit: "farms", plausible_range: [200000, 230000] },
      { label: "Fraction of farms that keep sheep", op: "x", model_value: 0.28, unit: "fraction", plausible_range: [0.2, 0.35] },
      { label: "Average flock size on a sheep farm", op: "x", model_value: 550, unit: "sheep/farm", plausible_range: [300, 800] }
    ],
    framework_notes: [
      "There are around 216,000 farm holdings across the UK.",
      "Roughly a quarter to a third of them keep sheep in any number.",
      "A sheep farm carries a flock in the hundreds, often into four figures on the big hill farms."
    ],
    narrative: [
      "The UK has around 216,000 farms.",
      "About 28% of them keep sheep.",
      "And a sheep farm runs an average flock of around 550.",
      "216,000 × 0.28 × 550 comes out around 33 million.",
      "That matches Defra's agricultural census closely — and yes, Wales alone has more sheep than people."
    ],
    estimate_range: [15000000, 55000000],
    actual_answer: 33000000,
    answer_type: "measured",
    as_of: 2022,
    source: "Defra agricultural census (UK sheep and lamb population).",
    sanity_check: "33 million sheep is about one for every two people in the country."
  },
  {
    id: "q0017",
    category: "entertainment",
    difficulty: "medium",
    question: "How many people watch the Eurovision Song Contest final worldwide?",
    clarifications: [
      "The grand final broadcast, not the semi-finals.",
      "Total worldwide TV audience across all broadcasting countries."
    ],
    reference_anchors: [
      { label: "countries broadcasting the final", value: 37 },
      { label: "average population of a participating country", value: 25000000 }
    ],
    framework: [
      { label: "Countries broadcasting the final", op: "x", model_value: 37, unit: "countries", plausible_range: [30, 40] },
      { label: "Average population of a participating country", op: "x", model_value: 25000000, unit: "people", plausible_range: [10000000, 50000000] },
      { label: "Average fraction of a country's population that tunes in", op: "x", model_value: 0.18, unit: "fraction", plausible_range: [0.05, 0.3] }
    ],
    framework_notes: [
      "Around 37 countries broadcast the Eurovision final live.",
      "The average participating nation has a population in the tens of millions.",
      "Eurovision draws a big domestic audience in most of those countries — often the biggest entertainment broadcast of the year."
    ],
    narrative: [
      "Around 37 countries broadcast the final live.",
      "The average participating country has about 25 million people.",
      "And roughly 18% of a country's population tunes in on the night.",
      "37 × 25,000,000 × 0.18 comes out around 163 million.",
      "The EBU's own reported figures for recent finals land right around there — Eurovision genuinely is one of the biggest TV nights on the planet."
    ],
    estimate_range: [60000000, 300000000],
    actual_answer: 163000000,
    answer_type: "measured",
    as_of: 2023,
    source: "European Broadcasting Union reported viewership figures for the Eurovision final.",
    sanity_check: "163 million viewers is more people than watch most Super Bowls."
  },
  {
    id: "q0018",
    category: "money",
    difficulty: "medium",
    question: "How many contactless payments are made in the UK per day?",
    clarifications: [
      "Card and phone taps combined, in person.",
      "A normal day, not a Christmas shopping peak."
    ],
    reference_anchors: [
      { label: "UK adult population", value: 53000000 },
      { label: "annual UK contactless payment volume", value: 20000000000 }
    ],
    framework: [
      { label: "UK adult population", op: "x", model_value: 53000000, unit: "people", plausible_range: [50000000, 55000000] },
      { label: "Fraction who regularly use contactless payment", op: "x", model_value: 0.9, unit: "fraction", plausible_range: [0.7, 0.98] },
      { label: "Average contactless taps per user per day", op: "x", model_value: 1.15, unit: "taps/person", plausible_range: [0.5, 2] }
    ],
    framework_notes: [
      "There are around 53 million adults in the UK.",
      "The vast majority now use contactless as their default way to pay.",
      "A regular user taps in a little over once a day on average, between coffee, lunch and the bus."
    ],
    narrative: [
      "There are about 53 million UK adults.",
      "Around 90% of them use contactless regularly.",
      "And they tap roughly 1.15 times a day on average.",
      "53,000,000 × 0.9 × 1.15 comes out around 55 million.",
      "UK Finance's own payment statistics put annual contactless volume at around 20 billion — which is almost exactly this per day."
    ],
    estimate_range: [25000000, 100000000],
    actual_answer: 55000000,
    answer_type: "measured",
    as_of: 2022,
    source: "UK Finance, UK Payment Markets report (annual contactless payment volume).",
    sanity_check: "55 million taps a day is roughly one for every adult in the country, once, every day."
  },
  {
    id: "q0019",
    category: "product",
    difficulty: "medium",
    question: "How many app downloads happen worldwide per day?",
    clarifications: [
      "New installs across all major app stores combined, not updates.",
      "Every device type — phones, tablets, everything."
    ],
    reference_anchors: [
      { label: "smartphone users worldwide", value: 6500000000 },
      { label: "average new app downloads per user per year", value: 40 }
    ],
    framework: [
      { label: "Smartphone users worldwide", op: "x", model_value: 6500000000, unit: "users", plausible_range: [6000000000, 7000000000] },
      { label: "Average new app downloads per user per year", op: "x", model_value: 40, unit: "downloads/user/year", plausible_range: [20, 60] },
      { label: "Convert annual total to a daily figure", op: "/", model_value: 365, unit: "days/year", plausible_range: [365, 365] }
    ],
    framework_notes: [
      "There are roughly 6.5 billion smartphone users globally.",
      "The average user downloads a few dozen new apps a year, in bursts around new phones and trends.",
      "Dividing by days in the year gives the daily rate."
    ],
    narrative: [
      "There are about 6.5 billion smartphone users worldwide.",
      "Each downloads roughly 40 new apps a year on average.",
      "6,500,000,000 × 40 gives 260 billion downloads a year.",
      "Divide by 365 and that comes out around 700 million a day.",
      "That lines up closely with industry trackers like data.ai, who've put annual global downloads in the 250-billion-plus range."
    ],
    estimate_range: [300000000, 2000000000],
    actual_answer: 700000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "data.ai State of Mobile report (annual global app download estimates).",
    sanity_check: "700 million downloads a day is roughly one for every 11th person on Earth, every single day."
  },
  {
    id: "q0020",
    category: "sport",
    difficulty: "medium",
    question: "How many tennis balls are used at Wimbledon each year?",
    clarifications: [
      "The whole Championships fortnight, all courts, qualifying included.",
      "Match balls plus practice-court balls."
    ],
    reference_anchors: [
      { label: "matches played during the Championships", value: 650 },
      { label: "balls used per match", value: 83 }
    ],
    framework: [
      { label: "Matches played across the Championships", op: "x", model_value: 650, unit: "matches", plausible_range: [600, 700] },
      { label: "Average balls used per match", op: "x", model_value: 83, unit: "balls/match", plausible_range: [50, 100] },
      { label: "Extra balls used on practice courts", op: "+", model_value: 2000, unit: "balls", plausible_range: [0, 5000] }
    ],
    framework_notes: [
      "Around 650 matches are played across the singles, doubles and qualifying draws.",
      "Balls are changed every seven games (nine after the first set), so a match gets through dozens.",
      "Practice courts get through their own stock on top of match play."
    ],
    narrative: [
      "Around 650 matches are played across the Championships.",
      "Each match gets through about 83 balls, with changes every seven games.",
      "650 × 83 comes to about 54,000, plus a couple of thousand more on the practice courts.",
      "That comes out around 54,250.",
      "That's the exact figure Wimbledon and Slazenger have quoted for years — 54,250 balls a Championships."
    ],
    estimate_range: [40000, 70000],
    actual_answer: 54250,
    answer_type: "measured",
    as_of: 2023,
    source: "All England Lawn Tennis Club / Slazenger official figures.",
    sanity_check: "54,250 balls is enough that if you stacked them, the tower would clear the roof of Centre Court."
  },
  {
    id: "q0021",
    category: "everyday-life",
    difficulty: "medium",
    question: "How many umbrellas are bought in the UK per year?",
    clarifications: [
      "New umbrellas purchased, not umbrellas already owned.",
      "All types — pocket, golf, the cheap ones from the newsagent."
    ],
    reference_anchors: [
      { label: "UK population", value: 67000000 },
      { label: "fraction who buy a new umbrella in a given year", value: 0.35 }
    ],
    framework: [
      { label: "UK population", op: "x", model_value: 67000000, unit: "people", plausible_range: [65000000, 68000000] },
      { label: "Fraction who buy a new umbrella in a given year", op: "x", model_value: 0.35, unit: "fraction", plausible_range: [0.2, 0.5] },
      { label: "Average umbrellas bought per buyer per year", op: "x", model_value: 1.3, unit: "umbrellas/buyer", plausible_range: [1, 2] }
    ],
    framework_notes: [
      "The UK has around 67 million people.",
      "Umbrellas are famously disposable — inside-out in the first gust — so a good third of people replace one most years.",
      "Some buyers end up replacing more than one across the year."
    ],
    narrative: [
      "There are about 67 million people in the UK.",
      "Around 35% buy a new umbrella in a given year.",
      "And buyers pick up about 1.3 on average, because the first one never survives.",
      "67,000,000 × 0.35 × 1.3 comes out around 30 million.",
      "Trade estimates for the UK umbrella market land in that same ballpark — most end up in a bin after one bad storm."
    ],
    estimate_range: [12000000, 60000000],
    actual_answer: 30000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "UK retail and homeware trade estimates of annual umbrella sales.",
    sanity_check: "30 million umbrellas a year is nearly one for every two people, mostly bought in a hurry outside a Tube station."
  },
  {
    id: "q0022",
    category: "operations",
    difficulty: "hard",
    question: "How many parcels does Amazon deliver in the UK per day?",
    clarifications: [
      "Items delivered to UK customers, not sold overseas.",
      "Averaged across the year, not just the Christmas peak."
    ],
    reference_anchors: [
      { label: "UK online shoppers", value: 40000000 },
      { label: "average Amazon orders per shopper per year", value: 25 }
    ],
    framework: [
      { label: "UK online shoppers who use Amazon", op: "x", model_value: 40000000, unit: "shoppers", plausible_range: [30000000, 45000000] },
      { label: "Average Amazon items ordered per shopper per year", op: "x", model_value: 25, unit: "items/shopper/year", plausible_range: [10, 40] },
      { label: "Convert annual total to a daily figure", op: "/", model_value: 365, unit: "days/year", plausible_range: [365, 365] }
    ],
    framework_notes: [
      "The great majority of UK online shoppers have an Amazon account.",
      "A typical customer orders a couple of dozen items a year, more for Prime households.",
      "Dividing by days in the year smooths out the Black Friday and Christmas spikes."
    ],
    narrative: [
      "Around 40 million people in the UK shop on Amazon.",
      "Each orders about 25 items a year on average.",
      "40,000,000 × 25 gives 1 billion items a year.",
      "Divide by 365 and that's around 2.7 million a day.",
      "Amazon has stated it delivers over a billion items to UK customers annually — which matches this almost exactly."
    ],
    estimate_range: [800000, 8000000],
    actual_answer: 2700000,
    answer_type: "consensus-estimate",
    as_of: 2022,
    source: "Amazon UK public statements on annual items delivered to UK customers.",
    sanity_check: "2.7 million parcels a day is roughly one for every 25th person in the country, every day of the year."
  },
  {
    id: "q0023",
    category: "physical-estimation",
    difficulty: "medium",
    question: "How many bricks are in a typical UK terraced house?",
    clarifications: [
      "Visible facing brickwork on the outside walls, not internal blockwork.",
      "A standard two-up two-down Victorian terrace, not a mansion."
    ],
    reference_anchors: [
      { label: "external wall area of a terraced house", value: 180 },
      { label: "facing bricks per square metre", value: 60 }
    ],
    framework: [
      { label: "External wall area (all sides)", op: "x", model_value: 180, unit: "m2", plausible_range: [140, 220] },
      { label: "Facing bricks per square metre of wall", op: "x", model_value: 60, unit: "bricks/m2", plausible_range: [50, 70] },
      { label: "Fraction of that wall area that's actually brick, not window or door", op: "x", model_value: 0.8, unit: "fraction", plausible_range: [0.65, 0.9] }
    ],
    framework_notes: [
      "A typical terrace has around 180 square metres of external wall once you include the sides shared with neighbours' equivalent walls.",
      "Standard brick coursing runs about 60 bricks to the square metre.",
      "Windows and doors eat into that, so only about 80% of the wall area is actually brick."
    ],
    narrative: [
      "A terraced house has around 180 square metres of outer wall.",
      "Standard brickwork runs about 60 bricks per square metre.",
      "But windows and doors take up maybe 20% of that area.",
      "180 × 60 × 0.8 comes out around 9,000.",
      "That's right in line with the builder's rule of thumb of 8,000 to 10,000 bricks for a standard terrace."
    ],
    estimate_range: [4000, 18000],
    actual_answer: 9000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "UK construction industry rule-of-thumb brick counts for terraced housing.",
    sanity_check: "9,000 bricks is about what one bricklayer gets through in a fortnight, alone, before tea breaks."
  },
  {
    id: "q0024",
    category: "transport",
    difficulty: "hard",
    question: "How many vehicles pass a given point on the M25 in a day?",
    clarifications: [
      "A typical busy section, both directions combined, not the whole ring summed.",
      "An average weekday, not a bank holiday getaway."
    ],
    reference_anchors: [
      { label: "typical traffic flow per lane per hour", value: 1800 },
      { label: "number of lanes both directions", value: 8 }
    ],
    framework: [
      { label: "Traffic flow per lane per hour at a busy section", op: "x", model_value: 1800, unit: "vehicles/lane/hr", plausible_range: [1500, 2200] },
      { label: "Number of lanes, both directions combined", op: "x", model_value: 8, unit: "lanes", plausible_range: [6, 10] },
      { label: "Effective hours of significant flow per day", op: "x", model_value: 10.5, unit: "hours", plausible_range: [8, 14] }
    ],
    framework_notes: [
      "A busy motorway lane carries close to 1,800 vehicles an hour before it starts to congest.",
      "A typical M25 section has four lanes each way.",
      "Traffic isn't flat all day, but weighting for peaks and troughs gives an effective 10 to 11 hours of near-capacity-equivalent flow."
    ],
    narrative: [
      "A busy motorway lane carries about 1,800 vehicles an hour.",
      "The M25 typically runs 8 lanes combined across both directions.",
      "And that flow holds for the equivalent of about 10.5 hours a day once you average peaks and troughs.",
      "1,800 × 8 × 10.5 comes out around 150,000.",
      "That's in line with National Highways' own traffic counts for the busier stretches, like the section near Heathrow."
    ],
    estimate_range: [60000, 300000],
    actual_answer: 150000,
    answer_type: "measured",
    as_of: 2022,
    source: "National Highways average daily traffic flow data for M25 sections.",
    sanity_check: "150,000 vehicles a day is roughly the population of Cambridge, driving past the same spot, once, every day."
  },
  {
    id: "q0025",
    category: "geography",
    difficulty: "hard",
    question: "How many private gardens are there in the UK?",
    clarifications: [
      "Private gardens attached to homes, not public parks.",
      "Great Britain, where the detailed survey data exists."
    ],
    reference_anchors: [
      { label: "UK households", value: 28000000 },
      { label: "fraction of households with private garden access", value: 0.82 }
    ],
    framework: [
      { label: "UK households", op: "x", model_value: 28000000, unit: "households", plausible_range: [27000000, 29000000] },
      { label: "Fraction with access to a private garden", op: "x", model_value: 0.82, unit: "fraction", plausible_range: [0.7, 0.9] },
      { label: "Adjustment excluding shared or communal gardens", op: "x", model_value: 0.95, unit: "fraction", plausible_range: [0.85, 1] }
    ],
    framework_notes: [
      "There are around 28 million households in the UK.",
      "Most, but not all — flats especially miss out — have access to a private garden.",
      "A small share of what's counted as 'garden access' is actually shared or communal rather than private."
    ],
    narrative: [
      "There are about 28 million UK households.",
      "Around 82% have access to a private garden.",
      "And about 95% of those are genuinely private rather than shared.",
      "28,000,000 × 0.82 × 0.95 comes out around 22 million.",
      "The ONS's own garden survey using aerial mapping landed on almost exactly that — around 22.7 million private gardens."
    ],
    estimate_range: [8000000, 40000000],
    actual_answer: 22000000,
    answer_type: "measured",
    as_of: 2017,
    source: "Office for National Statistics, UK natural capital garden accounts (2017 aerial survey).",
    sanity_check: "22 million gardens cover more ground than every nature reserve in England combined."
  },
  {
    id: "q0026",
    category: "animals",
    difficulty: "medium",
    question: "How many pigeons live in London?",
    clarifications: [
      "Feral pigeons in the built-up urban area, not racing pigeons in lofts.",
      "Greater London, not just the tourist-heavy centre."
    ],
    reference_anchors: [
      { label: "Greater London land area", value: 1570 },
      { label: "fraction of London that's densely built-up", value: 0.85 }
    ],
    framework: [
      { label: "Greater London land area", op: "x", model_value: 1570, unit: "km2", plausible_range: [1500, 1650] },
      { label: "Fraction of that area that's densely built-up (pigeon habitat)", op: "x", model_value: 0.85, unit: "fraction", plausible_range: [0.6, 0.95] },
      { label: "Average pigeons per square kilometre of built-up area", op: "x", model_value: 670, unit: "pigeons/km2", plausible_range: [400, 900] }
    ],
    framework_notes: [
      "Greater London covers around 1,570 square kilometres.",
      "Most of that is built-up urban environment where feral pigeons thrive.",
      "Urban pigeon densities of several hundred per square kilometre are typical in big cities."
    ],
    narrative: [
      "Greater London covers about 1,570 square kilometres.",
      "Around 85% of that is dense, built-up habitat pigeons love.",
      "And urban pigeon density runs about 670 per square kilometre in that habitat.",
      "1,570 × 0.85 × 670 comes out around 900,000.",
      "That sits comfortably within the range naturalists have estimated for London's feral pigeon population."
    ],
    estimate_range: [300000, 2000000],
    actual_answer: 900000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Urban ecology estimates of feral pigeon density in major cities, scaled to Greater London.",
    sanity_check: "900,000 pigeons is about one for every ten Londoners — most of them apparently in Trafalgar Square."
  },
  {
    id: "q0027",
    category: "entertainment",
    difficulty: "medium",
    question: "How many cinema tickets are sold in the UK per year?",
    clarifications: [
      "Tickets sold at UK cinemas, all films combined.",
      "A recent, post-pandemic-recovery year, not the 2020 lockdown low."
    ],
    reference_anchors: [
      { label: "cinema screens in the UK", value: 4400 },
      { label: "average seats per screen", value: 120 }
    ],
    framework: [
      { label: "Cinema screens in the UK", op: "x", model_value: 4400, unit: "screens", plausible_range: [4000, 4800] },
      { label: "Average seats per screen", op: "x", model_value: 120, unit: "seats", plausible_range: [80, 150] },
      { label: "Average paying 'turns' of a seat per year", op: "x", model_value: 240, unit: "turns/seat/year", plausible_range: [150, 300] }
    ],
    framework_notes: [
      "The UK has around 4,400 cinema screens.",
      "The average screen seats around 120 people.",
      "Across a year, factoring in quiet weekday matinees and packed weekend blockbusters, each seat gets filled with a paying customer a couple of hundred times."
    ],
    narrative: [
      "The UK has about 4,400 cinema screens.",
      "Each seats around 120 people.",
      "And each seat gets sold to a paying customer roughly 240 times a year.",
      "4,400 × 120 × 240 comes out around 127 million.",
      "The BFI's own admissions figures for a recovering post-pandemic year land right around 125 million."
    ],
    estimate_range: [70000000, 220000000],
    actual_answer: 125000000,
    answer_type: "measured",
    as_of: 2023,
    source: "British Film Institute, Statistical Yearbook (UK cinema admissions).",
    sanity_check: "125 million admissions is nearly two trips to the cinema for every person in the country in a year."
  },
  {
    id: "q0028",
    category: "money",
    difficulty: "medium",
    question: "How much is spent on the National Lottery in the UK per week?",
    clarifications: [
      "All National Lottery games combined — draws, scratchcards, instant win.",
      "A normal week, not a rollover week."
    ],
    reference_anchors: [
      { label: "UK adults", value: 53000000 },
      { label: "fraction who play in a given week", value: 0.32 }
    ],
    framework: [
      { label: "UK adult population", op: "x", model_value: 53000000, unit: "people", plausible_range: [50000000, 55000000] },
      { label: "Fraction who play a National Lottery game in a given week", op: "x", model_value: 0.32, unit: "fraction", plausible_range: [0.2, 0.45] },
      { label: "Average spend per player per week", op: "x", model_value: 8.85, unit: "GBP/player", plausible_range: [4, 15] }
    ],
    framework_notes: [
      "There are around 53 million UK adults.",
      "Roughly a third play some National Lottery game in a given week.",
      "Players spend a modest amount most weeks — a couple of lines or a scratchcard."
    ],
    narrative: [
      "There are about 53 million UK adults.",
      "Around a third of them play a National Lottery game in a given week.",
      "And they spend about £8.85 on average.",
      "53,000,000 × 0.32 × 8.85 comes out around £150 million.",
      "That matches the operator's own reported annual sales of roughly £8 billion, divided across the year."
    ],
    estimate_range: [70000000, 300000000],
    actual_answer: 150000000,
    answer_type: "measured",
    as_of: 2022,
    source: "Camelot / Allwyn annual National Lottery sales figures.",
    sanity_check: "£150 million a week is enough to fund a fair few good causes — which, to be fair, is the entire point."
  },
  {
    id: "q0030",
    category: "health",
    difficulty: "hard",
    question: "How many babies are born in the UK per day?",
    clarifications: [
      "Live births across the whole UK, not England alone.",
      "A daily average across the year."
    ],
    reference_anchors: [
      { label: "UK population", value: 67000000 },
      { label: "crude birth rate per 1,000 people per year", value: 10.2 }
    ],
    framework: [
      { label: "UK population", op: "x", model_value: 67000000, unit: "people", plausible_range: [65000000, 68000000] },
      { label: "Convert to thousands of people", op: "/", model_value: 1000, unit: "people/1000", plausible_range: [1000, 1000] },
      { label: "Crude birth rate per 1,000 people per year", op: "x", model_value: 10.2, unit: "births/1000/year", plausible_range: [8, 12] },
      { label: "Convert annual total to a daily figure", op: "/", model_value: 365, unit: "days/year", plausible_range: [365, 365] }
    ],
    framework_notes: [
      "The UK's population is around 67 million.",
      "Dividing by a thousand puts it on the scale birth rates are quoted at.",
      "The UK's crude birth rate has settled at just over 10 per 1,000 people a year in recent times.",
      "Dividing the annual total by days in the year gives the daily rate."
    ],
    narrative: [
      "The UK has about 67 million people.",
      "That's 67,000 lots of a thousand.",
      "At a birth rate of about 10.2 per thousand per year, that's around 683,000 births a year.",
      "Divide by 365 and that comes out to about 1,870 a day.",
      "ONS figures for UK births land close to that — a little under 2,000 new arrivals every single day."
    ],
    estimate_range: [800, 4000],
    actual_answer: 1870,
    answer_type: "measured",
    as_of: 2022,
    source: "Office for National Statistics, UK birth statistics.",
    sanity_check: "1,870 babies a day is a small town's worth of newborns, every day, without fail."
  },
  {
    id: "q0031",
    category: "sport",
    difficulty: "hard",
    question: "How many golf balls are lost in the UK per year?",
    clarifications: [
      "Balls lost during a round — water, rough, hedges — not balls simply discarded.",
      "Amateur and club golf, not tour professionals."
    ],
    reference_anchors: [
      { label: "regular golfers in the UK", value: 3000000 },
      { label: "average rounds played per golfer per year", value: 20 }
    ],
    framework: [
      { label: "Regular golfers in the UK", op: "x", model_value: 3000000, unit: "golfers", plausible_range: [2500000, 3500000] },
      { label: "Average rounds played per golfer per year", op: "x", model_value: 20, unit: "rounds/golfer", plausible_range: [10, 30] },
      { label: "Average balls lost per round", op: "x", model_value: 1.2, unit: "balls/round", plausible_range: [0.5, 2] }
    ],
    framework_notes: [
      "The UK has around 3 million people who play golf with any regularity.",
      "A keen amateur plays somewhere around 20 rounds a year.",
      "Most amateur rounds cost at least one ball to water, gorse or a neighbouring fairway."
    ],
    narrative: [
      "There are around 3 million regular golfers in the UK.",
      "Each plays about 20 rounds a year.",
      "And loses roughly 1.2 balls per round to water, rough or worse.",
      "3,000,000 × 20 × 1.2 comes out around 72 million.",
      "Nobody keeps an official tally, but that lines up with golf-industry estimates of the used and lost ball market."
    ],
    estimate_range: [20000000, 200000000],
    actual_answer: 70000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from UK golf participation figures and typical lost-ball rates per round.",
    sanity_check: "70 million lost balls a year is roughly one for every man, woman and child in the country — swimming somewhere in a water hazard right now."
  },
  {
    id: "q0032",
    category: "everyday-life",
    difficulty: "hard",
    question: "How many WhatsApp messages are sent by people in the UK per day?",
    clarifications: [
      "WhatsApp specifically, not SMS or other messaging apps.",
      "Text messages sent, not voice notes or calls."
    ],
    reference_anchors: [
      { label: "UK WhatsApp users", value: 30000000 },
      { label: "average chats an active user checks per day", value: 12 }
    ],
    framework: [
      { label: "UK WhatsApp users", op: "x", model_value: 30000000, unit: "users", plausible_range: [25000000, 35000000] },
      { label: "Average chats (1:1 and group) an active user participates in per day", op: "x", model_value: 12, unit: "chats/user", plausible_range: [5, 20] },
      { label: "Average messages sent per chat per day", op: "x", model_value: 4.2, unit: "messages/chat", plausible_range: [2, 8] }
    ],
    framework_notes: [
      "WhatsApp is the dominant messaging app in the UK, used by most of the adult population.",
      "The average active user is part of a dozen or so ongoing chats, family groups included.",
      "Each chat usually sees a small burst of messages across a day."
    ],
    narrative: [
      "Around 30 million people in the UK use WhatsApp.",
      "Each is active in about 12 chats on a given day.",
      "And sends roughly 4.2 messages per chat.",
      "30,000,000 × 12 × 4.2 comes out around 1.5 billion.",
      "Meta has stated WhatsApp carries over 100 billion messages a day globally — the UK's share, scaled to its population, lands right around here."
    ],
    estimate_range: [500000000, 4000000000],
    actual_answer: 1500000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from Meta's reported global WhatsApp message volume, scaled to UK user share.",
    sanity_check: "1.5 billion messages a day is around 22 for every person in the UK — most of them probably in the family group chat."
  },
  {
    id: "q0033",
    category: "operations",
    difficulty: "medium",
    question: "How many pints of milk are delivered by milkmen in the UK each morning?",
    clarifications: [
      "Traditional doorstep milk delivery, not supermarket click-and-collect.",
      "A normal weekday morning round."
    ],
    reference_anchors: [
      { label: "UK households", value: 28000000 },
      { label: "fraction still using doorstep milk delivery", value: 0.016 }
    ],
    framework: [
      { label: "UK households", op: "x", model_value: 28000000, unit: "households", plausible_range: [27000000, 29000000] },
      { label: "Fraction still using doorstep milk delivery", op: "x", model_value: 0.016, unit: "fraction", plausible_range: [0.01, 0.03] },
      { label: "Average pints delivered per household", op: "x", model_value: 2.2, unit: "pints/household", plausible_range: [1.5, 3] }
    ],
    framework_notes: [
      "There are around 28 million households in the UK.",
      "Doorstep delivery has shrunk hugely since its 1980s peak, but a small, loyal base remains.",
      "A delivery household tends to have a couple of pints left on the step."
    ],
    narrative: [
      "There are about 28 million UK households.",
      "Only around 1.6% still get milk delivered to the door.",
      "And they get about 2.2 pints on average.",
      "28,000,000 × 0.016 × 2.2 comes out around 1 million.",
      "That fits with the dairy industry's own estimate — doorstep delivery is a shadow of its former self, but it hasn't disappeared."
    ],
    estimate_range: [400000, 2500000],
    actual_answer: 1000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Dairy UK and industry estimates of remaining doorstep milk delivery customers.",
    sanity_check: "1 million pints a morning is a nostalgic clink, multiplied a million times over."
  },
  {
    id: "q0034",
    category: "physical-estimation",
    difficulty: "hard",
    question: "How many raindrops fall on London during an average hour-long downpour?",
    clarifications: [
      "Greater London's land area, not just the City.",
      "A steady, moderate downpour, not a light drizzle or a cloudburst."
    ],
    reference_anchors: [
      { label: "Greater London area", value: 1570 },
      { label: "typical rainfall depth in a downpour", value: 0.005 }
    ],
    framework: [
      { label: "Greater London area", op: "x", model_value: 1570, unit: "km2", plausible_range: [1500, 1650] },
      { label: "Convert km2 to m2", op: "x", model_value: 1000000, unit: "m2/km2", plausible_range: [1000000, 1000000] },
      { label: "Rainfall depth in a typical downpour", op: "x", model_value: 0.005, unit: "metres", plausible_range: [0.002, 0.01] },
      { label: "Convert cubic metres of water to millilitres", op: "x", model_value: 1000000, unit: "mL/m3", plausible_range: [1000000, 1000000] },
      { label: "Average volume of a single raindrop", op: "/", model_value: 0.03, unit: "mL/drop", plausible_range: [0.02, 0.06] }
    ],
    framework_notes: [
      "Greater London covers around 1,570 square kilometres.",
      "Converting to square metres puts the area on the right scale for rainfall depth.",
      "A moderate downpour deposits around 5mm of rain in an hour.",
      "Converting the resulting volume to millilitres matches the scale of a single raindrop.",
      "A typical medium raindrop holds around 0.03 millilitres."
    ],
    narrative: [
      "Greater London covers about 1,570 square kilometres.",
      "That's 1.57 billion square metres.",
      "A downpour drops around 5 millimetres of rain in an hour.",
      "That works out to nearly 8 billion litres, or 7.85 trillion millilitres, of water.",
      "1,570,000,000 × 0.005 × 1,000,000 ÷ 0.03 comes out to about 260 trillion raindrops.",
      "Nobody's counting, but that's the scale a single London downpour operates at — roughly 30,000 raindrops for every person on Earth, in one city, in one hour."
    ],
    estimate_range: [50000000000000, 1000000000000000],
    actual_answer: 260000000000000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Fermi estimate; typical raindrop volume around 0.03 mL, Greater London area ~1,570 km2.",
    sanity_check: "260 trillion raindrops in an hour is roughly 30,000 for every person on the planet, falling on one city."
  },
  {
    id: "q0035",
    category: "transport",
    difficulty: "medium",
    question: "How many flights depart from Heathrow per day?",
    clarifications: [
      "Departures only, not arrivals.",
      "A normal operating day, not a snow-disrupted one."
    ],
    reference_anchors: [
      { label: "Heathrow's annual movement cap", value: 480000 },
      { label: "movements split roughly evenly between arrivals and departures", value: 2 }
    ],
    framework: [
      { label: "Heathrow's annual flight movement cap", op: "x", model_value: 480000, unit: "movements/year", plausible_range: [460000, 500000] },
      { label: "Split into departures only", op: "/", model_value: 2, unit: "arrivals+departures", plausible_range: [2, 2] },
      { label: "Convert annual total to a daily figure", op: "/", model_value: 365, unit: "days/year", plausible_range: [365, 365] }
    ],
    framework_notes: [
      "Heathrow operates under a long-standing regulatory cap on total annual flight movements.",
      "Movements split roughly evenly between landings and take-offs.",
      "Dividing by days in the year gives the average daily departure count."
    ],
    narrative: [
      "Heathrow is capped at around 480,000 flight movements a year.",
      "Half of those are departures, so that's 240,000 a year.",
      "Divide by 365 and that's around 655 a day.",
      "That matches Heathrow's own published operating statistics almost exactly — it runs right up against its cap most years."
    ],
    estimate_range: [400, 1200],
    actual_answer: 655,
    answer_type: "measured",
    as_of: 2023,
    source: "Heathrow Airport operating statistics and regulatory movement cap.",
    sanity_check: "655 departures a day is a plane taking off from Heathrow roughly every two minutes, round the clock."
  },
  {
    id: "q0036",
    category: "geography",
    difficulty: "medium",
    question: "How many wind turbines are there in the UK?",
    clarifications: [
      "Onshore and offshore combined.",
      "Currently operational, not under construction or decommissioned."
    ],
    reference_anchors: [
      { label: "total UK installed wind capacity", value: 30000 },
      { label: "average capacity per turbine", value: 2.6 }
    ],
    framework: [
      { label: "Total UK installed wind capacity", op: "x", model_value: 30000, unit: "MW", plausible_range: [28000, 32000] },
      { label: "Average capacity per turbine", op: "/", model_value: 2.6, unit: "MW/turbine", plausible_range: [2, 3.5] },
      { label: "Fraction of turbines actually operational at a given time", op: "x", model_value: 0.997, unit: "fraction", plausible_range: [0.9, 1] }
    ],
    framework_notes: [
      "The UK's total installed wind capacity is around 30 gigawatts.",
      "The average turbine, blending older small onshore units with newer offshore giants, sits around 2.6 megawatts.",
      "A small share are always offline for maintenance or repair at any given moment."
    ],
    narrative: [
      "UK wind capacity totals around 30,000 megawatts.",
      "Divide by an average turbine size of 2.6 megawatts.",
      "And a small fraction are offline for maintenance at any moment — call it 99.7% running.",
      "30,000 ÷ 2.6 × 0.997 comes out around 11,500.",
      "That matches RenewableUK's own count of operational turbines closely — split roughly three-quarters onshore, one-quarter offshore."
    ],
    estimate_range: [6000, 20000],
    actual_answer: 11500,
    answer_type: "measured",
    as_of: 2023,
    source: "RenewableUK wind energy database.",
    sanity_check: "11,500 turbines is enough that you're rarely more than a few miles from one on a British hillside or coastline."
  },
  {
    id: "q0037",
    category: "animals",
    difficulty: "medium",
    question: "How many pet dogs are owned in the UK?",
    clarifications: [
      "Dogs kept as pets in homes, not working or stray dogs.",
      "A recent, stable year, not the pandemic puppy boom peak."
    ],
    reference_anchors: [
      { label: "UK households", value: 28000000 },
      { label: "fraction owning at least one dog", value: 0.29 }
    ],
    framework: [
      { label: "UK households", op: "x", model_value: 28000000, unit: "households", plausible_range: [27000000, 29000000] },
      { label: "Fraction owning at least one dog", op: "x", model_value: 0.29, unit: "fraction", plausible_range: [0.2, 0.35] },
      { label: "Average dogs per dog-owning household", op: "x", model_value: 1.6, unit: "dogs/household", plausible_range: [1.1, 2] }
    ],
    framework_notes: [
      "There are around 28 million households in the UK.",
      "Roughly three in ten own at least one dog.",
      "Dog-owning households often end up with more than one."
    ],
    narrative: [
      "The UK has about 28 million households.",
      "Around 29% own at least one dog.",
      "And dog-owning households average about 1.6 dogs each.",
      "28,000,000 × 0.29 × 1.6 comes out around 13 million.",
      "That matches the UK Pet Food and PDSA PAW Report figures for the pet dog population closely."
    ],
    estimate_range: [6000000, 25000000],
    actual_answer: 13000000,
    answer_type: "measured",
    as_of: 2023,
    source: "UK Pet Food / PDSA Animal Wellbeing (PAW) Report.",
    sanity_check: "13 million dogs is nearly one for every five people in the country — no wonder every park smells the way it does."
  },
  {
    id: "q0038",
    category: "entertainment",
    difficulty: "medium",
    question: "How many people watch Strictly Come Dancing on a Saturday night?",
    clarifications: [
      "Total UK audience, live plus catch-up within the week.",
      "A typical mid-series Saturday, not the final."
    ],
    reference_anchors: [
      { label: "UK population", value: 67000000 },
      { label: "fraction who tune in live or catch up that week", value: 0.14 }
    ],
    framework: [
      { label: "UK population", op: "x", model_value: 67000000, unit: "people", plausible_range: [65000000, 68000000] },
      { label: "Fraction who tune in live or catch up within the week", op: "x", model_value: 0.14, unit: "fraction", plausible_range: [0.08, 0.2] },
      { label: "Additional catch-up viewers on BBC iPlayer", op: "+", model_value: 500000, unit: "viewers", plausible_range: [0, 1500000] }
    ],
    framework_notes: [
      "The UK population is around 67 million.",
      "Strictly regularly reaches a substantial slice of the population, live and via catch-up.",
      "iPlayer adds a further chunk of viewers who watch after broadcast."
    ],
    narrative: [
      "The UK has around 67 million people.",
      "Roughly 14% tune in live or catch up within the week.",
      "That's about 9.4 million, plus another half a million or so via iPlayer.",
      "67,000,000 × 0.14, plus 500,000, comes out around 9.5 million.",
      "That matches BARB's consolidated audience figures for a typical mid-series Strictly Saturday almost exactly."
    ],
    estimate_range: [4000000, 16000000],
    actual_answer: 9500000,
    answer_type: "measured",
    as_of: 2023,
    source: "BARB (Broadcasters' Audience Research Board) consolidated viewing figures.",
    sanity_check: "9.5 million viewers is more than the entire population of London settling in for the same sequin-covered hour."
  },
  {
    id: "q0039",
    category: "money",
    difficulty: "hard",
    question: "How much cash — notes and coins — is in circulation in the UK?",
    clarifications: [
      "Total value of physical currency in circulation, not bank deposits.",
      "Sterling only."
    ],
    reference_anchors: [
      { label: "UK population", value: 67000000 },
      { label: "average value of cash held per person", value: 1270 }
    ],
    framework: [
      { label: "UK population", op: "x", model_value: 67000000, unit: "people", plausible_range: [65000000, 68000000] },
      { label: "Average value of notes and coins attributable per person", op: "x", model_value: 1270, unit: "GBP/person", plausible_range: [900, 1700] },
      { label: "Adjustment for cash held in bulk (business tills, vaults) rather than evenly per person", op: "x", model_value: 1.0, unit: "fraction", plausible_range: [0.9, 1.1] }
    ],
    framework_notes: [
      "The UK population is around 67 million.",
      "A huge amount of cash sits idle — under mattresses, in tills, held as a store of value — pushing the effective per-person figure well above what's in anyone's actual wallet.",
      "This mostly nets out across the population once business and reserve cash is spread in."
    ],
    narrative: [
      "The UK has around 67 million people.",
      "Spread the total cash in circulation across everyone and it works out to about £1,270 a head.",
      "67,000,000 × 1,270 comes out around £85 billion.",
      "That matches the Bank of England's own figures for banknotes and coins in circulation closely — most of it never actually seen in a till."
    ],
    estimate_range: [40000000000, 150000000000],
    actual_answer: 85000000000,
    answer_type: "measured",
    as_of: 2023,
    source: "Bank of England banknote and coin circulation statistics.",
    sanity_check: "£85 billion in cash is far more than anyone's actual wallet suggests — most of it is sitting quietly in vaults, not pockets."
  },
  {
    id: "q0040",
    category: "product",
    difficulty: "medium",
    question: "How many food delivery orders (Deliveroo, Just Eat and similar) are placed in the UK per day?",
    clarifications: [
      "All major UK food delivery platforms combined.",
      "A normal weekday, not a Saturday night peak."
    ],
    reference_anchors: [
      { label: "UK adults", value: 53000000 },
      { label: "fraction ordering delivery in a given week", value: 0.17 }
    ],
    framework: [
      { label: "UK adult population", op: "x", model_value: 53000000, unit: "people", plausible_range: [50000000, 55000000] },
      { label: "Fraction who order food delivery in a given week", op: "x", model_value: 0.17, unit: "fraction", plausible_range: [0.1, 0.25] },
      { label: "Average orders per ordering person per week", op: "x", model_value: 1.3, unit: "orders/person", plausible_range: [1, 2] },
      { label: "Convert weekly total to a daily figure", op: "/", model_value: 7, unit: "days/week", plausible_range: [7, 7] }
    ],
    framework_notes: [
      "There are around 53 million UK adults.",
      "Roughly one in six order food delivery in a given week.",
      "Regular orderers tend to order slightly more than once a week.",
      "Dividing by seven smooths the weekly total, even though Fridays and Saturdays actually carry more."
    ],
    narrative: [
      "There are about 53 million UK adults.",
      "Around 17% order food delivery in a given week.",
      "And they order about 1.3 times on average.",
      "53,000,000 × 0.17 × 1.3 gives around 11.7 million orders a week.",
      "Divide by 7 and that's around 1.7 million a day.",
      "That's a reasonable average across the week, even though it's really a Friday night business at heart."
    ],
    estimate_range: [700000, 4000000],
    actual_answer: 1700000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from UK food delivery market participation surveys (Deliveroo, Just Eat, Uber Eats combined).",
    sanity_check: "1.7 million orders a day is roughly the population of Birmingham deciding, independently, not to cook tonight."
  },
  {
    id: "q0042",
    category: "sport",
    difficulty: "medium",
    question: "How many hours of live football are broadcast on UK TV in a typical week during the season?",
    clarifications: [
      "Premier League, EFL, Scottish and European football combined, across all UK broadcasters.",
      "Live match coverage including build-up and analysis, not general sports news."
    ],
    reference_anchors: [
      { label: "live matches broadcast across UK channels in a week", value: 90 },
      { label: "average broadcast time per match including build-up", value: 2.2 }
    ],
    framework: [
      { label: "Live matches broadcast across all UK channels in a week", op: "x", model_value: 90, unit: "matches/week", plausible_range: [60, 120] },
      { label: "Average broadcast time per match, including build-up and analysis", op: "x", model_value: 2.2, unit: "hours/match", plausible_range: [1.5, 3] },
      { label: "Additional dedicated highlights and magazine shows", op: "+", model_value: 20, unit: "hours", plausible_range: [10, 40] }
    ],
    framework_notes: [
      "Between the Premier League, all four EFL divisions, Scottish football and midweek European fixtures, UK broadcasters show a lot of live football in a given week.",
      "Each match comes wrapped in pre-match and post-match analysis, not just 90 minutes of action.",
      "On top of live matches, there are dedicated highlights and magazine programmes."
    ],
    narrative: [
      "Across the Premier League, EFL, Scottish football and European nights, UK broadcasters show around 90 live matches a week during the season.",
      "Each comes with build-up and analysis, averaging about 2.2 hours of broadcast time.",
      "That's about 200 hours, plus another 20 or so for dedicated highlights shows.",
      "90 × 2.2, plus 20, comes out around 220 hours a week.",
      "There's no single official tally, but that's roughly what you'd clock up if you tried to watch every minute — a full-time job in itself."
    ],
    estimate_range: [100, 500],
    actual_answer: 200,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from UK broadcast schedules across Sky Sports, TNT Sports, BBC and Amazon during a typical season week.",
    sanity_check: "200 hours of football a week is more football than there are working hours in a normal week — nobody is watching all of it."
  },
  {
    id: "q0043",
    category: "everyday-life",
    difficulty: "medium",
    question: "How many loads of laundry are washed in UK homes per day?",
    clarifications: [
      "Domestic washing machine loads, not commercial laundrettes.",
      "A normal day averaged across the week."
    ],
    reference_anchors: [
      { label: "UK households", value: 28000000 },
      { label: "average washing machine loads per household per week", value: 5 }
    ],
    framework: [
      { label: "UK households", op: "x", model_value: 28000000, unit: "households", plausible_range: [27000000, 29000000] },
      { label: "Average washing machine loads per household per week", op: "x", model_value: 5, unit: "loads/week", plausible_range: [3, 7] },
      { label: "Convert weekly total to a daily figure", op: "/", model_value: 7, unit: "days/week", plausible_range: [7, 7] }
    ],
    framework_notes: [
      "There are around 28 million households in the UK.",
      "Most households run their washing machine around five times a week.",
      "Dividing by seven gives the daily average, even though Sundays are busier than most."
    ],
    narrative: [
      "There are about 28 million UK households.",
      "Each does around 5 loads of washing a week.",
      "28,000,000 × 5 gives 140 million loads a week.",
      "Divide by 7 and that's around 20 million a day.",
      "That matches energy-use survey estimates of UK laundry habits closely — the tumble dryer bill checks out."
    ],
    estimate_range: [10000000, 35000000],
    actual_answer: 20000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Energy Saving Trust and appliance-usage survey estimates of UK washing machine habits.",
    sanity_check: "20 million loads a day is roughly one for every household, once, every day of the week."
  },
  {
    id: "q0044",
    category: "operations",
    difficulty: "hard",
    question: "How many coffees does a big UK coffee chain sell per day?",
    clarifications: [
      "One major UK-wide chain, not the whole coffee shop sector.",
      "All drink sizes and types counted as one 'coffee'."
    ],
    reference_anchors: [
      { label: "UK stores in a major chain", value: 2700 },
      { label: "average cups sold per store per day", value: 400 }
    ],
    framework: [
      { label: "UK stores in a major coffee chain", op: "x", model_value: 2700, unit: "stores", plausible_range: [2500, 3000] },
      { label: "Average cups sold per store per day", op: "x", model_value: 400, unit: "cups/store", plausible_range: [250, 600] },
      { label: "Fraction of stores trading on a given day", op: "x", model_value: 0.97, unit: "fraction", plausible_range: [0.9, 1] }
    ],
    framework_notes: [
      "A major UK coffee chain operates around 2,700 stores nationwide.",
      "A busy high-street store might sell several hundred drinks on a normal day.",
      "A small share of stores are closed or refitting on any given day."
    ],
    narrative: [
      "A big UK chain runs around 2,700 stores.",
      "Each sells about 400 cups on a normal day.",
      "And about 97% of stores are open and trading.",
      "2,700 × 400 × 0.97 comes out around 1.05 million.",
      "That's in the same ballpark as company reporting on daily transaction volumes for the UK's biggest coffee chains."
    ],
    estimate_range: [400000, 3000000],
    actual_answer: 1050000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from UK coffee chain store counts and typical per-store daily transaction estimates.",
    sanity_check: "1.05 million coffees a day from one chain alone is more caffeine than most small countries could handle."
  },
  {
    id: "q0045",
    category: "physical-estimation",
    difficulty: "hard",
    question: "How many leaves are on a mature oak tree?",
    clarifications: [
      "A large, healthy, fully-grown English oak in summer leaf.",
      "Total leaves on the whole canopy, not per branch."
    ],
    reference_anchors: [
      { label: "major branches on a mature oak", value: 20 },
      { label: "leaves per twig", value: 250 }
    ],
    framework: [
      { label: "Major branches on a mature oak", op: "x", model_value: 20, unit: "branches", plausible_range: [15, 30] },
      { label: "Twigs per major branch", op: "x", model_value: 50, unit: "twigs/branch", plausible_range: [30, 80] },
      { label: "Leaves per twig", op: "x", model_value: 250, unit: "leaves/twig", plausible_range: [150, 350] }
    ],
    framework_notes: [
      "A mature oak has a couple of dozen major branches forming the main canopy structure.",
      "Each branch carries dozens of smaller twigs.",
      "Each twig, in turn, is dense with individual leaves through summer."
    ],
    narrative: [
      "A mature oak has around 20 major branches.",
      "Each branch carries about 50 twigs.",
      "And each twig holds roughly 250 leaves.",
      "20 × 50 × 250 comes out to about 250,000.",
      "Nobody's actually counted one leaf at a time, but that matches the range arborists commonly quote for a big, healthy oak."
    ],
    estimate_range: [80000, 700000],
    actual_answer: 250000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Arboriculture estimates of leaf counts on mature broadleaf trees.",
    sanity_check: "250,000 leaves on one tree is roughly one for every resident of a decent-sized British city."
  },
  {
    id: "q0046",
    category: "transport",
    difficulty: "hard",
    question: "How many bikes are stolen in the UK per year?",
    clarifications: [
      "All incidents, including the many that never get reported to police.",
      "Bicycles only, not e-scooters or mopeds."
    ],
    reference_anchors: [
      { label: "regular bike owners in the UK", value: 15000000 },
      { label: "fraction who have a bike stolen in a given year", value: 0.02 }
    ],
    framework: [
      { label: "Regular adult bike owners in the UK", op: "x", model_value: 15000000, unit: "owners", plausible_range: [12000000, 18000000] },
      { label: "Fraction who have a bike stolen in a given year", op: "x", model_value: 0.02, unit: "fraction", plausible_range: [0.01, 0.03] },
      { label: "Average bikes stolen per incident", op: "x", model_value: 1.05, unit: "bikes/incident", plausible_range: [1, 1.3] }
    ],
    framework_notes: [
      "Around 15 million UK adults own a bike they use regularly.",
      "Roughly one in fifty has a bike stolen in a given year — a grim constant of urban cycling.",
      "Most incidents cost one bike, though occasionally a shed gets cleared out entirely."
    ],
    narrative: [
      "About 15 million UK adults are regular bike owners.",
      "Around 2% have a bike stolen in a given year.",
      "And a small extra allowance for multi-bike thefts brings it to about 1.05 bikes per incident.",
      "15,000,000 × 0.02 × 1.05 comes out around 315,000.",
      "That's well above the roughly 80,000 thefts recorded by police each year — most bike thefts are simply never reported, which is exactly why the real total runs so much higher."
    ],
    estimate_range: [100000, 800000],
    actual_answer: 300000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from police recorded crime figures plus insurer and cycling-charity estimates of underreporting.",
    sanity_check: "300,000 stolen bikes a year is nearly 1,000 disappearing from outside shops, stations and gardens every single day."
  },
  {
    id: "q0047",
    category: "geography",
    difficulty: "hard",
    question: "How many islands are there around the UK?",
    clarifications: [
      "Islands large enough to remain above water at high tide.",
      "Great Britain and its surrounding islands, not overseas territories."
    ],
    reference_anchors: [
      { label: "coastal regions with significant island clusters", value: 7 },
      { label: "average islands per region", value: 898 }
    ],
    framework: [
      { label: "Coastal regions with significant island clusters (Scotland's west coast, Northern Isles, Wales, etc.)", op: "x", model_value: 7, unit: "regions", plausible_range: [5, 10] },
      { label: "Average islands per region", op: "x", model_value: 898, unit: "islands/region", plausible_range: [500, 1200] },
      { label: "Extra scattered islands outside the main clusters (Scillies, Channel Islands, etc.)", op: "+", model_value: 3, unit: "islands", plausible_range: [0, 200] }
    ],
    framework_notes: [
      "The UK's coastline breaks into a handful of major island-rich zones, dominated heavily by Scotland's west coast and Northern Isles.",
      "Those zones are scattered with hundreds of skerries, islets and small islands each, alongside the well-known named ones.",
      "A handful more sit outside those main clusters entirely, like the Isles of Scilly."
    ],
    narrative: [
      "The UK's coastline splits into around 7 major island-rich zones.",
      "Each holds, on average, several hundred islands and islets once you count everything from Skye down to bare skerries.",
      "Add a handful more scattered outside those clusters, like the Isles of Scilly.",
      "7 × 898 comes out to about 6,290.",
      "Ordnance Survey's own count, using their mapping data, puts the figure at 6,289 islands around Britain — of which only around 130 are permanently inhabited."
    ],
    estimate_range: [3000, 12000],
    actual_answer: 6289,
    answer_type: "measured",
    as_of: 2023,
    source: "Ordnance Survey island count for Great Britain.",
    sanity_check: "6,289 islands means Britain has an island for nearly every day for the next 17 years."
  },
  {
    id: "q0048",
    category: "animals",
    difficulty: "hard",
    question: "How many honeybees are there in the UK?",
    clarifications: [
      "Managed honeybees kept by beekeepers, not wild bumblebees or solitary bees.",
      "At summer peak strength, not the smaller overwintering cluster."
    ],
    reference_anchors: [
      { label: "managed honeybee colonies in the UK", value: 250000 },
      { label: "average bees per colony at summer peak", value: 50000 }
    ],
    framework: [
      { label: "Managed honeybee colonies in the UK", op: "x", model_value: 250000, unit: "colonies", plausible_range: [200000, 300000] },
      { label: "Average bees per colony at summer peak", op: "x", model_value: 50000, unit: "bees/colony", plausible_range: [30000, 60000] },
      { label: "Fraction of colonies at full summer strength (rest are smaller nucleus colonies)", op: "x", model_value: 0.92, unit: "fraction", plausible_range: [0.7, 1] }
    ],
    framework_notes: [
      "There are estimated to be around 250,000 managed honeybee colonies across the UK.",
      "A healthy colony can swell to around 50,000 bees at the height of summer.",
      "Not every colony is at full strength — some are smaller starter or nucleus colonies."
    ],
    narrative: [
      "The UK has around 250,000 managed honeybee colonies.",
      "A colony can hold up to 50,000 bees at summer peak.",
      "And about 92% of colonies are at that full strength.",
      "250,000 × 50,000 × 0.92 comes out around 11.5 billion.",
      "That's in line with estimates from the National Bee Unit and the British Beekeepers Association."
    ],
    estimate_range: [3000000000, 25000000000],
    actual_answer: 11500000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "British Beekeepers Association / National Bee Unit colony estimates.",
    sanity_check: "11.5 billion bees is well over a thousand for every person in the country, all of them busier than you."
  },
  {
    id: "q0049",
    category: "entertainment",
    difficulty: "hard",
    question: "How many books do UK adults read in total per year?",
    clarifications: [
      "Books actually read cover to cover or substantially, not just bought.",
      "Print, ebook and audiobook combined."
    ],
    reference_anchors: [
      { label: "UK adults", value: 53000000 },
      { label: "fraction who read books regularly", value: 0.5 }
    ],
    framework: [
      { label: "UK adult population", op: "x", model_value: 53000000, unit: "people", plausible_range: [50000000, 55000000] },
      { label: "Fraction who read books regularly", op: "x", model_value: 0.5, unit: "fraction", plausible_range: [0.35, 0.65] },
      { label: "Average books read per year among regular readers", op: "x", model_value: 20, unit: "books/reader/year", plausible_range: [10, 30] }
    ],
    framework_notes: [
      "There are around 53 million UK adults.",
      "Reading surveys suggest around half read books with any regularity.",
      "Regular readers get through a good few books a year, skewed heavily by a smaller group of very keen readers."
    ],
    narrative: [
      "There are about 53 million UK adults.",
      "Around half of them read books regularly.",
      "And regular readers get through about 20 books a year on average.",
      "53,000,000 × 0.5 × 20 comes out around 530 million.",
      "That lines up with reading-habit surveys from bodies like Nielsen BookScan and YouGov, which consistently put the national average around 10 books a year per adult."
    ],
    estimate_range: [200000000, 1200000000],
    actual_answer: 530000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "YouGov / Nielsen BookScan reading habit surveys.",
    sanity_check: "530 million books a year is nearly ten for every adult in the country — though a smaller group of book-a-week readers is doing most of the heavy lifting."
  },
  {
    id: "q0050",
    category: "product",
    difficulty: "medium",
    question: "How many daily standups are held across a large tech company on a given weekday?",
    clarifications: [
      "A company the size of a major tech firm, tens of thousands of engineering and product staff.",
      "Teams that actually practise daily standups, not every meeting."
    ],
    reference_anchors: [
      { label: "engineering and product staff at a large tech company", value: 40000 },
      { label: "average team size for a standup", value: 7 }
    ],
    framework: [
      { label: "Engineering and product staff at the company", op: "x", model_value: 40000, unit: "people", plausible_range: [30000, 50000] },
      { label: "Average team size for a standup", op: "/", model_value: 7, unit: "people/team", plausible_range: [5, 10] },
      { label: "Fraction of teams that actually hold daily standups", op: "x", model_value: 0.7, unit: "fraction", plausible_range: [0.5, 0.9] }
    ],
    framework_notes: [
      "A major tech company might employ around 40,000 people in engineering and product roles.",
      "Agile teams typically run 5 to 10 people, giving a rough team count once divided.",
      "Not every team follows a strict daily-standup ritual — some use async check-ins instead."
    ],
    narrative: [
      "A large tech company might have around 40,000 engineering and product staff.",
      "Split into teams of about 7, that's roughly 5,700 teams.",
      "And about 70% of those teams actually run a daily standup.",
      "40,000 ÷ 7 × 0.7 comes out around 4,000.",
      "Nobody publishes this officially, but that's a believable number of 'so, what did you do yesterday' rituals happening across one company on a single morning."
    ],
    estimate_range: [1500, 10000],
    actual_answer: 4000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Reasoned from typical large-tech-company headcount and agile team-size norms.",
    sanity_check: "4,000 standups a day is 4,000 slightly awkward silences waiting for someone to volunteer an update first."
  },
  {
    id: "q0051",
    category: "history-scale",
    difficulty: "hard",
    question: "How many books are held in the British Library?",
    clarifications: [
      "Books specifically, not manuscripts, maps, newspapers or sound recordings.",
      "The Library's total holdings, not just what's on public display."
    ],
    reference_anchors: [
      { label: "total items in the British Library collection", value: 170000000 },
      { label: "fraction of items that are books", value: 0.08 }
    ],
    framework: [
      { label: "Total items in the British Library collection", op: "x", model_value: 170000000, unit: "items", plausible_range: [160000000, 180000000] },
      { label: "Fraction of items that are books, rather than manuscripts, maps, stamps, sound recordings etc.", op: "x", model_value: 0.08, unit: "fraction", plausible_range: [0.05, 0.12] }
    ],
    framework_notes: [
      "The British Library holds well over 170 million items in total, spanning centuries of formats.",
      "Books make up a relatively modest slice of that once you count everything else the Library preserves."
    ],
    narrative: [
      "The British Library holds over 170 million items in total.",
      "Books make up around 8% of that vast collection.",
      "170,000,000 × 0.08 comes out around 14 million.",
      "That matches the Library's own stated figure of roughly 14 million books, out of everything from Magna Carta copies to postage stamps."
    ],
    estimate_range: [8000000, 25000000],
    actual_answer: 14000000,
    answer_type: "measured",
    as_of: 2023,
    source: "British Library official collection statistics.",
    sanity_check: "14 million books is enough that reading one a day would take you nearly 38,000 years to finish the lot."
  },
  {
    id: "q0052",
    category: "sport",
    difficulty: "medium",
    question: "How many people finish a parkrun across the UK on a given Saturday?",
    clarifications: [
      "All UK parkrun events combined, not just one location.",
      "Finishers, not volunteers or spectators."
    ],
    reference_anchors: [
      { label: "parkrun events running in the UK each Saturday", value: 780 },
      { label: "average finishers per event", value: 180 }
    ],
    framework: [
      { label: "parkrun events running in the UK each Saturday", op: "x", model_value: 780, unit: "events", plausible_range: [700, 850] },
      { label: "Average finishers per event", op: "x", model_value: 180, unit: "finishers/event", plausible_range: [100, 250] },
      { label: "Fraction of scheduled events that actually go ahead (weather, holidays)", op: "x", model_value: 0.97, unit: "fraction", plausible_range: [0.9, 1] }
    ],
    framework_notes: [
      "There are around 780 weekly parkrun events across the UK.",
      "A typical event draws well over a hundred finishers, from Olympic hopefuls to first-timers.",
      "A small fraction of events get cancelled for weather or public holidays."
    ],
    narrative: [
      "There are around 780 parkrun events across the UK each Saturday.",
      "Each draws about 180 finishers on average.",
      "And around 97% of scheduled events actually go ahead.",
      "780 × 180 × 0.97 comes out around 136,000.",
      "That matches parkrun's own published weekly results closely — a genuinely enormous, quietly organised national ritual."
    ],
    estimate_range: [60000, 250000],
    actual_answer: 140000,
    answer_type: "measured",
    as_of: 2023,
    source: "parkrun UK official weekly results summaries.",
    sanity_check: "140,000 finishers a Saturday is a bigger crowd than most Premier League grounds hold — all before most people have had breakfast."
  },
  {
    id: "q0053",
    category: "everyday-life",
    difficulty: "medium",
    question: "How many times do people in the UK check their phones per day, in total?",
    clarifications: [
      "Every glance or unlock counts, not just meaningful use.",
      "UK adult smartphone users, summed across the whole population."
    ],
    reference_anchors: [
      { label: "UK adult population", value: 53000000 },
      { label: "average phone checks per person per day", value: 75 }
    ],
    framework: [
      { label: "UK adult population", op: "x", model_value: 53000000, unit: "people", plausible_range: [50000000, 55000000] },
      { label: "Fraction who own and use a smartphone", op: "x", model_value: 0.94, unit: "fraction", plausible_range: [0.85, 0.98] },
      { label: "Average phone checks per person per day", op: "x", model_value: 75, unit: "checks/person", plausible_range: [50, 120] }
    ],
    framework_notes: [
      "There are around 53 million UK adults.",
      "The great majority now own and use a smartphone.",
      "Mobile behaviour surveys put average daily checks — unlocks, notification glances, habitual pickups — somewhere around 75 for a typical adult."
    ],
    narrative: [
      "There are about 53 million UK adults.",
      "Around 94% own and use a smartphone.",
      "Each checks it roughly 75 times a day, from notifications to habit.",
      "53,000,000 × 0.94 × 75 comes out around 3.75 billion.",
      "That's in the range mobile-behaviour studies from Ofcom and Deloitte have reported — somewhere between once every ten minutes and once every four, all day."
    ],
    estimate_range: [1500000000, 8000000000],
    actual_answer: 3750000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Ofcom / Deloitte mobile consumer behaviour surveys.",
    sanity_check: "3.75 billion checks a day is a nation collectively looking at its phone roughly once every 23 seconds, per person, all day."
  },
  {
    id: "q0054",
    category: "operations",
    difficulty: "medium",
    question: "How many pizzas are ordered in the UK on a Friday night?",
    clarifications: [
      "Delivery and collection orders combined, chains and independents.",
      "A typical Friday evening, not a special promotion night."
    ],
    reference_anchors: [
      { label: "UK households", value: 28000000 },
      { label: "fraction ordering pizza on a given Friday", value: 0.04 }
    ],
    framework: [
      { label: "UK households", op: "x", model_value: 28000000, unit: "households", plausible_range: [27000000, 29000000] },
      { label: "Fraction ordering pizza that Friday night", op: "x", model_value: 0.04, unit: "fraction", plausible_range: [0.02, 0.07] },
      { label: "Average pizzas per order", op: "x", model_value: 1.8, unit: "pizzas/order", plausible_range: [1, 3] }
    ],
    framework_notes: [
      "There are around 28 million households in the UK.",
      "Friday is the traditional 'can't be bothered to cook' night, so a meaningful slice of households order in.",
      "An order for a household is rarely just one pizza."
    ],
    narrative: [
      "There are about 28 million UK households.",
      "Around 4% order pizza on a given Friday night.",
      "And an order comes to about 1.8 pizzas on average.",
      "28,000,000 × 0.04 × 1.8 comes out around 2 million.",
      "That fits with how the major chains describe Friday as easily their busiest night of the week."
    ],
    estimate_range: [800000, 5000000],
    actual_answer: 2000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from UK takeaway ordering patterns and chain reporting on peak trading days.",
    sanity_check: "2 million pizzas on one Friday night is enough dough, laid edge to edge, to cover several football pitches."
  },
  {
    id: "q0055",
    category: "physical-estimation",
    difficulty: "medium",
    question: "How many golf balls would it take to fill Wembley's pitch to knee height?",
    clarifications: [
      "The standard pitch area, filled to about half a metre deep.",
      "Golf balls packed as they naturally would be, not perfectly stacked."
    ],
    reference_anchors: [
      { label: "pitch area", value: 7140 },
      { label: "volume of one golf ball", value: 40.7 }
    ],
    framework: [
      { label: "Pitch area", op: "x", model_value: 7140, unit: "m2", plausible_range: [6500, 7800] },
      { label: "Fill height", op: "x", model_value: 0.5, unit: "metres", plausible_range: [0.3, 1] },
      { label: "Convert cubic metres to cubic centimetres", op: "x", model_value: 1000000, unit: "cm3/m3", plausible_range: [1000000, 1000000] },
      { label: "Sphere packing efficiency", op: "x", model_value: 0.64, unit: "fraction", plausible_range: [0.6, 0.68] },
      { label: "Volume of one golf ball", op: "/", model_value: 40.7, unit: "cm3/ball", plausible_range: [35, 45] }
    ],
    framework_notes: [
      "A standard football pitch covers about 7,140 square metres.",
      "Filling it to knee height means a depth of around half a metre.",
      "Converting to cubic centimetres matches the scale of a golf ball.",
      "Randomly packed spheres only fill about 64% of the available space, leaving gaps between balls.",
      "A standard golf ball has a volume of about 40.7 cubic centimetres."
    ],
    narrative: [
      "The pitch covers about 7,140 square metres.",
      "Filled to knee height, that's 3,570 cubic metres, or 3.57 billion cubic centimetres.",
      "Randomly packed spheres only fill about 64% of that space.",
      "Divide the packed volume by 40.7 cubic centimetres per ball.",
      "7,140 × 0.5 × 1,000,000 × 0.64 ÷ 40.7 comes out to about 56 million.",
      "Nobody's actually tried it, but that's the Fermi answer for burying Wembley's turf under a golf-ball tide."
    ],
    estimate_range: [15000000, 150000000],
    actual_answer: 56000000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Fermi estimate; standard golf ball volume ~40.7 cm3, random sphere packing efficiency ~64%.",
    sanity_check: "56 million golf balls is roughly one for every adult in the country, packed onto one football pitch."
  },
  {
    id: "q0056",
    category: "transport",
    difficulty: "hard",
    question: "How many potholes are there on UK roads at any given time?",
    clarifications: [
      "All classes of road — motorway, A-road, local street.",
      "A typical time of year, not the worst point after a hard winter."
    ],
    reference_anchors: [
      { label: "UK road network length", value: 400000 },
      { label: "average potholes per kilometre", value: 2.5 }
    ],
    framework: [
      { label: "UK road network length", op: "x", model_value: 400000, unit: "km", plausible_range: [380000, 420000] },
      { label: "Average potholes per kilometre at a given time", op: "x", model_value: 2.5, unit: "potholes/km", plausible_range: [1, 5] },
      { label: "Seasonal adjustment for a typical, non-post-winter-peak period", op: "x", model_value: 1.0, unit: "fraction", plausible_range: [0.7, 1.3] }
    ],
    framework_notes: [
      "The UK's total road network runs to around 400,000 kilometres.",
      "Local roads especially accumulate a steady rate of surface defects between resurfacing cycles.",
      "This roughly reflects an average time of year, since freeze-thaw winters make things noticeably worse."
    ],
    narrative: [
      "The UK's road network stretches around 400,000 kilometres.",
      "At any given time there are roughly 2.5 potholes for every kilometre of that.",
      "400,000 × 2.5 comes out around 1 million.",
      "That matches the RAC and AA's own estimates of the pothole backlog on Britain's roads — a number that only ever seems to grow."
    ],
    estimate_range: [300000, 3000000],
    actual_answer: 1000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "RAC / AA pothole tracking estimates and local authority road condition reports.",
    sanity_check: "1 million potholes is roughly one for every 40 cars in the country — no wonder every commute has a detour story."
  },
  {
    id: "q0057",
    category: "geography",
    difficulty: "medium",
    question: "How many traditional red telephone boxes remain in the UK?",
    clarifications: [
      "The classic red K2/K6 kiosks, not modern glass phone booths.",
      "Boxes still standing, whether working as phones or repurposed."
    ],
    reference_anchors: [
      { label: "red telephone boxes at 1980s peak", value: 92000 },
      { label: "fraction remaining today", value: 0.09 }
    ],
    framework: [
      { label: "Red telephone boxes at their 1980s peak", op: "x", model_value: 92000, unit: "boxes", plausible_range: [85000, 95000] },
      { label: "Fraction remaining today", op: "x", model_value: 0.09, unit: "fraction", plausible_range: [0.05, 0.15] },
      { label: "Further boxes removed since the estimate was made", op: "x", model_value: 0.97, unit: "fraction", plausible_range: [0.9, 1] }
    ],
    framework_notes: [
      "At their peak in the 1980s, around 92,000 red phone boxes stood across the UK.",
      "Mobile phones triggered a mass removal programme from the 1990s onward, leaving only a small fraction standing today.",
      "BT's removal programme has continued in the years since, trimming the total a little further."
    ],
    narrative: [
      "At their peak, there were around 92,000 red phone boxes across the UK.",
      "Only about 9% remain today.",
      "And a further removal programme has trimmed that down slightly since — call it 97% of that figure.",
      "92,000 × 0.09 × 0.97 comes out around 8,000.",
      "That matches BT's own figures closely — around 8,000 remain, many now adopted by local communities as defibrillator points or tiny libraries rather than phones."
    ],
    estimate_range: [3000, 18000],
    actual_answer: 8000,
    answer_type: "measured",
    as_of: 2022,
    source: "BT / Ofcom records on remaining red telephone kiosks and the Adopt a Kiosk scheme.",
    sanity_check: "8,000 boxes left out of 92,000 means over 90% have vanished — most of what remains now holds a defibrillator, not a phone."
  },
  {
    id: "q0059",
    category: "animals",
    difficulty: "medium",
    question: "How many urban foxes live in London?",
    clarifications: [
      "Foxes living within Greater London's built-up area, not the wider countryside.",
      "A typical population estimate, not the post-cub-season peak."
    ],
    reference_anchors: [
      { label: "Greater London land area", value: 1570 },
      { label: "average urban fox density", value: 6.4 }
    ],
    framework: [
      { label: "Greater London land area", op: "x", model_value: 1570, unit: "km2", plausible_range: [1500, 1650] },
      { label: "Average urban fox density", op: "x", model_value: 6.4, unit: "foxes/km2", plausible_range: [4, 10] }
    ],
    framework_notes: [
      "Greater London covers around 1,570 square kilometres.",
      "Urban fox studies put density at several foxes per square kilometre across the city's parks, gardens and railway embankments."
    ],
    narrative: [
      "Greater London covers about 1,570 square kilometres.",
      "Urban fox density runs around 6.4 per square kilometre.",
      "1,570 × 6.4 comes out around 10,000.",
      "That matches the commonly cited estimate from urban mammal researchers — London has been home to around 10,000 foxes for decades."
    ],
    estimate_range: [4000, 25000],
    actual_answer: 10000,
    answer_type: "consensus-estimate",
    as_of: 2022,
    source: "Urban fox population research, e.g. University of Bristol mammal studies.",
    sanity_check: "10,000 foxes in London is about one for every 900 residents — most of them seen only once, at 2am, tipping over a bin."
  },
  {
    id: "q0060",
    category: "product",
    difficulty: "hard",
    question: "How many Jira or Linear tickets get closed per day at a large tech company?",
    clarifications: [
      "One large tech organisation, tens of thousands of engineers.",
      "Tickets marked done or closed, not just created."
    ],
    reference_anchors: [
      { label: "engineering staff at the company", value: 40000 },
      { label: "fraction of teams using strict ticket tracking", value: 0.8 }
    ],
    framework: [
      { label: "Engineering staff at the company", op: "x", model_value: 40000, unit: "engineers", plausible_range: [30000, 50000] },
      { label: "Fraction of teams practising disciplined ticket tracking", op: "x", model_value: 0.8, unit: "fraction", plausible_range: [0.6, 0.95] },
      { label: "Average tickets closed per engineer per working day", op: "x", model_value: 0.7, unit: "tickets/engineer", plausible_range: [0.3, 1.2] }
    ],
    framework_notes: [
      "A large tech company might employ around 40,000 engineers.",
      "Most, but not all, teams rigorously track work as tickets rather than working informally.",
      "An individual engineer typically closes less than one ticket a day on average, once you weight in bigger multi-day tasks."
    ],
    narrative: [
      "A large tech company might have around 40,000 engineers.",
      "About 80% of teams track their work through tickets rigorously.",
      "And each of those engineers closes roughly 0.7 tickets on an average working day.",
      "40,000 × 0.8 × 0.7 comes out around 22,000.",
      "There's no public tally for this, but it's a believable churn rate for a company running that many engineers through an agile process."
    ],
    estimate_range: [8000, 60000],
    answer_type: "consensus-estimate",
    actual_answer: 22000,
    as_of: 2024,
    source: "Reasoned from large-tech-company engineering headcount and typical agile ticket throughput.",
    sanity_check: "22,000 tickets closed a day is a lot of tiny 'done' clicks — and roughly as many opened again as bugs the next morning."
  },
  {
    id: "q0061",
    category: "entertainment",
    difficulty: "medium",
    question: "How many vinyl records are sold in the UK per year?",
    clarifications: [
      "New vinyl sales, not second-hand record shop trading.",
      "A recent year during vinyl's ongoing revival, not its 1980s peak."
    ],
    reference_anchors: [
      { label: "UK vinyl buyers", value: 2000000 },
      { label: "average records bought per buyer per year", value: 3 }
    ],
    framework: [
      { label: "UK music buyers who purchase vinyl at least occasionally", op: "x", model_value: 2000000, unit: "buyers", plausible_range: [1500000, 2500000] },
      { label: "Average vinyl records bought per buyer per year", op: "x", model_value: 3, unit: "records/buyer", plausible_range: [2, 5] },
      { label: "Extra one-off purchases around Record Store Day and Christmas", op: "+", model_value: 200000, unit: "records", plausible_range: [0, 500000] }
    ],
    framework_notes: [
      "A dedicated niche of UK music buyers, a couple of million strong, still buy vinyl.",
      "Regular vinyl buyers tend to pick up a handful of records across a year.",
      "Record Store Day and Christmas gifting bring in extra one-off buyers who don't purchase vinyl the rest of the year."
    ],
    narrative: [
      "Around 2 million UK music fans buy vinyl at least occasionally.",
      "Each picks up about 3 records a year on average.",
      "That's 6 million, plus another couple of hundred thousand from Record Store Day and Christmas gift-buyers.",
      "2,000,000 × 3, plus 200,000, comes out around 6.2 million.",
      "The BPI's official chart data put UK vinyl sales at close to 5.9 million in a recent year — the highest in over three decades."
    ],
    estimate_range: [2000000, 12000000],
    actual_answer: 5900000,
    answer_type: "measured",
    as_of: 2022,
    source: "BPI / Official Charts Company annual UK vinyl sales figures.",
    sanity_check: "5.9 million records a year is enough vinyl to give every household in Cardiff a stack of forty."
  },
  {
    id: "q0063",
    category: "money",
    difficulty: "medium",
    question: "How many ATM cash withdrawals happen in the UK per day?",
    clarifications: [
      "All UK cash machines, bank-owned and independent.",
      "A normal weekday."
    ],
    reference_anchors: [
      { label: "UK adults", value: 53000000 },
      { label: "fraction withdrawing cash from an ATM in a given week", value: 0.35 }
    ],
    framework: [
      { label: "UK adult population", op: "x", model_value: 53000000, unit: "people", plausible_range: [50000000, 55000000] },
      { label: "Fraction who withdraw cash from an ATM in a given week", op: "x", model_value: 0.35, unit: "fraction", plausible_range: [0.2, 0.5] },
      { label: "Average withdrawals per person per week, among those who do", op: "x", model_value: 1.65, unit: "withdrawals/person", plausible_range: [1, 2.5] },
      { label: "Convert weekly total to a daily figure", op: "/", model_value: 7, unit: "days/week", plausible_range: [7, 7] }
    ],
    framework_notes: [
      "There are around 53 million UK adults.",
      "Cash use has declined, but a third or so of adults still withdraw from an ATM in a given week.",
      "Those who do tend to withdraw a little more than once a week.",
      "Dividing by seven gives the average daily rate."
    ],
    narrative: [
      "There are about 53 million UK adults.",
      "Around 35% withdraw cash from an ATM in a given week.",
      "And those who do withdraw about 1.65 times on average.",
      "53,000,000 × 0.35 × 1.65 gives around 30.6 million withdrawals a week.",
      "Divide by 7 and that's around 4.4 million a day.",
      "That matches LINK network data closely — cash use is well down on a decade ago, but far from gone."
    ],
    estimate_range: [1500000, 10000000],
    actual_answer: 4400000,
    answer_type: "measured",
    as_of: 2022,
    source: "LINK network UK ATM transaction statistics.",
    sanity_check: "4.4 million withdrawals a day is roughly one for every 12th adult in the country, every single day."
  },
  {
    id: "q0064",
    category: "product",
    difficulty: "medium",
    question: "How many user interviews does a product team run in a year?",
    clarifications: [
      "A mid-size SaaS company's product and research staff combined.",
      "One-on-one or small-group qualitative interviews, not surveys."
    ],
    reference_anchors: [
      { label: "product managers and researchers at a mid-size SaaS company", value: 15 },
      { label: "average interviews conducted per researcher per month", value: 6 }
    ],
    framework: [
      { label: "Product managers and researchers at the company", op: "x", model_value: 15, unit: "people", plausible_range: [8, 25] },
      { label: "Average interviews conducted per researcher per month", op: "x", model_value: 6, unit: "interviews/person/month", plausible_range: [3, 10] },
      { label: "Months in a year", op: "x", model_value: 12, unit: "months", plausible_range: [12, 12] }
    ],
    framework_notes: [
      "A mid-size SaaS company might have around 15 people doing product management or research work.",
      "A reasonably disciplined team runs a handful of user interviews a month per person.",
      "Multiplying by months in the year gives the annual total."
    ],
    narrative: [
      "A mid-size SaaS company might have around 15 product and research staff.",
      "Each runs about 6 user interviews a month.",
      "That's 90 a month across the team.",
      "15 × 6 × 12 comes out around 1,080.",
      "Call it a thousand conversations a year — a solid rhythm of 'just one more customer call' for the whole team."
    ],
    estimate_range: [300, 3000],
    actual_answer: 1000,
    answer_type: "consensus-estimate",
    as_of: 2024,
    source: "Reasoned from typical product-team staffing and research cadence at mid-size SaaS companies.",
    sanity_check: "1,000 interviews a year is roughly four a working day, spread across the whole team, forever asking 'can you walk me through that?'"
  },
  {
    id: "q0065",
    category: "health",
    difficulty: "medium",
    question: "How many NHS hospital beds are occupied on an average night in England?",
    clarifications: [
      "General and acute beds, not day-case or outpatient capacity.",
      "England specifically, where the clearest published figures exist."
    ],
    reference_anchors: [
      { label: "NHS England general and acute beds available", value: 100000 },
      { label: "typical bed occupancy rate", value: 0.92 }
    ],
    framework: [
      { label: "NHS England general and acute beds available", op: "x", model_value: 100000, unit: "beds", plausible_range: [90000, 110000] },
      { label: "Typical occupancy rate", op: "x", model_value: 0.92, unit: "fraction", plausible_range: [0.85, 0.98] }
    ],
    framework_notes: [
      "NHS England runs around 100,000 general and acute hospital beds.",
      "Occupancy runs consistently high — well above the 85% level considered safe for smooth patient flow."
    ],
    narrative: [
      "NHS England has around 100,000 general and acute beds.",
      "Occupancy typically runs at about 92%.",
      "100,000 × 0.92 comes out around 92,000.",
      "That matches NHS England's own winter and year-round occupancy statistics — hospitals rarely have much spare capacity to work with."
    ],
    estimate_range: [50000, 150000],
    actual_answer: 92000,
    answer_type: "measured",
    as_of: 2023,
    source: "NHS England bed availability and occupancy statistics.",
    sanity_check: "92,000 occupied beds on one night is nearly the population of Cambridge, all in a hospital gown at once."
  },
  {
    id: "q0066",
    category: "product",
    difficulty: "medium",
    question: "How many 1-star App Store reviews are submitted worldwide per day?",
    clarifications: [
      "Across all apps on major app stores, not one specific app.",
      "Reviews submitted, not just read."
    ],
    reference_anchors: [
      { label: "smartphone users worldwide", value: 6500000000 },
      { label: "fraction leaving any app review on a given day", value: 0.0008 }
    ],
    framework: [
      { label: "Smartphone users worldwide", op: "x", model_value: 6500000000, unit: "users", plausible_range: [6000000000, 7000000000] },
      { label: "Fraction who leave any app review on a given day", op: "x", model_value: 0.0008, unit: "fraction", plausible_range: [0.0003, 0.0015] },
      { label: "Fraction of those reviews that are 1-star", op: "x", model_value: 0.15, unit: "fraction", plausible_range: [0.08, 0.25] }
    ],
    framework_notes: [
      "There are around 6.5 billion smartphone users worldwide.",
      "Leaving a review at all is rare — most people only bother when something's gone particularly well or badly.",
      "1-star reviews make up a consistent minority slice of all reviews, skewed by people venting about bugs or bad updates."
    ],
    narrative: [
      "There are about 6.5 billion smartphone users worldwide.",
      "A tiny fraction, about 0.08%, leave any app review on a given day.",
      "And around 15% of those reviews are the full 1-star rant.",
      "6,500,000,000 × 0.0008 × 0.15 comes out around 780,000.",
      "Call it 750,000 a day — a reliable daily tide of 'crashed on launch, 1 star' from around the world."
    ],
    estimate_range: [200000, 2500000],
    actual_answer: 750000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "Reasoned from global smartphone user counts and typical app-store review submission rates.",
    sanity_check: "750,000 one-star reviews a day is enough fury to sink a thousand product roadmaps before lunch."
  },
  {
    id: "q0067",
    category: "money",
    difficulty: "medium",
    question: "How much do UK households spend on Christmas presents per year?",
    clarifications: [
      "Gifts only, not food, decorations or travel.",
      "Total spend summed across all UK households."
    ],
    reference_anchors: [
      { label: "UK households", value: 28000000 },
      { label: "average spend on presents per household", value: 580 }
    ],
    framework: [
      { label: "UK households", op: "x", model_value: 28000000, unit: "households", plausible_range: [27000000, 29000000] },
      { label: "Average spend on presents per household", op: "x", model_value: 580, unit: "GBP/household", plausible_range: [300, 900] }
    ],
    framework_notes: [
      "There are around 28 million households in the UK.",
      "Retail surveys consistently put average household gift spend somewhere in the high hundreds of pounds each Christmas."
    ],
    narrative: [
      "There are about 28 million UK households.",
      "Each spends around £580 on presents on average.",
      "28,000,000 × 580 comes out around £16 billion.",
      "That's broadly in line with retail-sector estimates of the UK's annual Christmas gift spend — before you even count the food."
    ],
    estimate_range: [6000000000, 30000000000],
    actual_answer: 16000000000,
    answer_type: "consensus-estimate",
    as_of: 2023,
    source: "UK retail sector surveys on average household Christmas gift spending.",
    sanity_check: "£16 billion on presents is enough to buy every person in the UK a fairly decent jumper, whether they wanted one or not."
  }
];

// The shared daily rotation: the same question for everyone on a given calendar
// day, keyed to the date (see storage.dayNumber / storage.EPOCH). Cycles when it
// runs out (roughly every 68 days at this size). Position 22 is pinned to
// Greggs so today (2026-09-21, day 22) keeps showing what it already showed
// earlier today — everything else is shuffled with no two same-category
// questions back to back.
window.NAPKIN.dailyOrder = [
  "q0005", // coastline of mainland Britain
  "q0003", // cups of tea in the UK per day
  "q0001", // Premier League matchday attendance
  "q0004", // pints pulled on a Friday night
  "q0007", // TfL journeys per weekday
  "q0002", // matchday pies across English football
  "q0016", // sheep in the UK
  "q0008", // blades of grass on a football pitch
  "q0034", // raindrops falling on London during a downpour
  "q0052", // parkrun finishers across the UK each Saturday
  "q0018", // contactless payments made in the UK per day
  "q0026", // pigeons in London
  "q0063", // ATM cash withdrawals in the UK per day
  "q0011", // cups of coffee drunk in the UK per day
  "q0057", // red telephone boxes remaining in the UK
  "q0030", // babies born in the UK per day
  "q0019", // app downloads worldwide per day
  "q0042", // hours of live football on UK TV per week
  "q0025", // private gardens in the UK
  "q0067", // money UK households spend on Christmas presents per year
  "q0013", // grains of sand on Blackpool beach
  "q0037", // pet dogs owned in the UK
  "q0006", // Greggs sausage rolls per day
  "q0049", // books read by UK adults per year
  "q0022", // Amazon parcels delivered in the UK per day
  "q0060", // Jira/Linear tickets closed per day at a large tech company
  "q0043", // laundry loads washed in UK homes per day
  "q0031", // golf balls lost in the UK per year
  "q0015", // trees in the UK
  "q0038", // Strictly Come Dancing Saturday night viewers
  "q0050", // daily standups held across a large tech company
  "q0028", // National Lottery spend in the UK per week
  "q0010", // London Marathon finishers per year
  "q0044", // coffees sold by a big UK coffee chain per day
  "q0059", // urban foxes living in London
  "q0021", // umbrellas bought in the UK per year
  "q0055", // golf balls to fill Wembley's pitch to knee height
  "q0017", // Eurovision final viewers worldwide
  "q0033", // pints of milk delivered by milkmen each morning
  "q0047", // islands around the UK
  "q0020", // tennis balls used at Wimbledon per year
  "q0039", // cash in circulation in the UK
  "q0012", // fish and chip portions sold in the UK per day
  "q0051", // books held in the British Library
  "q0035", // flights departing Heathrow per day
  "q0064", // user interviews a product team runs in a year
  "q0027", // cinema tickets sold in the UK per year
  "q0046", // bikes stolen in the UK per year
  "q0032", // WhatsApp messages sent by UK users per day
  "q0024", // vehicles crossing a point on the M25 per day
  "q0040", // food delivery orders in the UK per day
  "q0053", // times Brits check their phones per day
  "q0066", // 1-star App Store reviews received globally per day
  "q0014", // licensed black cabs operating in London
  "q0048", // honeybees in the UK
  "q0056", // potholes on UK roads
  "q0023", // bricks in a typical UK terraced house
  "q0061", // vinyl records sold in the UK per year
  "q0045", // leaves on a mature oak tree
  "q0065", // NHS hospital beds occupied on an average night
  "q0036", // wind turbines in the UK
  "q0054"  // pizzas ordered in the UK on a Friday night
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
