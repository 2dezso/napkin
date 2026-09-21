/* Shared daily results: everyone's band for today's question, written once
 * per submission and read back as a distribution so the reveal can show
 * "how did I do vs. today's players". No auth, no per-user identity — each
 * entry is just { band, ts }. Degrades silently (Promise rejects) if
 * js/firebase-config.js still has its placeholder values, or the Firebase
 * SDK/network isn't available, so this is always optional to the rest of
 * the app. */
window.NAPKIN = window.NAPKIN || {};
window.NAPKIN.results = (function () {
  var BANDS_ORDER = ["miss", "close", "solid", "nailed"]; // worst -> best, for percentile ranking

  var db = null;
  function ensureDb() {
    if (db) return db;
    var cfg = window.NAPKIN.firebaseConfig;
    if (!cfg || !cfg.apiKey || cfg.apiKey.indexOf("PASTE_") === 0) return null;
    if (!window.firebase) return null;
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    db = firebase.firestore();
    return db;
  }

  function submit(date, band) {
    var d = ensureDb();
    if (!d) return Promise.reject(new Error("no backend configured"));
    return d.collection("dailyResults").doc(date).collection("entries").add({
      band: band,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function distribution(date) {
    var d = ensureDb();
    if (!d) return Promise.reject(new Error("no backend configured"));
    return d.collection("dailyResults").doc(date).collection("entries")
      .limit(3000)
      .get()
      .then(function (snap) {
        var counts = { nailed: 0, solid: 0, close: 0, miss: 0 };
        snap.forEach(function (doc) {
          var b = doc.data().band;
          if (counts.hasOwnProperty(b)) counts[b]++;
        });
        var total = counts.nailed + counts.solid + counts.close + counts.miss;
        return { counts: counts, total: total };
      });
  }

  // Midpoint-rank percentile: bands strictly worse than yours count fully,
  // your own band counts as half — splits ties fairly instead of everyone
  // in the same band claiming to have "beaten" each other.
  function percentile(counts, total, band) {
    if (!total) return null;
    var worseCount = 0;
    for (var i = 0; i < BANDS_ORDER.length; i++) {
      if (BANDS_ORDER[i] === band) break;
      worseCount += counts[BANDS_ORDER[i]] || 0;
    }
    var same = counts[band] || 0;
    return Math.round(((worseCount + same / 2) / total) * 100);
  }

  return { submit: submit, distribution: distribution, percentile: percentile, BANDS_ORDER: BANDS_ORDER };
})();
