/* The native layer: what only exists inside the iOS app (Capacitor).
 *
 *   haptics      a tap on lock-in and on the verdict
 *   reminder     one local notification a day ("today's napkin is on the table")
 *   purchases    the one-off Practice unlock, through RevenueCat / StoreKit
 *
 * On the website none of the plugins exist, so every call here quietly does
 * nothing (or, for purchases, reports that it is not available) and the
 * existing web behaviour carries on untouched. Plain script, no bundler:
 * Capacitor injects window.Capacitor and window.Capacitor.Plugins.
 */
(function () {
  "use strict";
  var NAPKIN = (window.NAPKIN = window.NAPKIN || {});

  // Fill these in from App Store Connect / RevenueCat before shipping.
  var REVENUECAT_IOS_KEY = "appl_REPLACE_ME";
  var ENTITLEMENT = "practice_full";
  var REMINDER_ID = 1;
  var REMINDER_KEY = "napkin.reminder";   // "" (off) or the hour it fires, e.g. "8"
  var UNLOCK_KEY = "napkin.unlocked";

  function cap() { return window.Capacitor || null; }
  function isNative() {
    var c = cap();
    try { return !!(c && c.isNativePlatform && c.isNativePlatform()); } catch (e) { return false; }
  }
  function plugin(name) {
    var c = cap();
    return isNative() && c.Plugins && c.Plugins[name] ? c.Plugins[name] : null;
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* full / blocked */ } }

  /* ---------- haptics ---------- */
  // kind: "tap" | "thud" | "good" | "bad"
  function haptic(kind) {
    var h = plugin("Haptics");
    if (!h) return;
    try {
      if (kind === "good") h.notification({ type: "SUCCESS" });
      else if (kind === "bad") h.notification({ type: "WARNING" });
      else h.impact({ style: kind === "thud" ? "HEAVY" : "LIGHT" });
    } catch (e) { /* haptics are a nicety */ }
  }

  /* ---------- the daily reminder ---------- */
  function reminderHour() {
    var v = get(REMINDER_KEY);
    return v === null || v === "" ? null : +v;
  }

  // Resolves to the hour it is set for, or null if it is off or was refused.
  function enableReminder(hour) {
    var ln = plugin("LocalNotifications");
    if (!ln) return Promise.resolve(null);
    return ln.requestPermissions().then(function (p) {
      if (!p || p.display !== "granted") return null;
      return ln.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(function () {}).then(function () {
        return ln.schedule({
          notifications: [{
            id: REMINDER_ID,
            title: "Today's napkin is on the table",
            body: "One question, one sum. Keep the streak going.",
            // hour + minute with no date repeats every day
            schedule: { on: { hour: hour, minute: 0 }, allowWhileIdle: true }
          }]
        });
      }).then(function () { set(REMINDER_KEY, String(hour)); return hour; });
    }).catch(function () { return null; });
  }

  function disableReminder() {
    set(REMINDER_KEY, "");
    var ln = plugin("LocalNotifications");
    if (!ln) return Promise.resolve();
    return ln.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(function () {});
  }

  /* ---------- purchases: the Practice unlock ---------- */
  var configured = null;   // promise, so we only configure RevenueCat once

  function purchasesReady() {
    var p = plugin("Purchases");
    if (!p) return Promise.reject(new Error("not-native"));
    if (!configured) configured = p.configure({ apiKey: REVENUECAT_IOS_KEY });
    return configured.then(function () { return p; });
  }

  function hasEntitlement(info) {
    var a = info && info.customerInfo ? info.customerInfo : info;
    return !!(a && a.entitlements && a.entitlements.active && a.entitlements.active[ENTITLEMENT]);
  }

  // Unlocked on this device? Cached, so Practice never waits on the network.
  function isUnlocked() { return get(UNLOCK_KEY) === "1"; }
  function markUnlocked() { set(UNLOCK_KEY, "1"); }

  // Re-checks with Apple in the background (a refund or a new device).
  function refreshUnlock() {
    if (!plugin("Purchases")) return Promise.resolve(isUnlocked());
    return purchasesReady().then(function (p) { return p.getCustomerInfo(); }).then(function (info) {
      if (hasEntitlement(info)) markUnlocked(); else set(UNLOCK_KEY, "0");
      return isUnlocked();
    }).catch(function () { return isUnlocked(); });
  }

  // { price: "£1.99" } or null when there is nothing to sell (web, or offline).
  function unlockOffer() {
    return purchasesReady().then(function (p) { return p.getOfferings(); }).then(function (o) {
      var cur = o && o.current, pkg = cur && cur.availablePackages && cur.availablePackages[0];
      return pkg ? { price: pkg.product.priceString, pkg: pkg } : null;
    }).catch(function () { return null; });
  }

  // Resolves true if bought, false if cancelled; rejects on a real failure.
  function buyUnlock(offer) {
    return purchasesReady().then(function (p) { return p.purchasePackage({ aPackage: offer.pkg }); }).then(function (r) {
      if (hasEntitlement(r)) { markUnlocked(); return true; }
      return false;
    }).catch(function (e) {
      if (e && (e.userCancelled || /cancel/i.test(String(e.message || "")))) return false;
      throw e;
    });
  }

  function restoreUnlock() {
    return purchasesReady().then(function (p) { return p.restorePurchases(); }).then(function (info) {
      if (hasEntitlement(info)) { markUnlocked(); return true; }
      return false;
    });
  }

  NAPKIN.native = {
    isNative: isNative,
    haptic: haptic,
    reminderHour: reminderHour, enableReminder: enableReminder, disableReminder: disableReminder,
    isUnlocked: isUnlocked, refreshUnlock: refreshUnlock,
    unlockOffer: unlockOffer, buyUnlock: buyUnlock, restoreUnlock: restoreUnlock
  };
})();
