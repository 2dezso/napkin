/* Scoring + shared number helpers. See plan.md section 4. */
window.NAPKIN = window.NAPKIN || {};

/* ---- number helpers (shared with app.js) ---------------------------------- */
window.NAPKIN.util = (function () {
  // "8.3M", "8,300,000", "1.2e6", "285k", "$1b" -> Number (NaN if unparseable)
  function parseLoose(raw) {
    if (typeof raw === "number") return raw;
    if (raw == null) return NaN;
    var s = String(raw).trim().toLowerCase()
      .replace(/,/g, "").replace(/\s+/g, "").replace(/\$/g, "").replace(/x$/, "");
    if (s === "") return NaN;
    var m = s.match(/^(-?[0-9]*\.?[0-9]+)(e-?[0-9]+)?([kmbt])?$/);
    if (!m) { var f = parseFloat(s); return isNaN(f) ? NaN : f; }
    var n = parseFloat(m[1] + (m[2] || ""));
    var mult = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[m[3]] || 1;
    return n * mult;
  }

  function humanize(n) {
    if (n == null || !isFinite(n)) return "—";
    var abs = Math.abs(n), sign = n < 0 ? "-" : "";
    function trim(x, suffix, big) { return sign + (abs >= big ? Math.round(x) : x.toFixed(1).replace(/\.0$/, "")) + suffix; }
    if (abs >= 1e12) return trim(abs / 1e12, "T", 1e13);
    if (abs >= 1e9) return trim(abs / 1e9, "B", 1e10);
    if (abs >= 1e6) return trim(abs / 1e6, "M", 1e7);
    if (abs >= 1e4) return trim(abs / 1e3, "K", 0);
    if (abs >= 1) return sign + Math.round(abs).toLocaleString("en-US");
    if (abs === 0) return "0";
    return sign + String(+abs.toPrecision(3));
  }

  function withCommas(n) {
    return isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—";
  }

  function roundFactor(x) {
    if (!isFinite(x)) return "∞";
    return x >= 10 ? String(Math.round(x)) : (Math.round(x * 10) / 10).toString();
  }

  // Pull a quantity out of a free-typed napkin line like "8.3M people",
  // "1 in 4 delivered", "25% of them", "~55 windows/floor", "5 billion online".
  // Returns { value, label, annotation }. annotation = true when there's no number.
  var MULT = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12 };
  function parseQuantity(str) {
    var s = String(str == null ? "" : str).trim();
    if (s === "") return { value: NaN, label: "", annotation: true };

    var m, value = NaN, span = null;

    m = s.match(/(\d+(?:\.\d+)?)\s+in\s+(\d+(?:\.\d+)?)/i);            // "1 in 4"
    if (m) { value = parseFloat(m[1]) / parseFloat(m[2]); span = [m.index, m.index + m[0].length]; }

    if (span == null) {                                               // "1/4"
      m = s.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      if (m) { value = parseFloat(m[1]) / parseFloat(m[2]); span = [m.index, m.index + m[0].length]; }
    }
    if (span == null) {                                               // "25%"
      m = s.match(/(\d+(?:\.\d+)?)\s*%/);
      if (m) { value = parseFloat(m[1]) / 100; span = [m.index, m.index + m[0].length]; }
    }
    if (span == null) {                                               // plain number
      m = s.match(/(\d[\d,]*(?:\.\d+)?)(e-?\d+)?\s*(k|m|b|t|thousand|million|billion|trillion)?\b/i);
      if (m) {
        var n = parseFloat(m[1].replace(/,/g, "") + (m[2] || ""));
        if (isFinite(n)) {
          n *= MULT[(m[3] || "").toLowerCase()] || 1;
          value = n;
          span = [m.index, m.index + m[0].length];
        }
      }
    }

    if (span == null) return { value: NaN, label: s, annotation: true };

    return { value: value, label: cleanLabel(s.slice(0, span[0]) + " " + s.slice(span[1])), annotation: false };
  }

  function cleanLabel(s) {
    return String(s || "")
      .replace(/[~=*×÷,:]+/g, " ")
      .replace(/\b(per|over|divided by|of|a|an|the)\b/gi, " ")
      .replace(/\s*\/\s*/g, "/")
      .replace(/^[\s/\-–—]+|[\s/\-–—]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
  }

  // Scan a whole free-typed blob and pull out every number as a factor.
  // Returns [{ value, op:'x'|'/', label, raw, start, end, line, sig }]. This is
  // the engine for "C" mode: multiply every number found; a number divides when
  // "per" / "over" / a lone "/" or "÷" sits just before it on its line.
  // 1)"N in M"                         2)"A/B"                  3)"P%"                4) plain number
  var TOKEN_SRC =
    "(\\d+(?:\\.\\d+)?)\\s+in\\s+(\\d+(?:\\.\\d+)?)" +
    "|(\\d+(?:\\.\\d+)?)\\s*/\\s*(\\d+(?:\\.\\d+)?)" +
    "|(\\d+(?:\\.\\d+)?)\\s*%" +
    "|(\\d[\\d,]*(?:\\.\\d+)?)(e-?\\d+)?\\s*(k|m|b|t|thousand|million|billion|trillion)?(?![.\\d])";

  function valueFromMatch(m) {
    if (m[1] != null) return parseFloat(m[1]) / parseFloat(m[2]);
    if (m[3] != null) return parseFloat(m[3]) / parseFloat(m[4]);
    if (m[5] != null) return parseFloat(m[5]) / 100;
    if (m[6] != null) {
      var n = parseFloat(m[6].replace(/,/g, "") + (m[7] || ""));
      return n * (MULT[(m[8] || "").toLowerCase()] || 1);
    }
    return NaN;
  }

  function scanFactors(text) {
    var out = [], seen = {}, base = 0;
    var lines = String(text == null ? "" : text).split("\n");

    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      var re = new RegExp(TOKEN_SRC, "gi");
      var toks = [], m;
      while ((m = re.exec(line)) !== null) {
        if (m[0] === "") { re.lastIndex++; continue; }
        var v = valueFromMatch(m);
        if (isFinite(v)) toks.push({ v: v, raw: m[0], start: m.index, end: m.index + m[0].length });
      }
      for (var ti = 0; ti < toks.length; ti++) {
        var t = toks[ti];
        var gap = line.slice(ti === 0 ? 0 : toks[ti - 1].end, t.start);
        var after = line.slice(t.end, ti + 1 < toks.length ? toks[ti + 1].start : line.length);
        var divides =
          /(^|\s)(per|over)(\s|$)/i.test(gap) ||
          /(÷|(^|\s)divided by\s*)$/i.test(gap) ||
          /^\s*[/÷]\s*$/.test(gap);
        var c = seen[t.v] || 0; seen[t.v] = c + 1;
        out.push({
          value: t.v,
          op: divides ? "/" : "x",
          label: cleanLabel(after) || cleanLabel(gap) || "",
          raw: t.raw,
          start: base + t.start,
          end: base + t.end,
          line: li,
          sig: t.v + "#" + c
        });
      }
      base += line.length + 1;
    }
    return out;
  }

  return {
    parseLoose: parseLoose, parseQuantity: parseQuantity, scanFactors: scanFactors,
    humanize: humanize, withCommas: withCommas, roundFactor: roundFactor
  };
})();

