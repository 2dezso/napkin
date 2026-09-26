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
    // "1.2" must not show as "1": a pill that says ×1 when you wrote 1.2
    // looks like the parser misread you.
    if (abs >= 1 && abs < 100 && abs !== Math.round(abs)) return sign + String(+abs.toPrecision(3));
    if (abs >= 1) return sign + Math.round(abs).toLocaleString("en-US");
    if (abs === 0) return "0";
    return sign + String(+abs.toPrecision(3));
  }

  function withCommas(n) {
    return isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—";
  }

  function roundFactor(x) {
    if (!isFinite(x)) return "∞";
    return x >= 10 ? Math.round(x).toLocaleString("en-US") : (Math.round(x * 10) / 10).toString();
  }

  /* ---- the number reader ---------------------------------------------------
   * One tokenizer shared by the scribble pad (scanFactors) and anything that
   * reads a single typed quantity (parseQuantity). It walks each line left to
   * right and, at every word boundary, tries the richest reading first:
   *   "between 50 and 60", "50-60", "3-4 million", "5-10%"   -> range (geometric mean)
   *   "1 in 4", "1 in every 4", "3 out of 10", "one in four" -> ratio
   *   "two thirds", "a quarter", "half"                      -> fraction
   *   "1/4"                                                  -> fraction (no spaces)
   *   "20%", "20 per cent", "20 percent"                     -> percent
   *   "8bn", "1.2m", "30k", "3 million", "a dozen", "ten"    -> plain
   *   "10^6", "3e6", "twice", "double"                       -> plain
   * and deliberately does NOT read: "105m long" / "7140m2" as millions (metres),
   * "M25" / "COVID-19" (a number glued to a word), "5 t-shirts" as trillions,
   * or a year like "as of 2023" / "the 1990s". */
  var SMALL = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19
  };
  var TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var SCALE_WORD = { hundred: 1e2, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12, dozen: 12 };
  var SCALE_SUFFIX = { k: 1e3, m: 1e6, mn: 1e6, b: 1e9, bn: 1e9, t: 1e12, tn: 1e12 };
  var FRACTION_WORD = {
    half: 2, halves: 2, third: 3, thirds: 3, quarter: 4, quarters: 4,
    fifth: 5, fifths: 5, tenth: 10, tenths: 10
  };
  var UNICODE_FRACTION = { "½": 1 / 2, "¼": 1 / 4, "¾": 3 / 4, "⅓": 1 / 3, "⅔": 2 / 3, "⅕": 1 / 5, "⅛": 1 / 8 };
  var WORD_NUM_SRC = "(" + Object.keys(TENS).join("|") + ")(?:[\\s-](" +
    Object.keys(SMALL).slice(0, 9).join("|") + "))?\\b|(" + Object.keys(SMALL).join("|") + ")\\b";

  function isLetter(ch) { return !!ch && /[A-Za-z]/.test(ch); }
  function isDigit(ch) { return !!ch && ch >= "0" && ch <= "9"; }

  // A number, a number word, or "a dozen"/"a million", plus any scale after it.
  // Returns { value, end, scaled } or null. `allowOne` lets "one" count (it's
  // only meaningful inside "one in four" / "one third" — alone it's noise).
  function readNumber(s, i, allowOne) {
    var rest = s.slice(i), m, value, len, scaled = false, digits = false;

    if ((m = rest.match(/^(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?|\.\d+)(?:e([+-]?\d+)(?![A-Za-z]))?/i))) {
      value = parseFloat(m[1].replace(/,/g, "") + (m[2] != null ? "e" + m[2] : ""));
      len = m[0].length;
      digits = true;
      var pw = rest.slice(len).match(/^\s*(?:\^|\*\*)\s*(-?\d+(?:\.\d+)?)/);
      if (pw) { value = Math.pow(value, parseFloat(pw[1])); len += pw[0].length; }
    } else if ((m = rest.match(/^an?\s+(dozen|hundred|thousand|million|billion|trillion)\b/i))) {
      value = SCALE_WORD[m[1].toLowerCase()];
      len = m[0].length;
      scaled = true;
    } else if ((m = rest.match(new RegExp("^(?:" + WORD_NUM_SRC + ")", "i")))) {
      if (m[1]) value = TENS[m[1].toLowerCase()] + (m[2] ? SMALL[m[2].toLowerCase()] : 0);
      else value = SMALL[m[3].toLowerCase()];
      if (value === 1 && !allowOne) return null;
      len = m[0].length;
    } else if ((m = rest.match(/^dozen\b/i))) {
      value = 12; len = m[0].length; scaled = true;
    } else if ((m = rest.match(/^[½¼¾⅓⅔⅕⅛]/))) {
      value = UNICODE_FRACTION[m[0]]; len = 1;
    } else {
      return null;
    }

    // Trailing scale: "3 million", "2 hundred thousand", "3 dozen".
    for (var guard = 0; guard < 2; guard++) {
      var w = s.slice(i + len).match(/^\s*(hundred|thousand|million|billion|trillion|dozen)s?\b/i);
      if (!w) break;
      value *= SCALE_WORD[w[1].toLowerCase()];
      len += w[0].length;
      scaled = true;
    }
    // Glued suffix, digits only: "8bn", "1.2m", "30k". Never with a space
    // ("5 t-shirts"), never followed by another letter ("5km").
    // "bn" is unambiguous enough to allow a space before it ("1 bn").
    if (digits && !scaled) {
      var sfx = s.slice(i + len).match(/^(bn|mn|tn|k|m|b|t)(?![A-Za-z])/i) || s.slice(i + len).match(/^\s+(bn)\b/i);
      if (sfx) {
        var after = s.slice(i + len + sfx[0].length);
        var isMetres = sfx[1].toLowerCase() === "m" &&
          /^(?:[²³]|[23](?!\d)|\s*(?:long|wide|tall|high|deep|across|away|squared|in length|in width)\b)/i.test(after);
        if (isMetres) {
          len += sfx[0].length + (/^[²³23]/.test(after) ? 1 : 0);
        } else {
          value *= SCALE_SUFFIX[sfx[1].toLowerCase()];
          len += sfx[0].length;
          scaled = true;
        }
      }
    }
    return { value: value, end: i + len, scaled: scaled };
  }

  function readPercent(s, i) {
    var m = s.slice(i).match(/^\s*(?:%|per\s?cent\b|percent\b)/i);
    return m ? i + m[0].length : -1;
  }

  // Everything that can start at position i. Returns a token, a { skip } marker
  // (for years, which should be stepped over rather than re-read digit by
  // digit), or null.
  function readToken(s, i) {
    var rest = s.slice(i), m;

    // "between 50 and 60"
    if ((m = rest.match(/^between\s+/i))) {
      var b1 = readNumber(s, i + m[0].length, true);
      var and = b1 && s.slice(b1.end).match(/^\s+and\s+/i);
      var b2 = and && readNumber(s, b1.end + and[0].length, true);
      if (b2 && b2.value > b1.value) {
        var lo = b1.value, hi = b2.value, bEnd = b2.end;
        if (!b1.scaled && b2.scaled) lo *= scaleOf(b2, s);
        var bp = readPercent(s, bEnd);
        if (bp >= 0) { lo /= 100; hi /= 100; bEnd = bp; }
        return { value: Math.sqrt(lo * hi), end: bEnd, kind: "range" };
      }
    }

    var a = readNumber(s, i, true);

    if (!a) {
      // "half", "a third of them", "a quarter" at a line's end — but not
      // "a third party" or "a quarter pounder".
      if ((m = rest.match(/^(?:(an?|one)\s+)?(half|third|quarter|fifth|tenth)\b/i))) {
        var tail = s.slice(i + m[0].length);
        var isHalf = m[2].toLowerCase() === "half";
        if (isHalf || /^\s+of\b/i.test(tail) || (m[1] && !/^\s*[A-Za-z]/.test(tail))) {
          return { value: 1 / FRACTION_WORD[m[2].toLowerCase()], end: i + m[0].length, kind: "fraction" };
        }
      }
      if ((m = rest.match(/^a\s+couple\b/i))) return { value: 2, end: i + m[0].length, kind: "plain" };
      // "double the number" yes, "double-decker" no.
      if ((m = rest.match(/^(twice|double|doubled)\b(?!-)/i))) return { value: 2, end: i + m[0].length, kind: "plain" };
      if ((m = rest.match(/^(thrice|triple|tripled|treble)\b(?!-)/i))) return { value: 3, end: i + m[0].length, kind: "plain" };
      return null;
    }

    // A time of day ("9am", "5pm", "9:30") is never a factor.
    if (isDigit(rest.charAt(0)) && (m = s.slice(a.end).match(/^(?::\d{2})?\s?(?:am|pm)\b|^:\d{2}/i))) {
      return { skip: true, end: a.end + m[0].length };
    }

    // "1 in 4", "1 in every 4", "3 out of 10", "one in four"
    if ((m = s.slice(a.end).match(/^\s+(?:in|out\s+of)\s+(?:every\s+|each\s+)?/i))) {
      var d = readNumber(s, a.end + m[0].length, true);
      if (d && d.value > 0) return { value: a.value / d.value, end: d.end, kind: "ratio" };
    }
    // "two thirds", "3 quarters"
    if ((m = s.slice(a.end).match(/^[\s-]*(halves|half|thirds|third|quarters|quarter|fifths|fifth|tenths|tenth)\b/i))) {
      return { value: a.value / FRACTION_WORD[m[1].toLowerCase()], end: a.end + m[0].length, kind: "fraction" };
    }
    if (a.value === 1 && !/^\d/.test(rest)) return null; // a lone "one"
    // "1/4" — only when glued; "68 million / 2.4" stays two factors, divided.
    if ((m = s.slice(a.end).match(/^\/(?=[\d.])/))) {
      var f2 = readNumber(s, a.end + 1, false);
      if (f2 && f2.value > 0) return { value: a.value / f2.value, end: f2.end, kind: "fraction" };
    }
    // "50-60", "3-4 million", "5-10%", "2 to 3"
    if ((m = s.slice(a.end).match(/^\s*(?:-|–|—|to\b)\s*/i))) {
      var r2 = readNumber(s, a.end + m[0].length, false);
      if (r2 && isYear(a, s, i) && (isYear(r2, s, a.end + m[0].length) || /^\d{2}$/.test(s.slice(a.end + m[0].length, r2.end)))) {
        return { skip: true, end: r2.end }; // "2020-2023", "2023-24"
      }
      if (r2) {
        var lo2 = a.value, hi2 = r2.value, rEnd = r2.end;
        if (!a.scaled && r2.scaled) lo2 *= scaleOf(r2, s);
        var rp = readPercent(s, rEnd);
        if (rp >= 0) { lo2 /= 100; hi2 /= 100; rEnd = rp; }
        if (hi2 > lo2 && lo2 > 0) return { value: Math.sqrt(lo2 * hi2), end: rEnd, kind: "range" };
      }
    }
    var p = readPercent(s, a.end);
    if (p >= 0) return { value: a.value / 100, end: p, kind: "percent" };

    // A year: "as of 2023", "in 2019", "the 1990s" — step over it.
    if (isYear(a, s, i)) {
      var before = s.slice(0, i);
      if (/\b(in|since|by|from|until|till|of|circa|during|year|as of)\s*$/i.test(before) ||
          /^'?s\b/i.test(s.slice(a.end)) || /^\s*[-–]\s*\d{2,4}\b/.test(s.slice(a.end))) {
        return { skip: true, end: a.end };
      }
    }
    // Swallow a trailing "x" on "1.4x" / "3x" so it isn't left in the label.
    var tx = s.slice(a.end).match(/^[x×](?![A-Za-z\d])/i);
    return { value: a.value, end: tx ? a.end + tx[0].length : a.end, kind: "plain" };
  }

  // A bare four-digit number that could be a year. Only treated as one where
  // the surrounding words say so, since "2400 shops" is also four digits.
  function isYear(tok, s, start) {
    return !tok.scaled && /^\d{4}$/.test(s.slice(start, tok.end)) && tok.value >= 1800 && tok.value <= 2099;
  }

  // Given the upper end of "3-4 million", how much was the scale word worth?
  function scaleOf(tok, s) {
    var raw = s.slice(0, tok.end);
    var w = raw.match(/(hundred|thousand|million|billion|trillion|dozen)s?\s*$/i);
    if (w) return SCALE_WORD[w[1].toLowerCase()];
    var sfx = raw.match(/(bn|mn|tn|k|m|b|t)$/i);
    return sfx ? SCALE_SUFFIX[sfx[1].toLowerCase()] : 1;
  }

  // A token may only start at a boundary: not glued to the tail of a word
  // ("M25"), another number, or a decimal point. "x3" / "×3" are fine.
  function canStart(s, i) {
    var ch = s.charAt(i), prev = s.charAt(i - 1);
    if (isDigit(ch) || (ch === "." && isDigit(s.charAt(i + 1))) || UNICODE_FRACTION[ch]) {
      if (isDigit(prev) || prev === "." || prev === ",") return false;
      if (isLetter(prev)) return /[x×]/i.test(prev) && !isLetter(s.charAt(i - 2));
      if (prev === "-" && isLetter(s.charAt(i - 2))) return false; // "COVID-19"
      return true;
    }
    return isLetter(ch) && !isLetter(prev) && !isDigit(prev);
  }

  function tokenizeLine(line) {
    var toks = [], i = 0;
    while (i < line.length) {
      if (!canStart(line, i)) { i++; continue; }
      var t = readToken(line, i);
      if (!t) { i++; continue; }
      if (!t.skip && isFinite(t.value) && t.value > 0) {
        toks.push({ v: t.value, raw: line.slice(i, t.end).trim(), start: i, end: t.end, kind: t.kind });
      }
      i = Math.max(t.end, i + 1);
    }
    return toks;
  }

  // Pull the first quantity out of a single typed string, e.g. an edited
  // total ("400k", "2.5 million") or one napkin row.
  // Returns { value, label, annotation }; annotation = true when there's no number.
  function parseQuantity(str) {
    var s = String(str == null ? "" : str).trim();
    if (s === "") return { value: NaN, label: "", annotation: true };
    var t = tokenizeLine(s)[0];
    if (!t) return { value: NaN, label: s, annotation: true };
    return { value: t.v, label: cleanLabel(s.slice(0, t.start) + " " + s.slice(t.end)), annotation: false };
  }

  function cleanLabel(s) {
    return String(s || "")
      .replace(/[~=*×÷,:]+/g, " ")
      .replace(/\b(per|over|every|each|divided by|divide by|of|a|an|the)\b/gi, " ")
      .replace(/\s*\/\s*/g, "/")
      .replace(/^[\s/\-–—]+|[\s/\-–—]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
  }

  // Scan a whole free-typed blob and pull out every number as a factor.
  // Returns [{ value, op:'x'|'/'|'+', label, raw, kind, start, end, line, sig }].
  // Everything multiplies by default; a number divides when the word or symbol
  // right before it is "per" / "over" / "every" / "divided by" / "÷" / a lone
  // "/", and adds after "plus" / "add" / "+".
  function scanFactors(text) {
    var out = [], seen = {}, base = 0;
    var lines = String(text == null ? "" : text).split("\n");

    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      var toks = tokenizeLine(line);
      for (var ti = 0; ti < toks.length; ti++) {
        var t = toks[ti];
        var gap = line.slice(ti === 0 ? 0 : toks[ti - 1].end, t.start);
        var after = line.slice(t.end, ti + 1 < toks.length ? toks[ti + 1].start : line.length);
        var lead = gap.replace(/[£$€~≈(\s]+$/, "");
        var divides =
          /(^|\s)(per|over|every)$/i.test(lead) ||
          /(÷|\/|(^|\s)div(ide|ided)?\s*by)$/i.test(lead);
        var adds = /(^|\s)(plus|add)$/i.test(lead) || /\+$/.test(lead);
        var c = seen[t.v] || 0; seen[t.v] = c + 1;
        out.push({
          value: t.v,
          op: divides ? "/" : (adds ? "+" : "x"),
          label: cleanLabel(after) || cleanLabel(gap) || "",
          raw: t.raw,
          kind: t.kind,
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
      key: "nailed", max: 1.5, label: "Bang on", short: "Bang on", emoji: "🎯",
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
      key: "sharp", max: 2, label: "Good shout", short: "Good shout", emoji: "👌",
      blurb: "Very close — a confident, near-miss guess.",
      quips: [
        "Very nearly there.",
        "The interviewer's still nodding along.",
        "A whisker off, nothing more.",
        "Close enough that nobody's double-checking.",
        "You'd win the argument down the pub."
      ]
    },
    {
      key: "solid", max: 3, label: "Solid ballpark", short: "Solid", emoji: "👍",
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
      key: "close", max: 10, label: "Right idea, wrong number", short: "Close-ish", emoji: "🤏",
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
      key: "miss", max: Infinity, label: "Off by a mile", short: "Way off", emoji: "🙈",
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

  // 0-100. Exact is 100 and every doubling of the miss costs the same, so the
  // band edges land on 86 / 77 / 63 / 23 (1.5x / 2x / 3x / 10x off) and 20x
  // or worse is 0. Landing in a question's sensible range is always worth at
  // least a Bang on.
  function points(r, inRange) {
    var p = isFinite(r) && r >= 1 ? Math.round(100 * Math.max(0, 1 - Math.log(r) / Math.log(20))) : 0;
    return inRange ? Math.max(p, 86) : p;
  }

  function score(guess, q) {
    var r = ratio(guess, q.actual_answer);
    var inRange = !!q.estimate_range && guess >= q.estimate_range[0] && guess <= q.estimate_range[1];
    var band = inRange ? BANDS[0] : BANDS.filter(function (b) { return r <= b.max; })[0];
    return { ratio: r, inRange: inRange, band: band, points: points(r, inRange) };
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

  return { ratio: ratio, score: score, points: points, quip: quip, compareRows: compareRows, BANDS: BANDS };
})();
