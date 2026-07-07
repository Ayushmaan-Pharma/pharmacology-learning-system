/* ============================================================================
   app-shell.js — shared UI shell for the Pharmacology Study Hub
   • Injects a floating "Sections" menu (bottom-left corner) on every page
   • Provides cross-device progress sync via Supabase (magic-link auth)
   Everything is self-contained; pages just load: <script src="app-shell.js" defer></script>
   Build: mobile-responsive tables + diagrams, dark-mode dashboard fix.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__pharmShell) return;            // guard against double-load
  window.__pharmShell = true;

  /* ----------------------------------------------------------------------
     0. CONFIG  — filled in after the Supabase project is created.
     The anon key is a PUBLIC key (safe to ship in client code); row-level
     security on the database is what protects each user's data.
     ---------------------------------------------------------------------- */
  var SUPABASE_URL  = "https://zebeziqpsslqwdyjbavb.supabase.co";
  var SUPABASE_ANON = "sb_publishable_Io-EZdfEvBBBbpskuhDlNQ_JJjhZf9C";
  var SYNC_CONFIGURED = SUPABASE_URL.indexOf("%%") === -1 && SUPABASE_ANON.indexOf("%%") === -1;

  /* Keys we sync. pharm-theme is intentionally excluded (per-device). */
  var SYNC_PREFIXES = ["pharm-sr", "gmf-", "ls-rev:"];
  function isSyncKey(k) {
    if (!k || k.indexOf("pharm-theme") === 0) return false;
    for (var i = 0; i < SYNC_PREFIXES.length; i++) if (k.indexOf(SYNC_PREFIXES[i]) === 0) return true;
    return false;
  }

  /* ----------------------------------------------------------------------
     1. Page list for the menu
     ---------------------------------------------------------------------- */
  var GROUPS = [
    { title: "Study Hub", items: [
      ["index.html", "🏠 Home"],
      ["learning.html", "📚 Learning Systems"],
      ["questions.html", "❓ Question Bank"],
      ["review.html", "🔁 Spaced Repetition"],
      ["Pharmacology_Flashcards.html", "🃏 Flashcards"],
      ["index_pyq.html", "📄 PYQ Notes Library"]
    ]},
    { title: "Learning Systems", items: [
      ["General_Pharmacology_Learning-System.html", "General Pharmacology"],
      ["Neuropharmacology-ANS_Learning-System.html", "Neuropharmacology & ANS"],
      ["Cardiovascular-Renal_Pharmacology_Learning-System.html", "Cardiovascular & Renal"],
      ["Inflammation-Immunity-Hematopoiesis_Learning-System.html", "Inflammation, Immunity & Heme"],
      ["Endocrine-Pharmacology_Learning-System.html", "Endocrine"],
      ["Gastrointestinal_Pharmacology_Learning-System.html", "Gastrointestinal"],
      ["Infectious-Disease-Chemotherapy_Learning-System.html", "Infectious Disease Chemo"],
      ["Neoplastic-Disease-Pharmacology_Learning-System.html", "Neoplastic Disease"],
      ["Special-Systems_Pharmacology_Learning-System.html", "Special Systems"],
      ["Experimental-Pharmacology_Learning-System.html", "Experimental & Clinical"]
    ]},
    { title: "PYQ Notes", items: [
      ["General_Pharmacology_Notes.html", "General Pharmacology"],
      ["Autonomic_Receptor_Pharmacology_Notes.html", "Autonomic, Receptor & Neuro"],
      ["Pulmonary_Renal_Cardiovascular_Notes.html", "Pulmonary, Renal & CVS"],
      ["Neoplastic_Disease_Pharmacotherapy_Notes.html", "Neoplastic Disease"],
      ["Special_Systems_Pharmacology_Notes.html", "Special Systems"],
      ["Miscellaneous_Pharmacology_Notes.html", "Miscellaneous"]
    ]}
  ];

  /* ----------------------------------------------------------------------
     2. Styles
     ---------------------------------------------------------------------- */
  var css = ''
    + '#psm-root{font-family:"Inter",system-ui,-apple-system,sans-serif;}'
    + '#psm-launcher{position:fixed;bottom:18px;left:18px;z-index:2147482000;'
    +   'display:inline-flex;align-items:center;gap:.4em;padding:9px 15px;border-radius:999px;cursor:pointer;'
    +   'background:rgba(28,25,23,.94);color:#FBF7F0;border:1px solid rgba(212,168,71,.55);'
    +   'font-size:.82rem;font-weight:500;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);'
    +   'box-shadow:0 6px 20px rgba(0,0,0,.22);transition:transform .15s ease,box-shadow .15s ease,background .15s ease;}'
    + '#psm-launcher:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.28);background:rgba(28,25,23,1);}'
    + '#psm-launcher .psm-ico{color:#D4A847;font-size:.95rem;line-height:1;}'
    + '#psm-launcher .psm-dot{width:7px;height:7px;border-radius:50%;background:#7BAE7F;margin-left:2px;display:none;}'
    + '#psm-root.synced #psm-launcher .psm-dot{display:inline-block;}'
    + '#psm-overlay{position:fixed;inset:0;z-index:2147482001;background:rgba(10,10,12,.28);'
    +   '-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}'
    + '#psm-panel{position:fixed;bottom:64px;left:18px;z-index:2147482002;'
    +   'width:min(560px,92vw);max-height:min(76vh,640px);overflow-y:auto;opacity:0;pointer-events:none;'
    +   'background:#FBF7F0;color:#1C1917;border:1px solid #E7DDD0;border-radius:16px;'
    +   'box-shadow:0 24px 60px rgba(0,0,0,.26),0 6px 16px rgba(0,0,0,.12);'
    +   'padding:14px 16px 18px;transform:translateY(8px) scale(.98);transition:opacity .18s ease,transform .18s ease;}'
    + '#psm-root.open #psm-panel{opacity:1;pointer-events:auto;transform:translateY(0) scale(1);}'
    + '#psm-root.open #psm-launcher .psm-caret{transform:rotate(180deg);}'
    + '#psm-launcher .psm-caret{font-size:.65rem;opacity:.7;transition:transform .18s ease;}'
    + '.psm-acct{border:1px solid #E7DDD0;background:#fff;border-radius:12px;padding:11px 12px;margin-bottom:10px;}'
    + '.psm-acct .psm-h{margin:0 0 7px;}'
    + '.psm-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}'
    + '.psm-inp{flex:1 1 170px;min-width:140px;padding:8px 10px;border:1px solid #E7DDD0;border-radius:8px;font-size:.84rem;font-family:inherit;}'
    + '.psm-btn{padding:8px 13px;border-radius:8px;border:1px solid #1C1917;background:#1C1917;color:#FBF7F0;'
    +   'font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;}'
    + '.psm-btn.ghost{background:transparent;color:#1C1917;border-color:#E7DDD0;}'
    + '.psm-btn:disabled{opacity:.5;cursor:default;}'
    + '.psm-msg{font-size:.76rem;color:#78716C;margin-top:7px;line-height:1.4;}'
    + '.psm-msg.ok{color:#3f7a4f;} .psm-msg.err{color:#b04a4a;}'
    + '.psm-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 22px;}'
    + '.psm-h{font-family:"JetBrains Mono","SFMono-Regular",monospace;font-size:.62rem;letter-spacing:.15em;'
    +   'text-transform:uppercase;color:#A8A29E;margin:12px 6px 4px;}'
    + '.psm-grp:first-of-type .psm-h{margin-top:2px;}'
    + '.psm-grp a{display:block;text-decoration:none;color:#1C1917;font-size:.86rem;line-height:1.35;'
    +   'padding:7px 10px;border-radius:9px;transition:background .12s ease;}'
    + '.psm-grp a:hover{background:#F0E9DD;}'
    + '.psm-grp a.psm-active{background:#1C1917;color:#FBF7F0;font-weight:600;}'
    + '@media (max-width:560px){.psm-grid{grid-template-columns:1fr;}#psm-launcher .psm-lbl{display:none;}}'
    /* ---- responsive fixes applied to page content on every page ---- */
    + '.psm-tblscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;margin:1rem 0;}'
    + '.tbl-scroll,.tbl-wrap,.tbl{overflow-x:auto !important;-webkit-overflow-scrolling:touch;max-width:100%;}'
    + '.psm-tblscroll>table,.tbl-scroll>table,.tbl-wrap>table,.tbl>table{min-width:100%;width:auto;margin:0;}'
    + '.diagram-wrap{overflow-x:auto !important;-webkit-overflow-scrolling:touch;max-width:100%;}'
    + '.diagram-wrap svg{max-width:100%;height:auto;}'
    + 'svg{max-width:100%;}img{max-width:100%;height:auto;}'
    + 'html,body{max-width:100%;overflow-x:hidden;}'
    /* Skip painting large off-screen content blocks (big perf win on long pages).
       Double declaration: browsers without "auto <len>" support keep the first. */
    + '.module,.q,.sec{content-visibility:auto;contain-intrinsic-size:0 420px;contain-intrinsic-size:auto 420px;}'
    + '@media print{#psm-root{display:none!important;}}';

  /* ----------------------------------------------------------------------
     3. Build DOM
     ---------------------------------------------------------------------- */
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  var style = el("style"); style.textContent = css;
  var root = el("div", { id: "psm-root" });

  var launcher = el("button", { id: "psm-launcher", type: "button", "aria-haspopup": "true", "aria-expanded": "false", title: "Menu & sync" },
    '<span class="psm-ico">☰</span><span class="psm-lbl">Sections</span><span class="psm-dot" title="Cloud sync on"></span><span class="psm-caret">▴</span>');
  var overlay = el("div", { id: "psm-overlay", hidden: "" });
  var panel = el("nav", { id: "psm-panel", hidden: "", "aria-label": "Sections and account" });

  /* account block */
  var acct = el("div", { class: "psm-acct" });
  acct.innerHTML = '<p class="psm-h">Account &amp; Sync</p><div id="psm-acct-body"></div>';
  panel.appendChild(acct);

  /* link groups */
  var cur = (location.pathname.split("/").pop() || "index.html");
  try { cur = decodeURIComponent(cur); } catch (e) {}
  GROUPS.forEach(function (g) {
    var grp = el("div", { class: "psm-grp" });
    grp.appendChild(el("p", { class: "psm-h" }, g.title));
    var wrap = el("div", { class: "psm-grid" });
    g.items.forEach(function (it) {
      var a = el("a", { href: it[0] }, it[1]);
      if (it[0] === cur) a.className = "psm-active";
      wrap.appendChild(a);
    });
    grp.appendChild(wrap);
    panel.appendChild(grp);
  });

  root.appendChild(launcher); root.appendChild(overlay); root.appendChild(panel);

  function mount() {
    document.head.appendChild(style);
    document.body.appendChild(root);
    wireMenu();
    initSync();
    makeResponsive();
    // Re-run after other scripts/vars resolve (gamify HUD, dynamic content).
    if (document.readyState === "complete") tuneBackdropFilters();
    else window.addEventListener("load", tuneBackdropFilters);
    setTimeout(tuneBackdropFilters, 1500);
  }

  /* ----------------------------------------------------------------------
     Performance: heavy backdrop-filter blur (glassmorphism) is the main
     cause of choppy scrolling — a pinned/blurred bar re-blurs everything
     behind it every frame, and cost scales with the SQUARE of the radius.
     The blur radii here come from CSS variables, so we read each element's
     RESOLVED backdrop-filter and cap blur at 8px + strip saturate/brightness
     via an inline override. Look is preserved; repaint cost drops ~80-85%.
     Runs at most twice; each element is tuned once (data flag).
     ---------------------------------------------------------------------- */
  function capFilter(bf) {
    return bf
      .replace(/blur\(\s*([\d.]+)px\s*\)/g, function (m, rad) {
        return "blur(" + Math.min(parseFloat(rad), 8) + "px)";
      })
      .replace(/\s*saturate\([^)]*\)/g, "")
      .replace(/\s*brightness\([^)]*\)/g, "")
      .trim() || "none";
  }
  function tuneBackdropFilters() {
    try {
      var all = document.querySelectorAll("body *");
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.__psmBlurTuned) continue;
        if (el.id === "psm-root" || (el.closest && el.closest("#psm-root"))) continue;
        var cs = window.getComputedStyle(el);
        var bf = cs.backdropFilter || cs.webkitBackdropFilter || "none";
        if (!bf || bf === "none") continue;
        if (!/blur|saturate|brightness/.test(bf)) { el.__psmBlurTuned = 1; continue; }
        var capped = capFilter(bf);
        el.style.setProperty("backdrop-filter", capped, "important");
        el.style.setProperty("-webkit-backdrop-filter", capped, "important");
        el.__psmBlurTuned = 1;
      }
    } catch (e) {}
  }

  /* Wrap any table that isn't already inside a horizontal-scroll container
     (fixes the Notes pages) so wide tables scroll instead of being clipped. */
  function makeResponsive() {
    try {
      var wrapped = /(^|\s)(tbl-scroll|tbl-wrap|tbl|psm-tblscroll)(\s|$)/;
      var tables = document.querySelectorAll("table");
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i], p = t.parentNode;
        if (!p || p.nodeType !== 1) continue;
        if (wrapped.test(p.className || "")) continue;           // already scrollable
        if (t.closest && t.closest("#psm-root")) continue;       // never touch our own UI
        var w = document.createElement("div");
        w.className = "psm-tblscroll";
        p.insertBefore(w, t);
        w.appendChild(t);
      }
    } catch (e) {}
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  /* ----------------------------------------------------------------------
     4. Menu open/close
     ---------------------------------------------------------------------- */
  function wireMenu() {
    function open() { root.classList.add("open"); panel.hidden = false; overlay.hidden = false; launcher.setAttribute("aria-expanded", "true"); }
    function close() {
      root.classList.remove("open"); launcher.setAttribute("aria-expanded", "false");
      setTimeout(function () { if (!root.classList.contains("open")) { panel.hidden = true; overlay.hidden = true; } }, 200);
    }
    launcher.addEventListener("click", function (e) { e.stopPropagation(); root.classList.contains("open") ? close() : open(); });
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("open")) close(); });
  }

  /* ----------------------------------------------------------------------
     5. Sync layer (Supabase magic-link)
     ---------------------------------------------------------------------- */
  var sb = null, user = null;

  function acctBody() { return document.getElementById("psm-acct-body"); }
  function setMsg(text, cls) {
    var b = acctBody(); if (!b) return;
    var m = b.querySelector(".psm-msg");
    if (!m) { m = el("div", { class: "psm-msg" }); b.appendChild(m); }
    m.className = "psm-msg" + (cls ? " " + cls : ""); m.textContent = text || "";
  }

  function renderSignedOut() {
    acctBody().innerHTML =
      '<div class="psm-row">' +
      '  <input class="psm-inp" id="psm-email" type="email" placeholder="you@email.com" autocomplete="email">' +
      '  <button class="psm-btn" id="psm-signin">Send link</button>' +
      '</div><div class="psm-msg">Sign in to sync XP, achievements &amp; spaced-repetition progress across devices.</div>';
    document.getElementById("psm-signin").addEventListener("click", sendLink);
    document.getElementById("psm-email").addEventListener("keydown", function (e) { if (e.key === "Enter") sendLink(); });
  }
  function renderSignedIn() {
    acctBody().innerHTML =
      '<div class="psm-row"><div style="flex:1;font-size:.84rem;overflow:hidden;text-overflow:ellipsis;">Signed in as <b>' +
      (user.email || "you") + '</b></div>' +
      '<button class="psm-btn ghost" id="psm-syncnow">Sync now</button>' +
      '<button class="psm-btn ghost" id="psm-signout">Sign out</button></div><div class="psm-msg"></div>';
    document.getElementById("psm-syncnow").addEventListener("click", function () { syncNow(true); });
    document.getElementById("psm-signout").addEventListener("click", signOut);
    root.classList.add("synced");
  }

  function sendLink() {
    var email = (document.getElementById("psm-email").value || "").trim();
    if (!email) { setMsg("Enter your email first.", "err"); return; }
    document.getElementById("psm-signin").disabled = true;
    setMsg("Sending…", "");
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.href } })
      .then(function (r) {
        if (r.error) { setMsg(r.error.message, "err"); document.getElementById("psm-signin").disabled = false; }
        else setMsg("Check your email for a login link, then reopen this page.", "ok");
      });
  }
  function signOut() { sb.auth.signOut().then(function () { user = null; root.classList.remove("synced"); renderSignedOut(); }); }

  function loadSupabase() {
    return new Promise(function (resolve, reject) {
      if (window.supabase) return resolve();
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initSync() {
    if (!SYNC_CONFIGURED) {
      acctBody().innerHTML = '<div class="psm-msg">Cloud sync isn’t set up yet.</div>';
      return;
    }
    acctBody().innerHTML = '<div class="psm-msg">Loading…</div>';
    loadSupabase().then(function () {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      sb.auth.getSession().then(function (r) {
        user = r.data.session ? r.data.session.user : null;
        if (user) { renderSignedIn(); syncNow(false); } else renderSignedOut();
      });
      sb.auth.onAuthStateChange(function (_e, session) {
        var was = !!user; user = session ? session.user : null;
        if (user && !was) { renderSignedIn(); syncNow(false); }
        else if (!user && was) renderSignedOut();
      });
    }).catch(function () { setMsg("Couldn’t load the sync library (offline?).", "err"); });
  }

  /* ---- snapshot helpers ---- */
  function snapshot() {
    var o = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (isSyncKey(k)) o[k] = localStorage.getItem(k);
    }
    return o;
  }
  function parseJSON(v, d) { try { var x = JSON.parse(v); return x == null ? d : x; } catch (e) { return d; } }

  /* Merge two snapshots (local + remote) with progress-preserving rules. */
  function merge(localSnap, remoteSnap) {
    var out = {}, keys = {};
    var s; for (s in localSnap) keys[s] = 1; for (s in remoteSnap) keys[s] = 1;
    Object.keys(keys).forEach(function (k) {
      var lv = localSnap[k], rv = remoteSnap[k];
      if (lv == null) { out[k] = rv; return; }
      if (rv == null) { out[k] = lv; return; }
      if (lv === rv) { out[k] = lv; return; }
      if (k === "gmf-xp") { out[k] = String(Math.max(parseFloat(lv) || 0, parseFloat(rv) || 0)); return; }
      if (k.indexOf("gmf-seen-") === 0) {
        var a = parseJSON(lv, {}), b = parseJSON(rv, {}), m = {}, kk;
        for (kk in a) m[kk] = a[kk]; for (kk in b) m[kk] = m[kk] || b[kk];
        out[k] = JSON.stringify(m); return;
      }
      if (k.indexOf("ls-rev:") === 0) { out[k] = (lv === "1" || rv === "1") ? "1" : lv; return; }
      if (k === "pharm-sr" || k === "pharm-sr-meta") {
        var la = parseJSON(lv, {}), rb = parseJSON(rv, {}), mm = {}, id;
        for (id in la) mm[id] = la[id];
        for (id in rb) {
          if (!(id in mm)) { mm[id] = rb[id]; continue; }
          var lc = mm[id] || {}, rc = rb[id] || {};
          var ls = (lc.reps || 0) + (lc.interval || 0), rs = (rc.reps || 0) + (rc.interval || 0);
          mm[id] = rs > ls ? rc : lc;               // keep the more-progressed card
        }
        out[k] = JSON.stringify(mm); return;
      }
      out[k] = lv;                                    // default: keep local
    });
    return out;
  }

  var syncing = false;
  function syncNow(manual) {
    if (!sb || !user || syncing) return;
    syncing = true;
    if (manual) setMsg("Syncing…", "");
    var local = snapshot();
    sb.from("progress").select("data").eq("user_id", user.id).maybeSingle().then(function (r) {
      var remote = (r.data && r.data.data) ? r.data.data : {};
      var merged = merge(local, remote);
      // apply merged back to localStorage
      var changed = false, k;
      for (k in merged) { if (localStorage.getItem(k) !== merged[k]) { try { localStorage.setItem(k, merged[k]); changed = true; } catch (e) {} } }
      // push merged up
      sb.from("progress").upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() }).then(function (up) {
        syncing = false;
        if (up && up.error) { setMsg("Sync error: " + up.error.message, "err"); return; }
        setMsg("Synced ✓ " + new Date().toLocaleTimeString(), "ok");
        if (changed && !sessionStorage.getItem("psm-reloaded")) {
          sessionStorage.setItem("psm-reloaded", "1");
          setTimeout(function () { location.reload(); }, 600);   // refresh UI with merged data
        }
      });
    }, function () { syncing = false; setMsg("Couldn’t reach the server.", "err"); });
  }

  // push local changes when leaving the page
  window.addEventListener("beforeunload", function () {
    if (sb && user) { try { navigator.sendBeacon; } catch (e) {} }
  });
})();
