/* Anonymous product analytics (TelemetryDeck).
 *
 * A handful of events so the numbers in the PRD can actually be measured:
 * activation, retention, share rate, paywall and purchase conversion.
 * Never sent: names, pad text, problem text, scores' working. Only event names
 * and a few coarse labels. The user id is a random id made on this device,
 * hashed before it leaves, and not linked to anything else.
 *
 * Does nothing until APP_ID is filled in (TelemetryDeck dashboard > the app's
 * App ID), and nothing at all if the browser asks not to be tracked.
 */
(function () {
  "use strict";
  var NAPKIN = (window.NAPKIN = window.NAPKIN || {});

  var APP_ID = "";   // TelemetryDeck App ID, paste here before launch
  var ENDPOINT = "https://nom.telemetrydeck.com/v2/";
  var ID_KEY = "napkin.aid";

  var session = String(Date.now()) + "-" + Math.floor(Math.random() * 1e9);
  var userHash = null;

  function enabled() {
    if (!APP_ID) return false;
    try { if (navigator.doNotTrack === "1") return false; } catch (e) { /* ignore */ }
    return true;
  }

  function localId() {
    try {
      var id = localStorage.getItem(ID_KEY);
      if (!id) {
        id = String(Math.random()).slice(2) + String(Date.now());
        localStorage.setItem(ID_KEY, id);
      }
      return id;
    } catch (e) { return "anon"; }
  }

  function sha256(text) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve(text);
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }

  function user() {
    if (!userHash) userHash = sha256(localId());
    return userHash;
  }

  // track("paywall_view", { where: "after_daily" }): payload values are strings.
  function track(name, props) {
    if (!enabled()) return;
    var payload = {};
    Object.keys(props || {}).forEach(function (k) { payload[k] = String(props[k]); });
    payload.platform = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? "ios-app" : "web";
    user().then(function (u) {
      var body = JSON.stringify([{
        appID: APP_ID, clientUser: u, sessionID: session, type: name, payload: payload,
        isTestMode: /^(localhost|127\.|file)/.test(location.hostname || "file") ? "true" : "false"
      }]);
      return fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
    }).catch(function () { /* analytics must never get in the way */ });
  }

  NAPKIN.track = track;
})();
