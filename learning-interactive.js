/* ============================================================
   Shared interactivity layer — Pharmacology Learning System
   Top toolbar · dark mode · search · item-by-item navigation
   (flashcards + quiz questions + modules) · reading progress ·
   per-module reviewed.  Pure client-side; persists via localStorage.
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement;
  var FILE = (location.pathname.split("/").pop() || "guide").replace(/\.html$/, "");
  var themeBtn = null;

  /* apply saved theme early to avoid a flash */
  try { if (localStorage.getItem("pharm-theme") === "dark") root.setAttribute("data-theme", "dark"); } catch (e) {}
  function isDark() { return root.getAttribute("data-theme") === "dark"; }
  function setTheme(mode) {
    if (mode === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    try { localStorage.setItem("pharm-theme", mode); } catch (e) {}
    if (themeBtn) themeBtn.innerHTML = isDark() ? "&#9728;&#65039; Light" : "&#127769; Dark";
  }

  function qsa(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    /* ---------- reading-progress bar ---------- */
    var prog = document.createElement("div");
    prog.id = "li-progress";
    document.body.appendChild(prog);
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
      scheduleSync();
    }

    /* ---------- navigation model ----------
       Prev/Next step through every flashcard and quiz question
       (and module intros), in document order. */
    var navItems = qsa("section.module, details.flashcard, .q, .quiz-item");
    qsa(".qq").forEach(function (q) {            // GI variant: question rows without a .q wrapper
      if (!q.closest(".q") && !q.closest(".quiz-item")) navItems.push(q);
    });
    navItems = navItems.filter(function (el, i, a) { return a.indexOf(el) === i; });
    navItems.sort(function (a, b) {
      var p = a.compareDocumentPosition(b);
      if (p & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (p & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    /* random "quiz me" pool = just flashcards + questions */
    var quizPool = navItems.filter(function (el) {
      return el.matches("details.flashcard, .q, .quiz-item, .qq");
    });

    var curIdx = 0, focusEl = null, lockUntil = 0;
    function flash(el) {
      if (focusEl) focusEl.classList.remove("li-focus");
      el.classList.add("li-focus");
      focusEl = el;
      clearTimeout(flash._t);
      flash._t = setTimeout(function () { el.classList.remove("li-focus"); }, 1100);
    }
    /* open any collapsed <details> ancestors (module gates, quiz-sets,
       flashcards) and reveal the question/answer itself, so the target is
       actually visible before we scroll to it. Without this, Prev/Next/Random
       can silently land on an item that's still hidden inside a closed
       <details> — it looks like the button did nothing. Mirrors what
       gotoMark() already does for search-jump. */
    function revealForNav(el) {
      var node = el;
      while (node && node !== document.body) {
        if (node.tagName === "DETAILS" && !node.open) node.open = true;
        node = node.parentElement;
      }
      var qd = el.closest && el.closest(".q, .quiz-item");
      if (qd) qd.classList.add("open");
      var qq = el.closest && el.closest(".qq");
      if (qq && !qq.closest(".q") && !qq.closest(".quiz-item")) qq.classList.add("open");
    }
    function goTo(i) {
      if (!navItems.length) return;
      curIdx = Math.max(0, Math.min(navItems.length - 1, i));
      lockUntil = Date.now() + 700;            // let the smooth-scroll settle before re-syncing
      var el = navItems[curIdx];
      revealForNav(el);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      flash(el);
      updPos();
    }
    function updPos() {
      if (posEl) posEl.textContent = (navItems.length ? curIdx + 1 : 0) + " / " + navItems.length;
    }
    function syncToScroll() {
      if (Date.now() < lockUntil) { updPos(); return; }   // don't fight a programmatic jump
      var c = window.scrollY + window.innerHeight * 0.4, best = 0;
      for (var i = 0; i < navItems.length; i++) {
        if (navItems[i].getBoundingClientRect().top + window.scrollY <= c) best = i;
      }
      curIdx = best; updPos();
    }
    var syncRAF = 0;
    function scheduleSync() {
      if (syncRAF) return;
      syncRAF = requestAnimationFrame(function () { syncRAF = 0; syncToScroll(); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    /* random / quiz-me */
    var lastRandomPoolIdx = -1;
    function randomItem() {
      if (!quizPool.length) { if (navItems.length) goTo(Math.floor(Math.random() * navItems.length)); return; }
      var poolIdx = Math.floor(Math.random() * quizPool.length);
      if (quizPool.length > 1) {                       // avoid repeating the same pick twice in a row
        var tries = 0;
        while (poolIdx === lastRandomPoolIdx && tries < 8) { poolIdx = Math.floor(Math.random() * quizPool.length); tries++; }
      }
      lastRandomPoolIdx = poolIdx;
      var el = quizPool[poolIdx];
      var idx = navItems.indexOf(el);
      goTo(idx >= 0 ? idx : 0);
    }

    /* expand / collapse everything */
    function setAll(open) {
      qsa("details").forEach(function (d) { d.open = open; });
      qsa(".q, .quiz-item").forEach(function (q) { q.classList.toggle("open", open); });
    }

    /* open/close the current item (Space) — reuses each file's own reveal logic */
    function toggleItem(el) {
      if (!el) return;
      if (el.tagName === "DETAILS") { el.open = !el.open; flash(el); return; }
      var trig = el.querySelector(":scope > .qq, :scope > .quiz-q");
      if (!trig && el.classList && el.classList.contains("qq")) trig = el; // GI standalone question
      if (trig) { trig.click(); flash(el); return; }
      if (el.matches && el.matches("section.module")) {        // module → reveal its Feynman gate
        var g = el.querySelector("details.gate"); if (g) { g.open = !g.open; flash(g); }
        return;
      }
      var d = el.querySelector && el.querySelector("details");
      if (d) { d.open = !d.open; flash(d); }
    }

    /* ---------- per-module "reviewed" toggles ---------- */
    var heads = qsa(".mod-head");
    function revKey(i) { return "ls-rev:" + FILE + ":" + i; }
    heads.forEach(function (h, i) {
      var b = document.createElement("button");
      b.className = "li-review"; b.type = "button";
      var done = false;
      try { done = localStorage.getItem(revKey(i)) === "1"; } catch (e) {}
      function render() { b.classList.toggle("done", done); b.textContent = done ? "✓ Reviewed" : "Mark reviewed"; }
      render();
      b.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        done = !done;
        try { localStorage.setItem(revKey(i), done ? "1" : "0"); } catch (e) {}
        render();
      });
      h.appendChild(b);
    });

    /* ---------- search: find-on-page → highlight matches and jump to them ---------- */
    var marks = [], markIdx = -1, searchDebounce = 0;
    // Search the whole page, not just <main> — the hero header (title,
    // subtitle, chapter blurbs), the table-of-contents nav, and the footer
    // (source/citation text) all live OUTSIDE <main> on these pages, so
    // restricting to <main> made a large chunk of real, visible content
    // unsearchable. Chrome (toolbar/drawer/hint popover) is still excluded
    // below in acceptNode.
    var searchRoot = document.body;
    function clearMarks() {
      document.querySelectorAll("mark.li-mark").forEach(function (m) {
        m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
      });
      marks = []; markIdx = -1; if (countEl) countEl.textContent = "";
    }
    function gotoMark(dir) {
      if (!marks.length) return;
      if (markIdx >= 0 && marks[markIdx]) marks[markIdx].classList.remove("li-mark-cur");
      markIdx = (markIdx + dir + marks.length) % marks.length;
      var mk = marks[markIdx];
      var det = mk.closest("details"); if (det) det.open = true;          // open gates/flashcards/quizsets
      var qd = mk.closest(".q, .quiz-item"); if (qd) qd.classList.add("open"); // reveal quiz answers
      var qq = mk.closest(".qq"); if (qq && !qq.closest(".q")) qq.classList.add("open"); // GI
      mk.classList.add("li-mark-cur");
      mk.scrollIntoView({ behavior: "smooth", block: "center" });
      if (countEl) countEl.textContent = (markIdx + 1) + " / " + marks.length;
    }
    function runSearch(q) {
      clearMarks();
      q = (q || "").trim();
      if (q.length < 2) return;
      var rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      var walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
          var tag = p.nodeName.toLowerCase();
          if (tag === "script" || tag === "style" || tag === "mark") return NodeFilter.FILTER_REJECT;
          if (p.closest && p.closest("#li-bar, .gp-toolbar, #li-hint, #gpDrawer, #gpProgressBar")) return NodeFilter.FILTER_REJECT;
          rx.lastIndex = 0;
          return rx.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        rx.lastIndex = 0;
        var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
        while ((m = rx.exec(text))) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mk = document.createElement("mark"); mk.className = "li-mark"; mk.textContent = m[0];
          frag.appendChild(mk); marks.push(mk);
          last = m.index + m[0].length;
          if (m[0].length === 0) rx.lastIndex++;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
      if (!marks.length) { countEl.textContent = "no matches"; return; }
      markIdx = -1; gotoMark(1);
    }

    /* ---------- build the top toolbar ---------- */
    function mkBtn(html, title, fn, cls) {
      var b = document.createElement("button");
      b.className = "li-btn" + (cls ? " " + cls : "");
      b.type = "button"; b.innerHTML = html; b.title = title; b.setAttribute("aria-label", title);
      b.addEventListener("click", fn);
      return b;
    }
    function sep() { var s = document.createElement("span"); s.className = "li-sep"; return s; }

    var bar = document.createElement("div");
    bar.id = "li-bar";

    var brand = document.createElement("span");
    brand.className = "li-brand";
    brand.textContent = "Learning System";

    var posEl = document.createElement("span");
    posEl.className = "li-pos";

    // search field
    var searchWrap = document.createElement("div");
    searchWrap.className = "li-search";
    var input = document.createElement("input");
    input.type = "text"; input.placeholder = "Find on page (Enter = next)"; input.setAttribute("aria-label", "Find on page");
    var countEl = document.createElement("span"); countEl.className = "li-count";
    searchWrap.appendChild(input); searchWrap.appendChild(countEl);
    input.addEventListener("input", function () {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () { runSearch(input.value); }, 220);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (marks.length) gotoMark(e.shiftKey ? -1 : 1); else runSearch(input.value);
      }
    });
    function toggleSearch(force) {
      var open = force != null ? force : !searchWrap.classList.contains("open");
      searchWrap.classList.toggle("open", open);
      if (open) input.focus(); else { input.value = ""; clearMarks(); }
    }

    var hint = document.createElement("div");
    hint.id = "li-hint";
    hint.innerHTML =
      "<b>Keyboard shortcuts</b><br>" +
      "<kbd>K</kbd> next card/question &nbsp; <kbd>J</kbd> previous<br>" +
      "<kbd>Space</kbd> reveal the current answer/card<br>" +
      "<kbd>R</kbd> random question &nbsp; <kbd>/</kbd> find on page<br>" +
      "<kbd>Enter</kbd> jump to next match (<kbd>Shift+Enter</kbd> previous)<br>" +
      "<kbd>E</kbd> expand all &nbsp; <kbd>C</kbd> collapse all<br>" +
      "<kbd>D</kbd> dark mode &nbsp; <kbd>T</kbd> top &nbsp; <kbd>B</kbd> bottom<br>" +
      "<kbd>Esc</kbd> close search / this box";
    document.body.appendChild(hint);

    themeBtn = mkBtn(isDark() ? "&#9728;&#65039; Light" : "&#127769; Dark", "Toggle dark mode (D)",
      function () { setTheme(isDark() ? "light" : "dark"); });

    // navigation group
    var navGroup = document.createElement("div"); navGroup.className = "li-group";
    navGroup.appendChild(mkBtn("&#9664;", "Previous card/question (J)", function () { goTo(curIdx - 1); }, "icon"));
    navGroup.appendChild(posEl);
    navGroup.appendChild(mkBtn("&#9654;", "Next card/question (K)", function () { goTo(curIdx + 1); }, "icon"));

    // jump group
    var jumpGroup = document.createElement("div"); jumpGroup.className = "li-group";
    jumpGroup.appendChild(mkBtn("&#8593; Top", "Scroll to top (T)", function () { window.scrollTo({ top: 0, behavior: "smooth" }); }));
    jumpGroup.appendChild(mkBtn("&#8595; Bottom", "Scroll to bottom (B)", function () { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }));
    jumpGroup.appendChild(mkBtn("&#127922; Random", "Random question (R)", randomItem));

    // tools group
    var toolGroup = document.createElement("div"); toolGroup.className = "li-group";
    toolGroup.appendChild(mkBtn("Expand", "Open all gates, cards & quizzes (E)", function () { setAll(true); }));
    toolGroup.appendChild(mkBtn("Collapse", "Close everything (C)", function () { setAll(false); }));
    toolGroup.appendChild(mkBtn("&#128269;", "Search (/)", function () { toggleSearch(); }, "icon"));
    toolGroup.appendChild(themeBtn);
    toolGroup.appendChild(mkBtn("&#8962; Hub", "Back to library hub", function () { location.href = "learning.html"; }));
    toolGroup.appendChild(mkBtn("?", "Keyboard shortcuts", function () { hint.classList.toggle("open"); }, "icon"));

    bar.appendChild(brand);
    bar.appendChild(sep());
    bar.appendChild(navGroup);
    bar.appendChild(sep());
    bar.appendChild(jumpGroup);
    bar.appendChild(searchWrap);
    bar.appendChild(document.createElement("span")).className = "li-spacer";
    bar.appendChild(toolGroup);

    /* fold these controls into the floating glass toolbar each page already
       builds for back/chapters-drawer (see .gp-toolbar), instead of adding a
       second, separate full-width sticky bar. Prefer the collapsible
       #gpToolbarExtra region (so these land in the expand/contract drawer,
       keeping only ☰/← visible by default); fall back to dropping straight
       into .gp-toolbar, then to the old standalone bar, if either is absent. */
    var hostToolbar = document.getElementById("gpToolbarExtra") || document.querySelector(".gp-toolbar");
    if (hostToolbar) {
      while (bar.firstChild) hostToolbar.appendChild(bar.firstChild);
    } else {
      document.body.appendChild(bar);
    }

    updPos();
    onScroll();

    /* ---------- keyboard shortcuts ---------- */
    document.addEventListener("keydown", function (e) {
      if (e.target === input) { if (e.key === "Escape") toggleSearch(false); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;
      switch (e.key) {
        case "k": case "K": e.preventDefault(); goTo(curIdx + 1); break;
        case "j": case "J": e.preventDefault(); goTo(curIdx - 1); break;
        case "r": case "R": randomItem(); break;
        case "e": case "E": setAll(true); break;
        case "c": case "C": setAll(false); break;
        case "d": case "D": setTheme(isDark() ? "light" : "dark"); break;
        case "t": case "T": window.scrollTo({ top: 0, behavior: "smooth" }); break;
        case "b": case "B": window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); break;
        case "/": e.preventDefault(); toggleSearch(true); break;
        case " ": case "Spacebar":
          if (e.target.closest && e.target.closest("#li-bar, .gp-toolbar")) return; // let toolbar buttons use Space
          e.preventDefault();
          toggleItem(navItems[curIdx]);
          break;
        case "?": hint.classList.toggle("open"); break;
        case "Escape": toggleSearch(false); hint.classList.remove("open"); break;
      }
    });
  });
})();
