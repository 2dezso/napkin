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

  // Separate flag (not part of the results backup) for the one-time "watch
  // the pad read your numbers" demo shown before anyone's first attempt.
  var DEMO_KEY = "napkin.padDemoSeen";
  function hasSeenPadDemo() {
    try { return localStorage.getItem(DEMO_KEY) === "1"; } catch (e) { return true; }
  }
  function markPadDemoSeen() {
    try { localStorage.setItem(DEMO_KEY, "1"); } catch (e) { /* full / blocked */ }
  }

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

  function blank() { return { version: 1, results: [], challengeBest: 0 }; }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* full / blocked */ }
    pushToCloud(state);
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.results)) return blank();
      return { version: 1, results: o.results, challengeBest: o.challengeBest || 0 };
    } catch (e) {
      return blank();
    }
  }

  /* ---- cloud backup (Firebase Anonymous Auth + Firestore) ----------------
   * Invisible, no-signup safety net: every visitor gets a stable anonymous
   * uid (persisted by the Firebase SDK itself, so it survives reloads on
   * the same browser) and their history mirrors to users/{uid}. This is
   * NOT cross-device sync on its own — that needs the uid to be linked to
   * a real credential later — it just means a cleared cache or a browser
   * reinstall on the SAME device doesn't wipe a streak, since Firebase's
   * auth persistence and localStorage are separate stores. Every step is
   * best-effort: if Firebase isn't configured, offline, or the write is
   * rejected, this silently no-ops and the app carries on local-only. */
  var cloudUid = null;

  function pushToCloud(state) {
    if (!cloudUid || !window.firebase) return;
    firebase.firestore().collection("users").doc(cloudUid).set({
      results: state.results,
      challengeBest: state.challengeBest || 0,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function () { /* offline / rules not set up yet */ });
  }

  // Union of local + remote results by date (local wins on same-date
  // conflicts, since it's the freshest thing this device just did), plus
  // the higher of either challengeBest.
  function mergeState(local, remote) {
    var byDate = {};
    (remote.results || []).forEach(function (r) { byDate[r.date] = r; });
    (local.results || []).forEach(function (r) { byDate[r.date] = r; });
    var results = Object.keys(byDate).sort().map(function (d) { return byDate[d]; });
    return { version: 1, results: results, challengeBest: Math.max(local.challengeBest || 0, remote.challengeBest || 0) };
  }

  // Call once at boot. onMerged fires at most once, only if the cloud copy
  // actually had something new to add to this device's local copy — the
  // caller can use it to re-render whatever's currently on screen.
  function initCloudSync(onMerged) {
    var cfg = window.NAPKIN.firebaseConfig;
    if (!window.firebase || !cfg || !cfg.apiKey || cfg.apiKey.indexOf("PASTE_") === 0) return;
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) return;
      cloudUid = user.uid;
      var before = load();
      firebase.firestore().collection("users").doc(cloudUid).get().then(function (doc) {
        var remote = doc.exists ? doc.data() : blank();
        var merged = mergeState(before, remote);
        var changed = merged.results.length !== before.results.length || merged.challengeBest !== before.challengeBest;
        save(merged);
        if (changed && onMerged) onMerged();
      }).catch(function () { /* offline / rules not set up yet — stay local-only */ });
    });
    firebase.auth().signInAnonymously().catch(function () { /* auth not enabled yet */ });
  }

  // Challenge mode's high score: longest streak survived in a single run.
  function challengeBest() { return load().challengeBest || 0; }
  function recordChallengeBest(n) {
    var s = load();
    if (n > (s.challengeBest || 0)) { s.challengeBest = n; save(s); }
    return s.challengeBest;
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

  // The longest run of consecutive calendar days ever played, as opposed to
  // streak() which only cares about the current unbroken run.
  function longestStreak() {
    var s = load();
    var dates = Object.keys(s.results.reduce(function (acc, r) { acc[r.date] = 1; return acc; }, {})).sort();
    if (!dates.length) return 0;
    var best = 1, run = 1;
    for (var i = 1; i < dates.length; i++) {
      run = (dates[i] === isoOffset(1, dates[i - 1])) ? run + 1 : 1;
      best = Math.max(best, run);
    }
    return best;
  }

  function stats() {
    var s = load();
    var ratios = s.results.map(function (r) { return r.ratio; }).filter(function (x) { return isFinite(x); });
    var avg = ratios.length ? ratios.reduce(function (a, b) { return a + b; }, 0) / ratios.length : null;
    var best = ratios.length ? Math.min.apply(null, ratios) : null;
    var bandCounts = {};
    s.results.forEach(function (r) { if (r.band) bandCounts[r.band] = (bandCounts[r.band] || 0) + 1; });
    return {
      played: s.results.length,
      streak: streak(),
      longestStreak: longestStreak(),
      avgRatio: avg,
      bestRatio: best,
      bandCounts: bandCounts,
      caughtUp: false,
      series: s.results.map(function (r) { return { n: r.napkinNumber, ratio: r.ratio, band: r.band }; })
    };
  }

  function exportJSON() { return JSON.stringify(load(), null, 2); }

  function importJSON(str) {
    var o = JSON.parse(str);
    if (!o || !Array.isArray(o.results)) throw new Error("That doesn't look like a Napkin backup.");
    save({ version: 1, results: o.results, challengeBest: o.challengeBest || 0 });
  }

  function reset() { save(blank()); }

  return {
    EPOCH: EPOCH,
    todayISO: todayISO, isoOffset: isoOffset, dayNumber: dayNumber,
    load: load,
    currentQuestion: currentQuestion,
    resultForDate: resultForDate, playedToday: playedToday,
    recordResult: recordResult,
    streak: streak, longestStreak: longestStreak, stats: stats,
    challengeBest: challengeBest, recordChallengeBest: recordChallengeBest,
    hasSeenPadDemo: hasSeenPadDemo, markPadDemoSeen: markPadDemoSeen,
    exportJSON: exportJSON, importJSON: importJSON, reset: reset,
    initCloudSync: initCloudSync
  };
})();
