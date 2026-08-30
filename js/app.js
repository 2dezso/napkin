/* UI + wiring. Plain DOM, no framework. See plan.md sections 1, 8, 9. */
(function () {
  "use strict";

  var util = window.NAPKIN.util;
  var scoring = window.NAPKIN.scoring;
  var storage = window.NAPKIN.storage;
  var QUESTIONS = window.NAPKIN.questions;

  var STATE = { view: "daily", practiceQ: null };

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
    var wrap = el("section", { class: "screen napkin" });

    if (opts.practice) {
      var back = el("button", { class: "linkbtn" }, "‹ back to list");
      back.addEventListener("click", function () { STATE.practiceQ = null; renderApp(); });
      wrap.appendChild(back);
    } else {
      wrap.appendChild(el("div", { class: "daychip" },
        el("span", { class: "chip" }, "Napkin #" + (storage.load().results.length + 1)),
        el("span", { class: "muted" }, storage.todayISO())
      ));
    }

    wrap.appendChild(el("h1", { class: "question hand" }, q.question));

    if (q.clarifications && q.clarifications.length) {
      var det = el("details", { class: "fineprint" });
      det.appendChild(el("summary", {}, "the fine print"));
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
    var flipped = {};           // factor sig -> "x"|"/"  (operator overridden by a pill tap)
    var rollFrom = 0;

    var napkinPanel = el("div", { class: "panel" });

    var toolbar = el("div", { class: "toolbar" });
    [["×", " × "], ["÷", " ÷ "], ["%", "% "], ["1 in", "1 in "], ["000", "000"], ["K", "K "], ["M", "M "]]
      .forEach(function (b) {
        var t = el("button", { class: "tbtn", type: "button" }, b[0]);
        t.addEventListener("mousedown", function (e) { e.preventDefault(); });
        t.addEventListener("click", function () { insertText(b[1]); });
        toolbar.appendChild(t);
      });
    napkinPanel.appendChild(toolbar);

    var padWrap = el("div", { class: "padwrap" });
    var pad = el("textarea", {
      class: "pad hand", rows: "6", spellcheck: "false", autocapitalize: "off", autocomplete: "off",
      placeholder: "Just think out loud — I'll find the numbers.\n\n8.3M people\n1 in 4 order delivery\nover 7 days"
    });
    pad.setAttribute("autocorrect", "off");
    pad.setAttribute("enterkeyhint", "enter");
    var stamp = el("div", { class: "stamp" }, "LOCKED IN");
    stamp.hidden = true;
    padWrap.appendChild(pad);
    padWrap.appendChild(stamp);
    napkinPanel.appendChild(padWrap);

    pad.addEventListener("input", onPad);
    pad.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); doLock(); }
    });

    var ribbon = el("div", { class: "ribbon" });
    napkinPanel.appendChild(ribbon);
    var ribbonHint = el("p", { class: "muted ribbon-hint" }, "tap a chip to mute it · tap again to flip × / ÷");
    ribbonHint.hidden = true;
    napkinPanel.appendChild(ribbonHint);

    var totalRow = el("div", { class: "total" });
    var approxBtn = el("button", { class: "total-approx hand", type: "button", title: "tap to set the answer by hand" }, "≈ …");
    var wordsEl = el("span", { class: "total-words muted" }, "");
    var revertBtn = el("button", { class: "total-revert", type: "button" }, "↺ back to the napkin's number");
    revertBtn.hidden = true;
    approxBtn.addEventListener("click", startTotalEdit);
    revertBtn.addEventListener("click", function () { totalOverride = null; refreshTotal(); });
    totalRow.appendChild(approxBtn);
    totalRow.appendChild(wordsEl);
    totalRow.appendChild(revertBtn);
    napkinPanel.appendChild(totalRow);

    /* value chips */
    if (q.reference_anchors && q.reference_anchors.length) {
      var chips = el("div", { class: "anchorchips" }, el("span", { class: "chips-h muted" }, "drop in a number:"));
      q.reference_anchors.forEach(function (a) {
        var chip = el("button", { class: "achip", type: "button" }, "+ " + a.label + " " + inputNumber(a.value));
        chip.addEventListener("mousedown", function (e) { e.preventDefault(); });
        chip.addEventListener("click", function () { insertLine(a.label + " " + inputNumber(a.value)); });
        chips.appendChild(chip);
      });
      napkinPanel.appendChild(chips);
    }

    /* peek */
    var peekWrap = el("div", { class: "peekwrap" });
    var peekBtn = el("button", { class: "linkbtn peek", type: "button" }, "stuck? show me the framework");
    var peekNote = el("p", { class: "muted peeknote" }, "👀 framework peeked — this one counts as assisted");
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
    peekWrap.appendChild(peekBtn);
    peekWrap.appendChild(peekNote);
    napkinPanel.appendChild(peekWrap);

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

    /* gut check + lock in (F) */
    var gutBtn = el("button", { class: "linkbtn gutbtn", type: "button" }, "🤔 gut check");
    var gutPanel = el("div", { class: "gutcheck-panel" });
    gutPanel.hidden = true;
    gutBtn.addEventListener("click", function () {
      if (!gutPanel.hidden) { gutPanel.hidden = true; return; }
      var g = mode === "eyeball" ? sliderValue() : effectiveGuess();
      gutPanel.innerHTML = "";
      gutPanel.appendChild(el("p", {}, "You're at " + (g == null ? "—" : "≈ " + util.humanize(g)) + "."));
      gutPanel.appendChild(el("p", { class: "muted" }, q.sanity_check));
      gutPanel.hidden = false;
    });
    wrap.appendChild(gutBtn);
    wrap.appendChild(gutPanel);

    wrap.appendChild(el("p", { class: "muted undohint" }, "⌘Z / Ctrl+Z undoes — it's just one page of text"));

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
        if (opts.practice) {
          mount(revealScreen(q, Object.assign({ date: storage.todayISO(), napkinNumber: null }, rec), { practice: true }));
        } else {
          storage.recordResult(rec);
          renderApp();
        }
      }

      submit.disabled = true;
      if (mode === "napkin") {
        stamp.hidden = false;
        stamp.classList.add("go");
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
        if (acc == null) acc = f.value;
        else acc = op === "/" ? acc / f.value : acc * f.value;
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
    }

    function renderRibbon() {
      var fs = scan();
      ribbon.innerHTML = "";
      ribbonHint.hidden = fs.length === 0;
      if (!fs.length) return;
      fs.forEach(function (f, idx) {
        var isMuted = !!muted[f.sig];
        var isFlip = !!flipped[f.sig];
        var op = flipped[f.sig] || f.op;
        var pill = el("button", {
          class: "pill" + (isMuted ? " muted" : "") + (isFlip ? " flip" : ""),
          type: "button", title: f.label || f.raw
        },
          el("span", { class: "pill-op" }, (idx === 0 && !isFlip && !isMuted) ? "" : (op === "/" ? "÷" : "×")),
          el("span", {}, util.humanize(f.value))
        );
        pill.addEventListener("click", function () {
          if (!muted[f.sig] && !flipped[f.sig]) {
            muted[f.sig] = true;
          } else if (muted[f.sig]) {
            delete muted[f.sig];
            flipped[f.sig] = f.op === "/" ? "x" : "/";
          } else {
            delete flipped[f.sig];
          }
          renderRibbon();
          refreshTotal();
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

    function refreshTotal() { renderTotal(); updateSubmit(); }
    function updateSubmit() {
      submit.disabled = mode === "eyeball" ? false : !(effectiveGuess() > 0);
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

    onPad();
    refreshTotal();
    return wrap;
  }

  /* ---------- the reveal screen ---------- */
  function revealScreen(q, res, opts) {
    opts = opts || {};
    var isPractice = !!opts.practice;
    var wrap = el("section", { class: "screen reveal" });

    wrap.appendChild(el("div", { class: "reveal-head" },
      el("span", { class: "chip" }, isPractice ? "Practice" : ("Napkin #" + res.napkinNumber)),
      el("span", { class: "muted" }, q.question)
    ));

    wrap.appendChild(el("div", { class: "yourcall" },
      el("span", { class: "muted" }, res.mode === "eyeball" ? "You eyeballed" : "Your napkin said"),
      el("span", { class: "hand big" }, util.humanize(res.guess))
    ));

    var narr = el("div", { class: "narrative" });
    q.narrative.forEach(function (line, i) {
      var last = i === q.narrative.length - 1;
      var p = el("p", { class: "beat" + (last ? " answerbeat" : "") }, line);
      p.style.animationDelay = (i * 1.15).toFixed(2) + "s";
      narr.appendChild(p);
    });
    wrap.appendChild(narr);

    var skip = el("button", { class: "linkbtn skip" }, "skip to the answer ▸");
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
      countUp(after.querySelector(".actualnum"), q.actual_answer);
    }
    return wrap;
  }

  function buildAfter(container, q, res, opts) {
    var sc = scoring.score(res.guess, q);
    var band = sc.band;

    container.appendChild(el("div", { class: "verdict " + band.key },
      el("div", { class: "verdict-emoji" }, band.emoji),
      el("div", {},
        el("div", { class: "verdict-label hand" }, band.label),
        el("div", { class: "muted" }, band.blurb)
      )
    ));

    var ansType = q.answer_type === "measured" ? "the real figure" : "the accepted estimate";
    container.appendChild(el("div", { class: "answerbox" },
      el("div", { class: "muted" }, "And " + ansType + (q.as_of ? " (as of " + q.as_of + ")" : "") + ":"),
      el("div", { class: "hand big actualnum" }, "0"),
      el("div", { class: "ratio muted" },
        sc.inRange ? "inside the sensible range" : (util.roundFactor(sc.ratio) + "× off"))
    ));
    container.appendChild(el("p", { class: "source muted" }, q.source));

    container.appendChild(buildComparison(q, res));

    if (!opts.practice) {
      container.appendChild(buildShareCard(q, res));
      container.appendChild(el("p", { class: "muted comeback" },
        "That's it for today. Come back tomorrow for Napkin #" + (res.napkinNumber + 1) + "."));
    } else {
      var again = el("button", { class: "btn" }, "Try another question");
      again.addEventListener("click", function () { STATE.practiceQ = null; STATE.view = "practice"; renderApp(); });
      container.appendChild(again);
    }
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
    var streak = storage.streak();
    var sc = scoring.score(res.guess, q);
    var line2 = (sc.inRange || sc.ratio < 1.1)
      ? "spot on " + sc.band.emoji
      : util.roundFactor(sc.ratio) + "× off " + sc.band.emoji;
    var rowsBit = res.assisted
      ? "👀 assisted"
      : res.mode === "eyeball"
        ? "eyeballed"
        : (res.rows && res.rows.length ? res.rows.length + (res.rows.length === 1 ? " number" : " numbers") : "hand-called");
    var text = [
      "Napkin #" + res.napkinNumber,
      line2,
      rowsBit + " · " + streak + "-day streak"
    ].join("\n");

    var card = el("div", { class: "sharecard" });
    card.appendChild(el("pre", { class: "sharetext" }, text));
    var btn = el("button", { class: "btn" }, "Copy result");
    btn.addEventListener("click", function () { copyText(text, btn); });
    card.appendChild(btn);
    return card;
  }

  /* ---------- practice list ---------- */
  function viewPracticeList() {
    var wrap = el("section", { class: "screen practice" });
    wrap.appendChild(el("h2", { class: "hand" }, "Practice — any question, any time"));
    wrap.appendChild(el("p", { class: "muted" }, "Untimed, retries allowed, nothing recorded."));

    var played = {};
    storage.load().results.forEach(function (r) { played[r.questionId] = 1; });

    var list = el("div", { class: "qlist" });
    QUESTIONS.forEach(function (q, i) {
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

    if (s.caughtUp) {
      wrap.appendChild(el("p", { class: "muted" }, "You've answered every question in the bank — they'll start repeating."));
    }

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
