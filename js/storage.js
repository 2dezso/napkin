/* Local persistence: rotation pointer, per-day results, streak, stats, export/import.
 * See plan.md section 7. Everything lives in one localStorage key.
 *
 * State shape:
 *   { version: 1,
 *     pointer: <int>,            // index of the next unplayed question (mod bank length)
 *     results: [
 *       { date: "YYYY-MM-DD", napkinNumber: <int>, questionId, guess,
 *         rows: [{ op, label, value }], assisted: <bool>,
 *         ratio: <number>, band: "<key>", inRange: <bool>, mode: "napkin"|"eyeball" }
 *     ] }
 */
window.NAPKIN = window.NAPKIN || {};
window.NAPKIN.storage = (function () {
  var KEY = "napkin.v1";

  function fmt(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function todayISO() { return fmt(new Date()); }
  function isoOffset(delta, from) {
    var d = from ? new Date(from + "T00:00:00") : new Date();
    d.setDate(d.getDate() + delta);
    return fmt(d);
  }

  function blank() { return { version: 1, pointer: 0, results: [] }; }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.results)) return blank();
      o.version = 1;
      o.pointer = o.pointer || 0;
      return o;
    } catch (e) {
      return blank();
    }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full / blocked */ }
  }

  function bankLength() {
    return (window.NAPKIN.questions || []).length || 1;
  }

  function currentQuestion(bank) {
    var s = load();
    return bank[s.pointer % bank.length];
  }

  function resultForDate(date) {
    return load().results.filter(function (r) { return r.date === date; })[0] || null;
  }
  function playedToday() { return !!resultForDate(todayISO()); }

  // rec: { questionId, guess, rows, assisted, ratio, band, inRange, mode }
  function recordResult(rec) {
    var s = load();
    var full = {
      date: todayISO(),
      napkinNumber: s.results.length + 1
    };
    for (var k in rec) if (rec.hasOwnProperty(k)) full[k] = rec[k];
    s.results.push(full);
    s.pointer = s.results.length; // next unplayed
    save(s);
    return full;
  }

  function streak() {
    var s = load();
    var dates = Object.keys(s.results.reduce(function (acc, r) { acc[r.date] = 1; return acc; }, {}))
      .sort().reverse();
    if (!dates.length) return 0;
    var today = todayISO(), yest = isoOffset(-1);
    if (dates[0] !== today && dates[0] !== yest) return 0;
    var n = 0, cursor = dates[0];
    for (var i = 0; i < dates.length; i++) {
      if (dates[i] === cursor) { n++; cursor = isoOffset(-1, cursor); }
      else break;
    }
    return n;
  }

  function stats() {
    var s = load();
    var ratios = s.results.map(function (r) { return r.ratio; }).filter(function (x) { return isFinite(x); });
    var avg = ratios.length ? ratios.reduce(function (a, b) { return a + b; }, 0) / ratios.length : null;
    var best = ratios.length ? Math.min.apply(null, ratios) : null;
    return {
      played: s.results.length,
      streak: streak(),
      avgRatio: avg,
      bestRatio: best,
      caughtUp: s.pointer >= bankLength(),
      series: s.results.map(function (r) { return { n: r.napkinNumber, ratio: r.ratio, band: r.band }; })
    };
  }

  function exportJSON() { return JSON.stringify(load(), null, 2); }

  function importJSON(str) {
    var o = JSON.parse(str);
    if (!o || !Array.isArray(o.results)) throw new Error("That doesn't look like a Napkin backup.");
    save({
      version: 1,
      pointer: typeof o.pointer === "number" ? o.pointer : o.results.length,
      results: o.results
    });
  }

  function reset() { save(blank()); }

  return {
    todayISO: todayISO, isoOffset: isoOffset,
    load: load,
    currentQuestion: currentQuestion,
    resultForDate: resultForDate, playedToday: playedToday,
    recordResult: recordResult,
    streak: streak, stats: stats,
    exportJSON: exportJSON, importJSON: importJSON, reset: reset
  };
})();
