/* UI + wiring. Plain DOM, no framework. See plan.md sections 1, 8, 9. */
(function () {
  "use strict";

  var util = window.NAPKIN.util;
  var scoring = window.NAPKIN.scoring;
  var storage = window.NAPKIN.storage;
  var QUESTIONS = window.NAPKIN.questions;

  var STATE = { view: "daily", practiceQ: null, challenge: null, challengeDifficulty: "hard" };

  // The scribble-pad placeholder — always this generic "type out your thinking"
  // template, so it never looks like an answer to the day's question.
  var PAD_HINT =
    "Write out your thinking — numbers get picked up.\n\n" +
    "For example:\n" +
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
    else if (STATE.view === "challenge") {
      node = (STATE.challenge && !STATE.challenge.over)
        ? napkinScreen(byId(STATE.challenge.lastId), { challenge: true })
        : viewChallengeIntro();
    }
    else node = viewStats();
    mount(node);
  }

  function viewDaily() {
    var todays = storage.resultForDate(storage.todayISO());
    if (todays) {
      var q = byId(todays.questionId) || storage.currentQuestion(QUESTIONS);
      return revealScreen(q, todays, { practice: false });
    }
    return napkinScreen(storage.currentQuestion(QUESTIONS), { practice: false });
  }
  function byId(id) {
    return QUESTIONS.filter(function (q) { return q.id === id; })[0] || null;
  }

  /* ---------- the napkin screen ---------- */
  function napkinScreen(q, opts) {
    opts = opts || {};
    var isEasyChallenge = !!(opts.challenge && STATE.challenge && STATE.challenge.difficulty === "easy");
    var wrap = el("section", { class: "screen napkin" });

    if (opts.practice) {
      var back = el("button", { class: "linkbtn" }, "‹ Back to list");
      back.addEventListener("click", function () { STATE.practiceQ = null; renderApp(); });
      wrap.appendChild(back);
    } else if (opts.challenge) {
      var quit = el("button", { class: "linkbtn" }, "‹ Quit run");
      quit.addEventListener("click", function () {
        if (!window.confirm("Quit this run? Your streak ends here.")) return;
        STATE.challenge = null;
        renderApp();
      });
      wrap.appendChild(quit);
      wrap.appendChild(el("div", { class: "chud-row" },
        heartsNode(STATE.challenge.lives, STATE.challenge.maxLives),
        el("span", { class: "chud-streak hand streak-big" }, fireLabel(STATE.challenge.streak)),
        el("span", { class: "chud-diff muted" }, STATE.challenge.difficulty === "easy" ? "Easy" : "Hard")
      ));
      var chase = bestChaseLabel(STATE.challenge.streak);
      if (chase) wrap.appendChild(el("p", { class: "muted chud-chase" }, chase));
    } else {
      wrap.appendChild(el("div", { class: "daychip" },
        el("span", { class: "chip" }, "Napkin #" + (storage.dayNumber() + 1)),
        el("span", { class: "muted" }, storage.todayISO())
      ));
    }

    wrap.appendChild(el("h1", { class: "question hand" }, q.question));

    if (q.clarifications && q.clarifications.length) {
      var det = el("details", { class: "fineprint" });
      det.appendChild(el("summary", {}, "The fine print"));
      var ul = el("ul", {});
      q.clarifications.forEach(function (c) { ul.appendChild(el("li", {}, c)); });
      det.appendChild(ul);
      wrap.appendChild(det);
    }

    /* mode toggle */
    var mode = "napkin";
    var segNapkin = el("button", { class: "seg active" }, "Build a napkin");
    var segEye = el("button", { class: "seg" }, "Just eyeball it");
    wrap.appendChild(el("div", { class: "segmented" }, segNapkin, segEye));

    /* ---- the scribble pad (C: multiply every number found) ---- */
    var totalOverride = null;   // set when the answer is typed by hand
    var assisted = false;
    var muted = {};             // factor sig -> true  (left out of the math)
    var flipped = {};           // factor sig -> "x"|"/"|"+"  (operator overridden by a pill tap)
    var rollFrom = 0;
    var seenFactorSigs = {};    // factor sig -> true once its pill has popped in / ticked

    var napkinPanel = el("div", { class: "panel" });

    var padWrap = el("div", { class: "padwrap" });
    // Sits behind the real textarea (which is made transparent) and mirrors
    // its text so recognized numbers can get a highlight *in place* — proof,
    // right on what you typed, that the pad is actually reading it.
    var padHighlight = el("div", { class: "pad-highlight hand", "aria-hidden": "true" });
    var pad = el("textarea", {
      class: "pad hand", rows: "6", spellcheck: "false", autocapitalize: "off", autocomplete: "off",
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

    var demoNote = el("p", { class: "muted demo-note" }, "Numbers get picked up automatically — watch.");
    demoNote.hidden = true;
    napkinPanel.insertBefore(demoNote, padWrap);

    pad.addEventListener("input", onPad);
    pad.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); doLock(); }
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
      var factsActionBtn = el("button", { class: "tbtn", type: "button" }, "Back-pocket numbers");
      factsActionBtn.addEventListener("click", openFactsModal);
      padActions.appendChild(factsActionBtn);
    }
    var gutActionBtn = el("button", { class: "tbtn", type: "button" }, "Gut check");
    gutActionBtn.addEventListener("click", openGutCheckModal);
    padActions.appendChild(gutActionBtn);

    // Lifelines live with the other pad tools, but on their own labelled row —
    // they're a scarce one-shot resource, not an always-there utility.
    var lifelineRow = null;
    if (opts.challenge) {
      lifelineRow = el("div", { class: "lifelines" },
        el("span", { class: "helper-label muted" }, "Lifelines")
      );
      var numberBtn = el("button", { class: "tbtn", type: "button" }, "Borrow a number");
      numberBtn.disabled = !!STATE.challenge.usedNumber;
      numberBtn.addEventListener("click", function () {
        if (STATE.challenge.usedNumber) return;
        var row = nextUnfilledFrameworkRow();
        insertLine((row.op === "/" ? "per " : "") + row.label + " " + inputNumber(row.model_value));
        STATE.challenge.usedNumber = true;
        numberBtn.disabled = true;
      });
      lifelineRow.appendChild(numberBtn);
      if (!isEasyChallenge) {
        var starterBtn = el("button", { class: "tbtn", type: "button" }, "Framework starter");
        starterBtn.disabled = !!STATE.challenge.usedFrameworkStarter;
        starterBtn.addEventListener("click", function () {
          if (STATE.challenge.usedFrameworkStarter) return;
          var starter = q.framework.slice(0, 2)
            .map(function (f) { return (f.op === "/" ? "per " : "") + f.label + " "; })
            .join("\n") + "\n";
          pad.value = starter + pad.value;
          onPad();
          pad.focus();
          STATE.challenge.usedFrameworkStarter = true;
          starterBtn.disabled = true;
        });
        lifelineRow.appendChild(starterBtn);
      }
    }

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
    var helpers = el("div", { class: "helpers" });
    helpers.appendChild(padActions);
    if (lifelineRow) helpers.appendChild(lifelineRow);
    napkinPanel.appendChild(helpers);

    /* Optional help — one quiet row, with each toggle's panel underneath it.
       Challenge keeps its own separate one-shot lifelines (above) exactly as
       they were. Practice/Daily get a single escalating "Stuck?" button
       instead of two separate links: first press gives a number (if this
       question has any back-pocket facts), second press shows the full
       framework — no extra browser confirm() gate, since the two presses
       already are the commitment. */
    var padHelp = el("div", { class: "padhelp" });
    napkinPanel.appendChild(padHelp);

    if (opts.challenge) {
      if (q.reference_anchors && q.reference_anchors.length) {
        var chips = el("div", { class: "anchorchips" });
        chips.hidden = true;
        q.reference_anchors.forEach(function (a) {
          var chip = el("button", { class: "achip", type: "button" }, "+ " + a.label + " " + inputNumber(a.value));
          chip.addEventListener("mousedown", function (e) { e.preventDefault(); });
          chip.addEventListener("click", function () { insertLine(a.label + " " + inputNumber(a.value)); });
          chips.appendChild(chip);
        });
        var hintBtn = el("button", { class: "linkbtn hintbtn", type: "button" }, "Need another number?");
        hintBtn.addEventListener("click", function () {
          chips.hidden = !chips.hidden;
          hintBtn.textContent = chips.hidden ? "Need another number?" : "Hide the hints";
        });
        padHelp.appendChild(hintBtn);
        napkinPanel.appendChild(chips);
      }
      /* peek — not offered in Challenge's easy mode, where the framework's already laid out */
      if (!isEasyChallenge) {
        var peekBtn = el("button", { class: "linkbtn peek", type: "button" }, "Show me the framework");
        var peekNote = el("p", { class: "muted peeknote" }, "Framework peeked — this one counts as assisted.");
        peekNote.hidden = true;
        peekBtn.addEventListener("click", function () {
          if (!window.confirm("Show the framework? You'll see the variable names (not the numbers), and this result gets an assisted mark.")) return;
          assisted = true;
          pad.value = q.framework.map(function (f) { return (f.op === "/" ? "per " : "") + f.label; }).join("\n") + "\n";
          onPad();
          pad.focus();
          peekBtn.remove();
          peekNote.hidden = false;
        });
        padHelp.appendChild(peekBtn);
        napkinPanel.appendChild(peekNote);
      }
    } else {
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
      var stuckBtn = el("button", { class: "linkbtn stuckbtn", type: "button" }, "Stuck?");
      var gaveNumber = false;
      stuckBtn.addEventListener("click", function () {
        if (hasAnchors && !gaveNumber) {
          gaveNumber = true;
          stuckChips.hidden = false;
          stuckBtn.textContent = "Still stuck?";
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
      if (stuckChips) napkinPanel.appendChild(stuckChips);
      napkinPanel.appendChild(stuckPeekNote);
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

    wrap.appendChild(el("p", { class: "muted undohint" }, "Changed your mind? ⌘Z / Ctrl+Z undoes — it's just one page of text."));

    var submit = el("button", { class: "btn submit lockbtn", type: "button" },
      opts.practice ? "See how close I got" : "Lock it in");
    submit.disabled = true;
    submit.addEventListener("click", doLock);
    wrap.appendChild(submit);

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
        if (opts.challenge) {
          applyChallengeResult(sc);
          mount(revealScreen(q, Object.assign({ date: storage.todayISO(), napkinNumber: null }, rec), { challenge: true }));
        } else if (opts.practice) {
          mount(revealScreen(q, Object.assign({ date: storage.todayISO(), napkinNumber: null }, rec), { practice: true }));
        } else {
          var full = storage.recordResult(rec);
          mount(revealScreen(q, full, { practice: false, justAnswered: true }));
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
    // "Borrow a Number" reveals whichever framework row your pad hasn't
    // matched yet, using the same fuzzy label-matching the reveal screen
    // grades with — falls back to the first row if nothing's been typed.
    function nextUnfilledFrameworkRow() {
      var userRows = activeFactors().map(function (f) {
        return { op: flipped[f.sig] || f.op, label: f.label, value: String(f.value) };
      });
      var cmp = scoring.compareRows(userRows, q.framework);
      var unfilled = cmp.pairs.filter(function (p) { return !p.user; });
      return unfilled.length ? unfilled[0].model : q.framework[0];
    }
    function computeTotal() {
      var acc = null;
      activeFactors().forEach(function (f) {
        var op = flipped[f.sig] || f.op;
        if (acc == null) acc = f.value;
        else if (op === "/") acc = acc / f.value;
        else if (op === "+") acc = acc + f.value;
        else acc = acc * f.value;
      });
      return acc;
    }
    function effectiveGuess() {
      return totalOverride != null ? totalOverride : computeTotal();
    }

    function onPad() {
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
    function renderPadHighlight() {
      var text = pad.value;
      var fs = scan();
      var html = "", pos = 0;
      fs.forEach(function (f) {
        if (f.start < pos) return;
        var end = f.end;
        while (end > f.start && /\s/.test(text.charAt(end - 1))) end--;
        var finished = end < text.length && /[ \n\t]/.test(text.charAt(end));
        if (!finished) return;
        html += escapeHtml(text.slice(pos, f.start));
        html += '<mark class="hl' + (muted[f.sig] ? " hl-muted" : "") + '">' +
          escapeHtml(text.slice(f.start, end)) + "</mark>";
        pos = end;
      });
      html += escapeHtml(text.slice(pos));
      // pre-wrap collapses a bare trailing newline's blank line; a trailing
      // zero-width space keeps it the same height as the real textarea.
      padHighlight.innerHTML = html + (text.slice(-1) === "\n" ? "​" : "");
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
      close = openInfoModal("Back-pocket numbers", list);
    }

    function openGutCheckModal() {
      var g = effectiveGuess();
      if (g == null) return; // button's disabled for this, but stay safe
      var ctx = contextualizeGuess(g);
      var line = "You're at ≈ " + util.humanize(g) + (ctx ? " — that's " + ctx + "." : ".");
      openInfoModal("Gut check", el("p", {}, line));
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
        pill.addEventListener("click", function () {
          // Cycle: detected op -> muted -> the other of ×/÷ -> forced + -> back to detected.
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
        });
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
        var p = Math.min(1, (now - start) / dur);
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
    }
    function updateGutBtn() {
      gutActionBtn.disabled = !(effectiveGuess() > 0);
    }
    function setMode(m) {
      mode = m;
      segNapkin.classList.toggle("active", m === "napkin");
      segEye.classList.toggle("active", m === "eyeball");
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

    segNapkin.addEventListener("click", function () { setMode("napkin"); });
    segEye.addEventListener("click", function () { setMode("eyeball"); });

    // First-ever visit: a short welcome, then (if they want it) type an
    // example into the empty pad so the "your numbers get read live" trick
    // is seen once, not just asserted. Any click/keypress cancels it.
    function startPadDemo() {
      if (opts.practice || opts.challenge) return;
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

    // Easy mode: the framework's rows are laid out for you already — just plug in a number per line.
    if (isEasyChallenge) {
      pad.value = q.framework.map(function (f) { return (f.op === "/" ? "per " : "") + f.label + " "; }).join("\n") + "\n";
    }

    onPad();
    refreshTotal();
    startPadDemo();
    return wrap;
  }

  /* ---------- the reveal screen ---------- */
  function revealScreen(q, res, opts) {
    opts = opts || {};
    var chipLabel = opts.challenge ? "Challenge" : opts.practice ? "Practice" : ("Napkin #" + res.napkinNumber);
    var wrap = el("section", { class: "screen reveal" });

    wrap.appendChild(el("div", { class: "reveal-head" },
      el("span", { class: "chip" }, chipLabel),
      el("span", { class: "muted" }, q.question)
    ));

    // Show what they actually answered right away — no coy "?" delay. The
    // suspense is saved for the score/comparison further down, not this.
    var guessNumEl = el("span", { class: "hand big guessnum" }, util.humanize(res.guess));
    wrap.appendChild(el("div", { class: "yourcall" },
      el("span", { class: "muted" }, res.mode === "eyeball" ? "You eyeballed…" : "You answered…"),
      guessNumEl
    ));
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { guessNumEl.classList.add("pop"); });
    });

    var narr = el("div", { class: "narrative" });
    q.narrative.forEach(function (line, i) {
      var last = i === q.narrative.length - 1;
      var p = el("p", { class: "beat" + (last ? " answerbeat" : "") }, line);
      p.style.animationDelay = (i * 1.15).toFixed(2) + "s";
      narr.appendChild(p);
    });
    wrap.appendChild(narr);

    var skip = el("button", { class: "linkbtn skip" }, "Skip to the score ▸");
    wrap.appendChild(skip);

    var after = el("div", { class: "after" });
    after.hidden = true;
    buildAfter(after, q, res, opts);
    wrap.appendChild(after);

    var totalMs = q.narrative.length * 1150 + 500;
    var timer = setTimeout(reveal, totalMs);
    skip.addEventListener("click", function () {
      clearTimeout(timer);
      narr.classList.add("done");
      reveal();
    });
    function reveal() {
      if (skip.parentNode) skip.remove();
      after.hidden = false;
      var hero = after.querySelector(".hero");
      if (hero) requestAnimationFrame(function () {
        requestAnimationFrame(function () { hero.classList.add("in"); });
      });
      var num = after.querySelector(".actualnum");
      countUp(num, q.actual_answer);
      if (num) setTimeout(function () { num.classList.add("pop"); }, 850);
      var circleWrap = after.querySelector(".actualnum-wrap");
      if (circleWrap) setTimeout(function () { circleWrap.classList.add("circled"); }, 1050);
      // The score popup is a capstone on the reveal that already plays out
      // here (narrative, then hero card, then the actual-answer count-up) —
      // not a race to beat it to the punch. Only fires on a fresh answer,
      // never when just reopening an already-answered day.
      if (opts.justAnswered) {
        setTimeout(function () { showScoreModal(wrap, q, res, scoring.score(res.guess, q)); }, 1300);
      }
    }
    return wrap;
  }

  // Close misses read better as a percentage ("14% away") than a multiplier;
  // order-of-magnitude misses read better the other way round ("40× off").
  // Shared by the full breakdown, the share text, and the score popup so the
  // framing is consistent everywhere it shows up.
  function scoreLine(sc) {
    if (sc.inRange) return "inside the sensible range";
    if (sc.ratio < 1.1) return "spot on";
    if (sc.ratio <= 2) return Math.round((sc.ratio - 1) * 100) + "% away";
    return util.roundFactor(sc.ratio) + "× off";
  }

  function resultShareText(q, res, sc) {
    var streak = storage.streak();
    var rowsBit = res.assisted
      ? "👀 assisted"
      : res.mode === "eyeball"
        ? "eyeballed"
        : (res.rows && res.rows.length ? res.rows.length + (res.rows.length === 1 ? " number" : " numbers") : "hand-called");
    return [
      "Napkin #" + res.napkinNumber,
      scoreLine(sc) + " " + sc.band.emoji,
      rowsBit + " · " + streak + "-day streak"
    ].join("\n");
  }

  function shareResult(text, btn) {
    if (navigator.share) { navigator.share({ text: text }).catch(function () {}); }
    else { copyText(text, btn); }
  }

  // A focused popup once the daily's answered — the full breakdown below
  // still has all the detail, but the score itself deserves a moment rather
  // than being just another line in a long scroll. Appended inside the
  // reveal screen's own container (not document.body) so navigating away
  // to another tab tears it down along with everything else, instead of
  // leaving it stuck floating over whatever screen comes next.
  function showScoreModal(container, q, res, sc) {
    var streak = storage.streak();
    var shareTxt = resultShareText(q, res, sc);
    var shareBtn = el("button", { class: "btn", type: "button" }, "Share result");
    var closeBtn = el("button", { class: "linkbtn modal-close", type: "button" }, "See the full breakdown ▾");
    var emojiEl = el("div", { class: "score-modal-emoji" }, sc.band.emoji);
    var card = el("div", { class: "demo-modal score-modal" },
      circleWrap(emojiEl),
      el("div", { class: "hand big" }, sc.band.label),
      el("div", { class: "score-modal-line" }, scoreLine(sc)),
      el("div", { class: "muted score-modal-nums" },
        "You answered " + util.humanize(res.guess) + " · actual " + util.humanize(q.actual_answer)),
      streak > 1 ? el("div", { class: "score-modal-streak" }, "🔥 " + streak + "-day streak") : null,
      shareBtn,
      closeBtn
    );
    var overlay = el("div", { class: "demo-overlay" }, card);
    function close() { if (overlay.parentNode) overlay.remove(); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    closeBtn.addEventListener("click", close);
    shareBtn.addEventListener("click", function () { shareResult(shareTxt, shareBtn); });
    container.appendChild(overlay);
    setTimeout(function () { emojiEl.parentNode.classList.add("circled"); }, 350);
  }

  function buildAfter(container, q, res, opts) {
    var sc = scoring.score(res.guess, q);
    var band = sc.band;
    var roast = scoring.quip(band, sc.ratio);
    var ratioLine = scoreLine(sc);

    var highlight = buildHighlight(scoring.compareRows(res.rows, q.framework));
    container.appendChild(el("div", { class: "hero " + band.key },
      el("div", { class: "hero-emoji" }, band.emoji),
      el("div", { class: "hero-score hand" }, band.label),
      el("div", { class: "hero-ratio" }, ratioLine),
      el("div", { class: "hero-quip" }, roast),
      highlight ? el("div", { class: "hero-highlight" }, highlight) : null
    ));

    var ansType = q.answer_type === "measured" ? "The real figure" : "The accepted estimate";
    var actualnumEl = el("div", { class: "hand actualnum" }, "0");
    container.appendChild(el("div", { class: "answerbox" },
      el("div", { class: "muted" }, ansType + (q.as_of ? " · as of " + q.as_of : "")),
      circleWrap(actualnumEl)
    ));

    container.appendChild(guessBar(res.guess, q.actual_answer));
    container.appendChild(el("p", { class: "source muted" }, q.source));
    container.appendChild(buildComparison(q, res));

    if (opts.challenge) {
      container.appendChild(buildChallengeOutcome());
    } else if (opts.practice) {
      var again = el("button", { class: "btn" }, "Try another question");
      again.addEventListener("click", function () { STATE.practiceQ = null; STATE.view = "practice"; renderApp(); });
      container.appendChild(again);
    } else {
      container.appendChild(buildShareCard(q, res));
      container.appendChild(el("p", { class: "muted comeback" },
        "That's it for today. Come back tomorrow for Napkin #" + (res.napkinNumber + 1) + "."));
    }
  }

  function guessBar(guess, actual) {
    var lo = Math.max(1, Math.min(guess, actual));
    var hi = Math.max(1, guess, actual);
    var min = Math.pow(10, Math.floor(Math.log10(lo)) - 0.4);
    var max = Math.pow(10, Math.ceil(Math.log10(hi)) + 0.4);
    function pct(v) {
      v = Math.max(min, Math.min(max, v));
      return (Math.log(v / min) / Math.log(max / min)) * 100;
    }
    var gp = pct(guess), ap = pct(actual);

    var track = el("div", { class: "gbar-track" });
    var span = el("div", { class: "gbar-span" });
    span.style.left = Math.min(gp, ap) + "%";
    span.style.width = Math.max(0, Math.abs(gp - ap)) + "%";
    track.appendChild(span);

    var mAct = el("div", { class: "gbar-mark actual" }, el("span", { class: "gbar-tag" }, "actual"));
    mAct.style.left = ap + "%";
    var mYou = el("div", { class: "gbar-mark you" }, el("span", { class: "gbar-tag" }, "you"));
    mYou.style.left = gp + "%";
    track.appendChild(mAct);
    track.appendChild(mYou);

    return el("div", { class: "gbar" },
      track,
      el("div", { class: "gbar-scale muted" },
        el("span", {}, util.humanize(min)),
        el("span", {}, util.humanize(max))
      )
    );
  }

  // Pick out the single number you nailed and the single number that hurt
  // you most, so the hero can call out *why* you scored what you scored —
  // not just the final ratio.
  function buildHighlight(cmp) {
    var lc = function (s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; };
    var tight = cmp.pairs.filter(function (p) { return p.verdict === "tight"; });
    var misses = cmp.pairs
      .filter(function (p) { return p.verdict === "low" || p.verdict === "high"; })
      .sort(function (a, b) { return (b.factor || 0) - (a.factor || 0); });
    var mvp = tight[0], culprit = misses[0];
    if (!mvp && !culprit) return null;
    if (mvp && culprit) {
      return "🎯 nailed " + lc(mvp.model.label) + " — " + lc(culprit.model.label) +
        " was the culprit, " + util.roundFactor(culprit.factor) + "× too " + culprit.verdict + ".";
    }
    if (mvp) return "🎯 every number you used was spot on — especially " + lc(mvp.model.label) + ".";
    return lc(culprit.model.label) + " was the culprit — " + util.roundFactor(culprit.factor) + "× too " + culprit.verdict + ".";
  }

  function verdictText(p) {
    if (p.verdict === "tight") return "on the money";
    if (p.verdict === "low") return "≈" + util.roundFactor(p.factor) + "× low";
    if (p.verdict === "high") return "≈" + util.roundFactor(p.factor) + "× high";
    return "didn't use this";
  }

  function buildComparison(q, res) {
    var cmp = scoring.compareRows(res.rows, q.framework);
    var box = el("div", { class: "compare" });
    box.appendChild(el("h3", { class: "hand" }, "Your napkin vs. one good way"));

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

  function buildShareCard(q, res) {
    var sc = scoring.score(res.guess, q);
    var text = resultShareText(q, res, sc);

    var card = el("div", { class: "sharecard" });
    card.appendChild(el("pre", { class: "sharetext" }, text));
    var btn = el("button", { class: "btn" }, "Share result");
    btn.addEventListener("click", function () { shareResult(text, btn); });
    card.appendChild(btn);
    return card;
  }

  /* ---------- challenge mode ----------
   * Rapid-fire questions, no retries. Three hearts. A "miss" (off by more
   * than 10×) costs a heart and resets the in-run streak to zero; the run
   * itself only ends when hearts hit zero. Longest streak survived in a
   * run is saved as the all-time best (storage.challengeBest). */
  function heartsNode(lives, max) {
    var s = "";
    for (var i = 0; i < max; i++) s += i < lives ? "❤️" : "🖤";
    return el("span", { class: "hearts" }, s);
  }
  function fireLabel(streak) {
    var flames = streak >= 10 ? "🔥🔥🔥" : streak >= 5 ? "🔥🔥" : "🔥";
    return (streak > 0 ? flames + " " : "") + "Streak: " + streak;
  }
  // 3, 5, then every 5 — matches the flame tiers above closely enough to feel earned.
  function isMilestone(n) { return n === 3 || n === 5 || (n >= 10 && n % 5 === 0); }
  function bestChaseLabel(streak) {
    var best = storage.challengeBest();
    if (best <= 0) return "";
    if (streak > best) return "🏆 new best!";
    if (streak === best) return "🏆 tied your best";
    return (best - streak) + " to beat your best (" + best + ")";
  }

  // Shuffled "bag" of every question id — deals through the whole bank
  // before any question can repeat, then reshuffles.
  function shuffledIds() {
    var ids = QUESTIONS.map(function (q) { return q.id; });
    for (var i = ids.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = ids[i]; ids[i] = ids[j]; ids[j] = t;
    }
    return ids;
  }
  function nextChallengeQuestion(c) {
    if (!c.queue.length) c.queue = shuffledIds();
    var id = c.queue.shift();
    if (id === c.lastId && c.queue.length) { c.queue.push(id); id = c.queue.shift(); }
    c.lastId = id;
    return byId(id);
  }
  function startChallenge() {
    STATE.challenge = {
      lives: 1, maxLives: 1, streak: 0, runBest: 0,
      queue: [], lastId: null, over: false, lastLifeLost: false, isNewBest: false,
      difficulty: STATE.challengeDifficulty,
      usedNumber: false, usedFrameworkStarter: false
    };
    nextChallengeQuestion(STATE.challenge);
    STATE.view = "challenge";
    renderApp();
  }
  function applyChallengeResult(sc) {
    var c = STATE.challenge;
    var lifeLost = sc.band.key === "miss";
    c.lastLifeLost = lifeLost;
    if (lifeLost) {
      c.lives -= 1;
      c.streak = 0;
    } else {
      c.streak += 1;
      c.runBest = Math.max(c.runBest, c.streak);
    }
    c.over = c.lives <= 0;
    if (c.over) {
      c.isNewBest = c.runBest > storage.challengeBest();
      storage.recordChallengeBest(c.runBest);
    }
  }

  function viewChallengeIntro() {
    var wrap = el("section", { class: "screen challenge-intro" });
    wrap.appendChild(el("h2", { class: "hand" }, "Challenge mode"));

    var c = STATE.challenge;
    if (c && c.over) {
      wrap.appendChild(el("div", { class: "panel challenge-summary" },
        el("div", { class: "hand big" }, "Game over"),
        el("p", {}, "Your streak topped out at " + c.runBest + "."),
        c.isNewBest ? el("p", { class: "newbest" }, "🏆 New best!") : null
      ));
    }

    wrap.appendChild(el("p", { class: "lede" },
      "Rapid-fire questions, no retries, one life. Miss by 10× or more and the run's over — " +
      "so how long can you keep the streak alive?"));

    var grid = el("div", { class: "statgrid" },
      stat("Best streak", String(storage.challengeBest())),
      stat("Life", "❤️ one shot")
    );
    wrap.appendChild(grid);

    var easyBtn = el("button", { class: "seg" + (STATE.challengeDifficulty === "easy" ? " active" : "") }, "Easy");
    var hardBtn = el("button", { class: "seg" + (STATE.challengeDifficulty === "easy" ? "" : " active") }, "Hard");
    easyBtn.addEventListener("click", function () { STATE.challengeDifficulty = "easy"; renderApp(); });
    hardBtn.addEventListener("click", function () { STATE.challengeDifficulty = "hard"; renderApp(); });
    wrap.appendChild(el("div", { class: "segmented" }, easyBtn, hardBtn));
    wrap.appendChild(el("p", { class: "muted diff-note" },
      STATE.challengeDifficulty === "easy"
        ? "The framework's laid out for you — just plug in the numbers."
        : "Build the whole napkin yourself, from a blank pad."));

    // Scannable rather than buried in the intro paragraph: these are the two
    // things a player actually needs to remember mid-run.
    var lifelineList = el("dl", { class: "rulelist" },
      el("dt", {}, "Borrow a number"),
      el("dd", {}, "Reveals one framework row's value."),
      el("dt", {}, "Framework starter"),
      el("dd", {}, "Lays out the first two rows to get you going.")
    );
    wrap.appendChild(el("div", { class: "rulebox" },
      el("h3", { class: "rulebox-title" }, "Lifelines · one use each per run"),
      lifelineList
    ));

    var startBtn = el("button", { class: "btn" }, c && c.over ? "Play again" : "Start challenge");
    startBtn.addEventListener("click", startChallenge);
    wrap.appendChild(startBtn);
    return wrap;
  }

  function buildChallengeOutcome() {
    var c = STATE.challenge;
    var box = el("div", { class: "challenge-hud" });

    var hudRow = el("div", { class: "chud-row" + (c.lastLifeLost ? " hit" : "") },
      heartsNode(c.lives, c.maxLives),
      el("span", { class: "chud-streak hand streak-big" }, fireLabel(c.streak)),
      el("span", { class: "chud-diff muted" }, c.difficulty === "easy" ? "Easy" : "Hard")
    );
    box.appendChild(hudRow);

    if (c.lastLifeLost) {
      box.appendChild(el("p", { class: "challenge-msg miss" }, "💔 Off by a mile — that's the run."));
    } else if (isMilestone(c.streak)) {
      box.appendChild(el("div", { class: "milestone-banner hand" }, "🔥 " + c.streak + " IN A ROW!"));
    } else {
      var chase = bestChaseLabel(c.streak);
      box.appendChild(el("p", { class: "challenge-msg" }, chase || "Streak's alive. Keep the napkins coming."));
    }

    if (c.over) {
      box.appendChild(el("div", { class: "challenge-gameover" },
        el("div", { class: "hand big" }, "Game over"),
        el("p", {}, "Your streak topped out at " + c.runBest + "."),
        c.isNewBest
          ? el("p", { class: "newbest" }, "🏆 New best!")
          : el("p", { class: "muted" }, "Best: " + storage.challengeBest() + ".")
      ));
      var again = el("button", { class: "btn" }, "Play again");
      again.addEventListener("click", startChallenge);
      var menu = el("button", { class: "linkbtn" }, "‹ Back to menu");
      menu.addEventListener("click", function () { STATE.challenge = null; STATE.view = "challenge"; renderApp(); });
      box.appendChild(again);
      box.appendChild(menu);
    } else {
      var next = el("button", { class: "btn" }, "Next question ▸");
      next.addEventListener("click", function () {
        nextChallengeQuestion(STATE.challenge);
        STATE.view = "challenge";
        renderApp();
      });
      box.appendChild(next);
    }
    return box;
  }

  /* ---------- practice list ---------- */
  function viewPracticeList() {
    var wrap = el("section", { class: "screen practice" });
    wrap.appendChild(el("h2", { class: "hand" }, "Practice — any question, any time"));
    wrap.appendChild(el("p", { class: "muted" }, "Untimed, retries allowed, nothing recorded."));

    var played = {};
    storage.load().results.forEach(function (r) { played[r.questionId] = 1; });

    var order = (window.NAPKIN.dailyOrder || []).map(byId).filter(Boolean);
    QUESTIONS.forEach(function (q) { if (order.indexOf(q) === -1) order.push(q); });

    var list = el("div", { class: "qlist" });
    order.forEach(function (q, i) {
      var item = el("button", { class: "qcard" },
        el("span", { class: "qnum" }, "#" + (i + 1)),
        el("span", { class: "qtext" }, q.question),
        el("span", { class: "qmeta muted" }, q.category + " · " + q.difficulty + (played[q.id] ? " · ✓ done" : ""))
      );
      item.addEventListener("click", function () { STATE.practiceQ = q; renderApp(); });
      list.appendChild(item);
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- stats ---------- */
  function viewStats() {
    var s = storage.stats();
    var wrap = el("section", { class: "screen stats" });
    wrap.appendChild(el("h2", { class: "hand" }, "Your run"));

    var grid = el("div", { class: "statgrid" });
    grid.appendChild(stat("Streak", s.streak + (s.streak === 1 ? " day" : " days")));
    grid.appendChild(stat("Played", String(s.played)));
    grid.appendChild(stat("Avg miss", s.avgRatio ? util.roundFactor(s.avgRatio) + "×" : "—"));
    grid.appendChild(stat("Best", s.bestRatio ? util.roundFactor(s.bestRatio) + "×" : "—"));
    wrap.appendChild(grid);

    if (s.series.length) wrap.appendChild(sparkline(s.series));
    else wrap.appendChild(el("p", { class: "muted" }, "No games yet — go do today's."));

    var backup = el("div", { class: "backup" });
    backup.appendChild(el("h3", { class: "hand" }, "Backup"));
    backup.appendChild(el("p", { class: "muted" }, "History lives in this browser only. Export a copy so a cache clear can't wipe your streak."));
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

  function sparkline(series) {
    var W = 300, H = 60, n = series.length;
    function xs(i) { return n === 1 ? W / 2 : (i / (n - 1)) * (W - 8) + 4; }
    function ys(r) {
      var v = Math.max(1, Math.min(100, isFinite(r) ? r : 100));
      return H - (Math.log(v) / Math.log(100)) * (H - 8) - 4;
    }
    var pts = series.map(function (d, i) { return xs(i) + "," + ys(d.ratio); }).join(" ");
    var parts = [
      '<line x1="4" y1="' + ys(1) + '" x2="' + (W - 4) + '" y2="' + ys(1) + '" class="spark-base"/>'
    ];
    if (n > 1) parts.push('<polyline points="' + pts + '" class="spark-line"/>');
    series.forEach(function (d, i) {
      parts.push('<circle cx="' + xs(i) + '" cy="' + ys(d.ratio) + '" r="3" class="dot dot-' + (d.band || "miss") + '"/>');
    });

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("class", "spark");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = parts.join("");

    var box = el("div", { class: "sparkbox" });
    box.appendChild(el("div", { class: "muted" }, "Miss ratio over time (lower is better)"));
    box.appendChild(svg);
    return box;
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
        window.alert("History imported.");
        renderApp();
      } catch (e) {
        window.alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  /* ---------- misc ---------- */
  function countUp(node, target) {
    if (!node) return;
    var dur = 900, start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
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
    renderApp();
  });
})();
