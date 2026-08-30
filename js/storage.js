/* Local persistence: results log, streak, stats, export/import.
 * See plan.md section 7. Everything lives in one localStorage key.
 *
 * The daily question is a shared global rotation keyed to the calendar date
 * (dayNumber + dailyOrder) — same for everyone, like Wordle. No per-user
 * pointer: what's stored is just the log of what you've played.
 *
 * State shape:
 *   { version: 1,
 *     results: [
 *       { date: "YYYY-MM-DD", napkinNumber: <global day #>, questionId, guess,
 *         rows: [{ op, label, value }], pad: "<raw text>", assisted, adjusted,
 *         ratio, band: "<key>", inRange, mode: "napkin"|"eyeball" }
 *     ] }
 */
window.NAPKIN = window.NAPKIN || {};
window.NAPKIN.storage = (function () {
  // v3: switched from a per-install shuffled pointer to a shared date-keyed
  // rotation. Old results carried a per-user napkinNumber, so start clean.
  var KEY = "napkin.v3";

  // Launch day = day 0. dayNumber() counts calendar days from here.
  var EPOCH = "2026-08-30";

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

  function dayNumber() {
    var epoch = new Date(EPOCH + "T00:00:00");
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((today - epoch) / 86400000));
  }

  function blank() { return { version: 1, results: [] }; }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* full / blocked */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.results)) return blank();
      return { version: 1, results: o.results };
    } catch (e) {
      return blank();
    }
  }

  function bankLength() {
    return (window.NAPKIN.questions || []).length || 1;
  }

  // The shared question for today: same for everyone, keyed to the date.
  function currentQuestion(bank) {
    var order = (window.NAPKIN.dailyOrder && window.NAPKIN.dailyOrder.length)
      ? window.NAPKIN.dailyOrder
      : bank.map(function (q) { return q.id; });
    var id = order[dayNumber() % order.length];
    var hit = bank.filter(function (q) { return q.id === id; })[0];
    return hit || bank[0];
  }

  function resultForDate(date) {
    return load().results.filter(function (r) { return r.date === date; })[0] || null;
  }
  function playedToday() { return !!resultForDate(todayISO()); }

  function recordResult(rec) {
    var s = load();
    var full = { date: todayISO(), napkinNumber: dayNumber() + 1 };
    for (var k in rec) if (rec.hasOwnProperty(k)) full[k] = rec[k];
    s.results.push(full);
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
      caughtUp: false,
      series: s.results.map(function (r) { return { n: r.napkinNumber, ratio: r.ratio, band: r.band }; })
    };
  }

  function exportJSON() { return JSON.stringify(load(), null, 2); }

  function importJSON(str) {
    var o = JSON.parse(str);
    if (!o || !Array.isArray(o.results)) throw new Error("That doesn't look like a Napkin backup.");
    save({ version: 1, results: o.results });
  }

  function reset() { save(blank()); }

  return {
    EPOCH: EPOCH,
    todayISO: todayISO, isoOffset: isoOffset, dayNumber: dayNumber,
    load: load,
    currentQuestion: currentQuestion,
    resultForDate: resultForDate, playedToday: playedToday,
    recordResult: recordResult,
    streak: streak, stats: stats,
    exportJSON: exportJSON, importJSON: importJSON, reset: reset
  };
})();
