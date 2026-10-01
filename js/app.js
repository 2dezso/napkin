/* UI + wiring. Plain DOM, no framework. See plan.md sections 1, 8, 9. */
(function () {
  "use strict";

  var util = window.NAPKIN.util;
  var scoring = window.NAPKIN.scoring;
  var storage = window.NAPKIN.storage;
  var QUESTIONS = window.NAPKIN.questions;

  var STATE = { view: "daily", practiceQ: null, interview: null };

  // The scribble-pad placeholder — always this generic "type out your thinking"
  // template, so it never looks like an answer to the day's question.
  var PAD_HINT =
    "Jot one thought per line:\n" +
    "3 million people\n" +
    "1 in 4 of them\n" +
    "÷ 7 days";

  /* ---------- tiny sound effects (synthesized, no asset files) ----------
   * Small bits of audio feedback for the pad: a tick when a number is
   * recognized, a ding when the running total updates, a thunk on lock-in.
   * Built with Web Audio oscillators/noise so there's nothing to load. */
  var audioCtx = null;
  function ensureAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function beep(freq, dur, type, peak) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    var now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak || 0.07, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
  function noiseThud(dur, peak) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = peak || 0.1;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }
  function sfxTick() { beep(920, 0.05, "square", 0.045); }
  function sfxDing() { beep(1300, 0.09, "sine", 0.05); }
  function sfxLock() { noiseThud(0.06, 0.14); beep(85, 0.16, "sine", 0.16); }

  /* ---------- gut check: put an arbitrary guess in relatable terms ----------
   * Deliberately question-independent (population/time only, same territory
   * as commonFacts) so it never hints at the actual answer being estimated. */
  var GUESS_ANCHORS = [
    { value: 86400, name: "the seconds in a day" },
    { value: 604800, name: "the seconds in a week" },
    { value: 9000000, name: "everyone in Greater London" },
    { value: 31536000, name: "the seconds in a year" },
    { value: 67000000, name: "everyone in the UK" },
    { value: 8100000000, name: "everyone on Earth" }
  ];
  function contextualizeGuess(n) {
    if (!(n > 0)) return null;
    var best = null, bestDist = Infinity;
    GUESS_ANCHORS.forEach(function (a) {
      var dist = Math.abs(Math.log10(n / a.value));
      if (dist < bestDist) { bestDist = dist; best = a; }
    });
    var ratio = n / best.value;
    if (ratio >= 0.7 && ratio <= 1.4) return "roughly " + best.name;
    if (ratio > 1.4) return "about " + util.roundFactor(ratio) + "× " + best.name;
    return "about " + util.roundFactor(1 / ratio) + "× smaller than " + best.name;
  }

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (v === true) n.setAttribute(k, "");
      else n.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) append(n, arguments[i]);
    return n;
  }
  function elNS(tag, attrs) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      n.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) append(n, arguments[i]);
    return n;
  }
  // Wraps any element in the "circle it on the napkin" scribble effect —
  // add .circled to the wrapper (returned as wrap.firstChild's parent) once
  // it should draw itself in. Shared by the actual-answer reveal and the
  // score popup's band.
  function circleWrap(child) {
    var svg = elNS("svg", { class: "answer-circle", viewBox: "0 0 200 100", preserveAspectRatio: "none" },
      elNS("path", { d: "M14,55 C10,25 45,6 100,5 C158,4 194,22 192,52 C190,82 155,95 98,96 C46,97 14,85 16,58 C17,50 20,48 24,50" })
    );
    return el("div", { class: "actualnum-wrap" }, svg, child);
  }
  function append(n, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(n, k); }); return; }
    n.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  function mount(node) {
    var app = document.getElementById("app");
    app.innerHTML = "";
    app.appendChild(node);
    window.scrollTo(0, 0);
  }

  /* ---------- router ---------- */
  function renderApp() {
    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("active", tabs[i].getAttribute("data-view") === STATE.view);
    }
    var node;
    if (STATE.view === "daily") node = viewDaily();
    else if (STATE.view === "practice") node = STATE.practiceQ ? napkinScreen(STATE.practiceQ, { practice: true }) : viewPracticeList();
    else if (STATE.view === "interview") {
      node = (STATE.interview && !STATE.interview.over)
        ? napkinScreen(byId(STATE.interview.lastId), { interview: true })
        : viewInterviewIntro();
    }
    else node = viewStats();
    mount(node);
  }

  function viewDaily() {
    var todays = storage.resultForDate(storage.todayISO());
    if (todays) {
      var q = byId(todays.questionId) || storage.currentQuestion(QUESTIONS);
      return revealScreen(q, todays, { practice: false, instant: true });
    }
    return napkinScreen(storage.currentQuestion(QUESTIONS), { practice: false });
  }
  function byId(id) {
    return QUESTIONS.filter(function (q) { return q.id === id; })[0] || null;
  }

  /* ---------- challenge a friend ----------
   * Your share link carries your score for today's Napkin (and your name if
   * you gave one): napkinmath.co.uk/?vs=28-82-Lewis. No server involved —
   * a friend opening it sees your score over their pad, and the head-to-head
   * once they've played. Trivially fakeable, which is fine between friends. */
  var SITE_URL = "https://napkinmath.co.uk/";

  function cleanName(s) {
    return String(s || "").replace(/[^\p{L}\p{N} '’.\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 20);
  }
  function challengeLink(napkinNumber, points, name) {
    var n = cleanName(name);
    return SITE_URL + "?vs=" + napkinNumber + "-" + points + (n ? "-" + encodeURIComponent(n) : "");
  }
  function friendLabel(vs) { return vs.name || "Your friend"; }

  // Called once at boot: move a ?vs= link into storage and tidy the URL, so
  // a refresh or a re-share doesn't carry someone else's challenge along.
  function takeChallengeFromUrl() {
    var raw = null;
    try { raw = new URLSearchParams(window.location.search).get("vs"); } catch (e) { return; }
    if (raw == null) return;
    try { history.replaceState(null, "", window.location.pathname + window.location.hash); } catch (e) { /* file:// */ }
    var m = String(raw).match(/^(\d{1,5})-(\d{1,3})(?:-(.*))?$/);
    if (!m) return;
    var vs = { n: +m[1], p: Math.min(100, +m[2]), name: cleanName(m[3]) };
    storage.saveFriendChallenge(vs);
    if (vs.n !== storage.dayNumber() + 1) STATE.staleChallenge = vs;
  }

  // The friend's score for today's Napkin, if there is one.
  function todaysChallenge() {
    var vs = storage.friendChallenge();
    return vs && vs.n === storage.dayNumber() + 1 ? vs : null;
  }

  function challengeBanner() {
    var vs = todaysChallenge();
    if (vs) {
      return el("div", { class: "vs-note" },
        el("span", { class: "vs-note-icon" }, "✉️"),
        el("span", {}, el("strong", {}, friendLabel(vs)), " scored ",
          el("strong", { class: "hand vs-note-score" }, vs.p + "/100"), " on this one. Your move."));
    }
    var stale = STATE.staleChallenge;
    if (stale) {
      return el("div", { class: "vs-note stale" },
        el("span", { class: "vs-note-icon" }, "✉️"),
        el("span", {}, friendLabel(stale) + "'s challenge was for Napkin #" + stale.n +
          ", not today's. Play this one and send them yours."));
    }
    return null;
  }

  function versusRow(vs, mine) {
    var diff = mine - vs.p;
    var verdict = diff > 0 ? "You win by " + diff + " 🎉"
      : diff < 0 ? friendLabel(vs) + " wins by " + (-diff)
      : "Dead heat 🤝";
    return el("div", { class: "vs-row" + (diff > 0 ? " won" : diff < 0 ? " lost" : "") },
      el("div", { class: "vs-side" }, el("span", { class: "vs-who" }, "You"), el("span", { class: "hand vs-pts" }, String(mine))),
      el("div", { class: "vs-mid hand" }, "vs"),
      el("div", { class: "vs-side" }, el("span", { class: "vs-who" }, friendLabel(vs)), el("span", { class: "hand vs-pts" }, String(vs.p))),
      el("div", { class: "vs-verdict" }, verdict)
    );
  }

  /* ---------- the napkin screen ---------- */
  // A doodle that draws itself, and a line about today's crowd. The crowd
  // number is real (the same store the scorecard reads), or quietly absent.
  function buildHook() {
    var crowd = el("div", { class: "crowd" }, "Today's napkin is on the table.");
    var doodle = elNS("svg", { class: "doodle", viewBox: "0 0 64 64", "aria-hidden": "true" },
      elNS("path", { d: "M14 22 L50 22 L46 56 L18 56 Z" }),
      elNS("path", { d: "M14 22 C18 14 46 14 50 22" }),
      elNS("path", { class: "r", d: "M24 38 C28 34 36 34 40 38" }),
      elNS("path", { class: "r", d: "M26 46 L38 46" }));
    var box = el("div", { class: "hook" }, doodle, crowd);
    var api = window.NAPKIN.results;
    if (api) api.distribution(storage.todayISO()).then(function (d) {
      if (d && d.total > 0) crowd.textContent = util.withCommas(d.total) + (d.total === 1 ? " person has" : " people have") + " had a go today. Be next.";
    }).catch(function () { /* keep the quiet default */ });
    return box;
  }

  function napkinScreen(q, opts) {
    opts = opts || {};
    var wrap = el("section", { class: "screen napkin" });

    if (opts.practice) {
      var back = el("button", { class: "linkbtn" }, "‹ Back to list");
      back.addEventListener("click", function () { STATE.practiceQ = null; renderApp(); });
      wrap.appendChild(back);
    } else if (opts.interview) {
      var iv = STATE.interview, round = LADDER[iv.level + 1];
      var leave = el("button", { class: "linkbtn" }, "‹ Leave the interview");
      leave.addEventListener("click", function () {
        if (!window.confirm("Walk out of the interview? This run ends here.")) return;
        STATE.interview = null;
        renderApp();
      });
      wrap.appendChild(leave);
      wrap.appendChild(el("div", { class: "daychip" },
        el("span", { class: "chip" }, "Round " + (iv.level + 1) + " of 5"),
        el("span", { class: "muted" }, "for " + round.title + (iv.held ? " · second chance" : ""))
      ));
      wrap.appendChild(el("div", { class: "vs-note iv-note" },
        el("span", { class: "vs-note-icon" }, round.emoji),
        el("span", {}, el("strong", { class: "iv-who" }, round.round + " · " + round.who), iv.opener)
      ));
      wrap.appendChild(roundPips(iv.level, iv.held));
    } else {
      wrap.appendChild(el("div", { class: "daychip" },
        el("span", { class: "chip" }, "Napkin #" + (storage.dayNumber() + 1)),
        el("span", { class: "muted" }, britishDate(storage.todayISO()))
      ));
      var banner = challengeBanner();
      if (banner) wrap.appendChild(banner);
    }

    wrap.appendChild(el("h1", { class: "question" }, q.question));
    if (!opts.practice && !opts.interview) wrap.appendChild(buildHook());

    if (q.clarifications && q.clarifications.length) {
      var det = el("details", { class: "fineprint" });
      det.appendChild(el("summary", {}, "The fine print"));
      var ul = el("ul", {});
      q.clarifications.forEach(function (c) { ul.appendChild(el("li", {}, c)); });
      det.appendChild(ul);
      wrap.appendChild(det);
    }

    /* The napkin is the game; eyeballing is a quiet escape hatch under Lock it in. */
    var mode = "napkin";

    /* ---- the scribble pad (C: multiply every number found) ---- */
    var totalOverride = null;   // set when the answer is typed by hand
    var assisted = false;
    var muted = {};             // factor sig -> true  (left out of the math)
    var flipped = {};           // factor sig -> "x"|"/"|"+"  (operator overridden by a pill tap)
    var rollFrom = 0;
    var seenFactorSigs = {};    // factor sig -> true once its pill has popped in / ticked

    var napkinPanel = el("div", { class: "panel" });
    napkinPanel.appendChild(el("span", { class: "tag" }, "back of the napkin"));
    napkinPanel.appendChild(el("div", { class: "pencil", "aria-hidden": "true" }));

    var padWrap = el("div", { class: "padwrap" });
    // Sits behind the real textarea (which is made transparent) and mirrors
    // its text so recognized numbers can get a highlight *in place* — proof,
    // right on what you typed, that the pad is actually reading it.
    var padHighlight = el("div", { class: "pad-highlight hand", "aria-hidden": "true" });
    var pad = el("textarea", {
      class: "pad hand", rows: "1", spellcheck: "false", autocapitalize: "off", autocomplete: "off",
      placeholder: PAD_HINT
    });
    pad.setAttribute("autocorrect", "off");
    pad.setAttribute("enterkeyhint", "enter");
    var stamp = el("div", { class: "stamp" }, "LOCKED IN");
    stamp.hidden = true;
    padWrap.appendChild(padHighlight);
    padWrap.appendChild(pad);
    padWrap.appendChild(stamp);
    napkinPanel.appendChild(padWrap);

    var demoNote = el("p", { class: "muted demo-note" }, "Numbers get picked up as you type.");
    demoNote.hidden = true;
    napkinPanel.insertBefore(demoNote, padWrap);

    pad.addEventListener("input", onPad);
    pad.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); doLock(); }
    });
    // Double-click a number to cycle it (mute / flip / add) without going
    // down to its pill and back. Single click still just places the caret,
    // so ordinary editing is untouched.
    pad.addEventListener("dblclick", function (e) {
      var pos = pad.selectionStart;
      var hit = scan().filter(function (f) { return pos >= f.start && pos <= f.end; })[0];
      if (!hit) return;
      e.preventDefault();
      pad.setSelectionRange(pos, pos);
      cycleFactor(hit);
    });
    pad.addEventListener("scroll", function () {
      padHighlight.scrollTop = pad.scrollTop;
      padHighlight.scrollLeft = pad.scrollLeft;
    });

    // Back-pocket numbers and gut check — sit right under the pad. Gut check
    // is only enabled once there's an actual guess to react to.
    var padActions = el("div", { class: "padactions" },
      el("span", { class: "helper-label muted" }, "Tools")
    );
    if (window.NAPKIN.commonFacts && window.NAPKIN.commonFacts.length) {
      var factsActionBtn = el("button", { class: "tbtn", type: "button" }, "Handy numbers");
      factsActionBtn.addEventListener("click", openFactsModal);
      padActions.appendChild(factsActionBtn);
    }
    var gutActionBtn = el("button", { class: "tbtn", type: "button" }, "Sense-check");
    gutActionBtn.addEventListener("click", openGutCheckModal);
    padActions.appendChild(gutActionBtn);

    var ribbon = el("div", { class: "ribbon" });
    napkinPanel.appendChild(ribbon);
    var ribbonHint = el("p", { class: "muted ribbon-hint" }, "Tap a number to mute it · tap again to cycle × / ÷ / +");
    ribbonHint.hidden = true;
    napkinPanel.appendChild(ribbonHint);

    var totalRow = el("div", { class: "total" });
    var approxBtn = el("button", { class: "total-approx hand", type: "button", title: "Tap to set the answer by hand" }, "≈ …");
    var wordsEl = el("span", { class: "total-words muted" }, "");
    var revertBtn = el("button", { class: "total-revert", type: "button" }, "↺ Back to the napkin's number");
    revertBtn.hidden = true;
    approxBtn.addEventListener("click", startTotalEdit);
    revertBtn.addEventListener("click", function () { totalOverride = null; refreshTotal(); });
    totalRow.appendChild(approxBtn);
    totalRow.appendChild(wordsEl);
    totalRow.appendChild(revertBtn);
    napkinPanel.appendChild(totalRow);

    // Everything above is the working area — what you wrote, what we read from
    // it, what it comes to. Everything below is optional help, kept out of that
    // chain so it doesn't interrupt pad → reading → total.
    var needHand = el("details", { class: "needhand" },
      el("summary", {}, "Need a hand?"),
      el("ul", { class: "howto" },
        el("li", {}, "One thought per line. Every number you write gets multiplied."),
        el("li", {}, "Put per, / or ÷ before a number to divide. 1 in 4, 25%, 5k and 2.5M all work."),
        el("li", {}, "Tap a number's pill to mute it; tap again to flip × ÷ +."),
        el("li", {}, "Made a mess? Ctrl or ⌘ + Z undoes it.")
      )
    );
    var helpers = el("div", { class: "helpers" });
    helpers.appendChild(padActions);
    needHand.appendChild(helpers);
    napkinPanel.appendChild(needHand);

    /* Optional help: a single escalating "Stuck?" button. First press gives
       a number (if this question has any back-pocket facts), second press
       shows the full framework — no extra confirm() gate, since the two
       presses already are the commitment. An interview gets no help at all. */
    var padHelp = el("div", { class: "padhelp" });
    needHand.appendChild(padHelp);

    if (!opts.interview) {
      var hasAnchors = !!(q.reference_anchors && q.reference_anchors.length);
      var stuckChips = null;
      if (hasAnchors) {
        stuckChips = el("div", { class: "anchorchips" });
        stuckChips.hidden = true;
        q.reference_anchors.forEach(function (a) {
          var chip = el("button", { class: "achip", type: "button" }, "+ " + a.label + " " + inputNumber(a.value));
          chip.addEventListener("mousedown", function (e) { e.preventDefault(); });
          chip.addEventListener("click", function () { insertLine(a.label + " " + inputNumber(a.value)); });
          stuckChips.appendChild(chip);
        });
      }
      var stuckPeekNote = el("p", { class: "muted peeknote" }, "Framework peeked — this one counts as assisted.");
      stuckPeekNote.hidden = true;
      var stuckBtn = el("button", { class: "linkbtn stuckbtn", type: "button" }, "Give me a nudge");
      var gaveNumber = false;
      stuckBtn.addEventListener("click", function () {
        if (hasAnchors && !gaveNumber) {
          gaveNumber = true;
          stuckChips.hidden = false;
          stuckBtn.textContent = "A bigger nudge";
          return;
        }
        assisted = true;
        pad.value = q.framework.map(function (f) { return (f.op === "/" ? "per " : "") + f.label; }).join("\n") + "\n";
        onPad();
        pad.focus();
        stuckBtn.remove();
        stuckPeekNote.hidden = false;
      });
      padHelp.appendChild(stuckBtn);
      if (stuckChips) needHand.appendChild(stuckChips);
      needHand.appendChild(stuckPeekNote);
    }

    /* eyeball escape hatch */
    var eyePanel = el("div", { class: "panel" });
    eyePanel.hidden = true;
    eyePanel.appendChild(el("p", { class: "muted" }, "Skip the scribble and just drag to your gut number."));
    var slider = el("input", { type: "range", min: "0", max: "1000", value: "250", class: "slider" });
    var eyeVal = el("div", { class: "hand big eyeval" }, util.humanize(sliderValue()));
    slider.addEventListener("input", function () {
      eyeVal.textContent = util.humanize(sliderValue());
      updateSubmit();
    });
    eyePanel.appendChild(slider);
    eyePanel.appendChild(eyeVal);

    wrap.appendChild(napkinPanel);
    wrap.appendChild(eyePanel);

    var submit = el("button", { class: "btn submit lockbtn", type: "button" },
      opts.practice ? "See how close I got" : "Lock it in");
    submit.disabled = true;
    submit.addEventListener("click", doLock);
    // Say why Lock is dimmed, instead of leaving it looking broken.
    var lockHint = el("p", { class: "lockhint" }, "Write at least one number to lock it in.");
    wrap.appendChild(submit);
    wrap.appendChild(lockHint);

    // Eyeballing stays available, but as a quiet link rather than a tab above the pad.
    var eyeLink = null;
    if (!opts.interview) {
      eyeLink = el("button", { class: "linkbtn eyelink", type: "button" }, "Can't work it out? Just eyeball it");
      eyeLink.addEventListener("click", function () { setMode(mode === "napkin" ? "eyeball" : "napkin"); });
      wrap.appendChild(el("div", { class: "eyerow" }, eyeLink));
    }

    function doLock() {
      if (submit.disabled) return;
      var guess, rowsSnap = null, adjusted = false;
      if (mode === "eyeball") {
        guess = sliderValue();
      } else {
        guess = effectiveGuess();
        if (guess == null) return;
        adjusted = totalOverride != null;
        rowsSnap = activeFactors().map(function (f) {
          return { op: flipped[f.sig] || f.op, label: f.label, value: String(f.value) };
        });
      }
      if (!(guess > 0) || !isFinite(guess)) return;

      var sc = scoring.score(guess, q);
      var rec = {
        questionId: q.id, guess: guess, rows: rowsSnap,
        pad: mode === "eyeball" ? "" : pad.value,
        assisted: assisted, adjusted: adjusted,
        ratio: sc.ratio, band: sc.band.key, inRange: sc.inRange, mode: mode
      };

      function finish() {
        if (opts.interview) {
          var roundNumber = STATE.interview.level + 1;
          applyInterviewResult(sc);
          mount(revealScreen(q, Object.assign({ date: storage.todayISO(), napkinNumber: null, round: roundNumber }, rec), { interview: true }));
        } else if (opts.practice) {
          mount(revealScreen(q, Object.assign({ date: storage.todayISO(), napkinNumber: null }, rec), { practice: true }));
        } else {
          var full = storage.recordResult(rec);
          if (window.NAPKIN.results) window.NAPKIN.results.submit(full.date, full.band).catch(function () {});
          mount(revealScreen(q, full, { practice: false }));
        }
      }

      submit.disabled = true;
      if (mode === "napkin") {
        stamp.hidden = false;
        stamp.classList.add("go");
        sfxLock();
        setTimeout(finish, 480);
      } else {
        finish();
      }
    }

    /* ---- helpers ---- */
    function scan() { return util.scanFactors(pad.value); }
    function activeFactors() {
      return scan().filter(function (f) { return !muted[f.sig]; });
    }
    function computeTotal() {
      var acc = null;
      activeFactors().forEach(function (f) {
        var op = flipped[f.sig] || f.op;
        if (acc == null) acc = op === "/" ? 1 / f.value : f.value; // "per 1,000 people" on line one
        else if (op === "/") acc = acc / f.value;
        else if (op === "+") acc = acc + f.value;
        else acc = acc * f.value;
      });
      return acc;
    }
    function effectiveGuess() {
      return totalOverride != null ? totalOverride : computeTotal();
    }

    // The pad grows as you write, so it never needs its own scrollbar.
    function fitPad() {
      // Empty, the pad is as tall as its example, so that is never cut off.
      var empty = !pad.value;
      if (empty) pad.value = PAD_HINT;
      pad.style.height = "auto"; pad.style.height = pad.scrollHeight + "px";
      if (empty) pad.value = "";
    }

    function onPad() {
      fitPad();
      var live = {};
      scan().forEach(function (f) { live[f.sig] = true; });
      Object.keys(muted).forEach(function (s) { if (!live[s]) delete muted[s]; });
      Object.keys(flipped).forEach(function (s) { if (!live[s]) delete flipped[s]; });
      renderRibbon();
      refreshTotal();
      renderPadHighlight();
    }

    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Mirrors pad.value into the layer sitting behind the (transparent) pad,
    // wrapping each recognized number in a <mark> so it's highlighted right
    // where you typed it — not just reflected in the ribbon below. Trims any
    // trailing space the match swallowed, and holds off marking the token
    // you're still actively typing until a space/newline finishes it.
    // Each line becomes its own box; a soft-wrapped line still wraps inside
    // its box exactly as it does in the textarea, which is what keeps the
    // two layers aligned.
    var seenMarks = {};         // "sig#n" -> true once its circle has been drawn
    function renderPadHighlight() {
      var text = pad.value;
      var fs = scan();

      var html = "", pos = 0, occ = {};
      if (!text.trim()) seenMarks = {};
      fs.forEach(function (f) {
        if (f.start < pos) return;
        var end = f.end;
        while (end > f.start && /\s/.test(text.charAt(end - 1))) end--;
        var finished = end < text.length && /[ \n\t]/.test(text.charAt(end));
        if (!finished) return;
        // Only a number's first appearance gets the circle-draw pop; every
        // re-render after that leaves it alone instead of re-animating it.
        occ[f.sig] = (occ[f.sig] || 0) + 1;
        var markKey = f.sig + "#" + occ[f.sig], seen = !!seenMarks[markKey];
        seenMarks[markKey] = true;
        html += escapeHtml(text.slice(pos, f.start));
        html += '<mark class="hl' + (seen ? " hl-old" : "") + (muted[f.sig] ? " hl-muted" : "") +
          '" data-sig="' + escapeHtml(f.sig) + '">' +
          escapeHtml(text.slice(f.start, end)) + "</mark>";
        pos = end;
      });
      html += escapeHtml(text.slice(pos));

      // Safe to split on newlines now: they only ever survive inside the
      // escaped plain-text runs, never inside a tag we just emitted.
      var lines = html.split("\n"), out = "";
      for (var i = 0; i < lines.length; i++) {
        // An empty line still needs to take up a line's height.
        out += '<div class="padline">' + (lines[i] || "​") + "</div>";
      }

      // Once they've written one line but not yet gone to a second, put the
      // nudge on the line they should type next — inside the sheet, so it
      // costs no layout and disappears the moment they press Enter.
      if (text.trim() !== "" && text.indexOf("\n") === -1) {
        out += '<div class="padline padline-ghost">↵ next step on a new line</div>';
      }
      padHighlight.innerHTML = out;
    }

    // Mute → the other of × / ÷ → forced + → back to the detected operator.
    // Shared by the ribbon pills and by double-clicking the number itself.
    function cycleFactor(f) {
      if (!muted[f.sig] && !flipped[f.sig]) {
        muted[f.sig] = true;
      } else if (muted[f.sig]) {
        delete muted[f.sig];
        flipped[f.sig] = f.op === "/" ? "x" : "/";
      } else if (flipped[f.sig] === "x" || flipped[f.sig] === "/") {
        flipped[f.sig] = "+";
      } else {
        delete flipped[f.sig];
      }
      renderRibbon();
      refreshTotal();
      renderPadHighlight();
    }

    // Lights up the number in the pad that a given pill belongs to, so the
    // link between what you wrote and what we read is visible.
    function linkPadMark(sig) {
      var marks = padHighlight.querySelectorAll("mark.hl");
      for (var i = 0; i < marks.length; i++) {
        marks[i].classList.toggle("hl-linked", sig != null && marks[i].getAttribute("data-sig") === sig);
      }
    }

    // Generic dismissable popup: a titled card over a dark backdrop, closed by
    // its own close button or a tap on the backdrop. Returns the close fn.
    function openInfoModal(titleText, contentNode) {
      var closeBtn = el("button", { class: "linkbtn modal-close", type: "button" }, "Close");
      var card = el("div", { class: "demo-modal info-modal" },
        el("div", { class: "hand big" }, titleText),
        contentNode,
        closeBtn
      );
      var overlay = el("div", { class: "demo-overlay" }, card);
      function close() { if (overlay.parentNode) overlay.remove(); }
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      closeBtn.addEventListener("click", close);
      wrap.appendChild(overlay);
      return close;
    }

    function openFactsModal() {
      var close;
      var list = el("div", { class: "factspanel" });
      (window.NAPKIN.commonFacts || []).forEach(function (f) {
        var row = el("button", { class: "factrow", type: "button" },
          el("span", {}, f.label),
          el("span", { class: "hand" }, inputNumber(f.value))
        );
        row.addEventListener("click", function () { insertLine(f.label + " " + inputNumber(f.value)); close(); });
        list.appendChild(row);
      });
      close = openInfoModal("Handy numbers", list);
    }

    function openGutCheckModal() {
      var g = effectiveGuess();
      if (g == null) return; // button's disabled for this, but stay safe
      var ctx = contextualizeGuess(g);
      var line = "You're at ≈ " + util.humanize(g) + (ctx ? " — that's " + ctx + "." : ".");
      openInfoModal("Sense-check", el("p", {}, line));
    }

    function renderRibbon() {
      var fs = scan();
      ribbon.innerHTML = "";
      ribbonHint.hidden = fs.length === 0;
      if (!fs.length) return;
      ribbon.appendChild(el("span", { class: "ribbon-label muted" }, "Reading"));
      fs.forEach(function (f, idx) {
        var isMuted = !!muted[f.sig];
        var isFlip = !!flipped[f.sig];
        var op = flipped[f.sig] || f.op;
        var isNew = !seenFactorSigs[f.sig];
        if (isNew) { seenFactorSigs[f.sig] = true; sfxTick(); }
        var pill = el("button", {
          class: "pill" + (isMuted ? " muted" : "") + (isFlip ? " flip" : "") + (isNew ? " pill-new" : ""),
          type: "button", title: (f.label || f.raw) + " = " + util.withCommas(f.value)
        },
          el("span", { class: "pill-op" }, (idx === 0 && !isFlip && !isMuted) ? "" : (op === "/" ? "÷" : op === "+" ? "+" : "×")),
          el("span", {}, util.humanize(f.value))
        );
        pill.addEventListener("click", function () { cycleFactor(f); });
        pill.addEventListener("mouseenter", function () { linkPadMark(f.sig); });
        pill.addEventListener("mouseleave", function () { linkPadMark(null); });
        ribbon.appendChild(pill);
      });
      var t = computeTotal();
      ribbon.appendChild(el("span", { class: "ribbon-eq" }, "= " + (t == null ? "…" : util.humanize(t))));
    }

    function renderTotal() {
      var g = effectiveGuess();
      if (g == null) {
        approxBtn.textContent = "≈ …";
        wordsEl.textContent = "";
      } else {
        if (g !== rollFrom) sfxDing();
        rollNumber(approxBtn, rollFrom, g);
        rollFrom = g;
        wordsEl.textContent = humanizeWords(g) + " · " + util.withCommas(g) + (totalOverride != null ? " · your call" : "");
      }
      revertBtn.hidden = totalOverride == null;
    }

    var rollGen = 0;
    function rollNumber(node, from, to) {
      var gen = ++rollGen;
      if (!isFinite(from) || from === to) { node.textContent = "≈ " + util.humanize(to); return; }
      var start = performance.now(), dur = 380;
      function step(now) {
        if (gen !== rollGen) return;
        var p = Math.max(0, Math.min(1, (now - start) / dur));
        var v = from + (to - from) * (1 - Math.pow(1 - p, 3));
        node.textContent = "≈ " + util.humanize(v);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function humanizeWords(n) {
      var abs = Math.abs(n);
      var scales = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
      for (var i = 0; i < scales.length; i++) {
        if (abs >= scales[i][0]) {
          var x = n / scales[i][0];
          return (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10) + " " + scales[i][1];
        }
      }
      return String(Math.round(n));
    }

    function startTotalEdit() {
      var base = effectiveGuess();
      var edit = el("input", {
        type: "text", inputmode: "decimal", class: "total-edit hand",
        value: base == null ? "" : util.withCommas(base)
      });
      revertBtn.hidden = true;
      totalRow.replaceChild(edit, approxBtn);
      edit.focus();
      edit.select();
      var closed = false;
      function restore() { if (!closed && totalRow.contains(edit)) { totalRow.replaceChild(approxBtn, edit); } closed = true; }
      function commit() {
        if (closed) return;
        var pq = util.parseQuantity(edit.value);
        totalOverride = (isFinite(pq.value) && pq.value > 0) ? pq.value : null;
        rollFrom = totalOverride != null ? totalOverride : (computeTotal() || 0);
        restore();
        refreshTotal();
      }
      edit.addEventListener("blur", commit);
      edit.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); edit.blur(); }
        else if (e.key === "Escape") { e.preventDefault(); restore(); refreshTotal(); }
      });
    }

    function refreshTotal() { renderTotal(); updateSubmit(); updateGutBtn(); }
    function updateSubmit() {
      submit.disabled = mode === "eyeball" ? false : !(effectiveGuess() > 0);
      if (lockHint) lockHint.hidden = !submit.disabled;
    }
    function updateGutBtn() {
      gutActionBtn.disabled = !(effectiveGuess() > 0);
    }
    function setMode(m) {
      mode = m;
      if (eyeLink) eyeLink.textContent = m === "napkin" ? "Can't work it out? Just eyeball it" : "‹ Back to the napkin";
      napkinPanel.hidden = m !== "napkin";
      eyePanel.hidden = m !== "eyeball";
      updateSubmit();
    }
    function sliderValue() { return Math.round(Math.pow(10, (Number(slider.value) / 1000) * 12)); }
    function inputNumber(v) { return Number.isInteger(v) ? util.withCommas(v) : String(v); }

    function insertText(str) {
      var s = pad.selectionStart, e = pad.selectionEnd, v = pad.value;
      pad.value = v.slice(0, s) + str + v.slice(e);
      var pos = s + str.length;
      pad.setSelectionRange(pos, pos);
      pad.focus();
      onPad();
    }
    function insertLine(text) {
      var s = pad.selectionStart, e = pad.selectionEnd, v = pad.value;
      var needNL = s > 0 && v.charAt(s - 1) !== "\n";
      var ins = (needNL ? "\n" : "") + text + "\n";
      pad.value = v.slice(0, s) + ins + v.slice(e);
      var pos = s + ins.length - 1;
      pad.setSelectionRange(pos, pos);
      pad.focus();
      onPad();
    }

    // First-ever visit: a short welcome, then (if they want it) type an
    // example into the empty pad so the "your numbers get read live" trick
    // is seen once, not just asserted. Any click/keypress cancels it.
    function startPadDemo() {
      if (opts.practice || opts.interview) return;
      if (storage.hasSeenPadDemo() || pad.value !== "" || mode !== "napkin") return;
      showDemoIntro();
    }

    function showDemoIntro() {
      var showBtn = el("button", { class: "btn" }, "Show me ▸");
      var skipBtn = el("button", { class: "linkbtn" }, "Skip, I've got it");
      var overlay = el("div", { class: "demo-overlay" },
        el("div", { class: "demo-modal" },
          el("div", { class: "hand big" }, "Welcome to Napkin 👋"),
          el("p", {}, "Write out your thinking in plain English — we'll pick up the numbers as you go. Click below to see a quick example, then good luck!"),
          showBtn,
          skipBtn
        )
      );
      wrap.appendChild(overlay);
      function close() { if (overlay.parentNode) overlay.remove(); }
      showBtn.addEventListener("click", function () { close(); runPadDemo(); });
      skipBtn.addEventListener("click", function () { close(); storage.markPadDemoSeen(); });
    }

    function runPadDemo() {
      var demoText = "3 million people\n1 in 4 of them\n÷ 7 days";
      var i = 0, done = false, timer = null;
      // Only re-run recognition (ribbon/total) once a token is actually
      // finished — right after a space/newline, or at the very end. Doing it
      // on every keystroke would let a still-typing shorthand letter ("3 m"
      // typed on the way to "3 million") flash a wrong value before the word
      // is even done.
      function tick() {
        if (i >= demoText.length) { timer = setTimeout(stopDemo, 2000); return; }
        var ch = demoText.charAt(i);
        pad.value += ch;
        i++;
        if (/\s/.test(ch) || i >= demoText.length) onPad();
        timer = setTimeout(tick, ch === "\n" ? 620 : 130);
      }
      function stopDemo() {
        if (done) return;
        done = true;
        clearTimeout(timer);
        demoNote.hidden = true;
        pad.classList.remove("demo-typing");
        napkinPanel.classList.remove("demo-run");
        // Only clear it if the user never actually touched the pad themselves.
        if (demoText.indexOf(pad.value) === 0) { pad.value = ""; onPad(); }
        storage.markPadDemoSeen();
      }
      demoNote.hidden = false;
      pad.classList.add("demo-typing");
      // Reserves the ribbon's final height (and reveals its hint) up front,
      // all in one go, so nothing pops the page open line by line as the
      // scripted text types itself in.
      napkinPanel.classList.add("demo-run");
      ribbonHint.hidden = false;
      wrap.addEventListener("pointerdown", function () { stopDemo(); }, { once: true, capture: true });
      wrap.addEventListener("keydown", function () { stopDemo(); }, { once: true, capture: true });
      timer = setTimeout(tick, 130);
    }

    onPad();
    // Sizing needs the pad on the page, so fit it again once it is there and when the window changes.
    requestAnimationFrame(fitPad);
    window.addEventListener("resize", function () { if (pad.isConnected) fitPad(); });
    refreshTotal();
    startPadDemo();
    return wrap;
  }

  /* ---------- the reveal screen ----------
     One napkin at a time. "You said X" lands first, the model builds its
     working on the front of the napkin, then the napkin turns over and your
     score is on the back. Nothing is given away until the turn. */
  function revealScreen(q, res, opts) {
    opts = opts || {};
    var chipLabel = opts.interview ? "Round " + res.round + " of 5" : opts.practice ? "Practice" : ("Napkin #" + res.napkinNumber);
    var wrap = el("section", { class: "screen reveal" });

    wrap.appendChild(el("div", { class: "reveal-head" },
      el("span", { class: "chip" }, chipLabel),
      el("span", { class: "muted" }, q.question)
    ));

    // Regulars get a brisker pace; a first-timer gets the full build-up.
    var played = 0;
    try { played = storage.stats().played; } catch (e) { /* no history */ }
    var calm = prefersReducedMotion();
    var model = buildModelReveal(q, res, played > 3);
    wrap.appendChild(model.node);

    // The score napkin is the back of the model's napkin; everything else
    // (the comparison, what happens next) waits underneath.
    var after = el("div", { class: "after" });
    after.hidden = true;
    buildAfter(after, q, res, opts);
    var hero = after.querySelector(".hero");
    model.setBack(hero);
    wrap.appendChild(after);

    var pts = hero.querySelector(".hero-points");
    var target = +pts.getAttribute("data-points");
    var landed = false;

    function land(instant) {
      if (landed) return;
      landed = true;
      after.hidden = false;
      if (instant) {
        pts.textContent = util.withCommas(target);
        hero.classList.add("in", "scored", "instant");
        return;
      }
      hero.classList.add("in");
      countUp(pts, target);
      setTimeout(function () {
        hero.classList.add("scored");
        var beatFriend = !!hero.querySelector(".vs-row.won");
        if (target >= 86 || beatFriend) burstConfetti(hero.querySelector(".confetti"), target >= 95 || beatFriend ? 34 : 18);
        if (!opts.practice && !opts.interview) {
          var note = hero.querySelector(".pile-note");
          if (note) note.classList.add("in");
          setTimeout(function () { dropIntoPile(hero.querySelector(".hero-points"), target); }, 900);
        }
      }, 1000);
    }

    if (opts.instant || calm) {
      // Revisiting a finished Napkin (or no motion wanted): already turned over.
      model.showEnd();
      land(true);
    } else {
      model.play(function () { land(false); });
      model.skipBtn.addEventListener("click", function () {
        model.stop(); model.finish();
        model.turnOver(function () { land(false); }, true);
      });
    }
    return wrap;
  }

  // "2026-09-30" -> "Wednesday 30 September"
  function britishDate(iso) {
    var p = String(iso).split("-");
    try {
      return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
    } catch (e) { return iso; }
  }

  function fmtFull(v) { return v >= 1000 ? util.withCommas(Math.round(v)) : util.humanize(v); }

  // A log-scale ruler holding every number in play: the model's running
  // totals, your guess (a red ✗) and the real figure (a red circle). The
  // front of the napkin crawls a dot along it; the back shows it finished.
  function makeRuler(steps, guess, real, withDot) {
    var vals = steps.concat(guess, real).filter(function (v) { return v > 0; });
    var minE = Math.floor(Math.log10(Math.min.apply(null, vals))), maxE = Math.ceil(Math.log10(Math.max.apply(null, vals)));
    if (maxE - minE < 2) { minE -= 1; maxE += 1; }
    var min = Math.pow(10, minE - 0.2), max = Math.pow(10, maxE + 0.2);
    function pct(v) {
      v = Math.max(min, Math.min(max, v));
      return (Math.log(v / min) / Math.log(max / min)) * 100;
    }
    var node = el("div", { class: "rv-ruler", "aria-hidden": "true" }, el("div", { class: "rv-axis" }));
    var every = Math.ceil((maxE - minE + 1) / 5);
    for (var e = minE; e <= maxE; e++) {
      var tk = el("div", { class: "rv-tick" });
      tk.style.left = pct(Math.pow(10, e)) + "%";
      node.appendChild(tk);
      if ((e - minE) % every === 0) {
        var tl = el("div", { class: "rv-tl" }, util.humanize(Math.pow(10, e)));
        tl.style.left = pct(Math.pow(10, e)) + "%";
        node.appendChild(tl);
      }
    }
    var gx = pct(guess), rx = pct(real);
    var band = el("div", { class: "rv-band" });
    band.style.left = Math.min(gx, rx) + "%"; band.style.width = Math.abs(gx - rx) + "%";
    if (Math.abs(gx - rx) < 2) band.style.display = "none";
    var you = el("div", { class: "rv-you" }, el("small", {}, "you"), "✗");
    you.style.left = gx + "%";
    if (Math.abs(gx - rx) * 3 < 46) you.classList.add("stack");   // keep the two labels apart
    var realMark = el("div", { class: "rv-real" }, el("small", {}, "real"));
    realMark.style.left = rx + "%";
    [band, you, realMark].forEach(function (n) { node.appendChild(n); });
    var dot = null;
    if (withDot) {
      dot = el("div", { class: "rv-dot" });
      dot.style.left = pct(steps[0] || guess) + "%";
      node.appendChild(dot);
    }
    return {
      node: node, you: you, real: realMark, band: band, dot: dot,
      moveDot: function (v) { if (dot) dot.style.left = pct(v) + "%"; },
      showEnd: function () { you.classList.add("in"); realMark.classList.add("in"); band.classList.add("in"); }
    };
  }

  // The model's turn, on the front of a napkin that turns over to your score.
  // Returns { node, skipBtn, setBack(hero), play(onScore), turnOver(onScore, quick),
  // showEnd(), finish(), stop() }. play() runs the tense build; finish() jumps
  // the front straight to its end state.
  function buildModelReveal(q, res, fast) {
    var F = fast ? 0.62 : 1, rows = q.framework || [], steps = [], acc = null;
    rows.forEach(function (r) {
      var v = r.model_value;
      if (acc == null) acc = r.op === "/" ? 1 / v : v;
      else if (r.op === "/") acc /= v;
      else if (r.op === "+") acc += v;
      else acc *= v;
      steps.push(acc);
    });
    var total = acc, guess = res.guess, real = q.actual_answer;

    var ruler = makeRuler(steps, guess, real, true);
    var lead = el("p", { class: "rv-lead", "aria-live": "polite" }, "You said " + util.humanize(guess) + ".");
    var skipBtn = el("button", { class: "btn ghost skip", type: "button" }, "Skip ▸");
    var topline = el("div", { class: "rv-top" }, lead, skipBtn);

    var rowEls = rows.map(function (r, i) {
      var v = r.model_value, asPct = r.unit === "fraction" && v > 0 && v < 1;
      var show = asPct ? (Math.round(v * 1000) / 10) + "%" : util.humanize(v);
      var sym = i === 0 ? null : el("i", {}, r.op === "/" ? "÷" : r.op === "+" ? "+" : "×");
      return el("div", { class: "rv-row" },
        el("span", { class: "n" }, sym, el("span", { class: "circ" }, show)),
        el("span", { class: "t" }, r.label));
    });
    var sum = el("hr", { class: "rv-sum" });
    var num = el("span", { class: "num" }, "?");
    var totRow = el("div", { class: "rv-tot" }, el("span", { class: "eqs" }, "="), num);
    var checkText = q.sanity_check || q.narrative[q.narrative.length - 1] || "";
    var checkW = el("span", { class: "w" }, checkText);
    var check = el("div", { class: "rv-check" }, el("b", {}, "✓"), checkW);
    var vig = el("div", { class: "rv-vig", "aria-hidden": "true" });
    // Why you scored what you scored, written on the napkin once it has been checked.
    var culpritText = res.rows && res.rows.length ? buildHighlight(scoring.compareRows(res.rows, q.framework)) : null;
    var culprit = culpritText ? el("p", { class: "rv-culprit" }, culpritText) : null;
    var source = el("p", { class: "rv-source" }, q.source + (q.as_of ? " (" + q.as_of + ")" : ""));

    var over = el("div", { class: "rv-over", "aria-hidden": "true" }, "Turning it over…");
    var backBtn = el("button", { class: "linkbtn rv-backbtn", type: "button" }, "↻ Back to your score");
    var front = el("section", { class: "face front" },
      el("span", { class: "rv-lab" }, "The model's napkin"),
      ruler.node,
      el("div", { class: "rv-rows" }, rowEls),
      sum, totRow, check, culprit, source,
      el("div", { class: "rv-foot" }, over, backBtn));
    var flipIn = el("div", { class: "flip-in" }, front);
    var flip = el("div", { class: "flip" }, flipIn);
    var node = el("div", { class: "rv" }, topline, flip, vig);

    var timers = [], backRuler = null, flipBtn = null;
    function at(ms, fn) { timers.push(setTimeout(fn, ms * F)); }
    function stop() { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = []; }
    function tick() { try { sfxTick(); } catch (x) { /* audio is optional */ } }
    function say(t) { lead.textContent = t; lead.classList.remove("pop"); void lead.offsetWidth; lead.classList.add("pop"); }
    function setNum(v) { num.textContent = fmtFull(v); num.classList.remove("settle"); void num.offsetWidth; num.classList.add("settle"); }

    // The score napkin becomes the back face, with its own finished ruler and a
    // way to turn back to the working.
    function setBack(hero) {
      hero.classList.add("face", "back");
      backRuler = makeRuler(steps, guess, real, false);
      backRuler.showEnd();
      var anchor = hero.querySelector(".band-stamp");
      anchor.insertAdjacentElement("afterend", backRuler.node);
      flipBtn = el("button", { class: "linkbtn rv-flipbtn", type: "button" }, "↺ Turn it over to see the working");
      var crowd = hero.querySelector(".hero-crowd");
      if (crowd) crowd.insertAdjacentElement("afterend", flipBtn); else hero.appendChild(flipBtn);
      flipIn.appendChild(hero);
      // Each face carries its own button, since a face is hidden while the other shows.
      flipBtn.addEventListener("click", function () { flip.classList.remove("turned"); backBtn.classList.add("in"); });
      backBtn.addEventListener("click", function () { flip.classList.add("turned"); });
    }

    function collapseTop() { topline.classList.add("gone"); skipBtn.style.visibility = "hidden"; }

    function scrollToTop() {
      var s = node.parentNode;
      if (!s || !s.scrollIntoView) return;
      try { s.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }); } catch (e) { s.scrollIntoView(); }
    }

    function finish() {
      stop();
      say("Here's how you did.");
      ruler.you.classList.add("in");
      if (ruler.dot) { ruler.dot.classList.add("in"); ruler.dot.classList.remove("tense"); if (total != null) ruler.moveDot(total); }
      rowEls.forEach(function (r) { r.classList.add("go", "ring"); });
      sum.classList.add("in"); totRow.classList.add("in");
      if (total != null) num.textContent = fmtFull(total);
      check.classList.add("in"); checkW.style.transition = "none"; checkW.style.clipPath = "none";
      ruler.real.classList.add("in"); ruler.band.classList.add("in");
      if (culprit) culprit.classList.add("in");
      vig.classList.remove("on");
    }

    // The payoff: the napkin turns over and your score is on the back.
    function turnOver(onScore, quick) {
      var k = quick ? 0.5 : 1;
      over.classList.add("in");
      timers.push(setTimeout(function () {
        flip.classList.add("turned"); collapseTop(); over.classList.remove("in");
        timers.push(setTimeout(scrollToTop, 480));
      }, 700 * F * k));
      timers.push(setTimeout(function () { onScore(); }, 1250 * F * k));
      timers.push(setTimeout(function () { backBtn.classList.add("in"); }, 2900 * F * k));
    }

    // Straight to the finished, turned-over state (a revisit, or reduced motion).
    function showEnd() {
      node.classList.add("snap");
      finish(); flip.classList.add("turned"); collapseTop(); backBtn.classList.add("in");
      requestAnimationFrame(function () { requestAnimationFrame(function () { node.classList.remove("snap"); }); });
    }

    function play(onScore) {
      if (!rows.length) { finish(); turnOver(onScore, true); return; }
      var t = 300;
      at(t, function () { ruler.you.classList.add("in"); try { sfxLock(); } catch (x) { /* audio */ } });
      t = 1000;
      at(t, function () { say("Now watch the model…"); });
      rows.forEach(function (r, i) {
        var last = i === rows.length - 1, row = rowEls[i], val = steps[i];
        at(t, function () {
          row.classList.add("go");
          var n = 0, iv = setInterval(function () { tick(); if (++n > 4) clearInterval(iv); }, 120);
          timers.push(iv);
        });
        at(t + 600, function () { row.classList.add("ring"); tick(); });
        if (!last) at(t + 700, function () {
          ruler.dot.classList.add("in"); ruler.moveDot(val);
          totRow.classList.add("in"); setNum(val);
        });
        t += 900;
      });
      // the last multiplication: scramble, heartbeat, land it
      var finalText = fmtFull(total);
      at(t, function () { vig.classList.add("on"); sum.classList.add("in"); totRow.classList.add("in"); ruler.dot.classList.add("in", "tense"); say("Multiplying it all out…"); });
      at(t + 100, function () {
        var iv = setInterval(function () {
          var s = ""; for (var k = 0; k < finalText.length; k++) s += /\d/.test(finalText.charAt(k)) ? Math.floor(Math.random() * 10) : finalText.charAt(k);
          num.textContent = s; if (Math.random() < 0.3) tick();
        }, 70);
        timers.push(iv); timers.push(setTimeout(function () { clearInterval(iv); }, 1150 * F));
      });
      t += 1300;
      at(t, function () {
        setNum(total); ruler.dot.classList.remove("tense"); ruler.moveDot(total); vig.classList.remove("on");
        say("That's the model's answer."); try { sfxLock(); } catch (x) { /* audio */ }
      });
      t += 700;
      at(t, function () {
        check.classList.add("in"); say("Does that sound right?"); try { sfxDing(); } catch (x) { /* audio */ }
        checkW.style.transition = "none"; checkW.style.clipPath = "inset(-5px 100% -5px 0)"; void checkW.offsetWidth;
        checkW.style.transition = "clip-path " + (1.0 * F) + "s steps(22,end)"; checkW.style.clipPath = "inset(-5px 0 -5px 0)";
      });
      t += 1250;
      at(t, function () {
        ruler.real.classList.add("in"); ruler.band.classList.add("in"); if (culprit) culprit.classList.add("in");
        say("The real figure is " + util.humanize(real) + "."); tick();
      });
      t += 900;
      at(t, function () { say("Here's how you did."); turnOver(onScore, false); });
    }
    return { node: node, skipBtn: skipBtn, setBack: setBack, play: play, turnOver: turnOver, showEnd: showEnd, finish: finish, stop: stop };
  }

  // Close misses read better as a percentage ("14% away") than a multiplier;
  // order-of-magnitude misses read better the other way round ("40× off").
  // Shared by the scorecard and the share text so the framing is the same
  // everywhere. When the sensible-range floor lifted the score, say so.
  function scoreLine(sc) {
    var way = sc.dir === "high" ? "too high" : "too low";
    var miss = sc.ratio < 1.02 ? "spot on"
      : sc.ratio <= 2 ? Math.round((sc.ratio - 1) * 100) + "% " + way
      : util.roundFactor(sc.ratio) + "× " + way;
    return sc.floored ? miss + ", but inside the sensible range" : miss;
  }

  // The share text minus its link, which the card shows as a preview; the
  // link goes on the end when it's actually sent.
  function resultShareLines(q, res, sc) {
    var streak = storage.streak();
    var rowsBit = res.assisted
      ? "👀 assisted"
      : res.mode === "eyeball"
        ? "eyeballed"
        : (res.rows && res.rows.length ? res.rows.length + (res.rows.length === 1 ? " number" : " numbers") : "hand-called");
    var lines = [
      "Napkin #" + res.napkinNumber + " " + sc.band.emoji,
      scoreBar(sc) + " " + sc.points + "/100",
      scoreLine(sc) + " · " + rowsBit + " · " + streak + "-day streak"
    ];
    // Replying to someone's challenge: say how it went.
    var vs = todaysChallenge();
    if (vs && vs.n === res.napkinNumber) {
      var d = sc.points - vs.p, who = friendLabel(vs);
      lines.push(d > 0 ? "Beat " + who + " by " + d + " 😎" : d < 0 ? who + " beat me by " + (-d) + " 😤" : "Dead heat with " + who + " 🤝");
    }
    return lines;
  }

  // Ten squares filled by score, coloured by tier — readable at a glance in
  // a group chat, the way a Wordle grid is.
  var BAR_FILL = { bangon: "🟩", soclose: "🟩", goodshout: "🟨", ballpark: "🟨", notclose: "🟧", binit: "🟥" };
  function scoreBar(sc) {
    var filled = Math.max(sc.points > 0 ? 1 : 0, Math.round(sc.points / 10));
    var out = "";
    for (var i = 0; i < 10; i++) out += i < filled ? BAR_FILL[sc.band.key] : "⬜";
    return out;
  }

  /* ---------- share as a picture ----------
     A napkin with the question and your score on it, and nothing else: no
     working, so it gives nothing away to whoever hasn't played yet. */
  function wobblePath(ctx, x, y, w, h, j) {
    var pts = [], steps = 26, i, r = function () { return (Math.random() - 0.5) * j; };
    for (i = 0; i <= steps; i++) pts.push([x + w * i / steps + r(), y + r()]);
    for (i = 1; i <= steps; i++) pts.push([x + w + r(), y + h * i / steps + r()]);
    for (i = 1; i <= steps; i++) pts.push([x + w - w * i / steps + r(), y + h + r()]);
    for (i = 1; i < steps; i++) pts.push([x + r(), y + h - h * i / steps + r()]);
    ctx.beginPath();
    pts.forEach(function (p, k) { if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.closePath();
  }
  function wrapCanvasText(ctx, text, maxW) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function napkinImage(q, res, sc) {
    var W = 1080, H = 1350, c = document.createElement("canvas"), i;
    c.width = W; c.height = H;
    var x = c.getContext("2d");
    var font = function (px) { return px + "px 'Patrick Hand', 'Segoe Print', cursive"; };
    x.fillStyle = "#d9bb8d"; x.fillRect(0, 0, W, H);
    for (i = 0; i < W; i += 180) { x.fillStyle = "rgba(110,70,25,.2)"; x.fillRect(i, 0, 3, H); }
    for (i = 0; i < 1400; i++) { x.fillStyle = "rgba(90,55,15," + Math.random() * 0.07 + ")"; x.fillRect(Math.random() * W, Math.random() * H, 40 + Math.random() * 160, 1.5); }
    x.save(); x.translate(W / 2, 640); x.rotate(-0.022); x.translate(-W / 2, -640);
    var nx = 70, ny = 120, nw = 940, nh = 1040;
    x.shadowColor = "rgba(60,35,10,.45)"; x.shadowBlur = 40; x.shadowOffsetY = 26;
    wobblePath(x, nx, ny, nw, nh, 9); x.fillStyle = "#fbf8f1"; x.fill(); x.shadowColor = "transparent";
    x.save(); wobblePath(x, nx, ny, nw, nh, 0); x.clip();
    for (var yy = ny; yy < ny + nh; yy += 22) for (var xx = nx + ((yy / 22) % 2 ? 11 : 0); xx < nx + nw; xx += 22) {
      x.fillStyle = "rgba(130,100,60,.13)"; x.beginPath(); x.arc(xx, yy, 2.1, 0, 7); x.fill();
      x.fillStyle = "rgba(255,255,255,.9)"; x.beginPath(); x.arc(xx + 2, yy + 2, 1.5, 0, 7); x.fill();
    }
    x.fillStyle = "rgba(120,95,55,.2)"; x.fillRect(nx + nw / 2 - 1, ny, 2, nh); x.fillRect(nx, ny + nh / 2 - 1, nw, 2);
    x.fillStyle = "rgba(255,255,255,.85)"; x.fillRect(nx + nw / 2 + 1, ny, 2, nh); x.fillRect(nx, ny + nh / 2 + 1, nw, 2);
    x.restore();
    x.setLineDash([2, 10]); x.lineCap = "round"; x.lineWidth = 4; x.strokeStyle = "rgba(146,115,70,.55)";
    x.strokeRect(nx + 22, ny + 22, nw - 44, nh - 44); x.setLineDash([]);

    var cx = nx + nw / 2;
    x.textBaseline = "alphabetic"; x.textAlign = "center";
    x.fillStyle = "#6b655a"; x.font = font(38);
    x.fillText(res.napkinNumber ? "NAPKIN #" + res.napkinNumber : "NAPKIN", cx, ny + 110);
    x.fillStyle = "#2b2925"; x.font = font(72);
    var qy = ny + 240;
    wrapCanvasText(x, q.question, nw - 170).forEach(function (l) { x.fillText(l, cx, qy); qy += 86; });
    var sy = Math.max(qy + 190, ny + 640);
    x.fillStyle = "#3b3c41"; x.font = font(300); x.fillText(String(sc.points), cx - 70, sy);
    var pw = x.measureText(String(sc.points)).width;
    x.font = font(92); x.fillStyle = "#6b655a"; x.fillText("/100", cx - 70 + pw / 2 + 120, sy);
    x.strokeStyle = "#c2463a"; x.lineWidth = 8; x.beginPath();
    x.moveTo(cx - pw / 2 - 100, sy + 34); x.quadraticCurveTo(cx - 60, sy + 22, cx + pw / 2 + 200, sy + 32);
    x.moveTo(cx - pw / 2 - 80, sy + 62); x.quadraticCurveTo(cx - 40, sy + 54, cx + pw / 2 + 170, sy + 60); x.stroke();
    x.save(); x.translate(cx, sy + 200); x.rotate(-0.06);
    x.font = font(110);
    var label = sc.band.short.toUpperCase(), sw = x.measureText(label).width + 90;
    x.shadowColor = "rgba(60,15,10,.45)"; x.shadowBlur = 16; x.shadowOffsetY = 8; x.fillStyle = "#c2463a"; x.beginPath();
    if (x.roundRect) x.roundRect(-sw / 2, -92, sw, 140, 18); else x.rect(-sw / 2, -92, sw, 140);
    x.fill(); x.shadowColor = "transparent";
    x.fillStyle = "#fff8e8"; x.fillText(label, 0, 18); x.restore();
    x.restore();
    x.textAlign = "center"; x.fillStyle = "#2f2212"; x.font = font(64); x.fillText("Can you beat me?", W / 2, 1250);
    x.font = font(38); x.fillStyle = "#5a4526"; x.fillText("One question a day", W / 2, 1310);
    return c;
  }

  function shareNapkinImage(q, res, sc, btn) {
    function go() {
      var c = napkinImage(q, res, sc), url = c.toDataURL("image/png");
      var img = el("img", { src: url, alt: "Your napkin: the question and your score of " + sc.points + " out of 100" });
      var send = el("button", { class: "btn", type: "button" }, "Share");
      var close = el("button", { class: "btn ghost", type: "button" }, "Close");
      var overlay = el("div", { class: "demo-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Share your napkin" },
        el("div", { class: "sharecard" }, img, el("div", { class: "sharerow" }, send, close)));
      function shut() { if (overlay.parentNode) overlay.remove(); }
      close.addEventListener("click", shut);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) shut(); });
      send.addEventListener("click", function () {
        c.toBlob(function (b) {
          var file = new File([b], "my-napkin.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], text: "Napkin " + (res.napkinNumber || "") + ": " + sc.band.short + ", " + sc.points + "/100. Can you beat me?" }).catch(function () {});
          } else {
            var a = el("a", { href: url, download: file.name });
            document.body.appendChild(a); a.click(); a.remove();
          }
        });
      });
      document.body.appendChild(overlay);
      send.focus();
    }
    var ready = document.fonts && document.fonts.load ? document.fonts.load("40px 'Patrick Hand'") : Promise.resolve();
    ready.then(go, go);
  }

  function shareResult(text, btn) {
    if (navigator.share) { navigator.share({ text: text }).catch(function () {}); }
    else { copyText(text, btn); }
  }

  function buildAfter(container, q, res, opts) {
    var sc = scoring.score(res.guess, q);
    var band = sc.band;
    var ratioLine = scoreLine(sc);
    // In an interview the same six tiers read as the panel's vote.
    var verdict = opts.interview ? VERDICTS[band.key] : null;
    var roast = verdict ? verdict.feedback() : scoring.quip(band, sc.ratio, sc.dir);


    // One napkin holds the whole result: score, verdict, what you said against
    // the real figure, and the quip. No separate cards for each.
    var ansLabel = q.answer_type === "measured" ? "The real figure is " : "The accepted estimate is ";
    var facts = el("div", { class: "hero-facts hand" },
      "You said ", el("b", {}, util.humanize(res.guess)), ". " + ansLabel,
      el("b", {}, util.humanize(q.actual_answer)), ". " + ratioLine.charAt(0).toUpperCase() + ratioLine.slice(1) + ".");
    var isDaily = !opts.practice && !opts.interview;
    var vs = isDaily ? todaysChallenge() : null;
    if (vs && vs.n !== res.napkinNumber) vs = null;

    // The hero is the back of the model's napkin (see revealScreen), so it is
    // kept to what fits on one screen: score, stamp, facts, share, crowd.
    container.appendChild(el("div", { class: "hero " + band.key },
      el("div", { class: "hero-kicker" }, "Your score"),
      el("div", { class: "hero-points-row hand", role: "img", "aria-label": sc.points + " out of 100" },
        el("span", { class: "hero-points", "data-points": sc.points }, "0"),
        el("span", { class: "hero-outof" }, "/100")
      ),
      el("div", { class: "band-stamp" + (verdict && verdict.outcome === "up" ? " good" : "") }, verdict ? verdict.name : band.short),
      opts.interview ? interviewPromoLine() : null,
      facts,
      el("div", { class: "hero-quip", role: "status" }, opts.interview ? "“" + roast + "”" : roast),
      isDaily ? buildChallengeBlock(q, res, sc) : null,
      vs ? versusRow(vs, sc.points) : null,
      isDaily ? buildCrowdLine(res) : null,
      el("div", { class: "confetti", "aria-hidden": "true" })
    ));

    // The interview's next step comes straight after the verdict: the next
    // round, another go, or the letter that ends the run.
    if (opts.interview) container.appendChild(buildInterviewOutcome(q, res, sc));

    if (opts.interview) {
      container.appendChild(buildComparison(q, res));
    } else if (opts.practice) {
      container.appendChild(buildComparison(q, res));
      var again = el("button", { class: "btn" }, "Try another question");
      again.addEventListener("click", function () { STATE.practiceQ = null; STATE.view = "practice"; renderApp(); });
      container.appendChild(again);
    } else {
      container.appendChild(buildComparison(q, res));
      var st = storage.stats();
      container.appendChild(el("div", { class: "sendoff" },
        tallyMarks(st.streak),
        el("p", { class: "hand sendoff-text" },
          "Day " + st.streak + " on the wall. Napkin #" + (res.napkinNumber + 1) + " is tomorrow.")));
    }
  }

  // Pick out the single number you nailed and the single number that hurt
  // you most, so the hero can call out *why* you scored what you scored —
  // not just the final ratio.
  function buildHighlight(cmp) {
    // Lower-case the first letter of a label mid-sentence, but leave acronyms ("UK adults") alone.
    var lc = function (s) { return !s || /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); };
    var up = function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
    var tight = cmp.pairs.filter(function (p) { return p.verdict === "tight"; });
    var misses = cmp.pairs
      .filter(function (p) { return p.verdict === "low" || p.verdict === "high"; })
      .sort(function (a, b) { return (b.factor || 0) - (a.factor || 0); });
    var mvp = tight[0], culprit = misses[0];
    if (!mvp && !culprit) return null;
    if (mvp && culprit) {
      return "You nailed " + lc(mvp.model.label) + ". " + up(culprit.model.label) +
        " was the culprit, " + util.roundFactor(culprit.factor) + "× too " + culprit.verdict + ".";
    }
    if (mvp) return "Every number you used was spot on, especially " + lc(mvp.model.label) + ".";
    return up(culprit.model.label) + " was the culprit, " + util.roundFactor(culprit.factor) + "× too " + culprit.verdict + ".";
  }

  function verdictText(p) {
    if (p.verdict === "tight") return "on the money";
    if (p.verdict === "low") return "≈" + util.roundFactor(p.factor) + "× low";
    if (p.verdict === "high") return "≈" + util.roundFactor(p.factor) + "× high";
    return "didn't use this";
  }

  function buildComparison(q, res) {
    var cmp = scoring.compareRows(res.rows, q.framework);
    var box = el("details", { class: "compare" });
    box.appendChild(el("summary", { class: "hand" }, "Your napkin vs. one good way"));

    if (res.pad && res.pad.trim()) {
      box.appendChild(el("div", { class: "youwrote hand" }, res.pad.trim()));
    }

    if (!res.rows || !res.rows.length) {
      box.appendChild(el("p", { class: "muted" },
        res.mode === "eyeball"
          ? "You eyeballed this one — no numbers to compare. Here's the model's:"
          : "No numbers picked up from your scribble."));
    }

    var grid = el("div", { class: "cmp-grid" });
    grid.appendChild(el("div", { class: "cmp-h" }, "Variable"));
    grid.appendChild(el("div", { class: "cmp-h" }, "You"));
    grid.appendChild(el("div", { class: "cmp-h" }, "Model"));

    cmp.pairs.forEach(function (p) {
      grid.appendChild(el("div", { class: "cmp-var" },
        (p.model.op === "/" ? "÷ " : "× ") + p.model.label));

      var you = el("div", { class: "cmp-you" });
      if (p.user) {
        you.appendChild(el("span", {}, util.humanize(p.user.value)));
        you.appendChild(el("span", { class: "tag tag-" + p.verdict }, verdictText(p)));
      } else {
        you.appendChild(el("span", { class: "muted" }, "—"));
        you.appendChild(el("span", { class: "tag tag-skipped" }, "skipped"));
      }
      grid.appendChild(you);

      grid.appendChild(el("div", { class: "cmp-model" },
        util.humanize(p.model.model_value) + " " + p.model.unit));
    });
    box.appendChild(grid);

    if (cmp.extras.length) {
      box.appendChild(el("p", { class: "muted extras" }, "Extra rows you had: " +
        cmp.extras.map(function (e) { return (e.label || "(unlabeled)") + " = " + util.humanize(e.value); }).join(", ")));
    }

    var notes = el("ul", { class: "notes" });
    q.framework_notes.forEach(function (n) { notes.appendChild(el("li", {}, n)); });
    box.appendChild(notes);

    box.appendChild(el("p", { class: "muted sanity" }, "Gut check: " + q.sanity_check));
    return box;
  }

  // "How did I do vs. everyone else today", as one line on the scorecard.
  // Best-effort: if the backend is unreachable the line just disappears.
  function buildCrowdLine(res) {
    var line = el("div", { class: "hero-crowd" }, "Checking how everyone else did…");
    var api = window.NAPKIN.results;
    if (!api) { line.hidden = true; return line; }
    api.distribution(res.date).then(function (d) {
      var others = d.total - 1;
      var p = api.percentile(d.counts, d.total, res.band);
      line.textContent = p == null
        ? "First on today's napkin. The crowd will catch up."
        : "Better than " + p + "% of " + util.withCommas(others) + (others === 1 ? " other player" : " others") + " today.";
    }).catch(function () { line.hidden = true; });
    return line;
  }

  // The foot of the scorecard: your result as a friend will see it, and the
  // button that sends it as a challenge.
  function buildChallengeBlock(q, res, sc) {
    var lines = resultShareLines(q, res, sc);

    var card = el("div", { class: "hero-share" });

    // Sharing is the primary move. The name field only appears once you
    // reach for "Challenge a friend", so it is not a form under the stamp.
    var picBtn = el("button", { class: "btn", type: "button" }, "Share your napkin");
    picBtn.addEventListener("click", function () { shareNapkinImage(q, res, sc, picBtn); });

    var nameInput = el("input", {
      type: "text", class: "vs-name", maxlength: "20", autocomplete: "nickname",
      placeholder: "Your name (optional)", "aria-label": "Your name, so they know who to beat"
    });
    nameInput.value = storage.playerName();
    nameInput.addEventListener("input", function () { storage.setPlayerName(cleanName(nameInput.value)); });
    nameInput.hidden = true;

    var btn = el("button", { class: "btn ghost", type: "button" }, "Challenge a friend");
    btn.addEventListener("click", function () {
      if (nameInput.hidden) {
        nameInput.hidden = false; nameInput.focus();
        btn.textContent = "Send the challenge";
        return;
      }
      var link = challengeLink(res.napkinNumber, sc.points, nameInput.value);
      shareResult(lines.concat("Beat me: " + link).join("\n"), btn);
    });
    card.appendChild(el("div", { class: "hero-share-row" }, picBtn, btn));
    card.appendChild(nameInput);
    return card;
  }

  /* ---------- interview mode ----------
   * Five rounds to go from Aspiring APM to Head of Product at Napkin. Each
   * round is one question with a more senior interviewer. The same six score
   * tiers as everywhere else read as the panel's vote: Strong hire / Hire
   * promote you, Lean hire / Lean no hire get you another question at the
   * same level, No hire / Strong no hire end the run. No lifelines. The
   * highest rung you've reached is kept (storage.interviewBest). */
  var LADDER = [
    { title: "Aspiring APM" },
    { title: "Associate PM", round: "Recruiter screen", who: "Priya, Talent", emoji: "📋", difficulty: "medium",
      openers: ["Just a quick one to see how you think. Relax.", "No wrong answers here. Well, there are. Lots.", "The hiring manager asked me to throw you an estimate. Have a go."] },
    { title: "Product Manager", round: "Hiring manager", who: "Tom, Group PM", emoji: "☕", difficulty: "medium",
      openers: ["I care more about the working than the number. Mostly.", "Walk me through it like I'm a stakeholder.", "Take your time. I've blocked out twenty minutes."] },
    { title: "Senior PM", round: "Product-sense panel", who: "three PMs and a designer", emoji: "🧑‍💼", category: "product",
      openers: ["We love a framework. Talk us through it.", "Size it for us. We'll poke holes afterwards.", "Pretend we're the exec team and we've got five minutes."] },
    { title: "Lead PM", round: "VP of Product", who: "Anika, VP Product", emoji: "📈", difficulty: "hard",
      openers: ["I don't need precise. I need defensible.", "My last Lead PM got this one wrong. No pressure.", "Show me you can reason when the data's thin."] },
    { title: "Head of Product", round: "The founder", who: "who invented the napkin", emoji: "🎩", difficulty: "hard",
      openers: ["I built this company on the back of a napkin. Your turn.", "One question. Then we talk equity.", "Impress me and the job's yours."] }
  ];

  function pickOne(list) { return list[Math.floor(Math.random() * list.length)]; }

  // The six score tiers as a hiring panel's vote, each with the interviewer's feedback.
  function verdict(name, short, emoji, outcome, lines) {
    var last = null;
    return {
      name: name, short: short, emoji: emoji, outcome: outcome,
      feedback: function () {
        var pool = lines.filter(function (l) { return l !== last; });
        last = pickOne(pool);
        return last;
      }
    };
  }
  var VERDICTS = {
    bangon: verdict("Strong hire", "Strong hire", "🎉", "up", [
      "Best framework I've seen this quarter.",
      "Can you start Monday?",
      "I've stopped taking notes. No need.",
      "That's going in the hiring doc as the example answer.",
      "Honestly? Better than mine.",
      "Clean structure, right answer. Rare combination."
    ]),
    soclose: verdict("Hire", "Hire", "🤝", "up", [
      "Strong structure. Slightly off on one input. Would work with.",
      "Good instincts. I'd back you in a roadmap review.",
      "Clear thinking, sensible assumptions. Moving you forward.",
      "A couple of numbers were generous, but the logic held.",
      "Solid. You showed your working and it showed."
    ]),
    goodshout: verdict("Lean hire", "Lean hire", "🙂", "hold", [
      "Right shape, wobbly numbers. One more before we decide.",
      "I liked the framework. I didn't love the answer.",
      "You'd be fine. We're looking for better than fine.",
      "Close to a yes. Show me it wasn't luck.",
      "Promising. Let's see another."
    ]),
    ballpark: verdict("Lean no hire", "Lean no", "🤔", "hold", [
      "Right instincts, shaky numbers. One more question before we decide.",
      "I'm on the fence and the fence is uncomfortable.",
      "Some good bits in there. Some very not good bits.",
      "Let's try another one and pretend that didn't happen.",
      "The panel is \"aligning offline\". Have another go."
    ]),
    notclose: verdict("No hire", "No hire", "😬", "out", [
      "Thanks for your time. We'll be in touch. (We won't.)",
      "The assumptions didn't survive contact with reality.",
      "I lost you at the second line.",
      "Not a fit for this level, I'm afraid.",
      "Interesting approach. Wrong, but interesting."
    ]),
    binit: verdict("Strong no hire", "Strong no", "🚪", "out", [
      "Security will see you out.",
      "I'm going to need that napkin back.",
      "We've circulated this internally. As a warning.",
      "Did you hear the question?",
      "That wasn't an estimate, that was a guess wearing a tie."
    ])
  };

  // Five pips: one per round, green once passed, amber for a second chance.
  function roundPips(level, held) {
    var row = el("div", { class: "iv-pips", "aria-label": level + " of 5 rounds passed" });
    for (var i = 0; i < 5; i++) {
      row.appendChild(el("span", { class: i < level ? "on" : (i === level && held ? "hold" : "") }));
    }
    return row;
  }

  function pickInterviewQuestion(iv) {
    var round = LADDER[iv.level + 1];
    var fits = function (q) { return round.category ? q.category === round.category : q.difficulty === round.difficulty; };
    var pool = QUESTIONS.filter(function (q) { return !iv.used[q.id] && fits(q); });
    if (!pool.length) pool = QUESTIONS.filter(function (q) { return !iv.used[q.id]; });
    if (!pool.length) { iv.used = {}; pool = QUESTIONS.slice(); }
    var q = pickOne(pool);
    iv.used[q.id] = true;
    iv.lastId = q.id;
    iv.opener = pickOne(round.openers);
  }

  function startInterview() {
    STATE.interview = {
      level: 0, held: false, used: {}, lastId: null, opener: "",
      over: false, hired: false, last: null, startBest: storage.interviewBest()
    };
    pickInterviewQuestion(STATE.interview);
    STATE.view = "interview";
    renderApp();
  }

  // Settles the round and deals the next question straight away, so going
  // back to the tab can't re-answer the one just marked.
  function applyInterviewResult(sc) {
    var iv = STATE.interview, v = VERDICTS[sc.band.key];
    iv.last = { outcome: v.outcome, from: iv.level, ratio: sc.ratio, question: byId(iv.lastId) };
    if (v.outcome === "up") { iv.level += 1; iv.held = false; storage.recordInterviewBest(iv.level); }
    else if (v.outcome === "hold") { iv.held = true; }
    else { iv.over = true; }
    if (iv.level >= 5) { iv.over = true; iv.hired = true; }
    if (!iv.over) pickInterviewQuestion(iv);
  }

  function interviewPromoLine() {
    var iv = STATE.interview, last = iv.last;
    if (last.outcome === "up") {
      return el("div", { class: "iv-promo up" }, iv.hired ? "▲ Hired as Head of Product" : "▲ Promoted to " + LADDER[iv.level].title);
    }
    if (last.outcome === "hold") return el("div", { class: "iv-promo hold" }, "No promotion yet. They want to see one more.");
    return el("div", { class: "iv-promo out" }, "Out in the " + LADDER[last.from + 1].round.toLowerCase() + " round");
  }

  // 🟩 per round passed, 🟥 for the one that ended it, ⬜ for the rest.
  function interviewBar(iv) {
    var s = "";
    for (var i = 0; i < 5; i++) s += i < iv.level ? "🟩" : (i === iv.level && !iv.hired ? "🟥" : "⬜");
    return s;
  }

  function interviewShareText(iv) {
    if (iv.hired) {
      return ["Thrilled to announce I'm the new Head of Product at Napkin 🎉",
        interviewBar(iv) + " five rounds, zero lifelines", SITE_URL].join("\n");
    }
    var miss = util.roundFactor(iv.last.ratio) + "× miss";
    return ["Open to work 👀",
      iv.level
        ? "Made it to " + LADDER[iv.level].title + " at Napkin before a " + miss + " in the " + LADDER[iv.last.from + 1].round.toLowerCase() + " round."
        : "Bombed the recruiter screen at Napkin with a " + miss + ".",
      interviewBar(iv), SITE_URL].join("\n");
  }

  // Brand and subtitle on the left, the stamp on the right, so the stamp never
  // lands on the letter text at phone width.
  function letterhead(sub, stamp, kind) {
    return el("div", { class: "letterhead" },
      el("div", { class: "letterhead-text" }, el("span", { class: "letter-brand hand" }, "Napkin."), el("span", { class: "muted" }, sub)),
      el("span", { class: "letter-stamp " + kind + " hand" }, stamp));
  }

  function rejectionLetter(iv) {
    var role = LADDER[iv.last.from + 1].title;
    var reached = iv.level ? LADDER[iv.level].title : null;
    return el("div", { class: "letter" },
      letterhead("Sent from a phone, obviously", "Rejected", "rejected"),
      el("p", {}, "Dear candidate,"),
      el("p", {}, "Thank you for your interest in the " + role + " role. After careful consideration (about four seconds), we won't be moving forward."),
      el("p", {}, "You were ", el("b", {}, util.roundFactor(iv.last.ratio) + "× off"), " on “" + iv.last.question.question + "”"),
      el("p", {}, reached
        ? ["You made it to ", el("span", { class: "letter-mark hand" }, reached), ". We'll keep your napkin on file."]
        : "You didn't make it past the recruiter. We'll keep your napkin on file. Somewhere."),
      el("p", { class: "muted" }, "Best of luck with your search,", el("br"), "Talent team")
    );
  }

  function offerLetter() {
    return el("div", { class: "letter" },
      letterhead("Offer of employment", "Hired", "hired"),
      el("p", {}, "Dear Head of Product,"),
      el("p", {}, "We're delighted to offer you the role. Five rounds, five promotions, no lifelines."),
      el("dl", { class: "terms" },
        el("dt", {}, "Role"), el("dd", {}, "Head of Product"),
        el("dt", {}, "Salary"), el("dd", {}, "3 biscuits a day, rising to 4 on review"),
        el("dt", {}, "Equity"), el("dd", {}, "0.5% of the napkin"),
        el("dt", {}, "Start date"), el("dd", {}, "Tomorrow's Napkin")
      ),
      el("span", { class: "letter-sig hand" }, "The founder")
    );
  }

  function buildInterviewOutcome(q, res, sc) {
    var iv = STATE.interview;
    var box = el("div", { class: "iv-outcome" });

    if (!iv.over) {
      box.appendChild(roundPips(iv.level, iv.held));
      var next = el("button", { class: "btn" }, iv.last.outcome === "up"
        ? "Next round: " + LADDER[iv.level + 1].round + " ▸"
        : "Try another question ▸");
      next.addEventListener("click", function () { STATE.view = "interview"; renderApp(); });
      box.appendChild(next);
      return box;
    }

    box.appendChild(iv.hired ? offerLetter() : rejectionLetter(iv));
    if (iv.level > iv.startBest && !iv.hired) {
      box.appendChild(el("p", { class: "iv-best hand" }, "Furthest you've ever got 🏆"));
    }
    var share = el("button", { class: "btn" }, iv.hired ? "Share my offer" : "Share it");
    share.addEventListener("click", function () { shareResult(interviewShareText(iv), share); });
    var again = el("button", { class: "btn ghost" }, iv.hired ? "Go again" : "Reapply");
    again.addEventListener("click", startInterview);
    box.appendChild(el("div", { class: "iv-actions" }, share, again));
    return box;
  }

  function viewInterviewIntro() {
    var wrap = el("section", { class: "screen interview-intro" });
    wrap.appendChild(el("h2", { class: "hand" }, "Interview mode"));
    wrap.appendChild(el("p", { class: "lede" },
      "Get hired as Head of Product at Napkin. Five rounds, each one a question and a more senior interviewer. No lifelines, no eyeballing: show your working."));

    var best = storage.interviewBest();
    var career = el("div", { class: "career panel" });
    for (var i = LADDER.length - 1; i >= 0; i--) {
      var r = LADDER[i];
      career.appendChild(el("div", { class: "rung" + (i <= best ? " done" : "") + (i === best ? " best" : "") + (i === 5 ? " goal" : "") },
        el("span", { class: "rung-n hand" }, String(i)),
        el("span", { class: "rung-title" }, r.title),
        el("span", { class: "rung-who muted" }, i === 0 ? "where you start" : r.round + " · " + r.who)
      ));
    }
    wrap.appendChild(career);

    wrap.appendChild(el("div", { class: "rulebox" },
      el("h3", { class: "rulebox-title" }, "How the panel votes"),
      el("dl", { class: "rulelist" },
        el("dt", {}, "🤝 Strong hire · Hire"), el("dd", {}, "Promoted to the next rung."),
        el("dt", {}, "🤔 Lean hire · Lean no hire"), el("dd", {}, "No promotion. They want to see another one."),
        el("dt", {}, "🚪 No hire · Strong no hire"), el("dd", {}, "You're out.")
      )
    ));

    if (best > 0) wrap.appendChild(el("p", { class: "muted" }, "Furthest you've got: ", el("b", {}, LADDER[best].title)));
    var start = el("button", { class: "btn" }, STATE.interview && STATE.interview.over ? "Reapply" : "Start the interview");
    start.addEventListener("click", startInterview);
    wrap.appendChild(start);
    return wrap;
  }

  /* ---------- practice list ---------- */
  // A handful of free questions spanning different categories — Greggs and
  // the coastline are the two that best show off the game, plus one each
  // from sport, transport, everyday-life and the product-flavoured set.
  var PRACTICE_FREE_IDS = ["q0006", "q0001", "q0005", "q0007", "q0019", "q0003"];

  function viewPracticeList() {
    var wrap = el("section", { class: "screen practice" });
    wrap.appendChild(el("h2", { class: "hand" }, "Practice — any question, any time"));
    wrap.appendChild(el("p", { class: "muted" }, "Untimed, retries allowed, nothing recorded."));

    var played = {};
    storage.load().results.forEach(function (r) { played[r.questionId] = 1; });

    var order = (window.NAPKIN.dailyOrder || []).map(byId).filter(Boolean);
    QUESTIONS.forEach(function (q) { if (order.indexOf(q) === -1) order.push(q); });

    var free = PRACTICE_FREE_IDS.map(byId).filter(Boolean);
    var freeIds = {};
    free.forEach(function (q) { freeIds[q.id] = 1; });
    var locked = order.filter(function (q) { return !freeIds[q.id]; });

    var list = el("div", { class: "qlist" });
    function addCard(q, i) {
      var item = el("button", { class: "qcard" },
        el("span", { class: "qnum" }, "#" + (i + 1)),
        el("span", { class: "qtext" }, q.question),
        el("span", { class: "qmeta muted" }, q.category + " · " + q.difficulty + (played[q.id] ? " · ✓ done" : ""))
      );
      item.addEventListener("click", function () { STATE.practiceQ = q; renderApp(); });
      list.appendChild(item);
    }
    free.forEach(function (q, i) { addCard(q, i); });

    if (locked.length) {
      // No real paywall yet — this is a placeholder for the idea. Clicking
      // it just reveals the rest of the list in place.
      var unlockBtn = el("button", { class: "btn" }, "Unlock — £1.99");
      var paywall = el("div", { class: "paywall" },
        el("div", { class: "paywall-lock" }, "🔒"),
        el("div", { class: "hand paywall-title" }, locked.length + " more questions"),
        el("p", { class: "muted" }, "Unlock the full practice library."),
        unlockBtn
      );
      unlockBtn.addEventListener("click", function () {
        paywall.remove();
        locked.forEach(function (q, i) { addCard(q, free.length + i); });
      });
      list.appendChild(paywall);
    }

    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- stats ---------- */
  // Your own band distribution, reusing the same chart the daily reveal
  // uses for "today's players" — here it's your whole history instead,
  // computed locally with no network call.
  // A pencil doodle per tier, in place of the emoji: a bullseye, a tick, a
  // star, a wave, a shrug and a scrunched ball.
  var TIER_MARKS = {
    bangon: "M12 3a9 9 0 1 0 0.01 0 M12 8a4 4 0 1 0 0.01 0 M12 12h0.01",
    soclose: "M4 13 L10 19 L21 5",
    goodshout: "M12 3 L14.6 9.2 L21 9.8 L16.2 14 L17.7 20.5 L12 17 L6.3 20.5 L7.8 14 L3 9.8 L9.4 9.2 Z",
    ballpark: "M3 9 Q7 4 12 9 T21 9 M3 16 Q7 11 12 16 T21 16",
    notclose: "M4 17 L9 8 L13 16 L17 7 L20 13",
    binit: "M6 6 L14 4 L20 9 L19 17 L12 20 L5 16 Z M9 9 L14 11 M11 15 L16 14"
  };
  function tierMark(key) {
    return elNS("svg", { class: "tier-mark", viewBox: "0 0 24 24", "aria-hidden": "true" }, elNS("path", { d: TIER_MARKS[key] || "" }));
  }

  function buildPersonalDistribution(bandCounts) {
    var total = 0;
    scoring.BANDS.forEach(function (b) { total += bandCounts[b.key] || 0; });
    var box = el("div", { class: "distbox" });
    if (!total) {
      box.appendChild(el("div", { class: "muted" }, "No games yet — go do today's."));
      return box;
    }
    box.appendChild(el("div", { class: "muted" }, "How your napkins went: " + total + (total === 1 ? " game" : " games")));
    scoring.BANDS.forEach(function (b) {
      var count = bandCounts[b.key] || 0;
      if (!count) return;                       // an empty tier is just an empty bar
      var pct = Math.round((count / total) * 100);
      box.appendChild(el("div", { class: "distrow " + b.key },
        tierMark(b.key),
        el("span", { class: "dist-label" }, b.label),
        el("div", { class: "distbar-track" }, el("div", { class: "distbar-fill", style: "--p:" + (pct / 100) })),
        el("span", { class: "dist-pct" }, pct + "%")
      ));
    });
    return box;
  }

  function viewStats() {
    var s = storage.stats();
    var wrap = el("section", { class: "screen stats" });
    wrap.appendChild(el("h2", { class: "hand" }, "Your run"));

    // The wall comes first: the streak as tally gates, then the pile of napkins.
    var grid = el("div", { class: "statgrid" });
    var streakCard = el("div", { class: "stat streakstat" },
      s.streak ? tallyMarks(s.streak) : null,
      el("div", { class: "stat-val hand streak-num" }, s.streak + (s.streak === 1 ? " day" : " days")),
      el("div", { class: "stat-label muted" }, "Streak"));
    grid.appendChild(streakCard);
    grid.appendChild(stat("Avg score", s.avgPoints == null ? "—" : s.avgPoints + "/100"));
    wrap.appendChild(grid);
    wrap.appendChild(el("p", { class: "muted playedline" },
      s.played + (s.played === 1 ? " day played" : " days played") +
      " · longest streak " + s.longestStreak +
      (s.bestPoints != null ? " · best " + s.bestPoints + "/100" : "")));

    wrap.appendChild(pileBox(s.series));
    wrap.appendChild(buildPersonalDistribution(s.bandCounts));

    var backup = el("div", { class: "backup" });
    backup.appendChild(el("h3", { class: "hand" }, "Backup"));
    backup.appendChild(el("p", { class: "muted" }, "History backs up quietly to the cloud on this device, but export a copy too — it's the only thing that moves your streak to another device."));
    var exp = el("button", { class: "btn" }, "Export history (.json)");
    exp.addEventListener("click", downloadHistory);
    var imp = el("button", { class: "btn ghost" }, "Import history");
    var file = el("input", { type: "file", accept: "application/json" });
    file.style.display = "none";
    file.addEventListener("change", function (e) { importHistory(e.target.files[0]); e.target.value = ""; });
    imp.addEventListener("click", function () { file.click(); });
    backup.appendChild(exp);
    backup.appendChild(imp);
    backup.appendChild(file);
    wrap.appendChild(backup);

    return wrap;
  }

  function stat(label, value) {
    return el("div", { class: "stat" },
      el("div", { class: "stat-val hand" }, value),
      el("div", { class: "stat-label muted" }, label)
    );
  }

  /* ---------- backup ---------- */
  function downloadHistory() {
    var blob = new Blob([storage.exportJSON()], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: "napkin-history-" + storage.todayISO() + ".json" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function importHistory(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        storage.importJSON(String(reader.result));
        renderApp();
        showNotice("History imported. Your pile is back on the table.");
      } catch (e) {
        showNotice("That file didn't work: " + e.message + " Try the .json you exported from Napkin.");
      }
    };
    reader.readAsText(file);
  }

  /* ---------- feedback ---------- */
  // Web3Forms: a free access key (from web3forms.com, no account needed)
  // lets a static site POST straight to an inbox with no backend of our own.
  var FEEDBACK_ACCESS_KEY = "a44abe06-e067-4547-b258-1e2fad68ac42";
  var FEEDBACK_REACTIONS = [
    { key: "spoton", label: "🎯 Spot on" },
    { key: "confusing", label: "🤔 Confusing" },
    { key: "idea", label: "💡 Idea" },
    { key: "broken", label: "🐛 Something broke" }
  ];
  function openFeedbackModal() {
    var picked = null;

    var chips = FEEDBACK_REACTIONS.map(function (r) {
      var chip = el("button", { class: "feedback-chip", type: "button" }, r.label);
      chip.addEventListener("click", function () {
        picked = r.key;
        chips.forEach(function (c) { c.classList.remove("selected"); });
        chip.classList.add("selected");
        textWrap.hidden = false;
        submitBtn.disabled = false;
      });
      return chip;
    });
    var chipRow = el("div", { class: "feedback-chips" }, chips);

    var textarea = el("textarea", { class: "feedback-text", rows: 3, placeholder: "Anything to add? (optional)" });
    var textWrap = el("div", { class: "feedback-textwrap", hidden: true }, textarea);

    var status = el("div", { class: "muted feedback-status" });
    var submitBtn = el("button", { class: "btn submit", type: "button", disabled: true }, "Send");
    var cancelBtn = el("button", { class: "linkbtn", type: "button" }, "Never mind");

    submitBtn.addEventListener("click", function () {
      if (!picked) return;
      var reaction = FEEDBACK_REACTIONS.filter(function (r) { return r.key === picked; })[0];
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      status.textContent = "";
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: FEEDBACK_ACCESS_KEY,
          subject: "Napkin feedback: " + reaction.label,
          reaction: reaction.label,
          message: textarea.value.trim() || "(no extra note)",
          view: STATE.view,
          date: storage.todayISO()
        })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data && data.success) {
          card.innerHTML = "";
          var doneBtn = el("button", { class: "linkbtn modal-close", type: "button" }, "Close");
          doneBtn.addEventListener("click", close);
          card.appendChild(el("div", { class: "hand big" }, "Noted."));
          card.appendChild(el("p", {}, "Thanks for scribbling that down."));
          card.appendChild(doneBtn);
          setTimeout(close, 1800);
        } else {
          throw new Error("send failed");
        }
      }).catch(function () {
        status.textContent = "Couldn't send that — try again in a bit.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Send";
      });
    });

    var card = el("div", { class: "demo-modal feedback-modal" },
      el("div", { class: "hand big" }, "Scribble us a note"),
      el("p", { class: "muted" }, "What's this about?"),
      chipRow,
      textWrap,
      submitBtn,
      status,
      cancelBtn
    );
    var overlay = el("div", { class: "demo-overlay" }, card);
    function close() { if (overlay.parentNode) overlay.remove(); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    cancelBtn.addEventListener("click", close);
    document.body.appendChild(overlay);
  }

  /* ---------- misc ---------- */
  // Scraps of ink and paper flung out from the score for a top-tier result.
  var CONFETTI_COLORS = ["#3a3b40", "#b23b2e", "#4a8a4a", "#bd8420", "#8a5a2b", "#3c8a82"];
  function burstConfetti(host, n) {
    if (!host) return;
    try { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch (e) { /* old browser */ }
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      var dist = 90 + Math.random() * 110;
      var bit = el("span", { class: "confetto" + (i % 3 === 0 ? " round" : "") });
      bit.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      bit.style.setProperty("--dy", Math.sin(angle) * dist * 0.75 - 30 + "px");
      bit.style.setProperty("--rot", Math.round(Math.random() * 540 - 270) + "deg");
      bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      bit.style.animationDelay = Math.round(Math.random() * 90) + "ms";
      host.appendChild(bit);
    }
    setTimeout(function () { host.innerHTML = ""; }, 1800);
  }

  /* ---------- the pile ----------
     Every finished napkin joins a pile on the Stats tab: great ones are
     pinned up, middling ones kept, real misses scrunched into a ball. */
  function pileTone(points) { return points >= 86 ? "pinned" : points < 40 ? "scrunched" : "kept"; }
  function pileCaption(points) {
    var t = pileTone(points);
    return t === "pinned" ? "Pinned up on the wall."
      : t === "scrunched" ? "Scrunched up and lobbed at the bin."
      : "Saved to your pile.";
  }

  // A ragged paper ball: a wobbly outline plus a few crease lines, seeded by
  // the napkin number so the same miss always crumples the same way.
  function crumpledSvg(seed) {
    function rnd(k) { var x = Math.sin(seed * 97.13 + k * 12.9898) * 43758.5453; return x - Math.floor(x); }
    var pts = [], creases = "", N = 11;
    for (var i = 0; i < N; i++) {
      var a = (Math.PI * 2 * i) / N, r = 34 + rnd(i) * 11;
      pts.push((50 + Math.cos(a) * r).toFixed(1) + "," + (50 + Math.sin(a) * r).toFixed(1));
    }
    for (var c = 0; c < 4; c++) {
      var x1 = 24 + rnd(20 + c) * 52, y1 = 22 + rnd(30 + c) * 56;
      creases += "M" + x1.toFixed(1) + "," + y1.toFixed(1) + " l" + (rnd(40 + c) * 30 - 15).toFixed(1) + "," + (rnd(50 + c) * 26 - 8).toFixed(1) + " ";
    }
    return elNS("svg", { class: "ball", viewBox: "0 0 100 100", "aria-hidden": "true" },
      elNS("polygon", { points: pts.join(" "), class: "ball-body" }),
      elNS("path", { d: creases, class: "ball-crease" })
    );
  }

  function napkinTile(d) {
    var tone = pileTone(d.points);
    var tilt = ((Math.sin(d.n * 7.7) * 3.2)).toFixed(1) + "deg";
    var tile = el("div", { class: "tile " + tone, style: "--tilt:" + tilt, title: "Napkin #" + d.n + " · " + d.points + "/100" });
    if (tone === "scrunched") tile.appendChild(crumpledSvg(d.n));
    else tile.appendChild(el("span", { class: "tile-sheet" }));
    if (tone === "pinned") tile.appendChild(el("span", { class: "tile-pin" }));
    tile.appendChild(el("span", { class: "tile-pts hand" }, String(d.points)));
    tile.appendChild(el("span", { class: "tile-n" }, "#" + d.n));
    return tile;
  }

  function pileBox(series) {
    var box = el("div", { class: "pilebox" });
    box.appendChild(el("h3", { class: "hand pile-title" }, "Your pile"));
    if (!series.length) {
      box.appendChild(el("p", { class: "muted" }, "Empty table. Finish today's napkin and it lands here."));
      return box;
    }
    var grid = el("div", { class: "pile" });
    series.slice().reverse().forEach(function (d) { grid.appendChild(napkinTile(d)); });
    box.appendChild(grid);
    return box;
  }

  // Five-bar gates, the way you'd count days on a pub wall.
  function tallyMarks(n) {
    var cap = Math.min(n, 40), x = 4, parts = [];
    var svg = elNS("svg", { class: "tally-marks", viewBox: "0 0 " + (Math.ceil(cap / 5) * 34 + 6) + " 30", "aria-hidden": "true" });
    for (var g = 0; g < Math.ceil(cap / 5); g++) {
      var inGroup = Math.min(5, cap - g * 5);
      for (var i = 0; i < Math.min(4, inGroup); i++) {
        var lx = x + i * 6 + (((g + i) % 3) - 1) * 0.6;
        svg.appendChild(elNS("path", { d: "M" + lx + ",4 L" + (lx + 0.8) + ",26" }));
      }
      if (inGroup === 5) svg.appendChild(elNS("path", { d: "M" + (x - 3) + ",22 L" + (x + 27) + ",8" }));
      x += 34;
    }
    return svg;
  }

  // The fresh napkin flies to the Stats tab: pinned or flat if it did well,
  // scrunched and lobbed if it did not.
  function dropIntoPile(fromNode, points) {
    var tab = document.querySelector('.tab[data-view="stats"]');
    if (!fromNode || !tab) return;
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { /* old browser */ }
    function bump() { tab.classList.remove("bump"); void tab.offsetWidth; tab.classList.add("bump"); }
    if (reduce || !fromNode.animate) { bump(); return; }
    var a = fromNode.getBoundingClientRect(), b = tab.getBoundingClientRect();
    var tone = pileTone(points);
    var sheet = el("div", { class: "drop " + tone }, el("span", { class: "hand" }, String(points)));
    if (tone === "pinned") sheet.appendChild(el("span", { class: "tile-pin" }));
    sheet.style.left = a.left + a.width / 2 - 32 + "px";
    sheet.style.top = a.top + a.height / 2 - 32 + "px";
    document.body.appendChild(sheet);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    var anim;
    if (tone === "scrunched") {
      sheet.style.clipPath = "polygon(0 0,100% 0,100% 100%,0 100%)";
      anim = sheet.animate([
        { transform: "scale(1) rotate(0)", clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", offset: 0 },
        { transform: "scale(0.82) rotate(-14deg)", clipPath: "polygon(8% 4%,52% 12%,94% 0,88% 50%,100% 92%,50% 84%,6% 100%,14% 48%)", offset: 0.3 },
        { transform: "translate(" + dx * 0.4 + "px," + (dy * 0.4 - 90) + "px) scale(0.5) rotate(200deg)", clipPath: "polygon(20% 10%,60% 20%,90% 14%,82% 56%,88% 88%,46% 80%,14% 92%,22% 50%)", offset: 0.65 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(0.22) rotate(420deg)", clipPath: "polygon(20% 10%,60% 20%,90% 14%,82% 56%,88% 88%,46% 80%,14% 92%,22% 50%)", opacity: 0.9, offset: 1 }
      ], { duration: 1300, easing: ease, fill: "forwards" });
    } else {
      anim = sheet.animate([
        { transform: "scale(0.6) rotate(-6deg)", opacity: 0, offset: 0 },
        { transform: "scale(1.15) rotate(3deg)", opacity: 1, offset: 0.25 },
        { transform: "scale(1) rotate(-2deg)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(0.25) rotate(8deg)", opacity: 0.95, offset: 1 }
      ], { duration: 1200, easing: ease, fill: "forwards" });
    }
    anim.onfinish = function () { sheet.remove(); bump(); try { sfxTick(); } catch (e) { /* audio is optional */ } };
  }

  function prefersReducedMotion() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }

  // A notice in the napkin's own voice, in place of the browser's alert().
  function showNotice(message) {
    var ok = el("button", { class: "btn", type: "button" }, "Got it");
    var card = el("div", { class: "demo-modal info-modal", role: "dialog", "aria-modal": "true" },
      el("p", { class: "hand big" }, message), ok);
    var overlay = el("div", { class: "demo-overlay" }, card);
    function close() { if (overlay.parentNode) overlay.remove(); }
    ok.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    ok.focus();
  }

  function countUp(node, target) {
    if (!node) return;
    var dur = 900, start = performance.now();
    function step(now) {
      var p = Math.max(0, Math.min(1, (now - start) / dur));
      var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      node.textContent = util.withCommas(v);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function copyText(txt, btn) {
    var original = btn.textContent;
    function done() {
      btn.textContent = "Copied ✓";
      setTimeout(function () { btn.textContent = original; }, 1500);
    }
    function fallback() {
      var ta = el("textarea", {});
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); done(); }
      catch (e) { btn.textContent = "Copy failed"; }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function () {
        STATE.view = this.getAttribute("data-view");
        STATE.practiceQ = null;
        renderApp();
      });
    }
    var feedbackBtn = document.getElementById("feedbackBtn");
    if (feedbackBtn) feedbackBtn.addEventListener("click", openFeedbackModal);
    takeChallengeFromUrl();
    renderApp();

    // Best-effort cloud backup: re-render only if it actually pulled in
    // history this device didn't already have (e.g. first load after a
    // cleared cache), so a normal visit never has to wait on it.
    if (storage.initCloudSync) storage.initCloudSync(function () { renderApp(); });
  });
})();
