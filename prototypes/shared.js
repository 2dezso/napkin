/* Shared bits for the three Napkin prototypes: the sample question, a small
   number-reader, scoring, and a few sounds. Prototype code only. */
window.P = (function () {
  var Q = {
    n: 32,
    question: "How many sausage rolls does Greggs sell in the UK per day?",
    actual: 380000,
    source: "Greggs public statements (about 2.5 million sausage rolls a week).",
    steps: [
      "Greggs has about 2,400 shops across the UK.",
      "A shop might see 600 customers through the door on an average day.",
      "Around 55% of them buy something hot and savoury.",
      "Of those, call it roughly half pick a sausage roll.",
      "2,400 × 600 × 0.55 × 0.48 comes out around 380,000."
    ],
    model: [
      { t: "Greggs shops in the UK", v: 2400, op: "x", show: "2,400" },
      { t: "customers through each shop, each day", v: 600, op: "x", show: "600" },
      { t: "buy something hot and savoury", v: 0.55, op: "x", show: "55%" },
      { t: "of those pick a sausage roll", v: 0.48, op: "x", show: "about half" }
    ],
    check: "Greggs says it sells about 2.5 million a week. That's roughly 357,000 a day. We're in the right place.",
    demo: "Greggs shops 2,400\n600 customers a shop a day\n55% buy something hot\na third of them want a sausage roll"
  };

  var MULT = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, bn: 1e9, billion: 1e9 };

  function humanize(n) {
    if (!isFinite(n)) return "—";
    var a = Math.abs(n);
    if (a >= 1e9) return trim(n / 1e9) + "bn";
    if (a >= 1e6) return trim(n / 1e6) + "M";
    if (a >= 1e4) return trim(n / 1e3) + "k";
    if (a >= 100) return Math.round(n).toLocaleString("en-GB");
    return String(+n.toPrecision(3));
  }
  function trim(x) { return (Math.abs(x) >= 100 ? Math.round(x) : Math.round(x * 10) / 10).toString(); }
  function full(n) { return Math.round(n).toLocaleString("en-GB"); }

  // Finds every number in the pad text. "per", "over", "/" or "÷" before a
  // number divides by it; "1 in 4", "25%", "5k" and "2.5 million" all read.
  function parse(text) {
    var found = [], taken = [];
    function free(s, e) { return !taken.some(function (t) { return s < t[1] && e > t[0]; }); }
    function add(s, e, value, raw) {
      if (!free(s, e)) return;
      taken.push([s, e]);
      var before = text.slice(Math.max(0, s - 8), s);
      var op = /(per|over|÷|\/)\s*$/i.test(before) ? "/" : "x";
      found.push({ start: s, end: e, value: value, op: op, raw: raw });
    }
    var m, re = /\b(\d+(?:\.\d+)?)\s+in\s+(\d+(?:\.\d+)?)\b/gi;
    while ((m = re.exec(text))) add(m.index, m.index + m[0].length, +m[1] / +m[2], m[0]);
    re = /(\d[\d,]*(?:\.\d+)?|\.\d+)\s*(%|k\b|m\b|bn\b|thousand|million|billion)?/gi;
    while ((m = re.exec(text))) {
      var v = parseFloat(m[1].replace(/,/g, ""));
      if (!isFinite(v)) continue;
      var u = (m[2] || "").toLowerCase();
      if (u === "%") v /= 100; else if (MULT[u]) v *= MULT[u];
      add(m.index, m.index + m[0].replace(/\s+$/, "").length, v, m[0].trim());
    }
    var words = /\b(half|a third|a quarter|double|twice)\b/gi;
    var W = { half: 0.5, "a third": 1 / 3, "a quarter": 0.25, double: 2, twice: 2 };
    while ((m = words.exec(text))) add(m.index, m.index + m[0].length, W[m[0].toLowerCase()], m[0]);
    found.sort(function (a, b) { return a.start - b.start; });
    return found;
  }

  function total(factors) {
    var acc = null;
    factors.forEach(function (f) {
      if (acc == null) acc = f.op === "/" ? 1 / f.value : f.value;
      else acc = f.op === "/" ? acc / f.value : acc * f.value;
    });
    return acc;
  }

  var TIERS = [
    { key: "bangon", min: 95, name: "Bang on", quip: "Bang on. Either you work at Greggs or you've a suspiciously good memory." },
    { key: "soclose", min: 86, name: "So close", quip: "So close you could smell the pastry." },
    { key: "goodshout", min: 77, name: "Good shout", quip: "Good shout. A sound effort from the back of the queue." },
    { key: "ballpark", min: 63, name: "Ballpark-ish", quip: "Ballpark-ish. The right postcode, wrong house." },
    { key: "notclose", min: 23, name: "Not even close", quip: "Not even close. Bold, though." },
    { key: "binit", min: 0, name: "Bin it", quip: "Bin it. We'll pretend that never happened." }
  ];
  function score(guess, actual) {
    var r = Math.max(guess, actual) / Math.max(1, Math.min(guess, actual));
    var pts = Math.max(0, Math.round(100 * (1 - Math.log10(r) / 1.7)));
    var tier = TIERS.filter(function (t) { return pts >= t.min; })[0];
    return { points: pts, tier: tier, ratio: r, dir: guess >= actual ? "over" : "under" };
  }

  var COMPARE = [
    [68e6, "everyone in the UK"], [9e6, "London"], [1.4e6, "Birmingham"], [5.5e5, "Leeds"],
    [2.4e5, "Cardiff"], [9e4, "a full Wembley"], [9e3, "a Premier League ground"], [3e2, "a busy pub"]
  ];
  function compare(n) {
    if (!(n > 0)) return "";
    for (var i = 0; i < COMPARE.length; i++) {
      if (n >= COMPARE[i][0] * 0.6) {
        var x = n / COMPARE[i][0];
        return (x < 1.4 ? "about the size of " : "roughly " + (Math.round(x * 10) / 10) + "× ") + COMPARE[i][1];
      }
    }
    return "barely a crowd";
  }

  var ctx;
  function tone(freq, dur, type, peak, when) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(peak || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* audio is optional */ }
  }
  var sfx = {
    tick: function () { tone(900, 0.05, "square", 0.03); },
    pop: function () { tone(520, 0.08, "sine", 0.05); tone(780, 0.08, "sine", 0.04, 0.05); },
    thud: function () { tone(90, 0.18, "sine", 0.16); },
    ding: function () { tone(1320, 0.25, "sine", 0.06); tone(1760, 0.3, "sine", 0.04, 0.08); }
  };

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var qs = new URLSearchParams(location.search);
  function reduced() { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  // Position on a log ruler from 1 to 1bn, 0..100.
  function logPos(n) { return Math.max(0, Math.min(100, (Math.log10(Math.max(1, n)) / 9) * 100)); }

  return { Q: Q, humanize: humanize, full: full, parse: parse, total: total, score: score, compare: compare, sfx: sfx, esc: esc, qs: qs, reduced: reduced, logPos: logPos };
})();
