/* ============================================================================
   gamify.js — shared gamification engine for the Pharmacology Learning System
   XP, levels, streaks, badges, a central progress dashboard (learning.html),
   and a self-graded "Challenge Mode" for the 10 Learning-System guides.

   Additive only: reads/writes its own localStorage keys (prefixed "gmf-"),
   never modifies existing pharm-theme / ls-rev:* / pharm-sr / pharmFc* data,
   and only touches the DOM by injecting new elements (HUD pill, dashboard,
   toasts, challenge dock) — no existing markup is altered.
   ========================================================================== */
(function () {
  "use strict";

  var FILE = (location.pathname.split("/").pop() || "page").replace(/\.html$/, "");

  /* ---------------------------------------------------------------------- *
   * Manifest: module counts + display titles, in the same order they      *
   * appear as cards on learning.html. Module counts = number of           *
   * ".mod-head" (or ".module-header" fallback) blocks in each guide.      *
   * ---------------------------------------------------------------------- */
  var MANIFEST = [
    { file: "General_Pharmacology_Learning-System", title: "General Pharmacology", modules: 9 },
    { file: "Neuropharmacology-ANS_Learning-System", title: "Neuropharmacology & ANS", modules: 6 },
    { file: "Cardiovascular-Renal_Pharmacology_Learning-System", title: "Cardiovascular & Renal Pharmacology", modules: 9 },
    { file: "Inflammation-Immunity-Hematopoiesis_Learning-System", title: "Inflammation, Immunity & Haematopoiesis", modules: 8 },
    { file: "Endocrine-Pharmacology_Learning-System", title: "Endocrine Pharmacology", modules: 7 },
    { file: "Gastrointestinal_Pharmacology_Learning-System", title: "Gastrointestinal Pharmacology", modules: 3 },
    { file: "Infectious-Disease-Chemotherapy_Learning-System", title: "Infectious Disease & Chemotherapy", modules: 8 },
    { file: "Neoplastic-Disease-Pharmacology_Learning-System", title: "Neoplastic Disease Pharmacology", modules: 5 },
    { file: "Special-Systems_Pharmacology_Learning-System", title: "Special Systems Pharmacology", modules: 3 },
    { file: "Experimental-Pharmacology_Learning-System", title: "Experimental & Clinical Pharmacology", modules: 11 }
  ];
  var TOTAL_MODULES = MANIFEST.reduce(function (s, m) { return s + m.modules; }, 0);

  var XP = { module: 20, mind: 2, quiz: 3, sr: 4, dailyBonus: 10, challengePerItem: 5 };

  var LEVEL_TITLES = [
    "Pre-Clinical Hopeful", "MBBS Fresher", "Ward Clerk", "Junior Resident",
    "Senior Resident", "Registrar", "Attending Physician", "Pharmacology Fellow",
    "Clinical Pharmacologist", "Professor of Pharmacology"
  ];
  var GRANDMASTER = "Pharm Grandmaster";

  var BADGES = [
    { id: "first-xp", icon: "🌱", name: "First Steps", desc: "Earn your first XP", check: function (s) { return s.xp >= 1; } },
    { id: "module-1", icon: "📘", name: "Module Marked", desc: "Review your first module", check: function (s) { return s.modulesReviewed >= 1; } },
    { id: "module-10", icon: "📚", name: "Bookworm", desc: "Review 10 modules", check: function (s) { return s.modulesReviewed >= 10; } },
    { id: "module-all", icon: "🎓", name: "Course Complete", desc: "Review all " + TOTAL_MODULES + " modules across every guide", check: function (s) { return s.modulesReviewed >= TOTAL_MODULES; } },
    { id: "subject-1", icon: "🏅", name: "Subject Mastered", desc: "Fully review every module in one guide", check: function (s) { return s.subjectsCompleted >= 1; } },
    { id: "subject-5", icon: "🏆", name: "Halfway Scholar", desc: "Fully review 5 of 10 guides", check: function (s) { return s.subjectsCompleted >= 5; } },
    { id: "mind-25", icon: "🧠", name: "Mind Explorer", desc: "Open 25 mind-map nodes", check: function (s) { return s.mindNodes >= 25; } },
    { id: "mind-100", icon: "🧠", name: "Mind Master", desc: "Open 100 mind-map nodes", check: function (s) { return s.mindNodes >= 100; } },
    { id: "quiz-25", icon: "❓", name: "Quiz Curious", desc: "Reveal 25 quiz / flashcard items", check: function (s) { return s.quizRevealed >= 25; } },
    { id: "quiz-150", icon: "🎯", name: "Quiz Veteran", desc: "Reveal 150 quiz / flashcard items", check: function (s) { return s.quizRevealed >= 150; } },
    { id: "srs-10", icon: "🔁", name: "SRS Initiate", desc: "Grade 10 spaced-repetition cards", check: function (s) { return s.srGraded >= 10; } },
    { id: "srs-250", icon: "🔁", name: "SRS Veteran", desc: "Grade 250 spaced-repetition cards", check: function (s) { return s.srGraded >= 250; } },
    { id: "streak-3", icon: "🔥", name: "On a Roll", desc: "Reach a 3-day streak", check: function (s) { return s.streakLongest >= 3; } },
    { id: "streak-7", icon: "🔥", name: "Dedicated", desc: "Reach a 7-day streak", check: function (s) { return s.streakLongest >= 7; } },
    { id: "streak-30", icon: "🔥", name: "Unstoppable", desc: "Reach a 30-day streak", check: function (s) { return s.streakLongest >= 30; } },
    { id: "challenge-100", icon: "💯", name: "Challenge Champion", desc: "Score 100% in Challenge Mode", check: function (s) { return s.challengePerfect; } },
    { id: "level-5", icon: "⭐", name: "Level 5", desc: "Reach level 5", check: function (s) { return s.level >= 5; } },
    { id: "level-10", icon: "🌟", name: "Level 10", desc: "Reach level 10", check: function (s) { return s.level >= 10; } }
  ];

  /* ----------------------------- storage ------------------------------- */
  function readJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function readNum(k, d) { try { var v = parseFloat(localStorage.getItem(k)); return isNaN(v) ? d : v; } catch (e) { return d; } }
  function writeNum(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }

  function getXP() { return readNum("gmf-xp", 0); }
  function setXP(v) { writeNum("gmf-xp", v); }
  function getSeen(name) { return readJSON("gmf-seen-" + name, {}); }
  function setSeen(name, obj) { writeJSON("gmf-seen-" + name, obj); }
  function markSeenOnce(name, key) {
    var s = getSeen(name);
    if (s[key]) return false;
    s[key] = 1;
    setSeen(name, s);
    return true;
  }
  function seenCount(name) { return Object.keys(getSeen(name)).length; }
  function getCounter(name) { return readNum("gmf-count-" + name, 0); }
  function incCounter(name, by) { var v = getCounter(name) + (by || 1); writeNum("gmf-count-" + name, v); return v; }
  function getStreak() { return readJSON("gmf-streak", { date: null, current: 0, longest: 0 }); }
  function setStreak(v) { writeJSON("gmf-streak", v); }
  function getEarnedBadges() { return readJSON("gmf-badges", []); }
  function setEarnedBadges(v) { writeJSON("gmf-badges", v); }
  function getChallengeBest() { return readJSON("gmf-challenge-best", {}); }
  function setChallengeBest(v) { writeJSON("gmf-challenge-best", v); }
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  /* ------------------------------ levels -------------------------------- */
  function xpForLevel(level) { return 50 * level * (level + 1); } // cumulative XP needed to COMPLETE this level
  function levelFromXP(xp) {
    var lvl = 1;
    while (xp >= xpForLevel(lvl)) lvl++;
    return lvl;
  }
  function levelTitle(lvl) { return lvl <= LEVEL_TITLES.length ? LEVEL_TITLES[lvl - 1] : GRANDMASTER; }
  function levelProgress(xp, lvl) {
    var prevReq = lvl > 1 ? xpForLevel(lvl - 1) : 0;
    var nextReq = xpForLevel(lvl);
    return { into: xp - prevReq, span: nextReq - prevReq, prevReq: prevReq, nextReq: nextReq };
  }

  /* ------------------------------ streak -------------------------------- */
  function touchStreak() {
    var s = getStreak(), t = todayStr();
    if (s.date === t) return false; // already counted today
    var bonus = true;
    if (s.date === yesterdayStr()) s.current = (s.current || 0) + 1;
    else s.current = 1;
    s.longest = Math.max(s.longest || 0, s.current);
    s.date = t;
    setStreak(s);
    if (bonus) addXP(XP.dailyBonus, "🔥 Daily streak bonus");
    return true;
  }

  /* -------------------------------- xp ----------------------------------- */
  var hudRefreshCb = null;
  function addXP(amount, label) {
    setXP(getXP() + amount);
    if (label) showToast("+" + amount + " XP — " + label);
    runBadgeCheck();
    if (hudRefreshCb) hudRefreshCb();
  }
  function awardOnce(setName, key, amount, label) {
    if (markSeenOnce(setName, key)) {
      touchStreak();
      addXP(amount, label);
      return true;
    }
    return false;
  }
  function awardRepeatable(amount, label, counterName) {
    if (counterName) incCounter(counterName, 1);
    touchStreak();
    addXP(amount, label);
  }

  /* ------------------------------ stats ---------------------------------- */
  function computeStats() {
    var xp = getXP(), lvl = levelFromXP(xp);
    var streak = getStreak();
    var subjectsCompleted = 0;
    MANIFEST.forEach(function (m) {
      var seen = getSeen("module");
      var count = 0;
      for (var i = 0; i < m.modules; i++) if (seen[m.file + ":" + i]) count++;
      if (count >= m.modules && m.modules > 0) subjectsCompleted++;
    });
    var challengeBest = getChallengeBest();
    var perfect = false;
    Object.keys(challengeBest).forEach(function (k) { if (challengeBest[k] >= 100) perfect = true; });
    return {
      xp: xp, level: lvl, levelTitleStr: levelTitle(lvl), prog: levelProgress(xp, lvl),
      streakCurrent: streak.current || 0, streakLongest: streak.longest || 0,
      modulesReviewed: seenCount("module"), subjectsCompleted: subjectsCompleted,
      mindNodes: seenCount("mind"), quizRevealed: seenCount("quiz"),
      srGraded: getCounter("srgraded"), challengeBest: challengeBest, challengePerfect: perfect
    };
  }

  function runBadgeCheck() {
    var stats = computeStats();
    var earned = getEarnedBadges();
    var earnedSet = {}; earned.forEach(function (id) { earnedSet[id] = 1; });
    var fresh = [];
    BADGES.forEach(function (b) {
      if (!earnedSet[b.id] && b.check(stats)) { earned.push(b.id); fresh.push(b); }
    });
    if (fresh.length) {
      setEarnedBadges(earned);
      fresh.forEach(function (b) { showToast(b.icon + " Badge unlocked — " + b.name); });
    }
    return stats;
  }

  /* -------------------------------- CSS ----------------------------------- */
  function injectCSS() {
    var css = ""
      + ".gmf-hud{position:fixed;bottom:16px;left:16px;z-index:99996;display:flex;align-items:center;gap:8px;"
      + "background:rgba(255,255,255,.78);"
      + "border:1px solid rgba(0,0,0,.08);border-radius:999px;padding:6px 14px 6px 8px;box-shadow:0 4px 18px rgba(0,0,0,.12);"
      + "font:600 .8rem -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1C1917;cursor:pointer;user-select:none;transition:transform .15s ease}"
      + ".gmf-hud:hover{transform:translateY(-1px)}"
      + "[data-theme='dark'] .gmf-hud{background:rgba(28,26,24,.78);border-color:rgba(255,255,255,.12);color:#F5F1ED}"
      + ".gmf-hud .gmf-lvl{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;"
      + "background:linear-gradient(135deg,#b9762f,#8a4f1f);color:#fff;font-size:.7rem;font-weight:800}"
      + ".gmf-hud .gmf-streak{color:#c0392b}"
      + ".gmf-popover{position:fixed;bottom:62px;left:16px;z-index:99996;width:280px;max-width:88vw;display:none;"
      + "background:rgba(255,255,255,.94);"
      + "border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:16px;box-shadow:0 12px 36px rgba(0,0,0,.18);"
      + "font:500 .82rem/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1C1917}"
      + "[data-theme='dark'] .gmf-popover{background:rgba(24,22,20,.96);border-color:rgba(255,255,255,.12);color:#F5F1ED}"
      + ".gmf-popover.open{display:block}"
      + ".gmf-popover h4{margin:0 0 8px;font-size:.95rem}"
      + ".gmf-bar-track{background:rgba(0,0,0,.08);border-radius:999px;height:8px;overflow:hidden;margin:4px 0 10px}"
      + "[data-theme='dark'] .gmf-bar-track{background:rgba(255,255,255,.12)}"
      + ".gmf-bar-fill{height:100%;background:linear-gradient(90deg,#b9762f,#2f7d6a);border-radius:999px;transition:width .4s ease}"
      + ".gmf-popover a.gmf-dash-link{display:inline-block;margin-top:6px;color:#2f7d6a;font-weight:700;text-decoration:none}"
      + ".gmf-toast-stack{position:fixed;bottom:64px;left:16px;z-index:99997;display:flex;flex-direction:column;gap:8px;align-items:flex-start}"
      + ".gmf-toast{background:rgba(28,26,24,.92);color:#fff;padding:9px 16px;border-radius:10px;font:600 .82rem/1.3 -apple-system,sans-serif;"
      + "box-shadow:0 6px 20px rgba(0,0,0,.25);opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;max-width:280px}"
      + ".gmf-toast.show{opacity:1;transform:translateY(0)}"
      + ".gmf-dash{margin:0 auto 38px;max-width:1080px;padding:0 24px;box-sizing:border-box}"
      + ".gmf-dash-card{background:rgba(255,255,255,.65);"
      + "border:1px solid rgba(0,0,0,.06);border-radius:20px;padding:24px 26px;box-shadow:0 8px 28px rgba(0,0,0,.08)}"
      + "[data-theme='dark'] .gmf-dash-card{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}"
      + ".gmf-dash-top{display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;margin-bottom:18px}"
      + ".gmf-dash-id{display:flex;align-items:center;gap:14px}"
      + ".gmf-dash-lvl{width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#b9762f,#8a4f1f);color:#fff;"
      + "display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;flex-shrink:0}"
      + ".gmf-dash-title{font-size:1.05rem;font-weight:700}"
      + ".gmf-dash-sub{font-size:.82rem;color:#78716C;margin-top:2px}"
      + ".gmf-dash-streak{display:flex;gap:18px;font-size:.85rem;color:#78716C}"
      + ".gmf-dash-streak b{display:block;font-size:1.3rem;color:#c0392b}"
      + ".gmf-xpwrap{flex:1 1 220px;min-width:200px}"
      + ".gmf-xpwrap .gmf-bar-track{height:10px}"
      + ".gmf-subjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin:14px 0 20px}"
      + ".gmf-subj{font-size:.8rem}"
      + ".gmf-subj-name{display:flex;justify-content:space-between;margin-bottom:3px;color:#44403C}"
      + ".gmf-subj .gmf-bar-track{height:6px;margin:0}"
      + ".gmf-subj.done .gmf-subj-name{color:#2f7d6a;font-weight:700}"
      + ".gmf-badgegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:10px}"
      + ".gmf-badge{text-align:center;padding:10px 4px;border-radius:12px;background:rgba(0,0,0,.03);font-size:.68rem;color:#44403C}"
      + "[data-theme='dark'] .gmf-badge{background:rgba(255,255,255,.05);color:#cfc7bf}"
      + ".gmf-badge .gmf-badge-icon{font-size:1.5rem;display:block;margin-bottom:4px;filter:grayscale(1) opacity(.35)}"
      + ".gmf-badge.unlocked .gmf-badge-icon{filter:none}"
      + ".gmf-badge.unlocked{background:rgba(185,118,47,.12)}"
      + ".gmf-dash h3{margin:18px 0 8px;font-size:.92rem;color:#1C1917;display:flex;align-items:center;justify-content:space-between}"
      + "[data-theme='dark'] .gmf-dash h3{color:#F5F1ED}"
      + ".gmf-badge-count{font-weight:600;color:#78716C;font-size:.78rem}"
      + ".gmf-xp-note{color:#78716C;font-size:.78rem}"
      + "[data-theme='dark'] .gmf-dash-title{color:#F5F1ED}"
      + "[data-theme='dark'] .gmf-dash-sub{color:#B7AFA6}"
      + "[data-theme='dark'] .gmf-dash-streak{color:#B7AFA6}"
      + "[data-theme='dark'] .gmf-subj-name{color:#E7DDD0}"
      + "[data-theme='dark'] .gmf-subj.done .gmf-subj-name{color:#5cbfa3}"
      + "[data-theme='dark'] .gmf-badge-count{color:#B7AFA6}"
      + "[data-theme='dark'] .gmf-xp-note{color:#B7AFA6}"
      + "[data-theme='dark'] .gmf-dash-card .gmf-subj .gmf-bar-track{background:rgba(255,255,255,.14)}"
      + ".gmf-chal-btn{display:inline-flex;align-items:center;gap:6px}"
      + ".gmf-dock{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:99998;display:none;"
      + "max-width:min(92vw,520px);flex-wrap:wrap;justify-content:center;"
      + "background:rgba(28,26,24,.92);color:#fff;border-radius:14px;padding:10px 16px;gap:10px 14px;align-items:center;"
      + "font:600 .82rem -apple-system,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)}"
      + ".gmf-dock.show{display:flex}"
      + ".gmf-dock button{border:none;border-radius:8px;padding:7px 13px;font:700 .78rem -apple-system,sans-serif;cursor:pointer}"
      + ".gmf-dock .gmf-prev{background:rgba(255,255,255,.14);color:#fff}"
      + ".gmf-dock .gmf-know{background:#2f7d6a;color:#fff}"
      + ".gmf-dock .gmf-miss{background:#c0392b;color:#fff}"
      + ".gmf-dock .gmf-end{background:transparent;color:#cfc7bf;text-decoration:underline}"
      + ".gmf-dock button:disabled{opacity:.35;cursor:default}"
      + ".gmf-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}"
      + ".gmf-modal{background:#fff;border-radius:18px;max-width:380px;width:100%;padding:28px 26px;text-align:center;"
      + "font:500 .9rem/1.5 -apple-system,sans-serif;color:#1C1917;box-shadow:0 20px 60px rgba(0,0,0,.35)}"
      + "[data-theme='dark'] .gmf-modal{background:#221f1c;color:#F5F1ED}"
      + ".gmf-modal .gmf-score{font-size:2.4rem;font-weight:800;margin:8px 0;color:#b9762f}"
      + ".gmf-modal button{margin-top:16px;border:none;background:#2f7d6a;color:#fff;padding:10px 22px;border-radius:10px;font-weight:700;cursor:pointer}"
      + ".gmf-highlight{outline:3px solid #b9762f !important;outline-offset:3px;border-radius:8px;transition:outline-color .3s}"
      + ".gmf-confetti-piece{position:fixed;width:7px;height:11px;pointer-events:none;z-index:100000;border-radius:2px;"
      + "animation:gmf-confetti-burst .9s cubic-bezier(.2,.8,.3,1) forwards}"
      + "@keyframes gmf-confetti-burst{0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(1)}"
      + "100%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(.6)}}";
    var style = document.createElement("style");
    style.id = "gmf-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ------------------------------ toasts ---------------------------------- */
  var toastStack;
  function showToast(msg) {
    if (!toastStack) {
      toastStack = document.createElement("div");
      toastStack.className = "gmf-toast-stack";
      document.body.appendChild(toastStack);
    }
    var t = document.createElement("div");
    t.className = "gmf-toast";
    t.textContent = msg;
    toastStack.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 300);
    }, 3200);
  }

  /* ------------------------------ confetti ---------------------------------- */
  var CONFETTI_COLORS = ["#b9762f", "#2f7d6a", "#c0392b", "#3f6cb0", "#8a4f1f", "#e0a458"];
  function burstConfetti(x, y) {
    if (typeof x !== "number" || typeof y !== "number") return;
    var n = 16;
    for (var i = 0; i < n; i++) {
      var el = document.createElement("div");
      el.className = "gmf-confetti-piece";
      var angle = Math.random() * Math.PI * 2;
      var dist = 55 + Math.random() * 70;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist - 35; // slight upward bias
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      el.style.setProperty("--tx", tx + "px");
      el.style.setProperty("--ty", ty + "px");
      el.style.setProperty("--rot", (Math.random() * 480 - 240) + "deg");
      document.body.appendChild(el);
      (function (node) { setTimeout(function () { node.remove(); }, 950); })(el);
    }
  }

  /* -------------------------------- HUD ------------------------------------ */
  function injectHUD() {
    var hud = document.createElement("div");
    hud.className = "gmf-hud";
    hud.innerHTML = '<span class="gmf-lvl" id="gmfLvlBadge">1</span><span id="gmfXpLabel">0 XP</span><span class="gmf-streak" id="gmfStreakLabel"></span>';
    document.body.appendChild(hud);

    var pop = document.createElement("div");
    pop.className = "gmf-popover";
    pop.id = "gmfPopover";
    document.body.appendChild(pop);

    function isHub() { return !!document.getElementById("gamifyDashboard"); }

    function render() {
      var s = computeStats();
      document.getElementById("gmfLvlBadge").textContent = s.level;
      document.getElementById("gmfXpLabel").textContent = s.xp + " XP";
      document.getElementById("gmfStreakLabel").textContent = s.streakCurrent > 0 ? "🔥" + s.streakCurrent : "";
      var pct = s.prog.span > 0 ? Math.min(100, Math.round((s.prog.into / s.prog.span) * 100)) : 100;
      var dashHref = isHub() ? "#gamifyDashboard" : "learning.html#gamifyDashboard";
      pop.innerHTML =
        "<h4>" + s.levelTitleStr + " · Lv " + s.level + "</h4>" +
        '<div class="gmf-bar-track"><div class="gmf-bar-fill" style="width:' + pct + '%"></div></div>' +
        "<div>" + s.prog.into + " / " + s.prog.span + " XP to next level</div>" +
        "<div style='margin-top:10px'>🔥 Streak: <b>" + s.streakCurrent + "</b> days (best " + s.streakLongest + ")</div>" +
        "<div>🏆 Badges: " + getEarnedBadges().length + " / " + BADGES.length + "</div>" +
        "<div>📘 Modules reviewed: " + s.modulesReviewed + " / " + TOTAL_MODULES + "</div>" +
        '<a class="gmf-dash-link" href="' + dashHref + '">View full dashboard →</a>';
      renderDashboardIfPresent();
    }
    hud.addEventListener("click", function (e) {
      e.stopPropagation();
      pop.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!pop.contains(e.target) && e.target !== hud && !hud.contains(e.target)) pop.classList.remove("open");
    });
    hudRefreshCb = render;
    render();
  }

  /* ---------------------------- dashboard ---------------------------------- */
  function renderDashboardIfPresent() {
    var host = document.getElementById("gamifyDashboard");
    if (!host) return;
    var s = computeStats();
    var pct = s.prog.span > 0 ? Math.min(100, Math.round((s.prog.into / s.prog.span) * 100)) : 100;
    var earned = getEarnedBadges();
    var earnedSet = {}; earned.forEach(function (id) { earnedSet[id] = 1; });

    var subjHtml = MANIFEST.map(function (m) {
      var seen = getSeen("module");
      var count = 0;
      for (var i = 0; i < m.modules; i++) if (seen[m.file + ":" + i]) count++;
      var p = m.modules > 0 ? Math.round((count / m.modules) * 100) : 0;
      var done = count >= m.modules && m.modules > 0;
      return '<div class="gmf-subj' + (done ? " done" : "") + '">' +
        '<div class="gmf-subj-name"><span>' + (done ? "✓ " : "") + m.title + "</span><span>" + count + "/" + m.modules + "</span></div>" +
        '<div class="gmf-bar-track"><div class="gmf-bar-fill" style="width:' + p + '%"></div></div></div>';
    }).join("");

    var badgeHtml = BADGES.map(function (b) {
      var on = !!earnedSet[b.id];
      return '<div class="gmf-badge' + (on ? " unlocked" : "") + '" title="' + b.name + " — " + b.desc + '">' +
        '<span class="gmf-badge-icon">' + b.icon + "</span>" + b.name + "</div>";
    }).join("");

    host.innerHTML =
      '<div class="gmf-dash"><div class="gmf-dash-card">' +
      '<div class="gmf-dash-top">' +
      '<div class="gmf-dash-id"><div class="gmf-dash-lvl">' + s.level + '</div><div>' +
      '<div class="gmf-dash-title">' + s.levelTitleStr + '</div>' +
      '<div class="gmf-dash-sub">' + s.xp + ' XP total · ' + s.modulesReviewed + '/' + TOTAL_MODULES + ' modules reviewed</div></div></div>' +
      '<div class="gmf-dash-streak"><div>Current streak<b>' + s.streakCurrent + '</b></div><div>Best streak<b>' + s.streakLongest + '</b></div></div>' +
      '</div>' +
      '<div class="gmf-xpwrap"><div class="gmf-bar-track"><div class="gmf-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="gmf-xp-note">' + s.prog.into + ' / ' + s.prog.span + ' XP to Level ' + (s.level + 1) + '</div></div>' +
      '<h3>Study guide progress</h3>' +
      '<div class="gmf-subjects">' + subjHtml + '</div>' +
      '<h3>Badges <span class="gmf-badge-count">' + earned.length + ' / ' + BADGES.length + ' unlocked</span></h3>' +
      '<div class="gmf-badgegrid">' + badgeHtml + '</div>' +
      '</div></div>';
  }

  /* ------------------------------ hooks: modules ---------------------------- */
  function hookModuleReview() {
    var native = Array.prototype.slice.call(document.querySelectorAll(".li-review"));
    if (native.length) {
      native.forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          if (btn.classList.contains("done") || (function () { try { return localStorage.getItem("ls-rev:" + FILE + ":" + i) === "1"; } catch (e) { return false; } })()) {
            awardOnce("module", FILE + ":" + i, XP.module, "Module reviewed");
          }
        });
      });
      return;
    }
    // Fallback for guides whose module headings use a different class
    // (no native "Mark reviewed" control exists yet) — add our own.
    var heads = Array.prototype.slice.call(document.querySelectorAll(".module-header"));
    heads.forEach(function (h, i) {
      var key = "ls-rev:" + FILE + ":" + i;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "gmf-review-btn";
      b.style.cssText = "margin-left:10px;font:600 .72rem -apple-system,sans-serif;border:1px solid rgba(0,0,0,.15);" +
        "background:rgba(0,0,0,.04);border-radius:999px;padding:4px 11px;cursor:pointer;";
      var done = false;
      try { done = localStorage.getItem(key) === "1"; } catch (e) {}
      function render() {
        b.textContent = done ? "✓ Reviewed" : "Mark reviewed";
        b.style.opacity = done ? "0.85" : "1";
      }
      render();
      b.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        done = !done;
        try { localStorage.setItem(key, done ? "1" : "0"); } catch (e) {}
        render();
        if (done) awardOnce("module", FILE + ":" + i, XP.module, "Module reviewed");
      });
      h.appendChild(b);
    });
  }

  /* ----------------------------- hooks: mind map ----------------------------- */
  function hookMindMap() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".mm-node"));
    if (!nodes.length) return;
    nodes.forEach(function (n, i) {
      n.addEventListener("click", function () {
        awardOnce("mind", FILE + ":" + i, XP.mind, null); // silent, frequent — no toast spam
      });
    });
  }

  /* ------------------------------ hooks: quiz reveal -------------------------- */
  var quizEls = [];
  function hookQuizReveal() {
    quizEls = Array.prototype.slice.call(document.querySelectorAll(".qq, .quiz-item, .quiz-q, .q, details.flashcard"));
    if (!quizEls.length) return;
    document.addEventListener("click", function (e) {
      var el = e.target.closest && e.target.closest(".qq, .quiz-item, .quiz-q, .q, details.flashcard");
      if (!el) return;
      var idx = quizEls.indexOf(el);
      if (idx >= 0) awardOnce("quiz", FILE + ":" + idx, XP.quiz, null);
    });
  }

  /* ------------------------------- hooks: SM-2 -------------------------------- */
  function hookSM2() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t.closest) return;
      var rateBtn = t.closest("#rate button");
      var gradeBtn = !rateBtn && t.closest(".grade-btn");
      var btn = rateBtn || gradeBtn;
      if (btn) {
        var isCorrect = rateBtn
          ? parseInt(rateBtn.getAttribute("data-q"), 10) >= 4   // Good=4, Easy=5
          : /\bg-(good|easy)\b/.test(gradeBtn.className);
        if (isCorrect) burstConfetti(e.clientX, e.clientY);
        awardRepeatable(XP.sr, null, "srgraded");
      }
    });

    /* review.html and Pharmacology_Flashcards.html both also grade via number-key
       shortcuts (1-4) that call rate()/applyGrade() directly from a keydown handler,
       never dispatching a click — so the listener above never sees those. Mirror it
       here, gated on the actual grading UI (#rate / #gradeRow) being visible. Both
       apps map key "3"=Good and "4"=Easy, so that's our "correct" signal. */
    function visibleGroup(id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var cs = window.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return null;
      return el;
    }
    document.addEventListener("keydown", function (e) {
      if (e.repeat) return;
      if (e.key !== "1" && e.key !== "2" && e.key !== "3" && e.key !== "4") return;
      var group = visibleGroup("rate") || visibleGroup("gradeRow");
      if (!group) return;
      var isCorrect = (e.key === "3" || e.key === "4");
      if (isCorrect) {
        var r = group.getBoundingClientRect();
        burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
      }
      awardRepeatable(XP.sr, null, "srgraded");
    });
  }

  /* ----------------------------- Challenge Mode ------------------------------- */
  function hookChallenge() {
    if (!quizEls.length) return;
    var toolbar = document.getElementById("gpToolbarExtra") || document.querySelector(".gp-toolbar");
    if (!toolbar) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "gmfChallengeBtn";
    btn.className = "gmf-chal-btn";
    btn.textContent = "🏆 Challenge";
    btn.title = "Self-graded random challenge over this guide's quiz items";
    toolbar.appendChild(btn);
    btn.addEventListener("click", startChallenge);

    var dock, current, order, pos, total, grades;
    function buildDock() {
      dock = document.createElement("div");
      dock.className = "gmf-dock";
      dock.innerHTML =
        '<button class="gmf-prev" id="gmfPrev">← Previous</button>' +
        '<span id="gmfDockProgress">Item 1/10</span>' +
        '<button class="gmf-know" id="gmfKnow" disabled>✓ Knew it</button>' +
        '<button class="gmf-miss" id="gmfMiss" disabled>✗ Missed it</button>' +
        '<button class="gmf-end" id="gmfEnd">End</button>';
      document.body.appendChild(dock);
      document.getElementById("gmfPrev").addEventListener("click", prevItem);
      document.getElementById("gmfKnow").addEventListener("click", function (e) { burstConfetti(e.clientX, e.clientY); grade(true); });
      document.getElementById("gmfMiss").addEventListener("click", function () { grade(false); });
      document.getElementById("gmfEnd").addEventListener("click", endChallenge);
    }

    function startChallenge() {
      if (!dock) buildDock();
      var pool = quizEls.slice();
      for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
      order = pool.slice(0, Math.min(10, pool.length));
      total = order.length; pos = 0; grades = new Array(total);
      dock.classList.add("show");
      showItem();
    }
    var revealPoll;
    function showItem() {
      clearInterval(revealPoll);
      document.querySelectorAll(".gmf-highlight").forEach(function (e) { e.classList.remove("gmf-highlight"); });
      if (pos >= total) { return finishChallenge(); }
      current = order[pos];
      document.getElementById("gmfDockProgress").textContent = "Item " + (pos + 1) + "/" + total + " — tap it, then self-grade";
      document.getElementById("gmfPrev").disabled = (pos === 0);
      document.getElementById("gmfKnow").disabled = true;
      document.getElementById("gmfMiss").disabled = true;
      current.classList.add("gmf-highlight");
      current.scrollIntoView({ behavior: "smooth", block: "center" });
      revealPoll = setInterval(function () {
        var revealed = current.classList.contains("open") || (current.tagName === "DETAILS" && current.open);
        if (revealed) {
          document.getElementById("gmfKnow").disabled = false;
          document.getElementById("gmfMiss").disabled = false;
          clearInterval(revealPoll);
        }
      }, 250);
    }
    function grade(knew) {
      grades[pos] = knew;
      pos++;
      showItem();
    }
    function prevItem() {
      if (pos <= 0) return;
      pos--;
      showItem();
    }
    function finishChallenge() {
      dock.classList.remove("show");
      document.querySelectorAll(".gmf-highlight").forEach(function (e) { e.classList.remove("gmf-highlight"); });
      var score = grades.filter(function (g) { return g === true; }).length;
      var pct = total ? Math.round((score / total) * 100) : 0;
      var best = getChallengeBest();
      var prevBest = best[FILE] || 0;
      if (pct > prevBest) { best[FILE] = pct; setChallengeBest(best); }
      addXP(score * XP.challengePerItem, "Challenge result " + score + "/" + total);
      showResultModal(score, total, pct, prevBest);
    }
    function endChallenge() {
      clearInterval(revealPoll);
      dock.classList.remove("show");
      document.querySelectorAll(".gmf-highlight").forEach(function (e) { e.classList.remove("gmf-highlight"); });
    }
    function showResultModal(score, total, pct, prevBest) {
      var bg = document.createElement("div");
      bg.className = "gmf-modal-bg";
      bg.innerHTML = '<div class="gmf-modal"><div>Challenge complete</div>' +
        '<div class="gmf-score">' + score + ' / ' + total + '</div>' +
        '<div>' + pct + "% — best on this guide: " + Math.max(pct, prevBest) + "%</div>" +
        '<button id="gmfModalClose">Nice</button></div>';
      document.body.appendChild(bg);
      document.getElementById("gmfModalClose").addEventListener("click", function () { bg.remove(); });
      bg.addEventListener("click", function (e) { if (e.target === bg) bg.remove(); });
    }
  }

  /* --------------------------------- init -------------------------------------- */
  function init() {
    injectCSS();
    injectHUD();
    hookModuleReview();
    hookMindMap();
    hookQuizReveal();
    hookChallenge();
    hookSM2();
    renderDashboardIfPresent();
    runBadgeCheck();
    if (hudRefreshCb) hudRefreshCb();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