/* ---- scoring ------------------------------------------------------------- */
window.NAPKIN.scoring = (function () {
  var util = window.NAPKIN.util;

  var BANDS = [
    {
      key: "nailed", max: 1.5, label: "Bang on", emoji: "🎯",
      blurb: "Dead on. That's interview gold.",
      quips: [
        "Frame that one.",
        "Are you secretly a quantity surveyor?",
        "Genuinely — that's a gold-star answer.",
        "Suspiciously good. Did you peek?",
        "The interviewer just offered you the job."
      ]
    },
    {
      key: "solid", max: 3, label: "Solid ballpark", emoji: "👍",
      blurb: "Right order of magnitude, comfortably.",
      quips: [
        "You'd survive the interview.",
        "Tidy. A confident nod from across the table.",
        "Not perfect, but nobody's quibbling.",
        "Right ballpark — pint's on them.",
        "That'll do nicely."
      ]
    },
    {
      key: "close", max: 10, label: "Right idea, wrong number", emoji: "🤏",
      blurb: "The reasoning was in the zone, the number wandered off.",
      quips: [
        "Right postcode, wrong street.",
        "In the right stadium, wrong stand.",
        "The interviewer's eyebrow is now raised.",
        "You'd talk your way out of that one. Just.",
        "Close-ish. We'll allow it, grudgingly."
      ]
    },
    {
      key: "miss", max: Infinity, label: "Off by a mile", emoji: "🙈",
      blurb: "Order-of-magnitude miss — check which number went walkabout.",
      quips: [
        "{n}× out. Were you guessing in a different currency?",
        "Bold. Wrong, but bold.",
        "{n}× off — that's Sunday league vs Wembley.",
        "Did you panic? It rather looks like you panicked.",
        "That is… a number you have chosen.",
        "Off by {n}×. The napkin has questions for you."
      ]
    }
  ];

  function ratio(guess, actual) {
    if (!(guess > 0) || !(actual > 0)) return Infinity;
    return Math.max(guess, actual) / Math.min(guess, actual);
  }

  function score(guess, q) {
    var r = ratio(guess, q.actual_answer);
    var inRange = !!q.estimate_range && guess >= q.estimate_range[0] && guess <= q.estimate_range[1];
    var band = inRange ? BANDS[0] : BANDS.filter(function (b) { return r <= b.max; })[0];
    return { ratio: r, inRange: inRange, band: band };
  }

  // A random roast/credit line for the result, with {n} -> the miss factor.
  function quip(band, r) {
    var list = band.quips || [""];
    var pick = list[Math.floor(Math.random() * list.length)];
    return pick.replace(/\{n\}/g, util.roundFactor(r));
  }

  // ---- fuzzy row alignment for the "your napkin vs the model's" comparison ----
  var STOP = { the: 1, of: 1, a: 1, an: 1, and: 1, per: 1, to: 1, in: 1, on: 1, for: 1, by: 1, with: 1, that: 1, is: 1, are: 1, how: 1, many: 1, number: 1 };
  function toks(s) {
    var raw = String(s || "").toLowerCase().match(/[a-z]+/g) || [];
    return raw
      .map(function (w) { return w.replace(/s$/, ""); })
      .filter(function (w) { return w.length > 2 && !STOP[w]; });
  }
  function overlap(a, b) {
    var A = {}, c = 0;
    toks(a).forEach(function (w) { A[w] = 1; });
    toks(b).forEach(function (w) { if (A[w]) c++; });
    return c;
  }

  // userRows: [{ label, value (raw string), op }]  modelRows: framework[]
  function compareRows(userRows, modelRows) {
    var users = (userRows || [])
      .map(function (r) {
        var pq = util.parseQuantity(r.value);
        return { label: r.label || pq.label || "", value: pq.value, op: r.op };
      })
      .filter(function (r) { return isFinite(r.value); });
    var used = {};

    var pairs = modelRows.map(function (m) {
      var bestIdx = -1, best = 0;
      users.forEach(function (u, i) {
        if (used[i]) return;
        var s = overlap(m.label, u.label);
        if (s > best) { best = s; bestIdx = i; }
      });
      var user = null, verdict = "skipped", factor = null;
      if (bestIdx >= 0 && best > 0) {
        used[bestIdx] = 1;
        user = users[bestIdx];
        var lo = m.plausible_range ? m.plausible_range[0] : m.model_value;
        var hi = m.plausible_range ? m.plausible_range[1] : m.model_value;
        if (user.value >= lo && user.value <= hi) verdict = "tight";
        else if (user.value < lo) { verdict = "low"; factor = m.model_value / user.value; }
        else { verdict = "high"; factor = user.value / m.model_value; }
      }
      return { model: m, user: user, verdict: verdict, factor: factor };
    });

    var extras = users.filter(function (u, i) { return !used[i]; });
    return { pairs: pairs, extras: extras };
  }

  return { ratio: ratio, score: score, quip: quip, compareRows: compareRows, BANDS: BANDS };
})();
