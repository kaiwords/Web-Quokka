/* ============================================================
   WEB QUOKKA · Template 03 "Horizon Drift" — behaviour
   Vanilla JS, no libraries.

   1.  Helpers & mode           9.  Magnetic buttons + ripples
   2.  Rail engine              10. Tilt + spotlight
   3.  Navigation (anchors,     11. Orbit + chips (mouse tracking)
       keys, wheel, focus)      12. Rotating word
   4.  Drag to scroll           13. Counters
   5.  Header, chapter, FAB     14. Constellation canvas
   6.  Menu                     15. Plan buttons + contact form
   7.  Reveals + split words    16. Confetti
   8.  Custom cursor            17. Boot
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. HELPERS & MODE ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Horizontal journey only where there is room for it (and motion is welcome)
  var wideQuery = window.matchMedia("(min-width: 960px) and (min-height: 600px)");
  var COLORS = ["#D4FF3A", "#7CC8FF", "#B69CFF", "#FF6B2C", "#F2F0EA"];

  var rail = $(".rail");
  var sticky = $(".rail-sticky");
  var track = $("#track");
  var panels = $$(".panel", track);
  var chapters = panels.filter(function (p) { return p.hasAttribute("data-chapter"); });
  var header = $(".site-header");

  panels.forEach(function (p) { if (p.id) p.setAttribute("tabindex", "-1"); });

  /* ---------- 2. RAIL ENGINE ---------- */
  var H = {
    on: false,     // horizontal mode active
    x: 0,          // displayed offset (eased)
    target: 0,     // offset from scroll position
    max: 0,        // total horizontal travel
    top: 0,        // rail's document top
    prevX: 0,
    running: false
  };
  var geo = { panels: [], parallax: [], timeline: null };
  var timeline = $("#timeline");
  var steps = $$(".step", timeline);
  var progressFill = $("#progressFill");
  var progressLinks = $$(".progress-list a");

  function leftInTrack(el) {
    // Position of el along the track, independent of the current translate
    return el.getBoundingClientRect().left - track.getBoundingClientRect().left;
  }

  function measure() {
    if (H.on) {
      H.max = Math.max(0, track.scrollWidth - window.innerWidth);
      rail.style.height = (H.max + window.innerHeight) + "px";
      H.top = rail.getBoundingClientRect().top + window.scrollY;
    } else {
      rail.style.height = "";
      track.style.transform = "";
      H.max = 0;
    }
    geo.panels = panels.map(function (p) {
      return { el: p, left: p.offsetLeft, width: p.offsetWidth };
    });
    geo.parallax = $$("[data-parallax]").map(function (el) {
      var p = el.closest(".panel");
      return { el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0, left: p.offsetLeft, width: p.offsetWidth };
    });
    if (timeline) {
      var tl = leftInTrack(timeline);
      geo.timeline = {
        left: tl,
        width: timeline.offsetWidth,
        steps: steps.map(function (s) { return s.offsetLeft / Math.max(1, timeline.offsetWidth); })
      };
    }
    if (!H.on) $$("[data-parallax]").forEach(function (el) { el.style.translate = ""; });
    readScroll();
    H.x = H.target;
    render(true);
  }

  function readScroll() {
    H.target = H.on ? clamp(window.scrollY - H.top, 0, H.max) : window.scrollY;
  }

  function onScroll() {
    readScroll();
    kick();
  }

  function kick() {
    if (!H.running) { H.running = true; requestAnimationFrame(tick); }
  }

  function tick() {
    var ease = (reduceMotion || !H.on) ? 1 : 0.1;
    H.x = lerp(H.x, H.target, ease);
    if (Math.abs(H.target - H.x) < 0.05) H.x = H.target;
    render(false);
    if (H.x !== H.target) requestAnimationFrame(tick);
    else { H.running = false; track.style.setProperty("--vel", 0); }
  }

  function render(force) {
    var x = H.x;
    var dx = x - H.prevX;
    H.prevX = x;
    stars.push(H.on ? dx : 0, H.on ? 0 : dx);

    if (H.on) {
      track.style.transform = "translate3d(" + (-x).toFixed(2) + "px,0,0)";
      track.style.setProperty("--vel", clamp((H.target - x) / 600, -1, 1).toFixed(3));
      if (progressFill) progressFill.style.transform = "scaleX(" + chapterProgress(x).toFixed(4) + ")";

      // Parallax: offset by the panel's distance from the viewport centre
      var vw = window.innerWidth;
      geo.parallax.forEach(function (p) {
        var d = clamp((p.left + p.width / 2) - (x + vw / 2), -vw * 0.6, vw * 0.6);
        p.el.style.translate = (d * p.speed).toFixed(1) + "px 0";
      });

      // Process line fills as it crosses the viewport
      if (geo.timeline) {
        var t = geo.timeline;
        setTimeline(clamp((x + vw * 0.8 - t.left) / t.width, 0, 1));
      }
    } else if (timeline) {
      var r = timeline.getBoundingClientRect();
      setTimeline(clamp((window.innerHeight * 0.7 - r.top) / r.height, 0, 1));
    }

    updateChrome(x, force);
  }

  // 0..1 along the chapter dots: reaches dot i when chapter i hits the left edge
  function chapterProgress(x) {
    var pos = chapters.map(function (c) { return Math.min(c.offsetLeft, H.max); });
    for (var i = 0; i < pos.length - 1; i++) {
      if (x < pos[i + 1]) return (i + clamp((x - pos[i]) / Math.max(1, pos[i + 1] - pos[i]), 0, 1)) / (pos.length - 1);
    }
    return 1;
  }

  var lastFill = -1;
  function setTimeline(f) {
    if (Math.abs(f - lastFill) < 0.001) return;
    lastFill = f;
    timeline.style.setProperty("--fill", f.toFixed(3));
    if (H.on) geo.timeline.steps.forEach(function (at, i) {
      steps[i].classList.toggle("is-lit", f >= at - 0.001 && f > 0);
    });
    if (!H.on) steps.forEach(function (s, i) { s.classList.toggle("is-lit", f >= i / steps.length && f > 0); });
  }

  /* ---------- 3. NAVIGATION ---------- */
  function currentPanelIndex() {
    var x = H.on ? H.target : window.scrollY;
    var idx = 0;
    geo.panels.forEach(function (p, i) {
      var start = H.on ? p.left : p.el.offsetTop + H.top;
      if (start <= x + 10) idx = i;
    });
    return idx;
  }

  function goTo(el, opts) {
    opts = opts || {};
    var panel = el.closest(".panel") || el;
    if (H.on) {
      var left = el === panel ? panel.offsetLeft : leftInTrack(el) - window.innerWidth * 0.15;
      window.scrollTo(0, H.top + clamp(left, 0, H.max));
      if (opts.instant) { readScroll(); H.x = H.target; render(true); }
    } else {
      el.scrollIntoView({ behavior: (reduceMotion || opts.instant) ? "auto" : "smooth", block: "start" });
    }
    if (opts.focus !== false && panel.id) panel.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var target = id && document.getElementById(id);
    if (!target || !track.contains(target)) return;
    e.preventDefault();
    if (menuOpen) closeMenu(false);
    goTo(target);
    if (history.replaceState) history.replaceState(null, "", "#" + id);
  });

  // Trackpad sideways swipes move the journey too
  window.addEventListener("wheel", function (e) {
    if (!H.on || menuOpen) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      window.scrollBy(0, e.deltaX);
    }
  }, { passive: false });

  // Left / right arrows jump a panel at a time
  document.addEventListener("keydown", function (e) {
    if (!H.on || menuOpen || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    var i = currentPanelIndex() + (e.key === "ArrowRight" ? 1 : -1);
    if (panels[i]) goTo(panels[i], { focus: false });
  });

  // Keyboard focus landing off-screen brings its panel into view
  document.addEventListener("focusin", function (e) {
    if (!H.on || !track.contains(e.target) || e.target.classList.contains("panel")) return;
    sticky.scrollLeft = 0;
    var left = leftInTrack(e.target);
    var w = e.target.offsetWidth;
    if (left < H.target + 20 || left + w > H.target + window.innerWidth - 20) {
      window.scrollTo(0, H.top + clamp(left - window.innerWidth * 0.3, 0, H.max));
    }
  });

  /* ---------- 4. DRAG TO SCROLL ---------- */
  var drag = { down: false, moved: false, startX: 0, startY: 0, lastX: 0, lastT: 0, v: 0, fling: 0 };
  var NO_DRAG = "a, button, input, select, textarea, label, [data-no-drag]";

  sticky.addEventListener("pointerdown", function (e) {
    if (!H.on || e.pointerType !== "mouse" || e.button !== 0 || e.target.closest(NO_DRAG)) return;
    cancelAnimationFrame(drag.fling);
    drag.down = true; drag.moved = false;
    drag.startX = drag.lastX = e.clientX;
    drag.startY = window.scrollY;
    drag.lastT = performance.now();
    drag.v = 0;
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag.down) return;
    var dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      root.classList.add("is-dragging");
      cursor.setDrag(true);
      var sel = window.getSelection && window.getSelection();
      if (sel) sel.removeAllRanges();
    }
    if (!drag.moved) return;
    var now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
    drag.lastX = e.clientX; drag.lastT = now;
    window.scrollTo(0, drag.startY - dx * 1.4);
  });
  window.addEventListener("pointerup", function () {
    if (!drag.down) return;
    drag.down = false;
    root.classList.remove("is-dragging");
    cursor.setDrag(false);
    if (!drag.moved) return;
    // Fling: keep coasting with the release speed
    var v = -drag.v * 22;
    (function coast() {
      v *= 0.92;
      if (Math.abs(v) < 0.5) return;
      window.scrollBy(0, v);
      drag.fling = requestAnimationFrame(coast);
    })();
  });
  // Swallow the click that ends a drag
  sticky.addEventListener("click", function (e) {
    if (drag.moved) { e.stopPropagation(); e.preventDefault(); drag.moved = false; }
  }, true);

  /* ---------- 5. HEADER, CHAPTER, FAB ---------- */
  var chapterNum = $("#chapterNum");
  var chapterName = $("#chapterName");
  var fab = $("#fab");
  var contactPanel = $("#contact");
  var lastChapter = -1;

  function updateChrome(x, force) {
    header.classList.toggle("is-solid", x > 20);
    fab.classList.toggle("is-away", x > window.innerWidth * 0.6);

    // Current chapter = last chapter panel whose start is before mid-screen
    var probe, cIdx = 0;
    if (H.on) {
      probe = x + window.innerWidth * 0.35;
      chapters.forEach(function (c, i) { if (Math.min(c.offsetLeft, H.max) <= probe) cIdx = i; });
    } else {
      probe = window.innerHeight * 0.5;
      chapters.forEach(function (c, i) { if (c.getBoundingClientRect().top <= probe) cIdx = i; });
    }
    if (cIdx !== lastChapter || force) {
      lastChapter = cIdx;
      chapterNum.textContent = String(cIdx + 1).padStart(2, "0");
      chapterName.textContent = chapters[cIdx].getAttribute("data-chapter");
      chapterName.classList.remove("is-swap"); void chapterName.offsetWidth; chapterName.classList.add("is-swap");
      progressLinks.forEach(function (a, i) {
        a.classList.toggle("is-current", i === cIdx);
        a.classList.toggle("is-passed", i < cIdx);
        if (i === cIdx) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
      });
    }
    fab.classList.toggle("is-hidden", chapters[cIdx] === contactPanel);
  }

  $("#fabTop").addEventListener("click", function () { goTo($("#hero")); });

  /* ---------- 6. MENU ---------- */
  var menu = $("#menu");
  var menuBtn = $("#menuBtn");
  var menuOpen = false;
  var menuTimer;

  function openMenu() {
    clearTimeout(menuTimer);
    menuOpen = true;
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add("is-open"); });
    menuBtn.setAttribute("aria-expanded", "true");
    $(".menu-btn-text", menuBtn).textContent = "Close";
    document.body.classList.add("menu-open");
    setTimeout(function () { var a = $("a", menu); a && a.focus(); }, 60);
  }
  function closeMenu(returnFocus) {
    menuOpen = false;
    menu.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    $(".menu-btn-text", menuBtn).textContent = "Menu";
    document.body.classList.remove("menu-open");
    menuTimer = setTimeout(function () { menu.hidden = true; }, 400);
    if (returnFocus !== false) menuBtn.focus();
  }
  menuBtn.addEventListener("click", function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener("keydown", function (e) {
    if (!menuOpen) return;
    if (e.key === "Escape") { closeMenu(); return; }
    if (e.key === "Tab") {
      var items = [menuBtn].concat($$("a", menu));
      var i = items.indexOf(document.activeElement);
      var next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    }
  });

  /* ---------- 7. REVEALS + SPLIT WORDS ---------- */
  function splitWords(el) {
    var i = 0;
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      var tag = node.nodeType === 1 ? node.tagName : null;
      node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) {
        var outer = document.createElement("span");
        var inner = document.createElement("span");
        outer.className = "word";
        inner.style.setProperty("--i", i++);
        if (tag) { var t = document.createElement(tag); t.textContent = w; inner.appendChild(t); }
        else inner.textContent = w;
        outer.appendChild(inner);
        frag.appendChild(outer);
        frag.appendChild(document.createTextNode(" "));
      });
    });
    el.textContent = "";
    el.appendChild(frag);
    el.classList.add("is-split");
  }
  $$("[data-split]").forEach(splitWords);

  var revealTargets = $$("[data-reveal], [data-wipe], [data-split]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    // A fully clipped heading never "intersects", so wipes watch their parent
    var wipeOf = new Map();
    $$("[data-wipe]").forEach(function (el) { wipeOf.set(el.parentElement, el); });
    var revealIO = new IntersectionObserver(function (entries) {
      // Items arriving together are staggered, so a panel "deals" its content in
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = wipeOf.get(en.target) || en.target;
        revealIO.unobserve(en.target);
        if (el.hasAttribute("data-wipe")) { el.classList.add("is-in"); return; }
        el.style.setProperty("--d", (Math.min(n++, 6) * 0.08).toFixed(2) + "s");
        el.classList.add("is-in");
        startCounters(el);
      });
    }, { threshold: 0.12, rootMargin: "0px -4% -4% 0px" });
    revealTargets.forEach(function (el) {
      if (!el.hasAttribute("data-wipe")) revealIO.observe(el);
    });
    wipeOf.forEach(function (el, parent) { revealIO.observe(parent); });
  }

  /* ---------- 8. CUSTOM CURSOR ---------- */
  var cursor = (function () {
    var el = $(".cursor");
    var api = { setDrag: function () {} };
    if (!finePointer || reduceMotion || !el) return api;

    root.classList.add("has-cursor");
    var dot = $(".cursor-dot", el);
    var ring = $(".cursor-ring", el);
    var label = $(".cursor-label", el);
    var mx = -100, my = -100, rx = -100, ry = -100, raf = 0;

    function loop() {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
      raf = (Math.abs(rx - mx) + Math.abs(ry - my) > 0.1) ? requestAnimationFrame(loop) : 0;
    }
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      el.classList.add("is-visible");
      if (!raf) raf = requestAnimationFrame(loop);
    });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) el.classList.remove("is-visible"); });
    window.addEventListener("pointerdown", function () { el.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { el.classList.remove("is-down"); });

    document.addEventListener("mouseover", function (e) {
      if (el.classList.contains("is-drag")) return;
      var t = e.target.closest("[data-cursor], a, button, input, textarea, select");
      var text = t && t.getAttribute("data-cursor");
      el.classList.toggle("is-label", !!text);
      el.classList.toggle("is-hover", !!t && !text);
      el.classList.toggle("is-text", !!t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (text) label.textContent = text;
    });

    api.setDrag = function (on) {
      el.classList.toggle("is-drag", on);
      el.classList.toggle("is-label", on);
      if (on) label.textContent = "Drag";
    };
    return api;
  })();

  /* ---------- 9. MAGNETIC BUTTONS + RIPPLES ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1) + "px");
        el.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".btn");
    if (!b || reduceMotion) return;
    var r = b.getBoundingClientRect();
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.left = (e.clientX ? e.clientX - r.left : r.width / 2) + "px";
    s.style.top = (e.clientY ? e.clientY - r.top : r.height / 2) + "px";
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  });

  /* ---------- 10. TILT + SPOTLIGHT ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-tilt], [data-spotlight]").forEach(function (el) {
      var tilt = el.hasAttribute("data-tilt");
      el.addEventListener("pointermove", function (e) {
        if (drag.moved) return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--sx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--sy", (py * 100).toFixed(1) + "%");
        el.style.setProperty("--spot", 1);
        if (tilt) {
          el.classList.add("is-tilting");
          el.style.setProperty("--ry", ((px - 0.5) * 12).toFixed(2) + "deg");
          el.style.setProperty("--rx", ((0.5 - py) * 12).toFixed(2) + "deg");
        }
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("is-tilting");
        el.style.setProperty("--spot", 0);
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- 11. ORBIT + CHIPS (MOUSE TRACKING) ---------- */
  (function () {
    var orbit = $("#orbit");
    if (!orbit || reduceMotion || !finePointer) return;
    var chips = $$(".chip", orbit);
    var ox = 0, oy = 0, queued = false;
    window.addEventListener("pointermove", function (e) {
      ox = (e.clientX / window.innerWidth - 0.5) * 2;
      oy = (e.clientY / window.innerHeight - 0.5) * 2;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        orbit.style.setProperty("--ox", ox.toFixed(3));
        orbit.style.setProperty("--oy", oy.toFixed(3));
        chips.forEach(function (c) {
          var d = parseFloat(c.getAttribute("data-depth")) || 1;
          c.style.translate = (ox * d * -16).toFixed(1) + "px " + (oy * d * -16).toFixed(1) + "px";
        });
      });
    });
  })();

  /* ---------- 12. ROTATING WORD ---------- */
  (function () {
    var rot = $("[data-rotate]");
    if (!rot) return;
    var words;
    try { words = JSON.parse(rot.getAttribute("data-rotate")); } catch (e) { return; }
    var span = $(".rotator-word", rot);
    var i = 0;
    var txt = document.createElement("textarea");
    setInterval(function () {
      if (document.hidden) return;
      i = (i + 1) % words.length;
      txt.innerHTML = words[i];
      var next = txt.value;
      if (reduceMotion) { span.textContent = next; return; }
      span.classList.remove("is-in-word");
      span.classList.add("is-out");
      setTimeout(function () {
        span.textContent = next;
        span.classList.remove("is-out");
        void span.offsetWidth;
        span.classList.add("is-in-word");
      }, 340);
    }, 2800);
  })();

  /* ---------- 13. COUNTERS ---------- */
  function fmt(n, comma) { return comma ? n.toLocaleString("en-AU") : String(n); }
  function startCounters(scope) {
    var list = scope.matches && scope.matches("[data-count]") ? [scope] : $$("[data-count]", scope);
    list.forEach(function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      var end = parseInt(el.getAttribute("data-count"), 10);
      var comma = el.getAttribute("data-format") === "comma";
      if (reduceMotion) { el.textContent = fmt(end, comma); return; }
      var t0 = performance.now(), dur = 1600;
      (function step(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = fmt(Math.round(end * e), comma);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------- 14. CONSTELLATION CANVAS ---------- */
  var stars = (function () {
    var canvas = $("#stars");
    var api = { push: function () {} };
    if (!canvas || !canvas.getContext) return api;
    var ctx = canvas.getContext("2d");
    var W = 0, H2 = 0, dpr = 1;
    var parts = [], bursts = [];
    var mouse = { x: 0, y: 0, active: false };
    var drift = { x: 0, y: 0 };
    var raf = 0, running = false;
    var LINK = 130, REACH = 190, REPEL = 90;

    function make(x, y, burst) {
      var a = Math.random() * Math.PI * 2;
      var sp = burst ? 1.5 + Math.random() * 3 : 0.15 + Math.random() * 0.35;
      return {
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        z: burst ? 1 : 0.35 + Math.random() * 0.65, // depth: near stars move faster
        r: 1 + Math.random() * 1.8,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1
      };
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H2 = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H2 * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = clamp(Math.floor(W * H2 / 13000), 30, 110);
      while (parts.length < want) parts.push(make(Math.random() * W, Math.random() * H2));
      parts.length = want;
    }

    function wrap(p) {
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H2 + 10; else if (p.y > H2 + 10) p.y = -10;
    }

    function frame() {
      ctx.clearRect(0, 0, W, H2);
      var all = parts.concat(bursts);
      var i, j, p, q, dx, dy, d2, d;

      // Scroll drift eases out so stars "stream past" while travelling
      drift.x *= 0.9; drift.y *= 0.9;

      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        p.x += p.vx - drift.x * p.z * 0.35;
        p.y += p.vy - drift.y * p.z * 0.35;
        if (mouse.active) {
          dx = p.x - mouse.x; dy = p.y - mouse.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < REPEL && d > 0.01) {
            var f = (REPEL - d) / REPEL * 0.6;
            p.vx += dx / d * f; p.vy += dy / d * f;
          }
        }
        var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > 0.6) { p.vx *= 0.95; p.vy *= 0.95; }
        wrap(p);
      }
      for (i = bursts.length - 1; i >= 0; i--) {
        p = bursts[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.96; p.vy *= 0.96;
        p.life -= 0.012;
        if (p.life <= 0) bursts.splice(i, 1);
      }

      // Links between near neighbours
      ctx.lineWidth = 1;
      for (i = 0; i < all.length; i++) {
        p = all[i];
        for (j = i + 1; j < all.length; j++) {
          q = all[j];
          dx = p.x - q.x; if (dx > LINK || dx < -LINK) continue;
          dy = p.y - q.y; if (dy > LINK || dy < -LINK) continue;
          d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          d = Math.sqrt(d2);
          ctx.strokeStyle = "rgba(242,240,234," + ((1 - d / LINK) * 0.16 * Math.min(p.life, q.life)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      // Web reaching toward the cursor
      if (mouse.active) {
        for (i = 0; i < all.length; i++) {
          p = all[i];
          dx = p.x - mouse.x; dy = p.y - mouse.y;
          d2 = dx * dx + dy * dy;
          if (d2 > REACH * REACH) continue;
          d = Math.sqrt(d2);
          ctx.strokeStyle = "rgba(212,255,58," + ((1 - d / REACH) * 0.5 * p.life).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      // Dots
      for (i = 0; i < all.length; i++) {
        p = all[i];
        ctx.globalAlpha = 0.9 * p.life * (0.5 + p.z * 0.5);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + p.z * 0.5), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() { if (!running && !reduceMotion && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size();
    if (reduceMotion) frame(); else start();

    var rT;
    window.addEventListener("resize", function () {
      clearTimeout(rT);
      rT = setTimeout(function () { size(); if (reduceMotion) frame(); }, 150);
    });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = e.pointerType === "mouse";
    });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) mouse.active = false; });

    // Click on empty space → burst of stars
    document.addEventListener("click", function (e) {
      if (reduceMotion || e.defaultPrevented) return;
      if (e.target.closest("a, button, input, select, textarea, label, .form-card, .menu")) return;
      for (var k = 0; k < 14; k++) bursts.push(make(e.clientX, e.clientY, true));
    });

    api.push = function (dx, dy) {
      drift.x = clamp(drift.x + dx * 0.12, -30, 30);
      drift.y = clamp(drift.y + dy * 0.12, -30, 30);
    };
    return api;
  })();

  /* ---------- 15. PLAN BUTTONS + CONTACT FORM ---------- */
  var form = $("#contactForm");
  var serviceSelect = $("#f-service");
  var live = $("#liveRegion");

  $$("[data-plan]").forEach(function (b) {
    b.addEventListener("click", function () { serviceSelect.value = b.getAttribute("data-plan"); });
  });

  if (form) {
    var success = $("#formSuccess");
    var card = $(".form-card");
    var submitBtn = $("button[type=submit]", form);
    var rules = {
      name: function (v) { return v.trim().length >= 2 || "Please tell us your name."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address."; },
      service: function (v) { return !!v || "Please choose what you need help with."; },
      message: function (v) { return v.trim().length >= 10 || "A few more words, please (10+ characters)."; }
    };

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      input.setAttribute("aria-describedby", "e-" + name);
      input.addEventListener("input", function () { if (input.closest(".field").classList.contains("is-invalid")) check(name); });
      input.addEventListener("blur", function () { if (input.value) check(name); });
    });

    function check(name) {
      var input = form.elements[name];
      var res = rules[name](input.value);
      var ok = res === true;
      input.closest(".field").classList.toggle("is-invalid", !ok);
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      $("#e-" + name).textContent = ok ? "" : res;
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).filter(function (n) { return !check(n); });
      if (bad.length) {
        card.classList.remove("is-shake"); void card.offsetWidth; card.classList.add("is-shake");
        form.elements[bad[0]].focus();
        live.textContent = "Please fix " + bad.length + " field" + (bad.length > 1 ? "s" : "") + ".";
        return;
      }
      submitBtn.classList.add("is-loading");
      submitBtn.disabled = true;
      $(".btn-label", submitBtn).textContent = "Sending…";

      // Simulated send (no backend). Swap for fetch() to Formspree, Netlify Forms, etc.
      setTimeout(function () {
        var r = submitBtn.getBoundingClientRect();
        submitBtn.classList.remove("is-loading");
        submitBtn.disabled = false;
        $(".btn-label", submitBtn).textContent = "Send Enquiry";
        form.hidden = true;
        success.hidden = false;
        success.focus({ preventScroll: true });
        live.textContent = "Thanks — message sent! We'll be in touch within 24 hours.";
        confetti(r.left + r.width / 2, r.top + r.height / 2);
      }, 1200);
    });

    $("#formReset").addEventListener("click", function () {
      form.reset();
      success.hidden = true;
      form.hidden = false;
      form.elements.name.focus({ preventScroll: true });
    });
  }

  /* ---------- 16. CONFETTI ---------- */
  function confetti(x, y) {
    if (reduceMotion) return;
    var bits = [];
    for (var i = 0; i < 80; i++) {
      var el = document.createElement("span");
      el.className = "confetti";
      el.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(el);
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      var s = 6 + Math.random() * 9;
      bits.push({ el: el, x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 360, vr: (Math.random() - 0.5) * 22, life: 1 });
    }
    (function step() {
      bits = bits.filter(function (b) {
        b.vy += 0.32; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life -= 0.009;
        b.el.style.transform = "translate3d(" + b.x + "px," + b.y + "px,0) rotate(" + b.r + "deg)";
        b.el.style.opacity = b.life;
        if (b.life <= 0 || b.y > window.innerHeight + 40) { b.el.remove(); return false; }
        return true;
      });
      if (bits.length) requestAnimationFrame(step);
    })();
  }

  /* ---------- 17. BOOT ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function setMode() {
    var want = wideQuery.matches && !reduceMotion;
    if (want === H.on && H.max !== undefined && geo.panels.length) { measure(); return; }
    var keep = geo.panels.length ? panels[currentPanelIndex()] : null;
    H.on = want;
    root.classList.toggle("is-h", want);
    measure();
    if (keep) goTo(keep, { instant: true, focus: false });
  }

  setMode();
  if (wideQuery.addEventListener) wideQuery.addEventListener("change", setMode);
  else if (wideQuery.addListener) wideQuery.addListener(setMode);

  var resizeT;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(measure, 150);
  });
  if ("ResizeObserver" in window) {
    var roQueued = false;
    new ResizeObserver(function () {
      if (roQueued) return;
      roQueued = true;
      requestAnimationFrame(function () { roQueued = false; measure(); });
    }).observe(track);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener("scroll", onScroll, { passive: true });

  // Deep link (e.g. index.html#pricing) lands on its panel without a whoosh
  if (location.hash) {
    var deep = document.getElementById(location.hash.slice(1));
    if (deep && track.contains(deep)) {
      window.addEventListener("load", function () { goTo(deep, { instant: true, focus: false }); });
    }
  }
})();
