/* ===========================================================================
   WebQuokka — "Horizon Drift" · main.js
   ===========================================================================
   One long horizontal journey: vertical scroll maps 1:1 to sideways travel
   through full-screen panels, with an eased render loop, a constellation
   canvas behind everything, and a quokka keeping watch from the hero orbit.

   Contents  : 01 Helpers & environment flags
               02 Mode manager (html.is-h)
               03 Rail engine (measure, scroll map, eased render loop)
               04 Parallax, progress bar, chapter label, timeline fill
               05 Ways to move (anchors, wheel, arrows, drag, focus, deep links)
               06 Header & full-screen menu
               07 Reveals (IntersectionObserver) & split-word H1
               08 Rotating word
               09 Counters
               10 Custom cursor
               11 Magnetic buttons & ripples
               12 Tilt + spotlight cards
               13 Orbit (tilt, mascot eyes, chips)
               14 Constellation canvas (+ confetti)
               15 Contact form
               16 Floating actions & odds and ends
               17 Init
   =========================================================================== */

(() => {
  "use strict";

  /* ==================== 01 · HELPERS & ENVIRONMENT ==================== */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;

  const mqReduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mqHorizontal = matchMedia("(min-width: 960px) and (min-height: 600px)");
  const mqFine = matchMedia("(hover: hover) and (pointer: fine)");
  const mqCoarse = matchMedia("(pointer: coarse)");

  const html = document.documentElement;
  const reduced = () => mqReduced.matches;

  const rail = $("#rail");
  const sticky = $("#rail-sticky");
  const track = $("#rail-track");
  const header = $("#site-header");
  const liveRegion = $("#live-region");

  const mouse = { x: innerWidth / 2, y: innerHeight / 2, inside: false };
  addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.inside = true;
  }, { passive: true });
  document.addEventListener("mouseleave", () => { mouse.inside = false; });

  const announce = (msg) => { if (liveRegion) liveRegion.textContent = msg; };

  /* ==================== 02 · MODE MANAGER ==================== */

  const state = {
    isH: false,
    x: 0,            // eased sideways position
    target: 0,       // where scroll wants us
    max: 0,          // total sideways travel
    railTop: 0,
    panels: [],      // { el, left, width, start }
    chapters: [],    // { el, start, name } — the 7 progress chapters
    chapterIdx: -1,
    ticking: false,
    lastX: 0,        // for constellation drift
  };

  const horizontalWanted = () =>
    mqHorizontal.matches && !mqReduced.matches && !mqCoarse.matches;

  /* ==================== 03 · RAIL ENGINE ==================== */

  const panelEls = $$(".panel", track);
  const chapterEls = $$("#progress-dots a").map((a) => $(a.getAttribute("href")));
  const progressFill = $("#progress-fill");
  const dots = $$("#progress-dots .dot");
  const chapterNumEl = $("#chapter-num");
  const chapterNameEl = $("#chapter-name");
  const timeline = $("#timeline");

  function measure() {
    if (!state.isH) {
      rail.style.height = "";
      track.style.transform = "";
      return;
    }
    state.max = Math.max(0, track.scrollWidth - innerWidth);
    rail.style.height = `${state.max + innerHeight}px`;
    state.railTop = rail.getBoundingClientRect().top + scrollY;

    state.panels = panelEls.map((el) => ({
      el,
      left: el.offsetLeft,
      width: el.offsetWidth,
      start: clamp(el.offsetLeft, 0, state.max),
    }));
    state.chapters = chapterEls.map((el) => {
      const p = state.panels.find((pp) => pp.el === el);
      return { el, start: p ? p.start : 0, name: el.dataset.chapter || "" };
    });
    cacheParallax();
    cacheTimeline();
    readScroll();
  }

  function readScroll() {
    if (!state.isH) return;
    state.target = clamp(scrollY - state.railTop, 0, state.max);
    wake();
  }

  /* Eased render loop — runs only while the rail is actually moving. */
  function wake() {
    if (state.ticking) return;
    state.ticking = true;
    requestAnimationFrame(tick);
  }

  function tick() {
    if (!state.isH) { state.ticking = false; return; }

    state.x = lerp(state.x, state.target, 0.1);
    const done = Math.abs(state.target - state.x) < 0.05;
    if (done) state.x = state.target;

    render();

    if (done && !fling.active) {
      state.ticking = false;
      track.style.setProperty("--vel", 0);
    } else {
      requestAnimationFrame(tick);
    }
  }

  function render() {
    track.style.transform = `translate3d(${-state.x}px, 0, 0)`;
    const vel = clamp((state.target - state.x) / 600, -1, 1);
    track.style.setProperty("--vel", vel.toFixed(4));
    applyParallax();
    applyProgress();
    applyTimelineH();
    updateFabs();
  }

  function jumpTo(px, { instant = false } = {}) {
    // Scroll position drives the rail; the eased loop animates the travel.
    scrollTo({ top: state.railTop + clamp(px, 0, state.max), behavior: "instant" });
    if (instant) {
      state.target = clamp(px, 0, state.max);
      state.x = state.target;
      render();
    }
  }

  function currentPanelIndex() {
    if (state.isH) {
      let idx = 0;
      state.panels.forEach((p, i) => { if (state.x >= p.start - 2) idx = i; });
      return idx;
    }
    let idx = 0;
    panelEls.forEach((el, i) => {
      if (scrollY + innerHeight * 0.35 >= el.offsetTop) idx = i;
    });
    return idx;
  }

  function setMode() {
    const wantH = horizontalWanted();
    if (wantH === state.isH && state.panels.length) return;

    const keepIdx = currentPanelIndex();
    state.isH = wantH;
    html.classList.toggle("is-h", wantH);

    if (wantH) {
      measure();
      const p = state.panels[keepIdx];
      if (p) jumpTo(p.start, { instant: true });
    } else {
      rail.style.height = "";
      track.style.transform = "";
      track.style.setProperty("--vel", 0);
      const el = panelEls[keepIdx];
      if (el) scrollTo({ top: el.offsetTop, behavior: "instant" });
      applyTimelineV();
    }
    updateFabs();
  }

  /* Re-measure on resize (debounced), track growth, fonts, and mode change. */
  // Re-measuring can shift every chapter start (fonts, resizes), so keep the
  // user on the panel they were reading.
  function remeasurePreserving() {
    if (!state.isH) { measure(); return; }
    const idx = currentPanelIndex();
    measure();
    const p = state.panels[idx];
    if (p && Math.abs(state.target - p.start) > 4) jumpTo(p.start, { instant: true });
  }

  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { setMode(); remeasurePreserving(); }, 150);
  });
  if ("ResizeObserver" in window) {
    let roTimer;
    new ResizeObserver(() => {
      clearTimeout(roTimer);
      roTimer = setTimeout(() => { if (state.isH) measure(); }, 150);
    }).observe(track);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      remeasurePreserving();
      // A deep link resolved before fonts loaded may have aimed at stale
      // positions — re-aim while the visitor is still at the top of the visit.
      if (location.hash && performance.now() < 3000) handleDeepLink();
    });
  }
  mqHorizontal.addEventListener("change", setMode);
  mqReduced.addEventListener("change", setMode);
  mqCoarse.addEventListener("change", setMode);

  addEventListener("scroll", () => {
    readScroll();
    header.classList.toggle("scrolled", scrollY > 8);
    if (!state.isH) { applyTimelineV(); updateFabs(); applyProgressV(); }
  }, { passive: true });

  /* ============ 04 · PARALLAX, PROGRESS, CHAPTER LABEL, TIMELINE ============ */

  let parallaxItems = [];
  function cacheParallax() {
    parallaxItems = $$("[data-parallax]").map((el) => {
      const panel = state.panels.find((p) => p.el.contains(el));
      return { el, panel, speed: parseFloat(el.dataset.parallax) || 0 };
    }).filter((it) => it.panel);
  }

  function applyParallax() {
    const half = innerWidth / 2;
    const limit = innerWidth * 0.6;
    for (const it of parallaxItems) {
      const centre = it.panel.left + it.panel.width / 2 - state.x;
      // Skip panels far off screen.
      if (centre < -innerWidth || centre > innerWidth * 2) continue;
      const delta = clamp(centre - half, -limit, limit);
      it.el.style.translate = `${(delta * it.speed).toFixed(2)}px 0`;
    }
  }

  function applyProgress() {
    if (!state.chapters.length) return;
    const cs = state.chapters.map((c) => c.start);
    const n = cs.length;

    // Interpolate between chapter start positions so the fill reaches dot i
    // exactly when chapter i reaches the left edge.
    let p = 0;
    if (state.x <= cs[0]) p = 0;
    else if (state.x >= cs[n - 1]) p = 1;
    else {
      for (let i = 0; i < n - 1; i++) {
        if (state.x >= cs[i] && state.x <= cs[i + 1]) {
          const t = (state.x - cs[i]) / Math.max(1, cs[i + 1] - cs[i]);
          p = (i + t) / (n - 1);
          break;
        }
      }
    }
    progressFill.style.setProperty("--p", p.toFixed(4));

    let current = 0;
    cs.forEach((s, i) => { if (state.x >= s - 2) current = i; });
    dots.forEach((d, i) => {
      d.classList.toggle("passed", i < current);
      d.classList.toggle("current", i === current);
    });
    setChapter(current);
  }

  function applyProgressV() {
    // Vertical mode: the bar is hidden, but keep the header chapter in sync.
    let current = 0;
    chapterEls.forEach((el, i) => {
      if (scrollY + innerHeight * 0.35 >= el.offsetTop) current = i;
    });
    setChapter(current);
  }

  function setChapter(i) {
    if (i === state.chapterIdx) return;
    state.chapterIdx = i;
    const name = chapterEls[i]?.dataset.chapter || "";
    chapterNumEl.textContent = String(i + 1).padStart(2, "0");
    chapterNameEl.textContent = name;
    chapterNameEl.classList.remove("slide");
    void chapterNameEl.offsetWidth;
    chapterNameEl.classList.add("slide");
  }

  let tl = null;
  function cacheTimeline() {
    if (!timeline) return;
    const steps = $$(".step", timeline);
    tl = {
      left: timelineDocLeft(),
      width: timeline.offsetWidth,
      steps: steps.map((el) => ({ el, offset: el.offsetLeft - timeline.offsetLeft })),
    };
  }
  function timelineDocLeft() {
    let left = 0, node = timeline;
    while (node && node !== track) { left += node.offsetLeft; node = node.offsetParent; }
    return left;
  }

  function applyTimelineH() {
    if (!tl || !state.isH) return;
    const screenLeft = tl.left - state.x;
    if (screenLeft > innerWidth * 1.5 || screenLeft < -tl.width - innerWidth) return;
    const fill = clamp((innerWidth * 0.82 - screenLeft) / tl.width, 0, 1);
    timeline.style.setProperty("--fill", fill.toFixed(4));
    for (const s of tl.steps) {
      s.el.classList.toggle("lit", fill * tl.width >= s.offset + 10);
    }
  }

  function applyTimelineV() {
    if (!timeline || state.isH) return;
    const rect = timeline.getBoundingClientRect();
    const fill = clamp((innerHeight * 0.85 - rect.top) / rect.height, 0, 1);
    timeline.style.setProperty("--fill", fill.toFixed(4));
    $$(".step", timeline).forEach((el) => {
      const r = el.getBoundingClientRect();
      el.classList.toggle("lit", fill * rect.height >= (r.top - rect.top) + 10);
    });
  }

  /* ==================== 05 · WAYS TO MOVE ==================== */

  // --- In-page anchors (header, menu, dots, footer, FABs, CTAs) ---
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = $(a.getAttribute("href"));
    if (!target || !target.classList.contains("panel")) return;
    e.preventDefault();
    if (menuIsOpen) closeMenu(false);
    goToPanel(target);
  });

  function goToPanel(el) {
    if (state.isH) {
      const p = state.panels.find((pp) => pp.el === el);
      if (p) jumpTo(p.start);
    } else {
      scrollTo({ top: el.offsetTop, behavior: reduced() ? "instant" : "smooth" });
    }
    el.focus({ preventScroll: true });
  }

  // --- Trackpad sideways swipe becomes travel ---
  addEventListener("wheel", (e) => {
    if (!state.isH || menuIsOpen) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      scrollBy(0, e.deltaX);
    }
  }, { passive: false });

  // --- Arrow keys jump one panel ---
  addEventListener("keydown", (e) => {
    if (!state.isH || menuIsOpen) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.target.matches("input, textarea, select")) return;
    e.preventDefault();
    const idx = currentPanelIndex();
    const next = clamp(idx + (e.key === "ArrowRight" ? 1 : -1), 0, state.panels.length - 1);
    goToPanel(state.panels[next].el);
  });

  // --- Drag to scroll with the mouse on empty space ---
  const fling = { active: false, v: 0 };
  let drag = null;
  let dragJustEnded = false;

  sticky.addEventListener("mousedown", (e) => {
    if (!state.isH || e.button !== 0) return;
    if (e.target.closest("a, button, input, textarea, select, label")) return;
    drag = { startX: e.clientX, lastX: e.clientX, moved: false, v: 0 };
    fling.active = false;
  });

  addEventListener("mousemove", (e) => {
    if (!drag) return;
    if (!drag.moved && Math.abs(e.clientX - drag.startX) > 6) {
      drag.moved = true;
      html.classList.add("is-dragging");
      cursorDrag(true);
      // Kill any selection the first few pixels of the drag started.
      getSelection()?.removeAllRanges();
    }
    if (drag.moved) {
      e.preventDefault();
      const dx = e.clientX - drag.lastX;
      drag.v = -dx * 1.4;
      scrollBy(0, drag.v);
    }
    drag.lastX = e.clientX;
  });

  addEventListener("mouseup", () => {
    if (!drag) return;
    const wasDrag = drag.moved;
    if (wasDrag) {
      html.classList.remove("is-dragging");
      cursorDrag(false);
      dragJustEnded = true;
      // Fling: keep travelling, decaying ×0.92 per frame.
      fling.v = drag.v;
      if (Math.abs(fling.v) > 1) {
        fling.active = true;
        const flingTick = () => {
          if (!fling.active || !state.isH) { fling.active = false; return; }
          fling.v *= 0.92;
          scrollBy(0, fling.v);
          if (Math.abs(fling.v) < 0.4) { fling.active = false; return; }
          requestAnimationFrame(flingTick);
        };
        requestAnimationFrame(flingTick);
        wake();
      }
    }
    drag = null;
  });

  // Swallow the click that ends a drag.
  addEventListener("click", (e) => {
    if (dragJustEnded) {
      e.preventDefault();
      e.stopPropagation();
      dragJustEnded = false;
    }
  }, true);

  // --- Keyboard focus keeps the focused element in view ---
  document.addEventListener("focusin", (e) => {
    if (!state.isH) return;
    if (!track.contains(e.target)) return;
    // Panels get programmatic focus after an anchor jump — the jump already
    // aimed them; re-targeting a full-width panel would drag it 30% inward.
    if (e.target.classList.contains("panel")) return;
    // Undo any native scroll of the clipped sticky container.
    sticky.scrollLeft = 0;
    sticky.scrollTop = 0;
    const rect = e.target.getBoundingClientRect();
    if (rect.left < 0 || rect.right > innerWidth) {
      const docLeft = rect.left + state.x;
      jumpTo(docLeft - innerWidth * 0.3);
    }
  });

  // --- Deep links jump instantly on load ---
  function handleDeepLink() {
    if (!location.hash) return;
    let target = null;
    try { target = $(location.hash); } catch { /* invalid selector */ }
    if (!target || !target.classList.contains("panel")) return;
    if (state.isH) {
      const p = state.panels.find((pp) => pp.el === target);
      if (p) jumpTo(p.start, { instant: true });
    } else {
      scrollTo({ top: target.offsetTop, behavior: "instant" });
    }
  }

  // --- Hash changed after load (a #section pasted into the address bar,
  //     or a history entry) travels there with the eased loop. ---
  addEventListener("hashchange", () => {
    if (!location.hash) return;
    let target = null;
    try { target = $(location.hash); } catch { /* invalid selector */ }
    if (target && target.classList.contains("panel")) goToPanel(target);
  });

  /* ==================== 06 · HEADER & MENU ==================== */

  const menu = $("#menu");
  const menuBtn = $("#menu-btn");
  const menuBtnLabel = $("#menu-btn-label");
  let menuIsOpen = false;

  $$(".menu-link", menu).forEach((link, i) => {
    link.style.setProperty("--d", `${0.06 + i * 0.05}s`);
  });

  function openMenu() {
    menuIsOpen = true;
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("open")));
    html.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtnLabel.textContent = "Close";
    $(".menu-link", menu).focus();
  }

  function closeMenu(refocus = true) {
    menuIsOpen = false;
    menu.classList.remove("open");
    html.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtnLabel.textContent = "Menu";
    setTimeout(() => { if (!menuIsOpen) menu.hidden = true; }, 420);
    if (refocus) menuBtn.focus();
  }

  menuBtn.addEventListener("click", () => (menuIsOpen ? closeMenu() : openMenu()));

  addEventListener("keydown", (e) => {
    if (!menuIsOpen) return;
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    if (e.key !== "Tab") return;
    // Focus trap: cycle through the menu links, contact links and the button.
    const focusables = [...$$("a", menu), menuBtn];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    } else if (!focusables.includes(document.activeElement)) {
      e.preventDefault(); first.focus();
    }
  });

  /* ==================== 07 · REVEALS & SPLIT H1 ==================== */

  function setupReveals() {
    const revealEls = $$("[data-reveal]");
    const wipeEls = $$("[data-wipe]");

    if (reduced() || !("IntersectionObserver" in window)) {
      [...revealEls, ...wipeEls].forEach((el) => el.classList.add("in"));
      return;
    }

    // A fully clipped wipe heading never reports as intersecting,
    // so we observe its parent instead.
    const wipeByParent = new Map();
    wipeEls.forEach((el) => wipeByParent.set(el.parentElement, el));

    const io = new IntersectionObserver((entries) => {
      const batch = entries
        .filter((en) => en.isIntersecting)
        .map((en) => wipeByParent.get(en.target) || en.target);
      batch.forEach((el, i) => {
        el.style.setProperty("--stagger", `${i * 80}ms`);
        el.classList.add("in");
      });
      entries.forEach((en) => { if (en.isIntersecting) io.unobserve(en.target); });
    }, { threshold: 0.12 });

    revealEls.forEach((el) => io.observe(el));
    wipeByParent.forEach((_, parent) => io.observe(parent));
  }

  function splitTitle() {
    const h1 = $("[data-split]");
    if (!h1) return;
    const tokens = [];
    h1.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/\s+/).filter(Boolean)
          .forEach((w) => tokens.push({ text: w, em: false }));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        tokens.push({ text: node.textContent.trim(), em: node.tagName === "EM" });
      }
    });
    h1.textContent = "";
    tokens.forEach((t, i) => {
      const word = document.createElement("span");
      word.className = "word";
      const inner = document.createElement("span");
      inner.style.setProperty("--i", i);
      if (t.em) {
        const em = document.createElement("em");
        em.textContent = t.text;
        inner.appendChild(em);
      } else {
        inner.textContent = t.text;
      }
      word.appendChild(inner);
      h1.appendChild(word);
      if (i < tokens.length - 1) h1.appendChild(document.createTextNode(" "));
    });
    h1.classList.add("split");
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add("in")));
  }

  /* ==================== 08 · ROTATING WORD ==================== */

  function setupRotator() {
    const wordEl = $("#rotator-word");
    const underline = $(".rotator-underline");
    if (!wordEl || reduced()) return;
    const words = ["startups", "local shops", "tradies", "cafés", "founders"];
    let i = 0;

    underline.classList.add("draw");
    setInterval(() => {
      if (document.hidden) return;
      wordEl.classList.remove("in");
      wordEl.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        wordEl.textContent = words[i];
        wordEl.classList.remove("out");
        wordEl.classList.add("in");
        underline.classList.remove("draw");
        void underline.offsetWidth;
        underline.classList.add("draw");
      }, 380);
    }, 2800);
  }

  /* ==================== 09 · COUNTERS ==================== */

  function setupCounters() {
    const counters = $$(".counter");
    if (!counters.length) return;

    const run = (el) => {
      const end = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const fmt = new Intl.NumberFormat("en-AU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      if (reduced()) { el.textContent = fmt.format(end); return; }
      const t0 = performance.now();
      const dur = 1600;
      const frame = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // ease-out-expo
        el.textContent = fmt.format(end * eased);
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    if (!("IntersectionObserver" in window)) { counters.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => io.observe(el));
  }

  /* ==================== 10 · CUSTOM CURSOR ==================== */

  const cursor = { enabled: false, rx: innerWidth / 2, ry: innerHeight / 2, loop: false };
  const cursorDot = $("#cursor-dot");
  const cursorRing = $("#cursor-ring");
  const cursorLabel = $("#cursor-label");

  function setupCursor() {
    cursor.enabled = mqFine.matches && !mqCoarse.matches && !reduced();
    html.classList.toggle("cursor-on", cursor.enabled);
    if (!cursor.enabled) return;

    // Stay invisible until the mouse actually moves, so the dot doesn't
    // sit in the top-left corner on load.
    html.classList.add("cursor-hidden");
    addEventListener("mousemove", () => {
      html.classList.remove("cursor-hidden");
    }, { once: true, passive: true });

    addEventListener("mousemove", () => {
      cursorDot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      if (!cursor.loop) {
        cursor.loop = true;
        requestAnimationFrame(cursorTick);
      }
    }, { passive: true });

    document.addEventListener("mouseover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const interactive = e.target.closest("a, button");
      const field = e.target.closest("input, textarea, select");
      html.classList.toggle("cursor-hidden", !!field);
      if (labelled && !html.classList.contains("is-dragging")) {
        cursorLabel.textContent = labelled.dataset.cursor;
        cursorRing.classList.add("label");
        cursorRing.classList.remove("grow");
      } else {
        cursorRing.classList.remove("label");
        cursorRing.classList.toggle("grow", !!interactive);
      }
    });

    addEventListener("mousedown", () => cursorRing.classList.add("pressed"));
    addEventListener("mouseup", () => cursorRing.classList.remove("pressed"));
    document.addEventListener("mouseleave", () => html.classList.add("cursor-hidden"));
    document.addEventListener("mouseenter", () => html.classList.remove("cursor-hidden"));
  }

  function cursorTick() {
    cursor.rx = lerp(cursor.rx, mouse.x, 0.18);
    cursor.ry = lerp(cursor.ry, mouse.y, 0.18);
    cursorRing.style.transform = `translate3d(${cursor.rx}px, ${cursor.ry}px, 0)`;
    if (Math.abs(cursor.rx - mouse.x) + Math.abs(cursor.ry - mouse.y) > 0.2) {
      requestAnimationFrame(cursorTick);
    } else {
      cursor.loop = false;
    }
  }

  function cursorDrag(on) {
    if (!cursor.enabled) return;
    cursorRing.classList.toggle("dragging", on);
    cursorRing.classList.remove("label", "grow");
    if (on) cursorLabel.textContent = "Drag";
  }

  /* ==================== 11 · MAGNETIC BUTTONS & RIPPLES ==================== */

  function setupMagnetic() {
    if (!mqFine.matches || mqCoarse.matches || reduced()) return;
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - (r.left + r.width / 2)) * 0.3;
        const my = (e.clientY - (r.top + r.height / 2)) * 0.4;
        el.style.setProperty("--mx", `${mx.toFixed(1)}px`);
        el.style.setProperty("--my", `${my.toFixed(1)}px`);
      });
      el.addEventListener("mouseleave", () => {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn || reduced()) return;
    const r = btn.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = "ripple";
    const size = Math.max(r.width, r.height);
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - r.left - size / 2}px`;
    span.style.top = `${e.clientY - r.top - size / 2}px`;
    btn.appendChild(span);
    setTimeout(() => span.remove(), 650);
  });

  /* ==================== 12 · TILT + SPOTLIGHT ==================== */

  function setupTilt() {
    if (!mqFine.matches || mqCoarse.matches || reduced()) return;
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${clamp(nx * 12, -6, 6).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${clamp(-ny * 12, -6, 6).toFixed(2)}deg`);
        el.style.setProperty("--sx", `${((nx + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--sy", `${((ny + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--spot", "1");
      });
      el.addEventListener("mouseleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--spot", "0");
      });
    });
  }

  /* ==================== 13 · ORBIT ==================== */

  function setupOrbit() {
    const orbit = $("#orbit");
    const core = $("#orbit-core");
    const eyes = $$("[data-eye]");
    const chips = $$(".chip");
    if (!orbit || mqCoarse.matches || reduced()) return;

    addEventListener("mousemove", () => {
      const r = orbit.getBoundingClientRect();
      // Only bother while the orbit is anywhere near the screen.
      if (r.right < -200 || r.left > innerWidth + 200) return;
      const nx = clamp((mouse.x - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
      const ny = clamp((mouse.y - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
      orbit.style.setProperty("--otx", `${(nx * 16).toFixed(2)}deg`);
      orbit.style.setProperty("--oty", `${(-ny * 16).toFixed(2)}deg`);
      core.style.setProperty("--cx", `${(nx * 18).toFixed(1)}px`);
      core.style.setProperty("--cy", `${(ny * 18).toFixed(1)}px`);
      eyes.forEach((eye) => {
        eye.style.setProperty("--ex", `${(nx * 1.6).toFixed(2)}px`);
        eye.style.setProperty("--ey", `${(ny * 1.4).toFixed(2)}px`);
      });
      chips.forEach((chip) => {
        const depth = parseFloat(chip.dataset.depth) || 0.5;
        chip.style.setProperty("--px", `${(-nx * 26 * depth).toFixed(1)}px`);
        chip.style.setProperty("--py", `${(-ny * 26 * depth).toFixed(1)}px`);
      });
    }, { passive: true });
  }

  /* ==================== 14 · CONSTELLATION CANVAS ==================== */

  const stars = (() => {
    const canvas = $("#constellation");
    const ctx = canvas.getContext("2d");
    const COLORS = ["#D4FF3A", "#7CC8FF", "#B69CFF", "#FF6B2C", "#F2F0EA"];
    let W = 0, H = 0, DPR = 1;
    let particles = [];
    let bursts = [];
    let confetti = [];
    let drift = 0;
    let lastScrollRef = 0;
    let running = false;

    function resize() {
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    }

    function seed() {
      const count = clamp(Math.floor((W * H) / 13000), 30, 110);
      particles = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.15 + Math.random() * 0.35;
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1 + Math.random() * 1.8,
          z: 0.35 + Math.random() * 0.65,
          color: COLORS[(Math.random() * COLORS.length) | 0],
        };
      });
    }

    function step() {
      // Sideways travel streams the starfield past — nearer stars faster.
      const scrollRef = state.isH ? state.x : scrollY;
      drift = clamp(drift + (scrollRef - lastScrollRef) * 0.12, -30, 30);
      lastScrollRef = scrollRef;
      drift *= 0.9;

      for (const p of particles) {
        p.x += p.vx - (state.isH ? drift * p.z * 0.35 : 0);
        p.y += p.vy - (state.isH ? 0 : drift * p.z * 0.35);

        // Cursor repel.
        if (mouse.inside) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 90 && d > 0.01) {
            const f = ((90 - d) / 90) * 0.6;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        // Damp back down after a shove.
        if (Math.hypot(p.vx, p.vy) > 0.6) { p.vx *= 0.95; p.vy *= 0.95; }

        // Wrap with a 10px margin.
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }

      for (const b of bursts) {
        b.x += b.vx; b.y += b.vy;
        b.vx *= 0.96; b.vy *= 0.96;
        b.life -= 0.012;
      }
      bursts = bursts.filter((b) => b.life > 0);

      for (const c of confetti) {
        c.x += c.vx; c.y += c.vy;
        c.vy += 0.12;
        c.rot += c.vr;
        c.life -= 0.008;
      }
      confetti = confetti.filter((c) => c.life > 0 && c.y < H + 30);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Links between close pairs (skip sqrt when clearly too far).
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          if (dx > 130 || dx < -130) continue;
          const dy = a.y - b.y;
          if (dy > 130 || dy < -130) continue;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(242,240,234,${((1 - d / 130) * 0.16).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Cursor web.
      if (mouse.inside) {
        for (const p of particles) {
          const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (d < 190) {
            ctx.strokeStyle = `rgba(212,255,58,${((1 - d / 190) * 0.5).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.globalAlpha = 0.35 + p.z * 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const b of bursts) {
        ctx.globalAlpha = Math.max(0, b.life);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const c of confetti) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, c.life * 2));
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.s / 2, -c.s / 2, c.s, c.s * 0.6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      if (!running) return;
      step();
      draw();
      requestAnimationFrame(loop);
    }

    function start() {
      if (reduced()) {
        // One still frame only.
        running = false;
        draw();
        return;
      }
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    }
    function stop() { running = false; }

    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    // Click burst on empty space.
    document.addEventListener("click", (e) => {
      if (reduced() || menuIsOpen) return;
      if (e.target.closest("a, button, input, textarea, select, label, form, .menu")) return;
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        bursts.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1.2 + Math.random() * 1.6,
          life: 1,
          color: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      start();
    });

    function burstConfetti(x, y) {
      if (reduced()) return;
      for (let i = 0; i < 80; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        const speed = 3 + Math.random() * 6;
        confetti.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3,
          s: 5 + Math.random() * 6,
          life: 1 + Math.random() * 0.5,
          color: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      start();
    }

    let starResizeTimer;
    addEventListener("resize", () => {
      clearTimeout(starResizeTimer);
      starResizeTimer = setTimeout(() => { resize(); if (reduced()) draw(); }, 150);
    });

    resize();
    return { start, stop, burstConfetti };
  })();

  /* ==================== 15 · CONTACT FORM ==================== */

  function setupForm() {
    const form = $("#contact-form");
    const success = $("#form-success");
    const submitBtn = $("#form-submit");
    const submitLabel = $(".submit-label", submitBtn);
    if (!form) return;

    const rules = {
      name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name (at least 2 characters)."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."),
      service: (v) => (v ? "" : "Please choose a service."),
      message: (v) => (v.trim().length >= 10 ? "" : "Please tell us a little more (at least 10 characters)."),
    };
    const touched = new Set();

    function fieldEl(name) { return form.elements[name]; }
    function errorEl(name) { return $(`#f-${name}-error`); }

    function validateField(name) {
      const input = fieldEl(name);
      const err = errorEl(name);
      if (!input || !err) return true;
      const msg = rules[name](input.value);
      if (msg) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", err.id);
        err.textContent = msg;
        err.hidden = false;
        return false;
      }
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      err.hidden = true;
      return true;
    }

    // Re-check as they type, once a field has errored.
    Object.keys(rules).forEach((name) => {
      const input = fieldEl(name);
      if (!input) return;
      input.addEventListener("input", () => { if (touched.has(name)) validateField(name); });
      input.addEventListener("change", () => { if (touched.has(name)) validateField(name); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = Object.keys(rules).filter((name) => {
        const ok = validateField(name);
        if (!ok) touched.add(name);
        return !ok;
      });

      if (bad.length) {
        form.classList.remove("shake");
        void form.offsetWidth;
        form.classList.add("shake");
        const first = fieldEl(bad[0]);
        first.focus({ preventScroll: state.isH });
        announce(`${bad.length} field${bad.length > 1 ? "s" : ""} need attention. ${errorEl(bad[0]).textContent}`);
        return;
      }

      // Simulated send.
      // To connect a real service, replace the setTimeout below with a fetch:
      //   - WebQuokka's own backend:  POST http://localhost:3001/api/contact
      //     (see backend/server.js — expects { name, business, email, phone,
      //     service, message } and emails the enquiry via Gmail)
      //   - or Formspree:  fetch("https://formspree.io/f/YOUR_ID", { method:
      //     "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      //   - or Netlify Forms: add data-netlify="true" to the <form> and deploy.
      submitBtn.classList.add("sending");
      submitBtn.setAttribute("aria-disabled", "true");
      submitLabel.textContent = "Sending…";

      const btnRect = submitBtn.getBoundingClientRect();
      setTimeout(() => {
        submitBtn.classList.remove("sending");
        submitBtn.removeAttribute("aria-disabled");
        submitLabel.textContent = "Send Enquiry";
        form.hidden = true;
        success.hidden = false;
        success.focus();
        announce("Message sent. Thanks for reaching out — we'll get back to you within one business day.");
        stars.burstConfetti(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);
        if (state.isH) measure(); // panel width may have changed
      }, 1200);
    });

    $("#form-reset").addEventListener("click", () => {
      form.reset();
      touched.clear();
      Object.keys(rules).forEach((name) => {
        const input = fieldEl(name);
        const err = errorEl(name);
        if (input) { input.removeAttribute("aria-invalid"); input.removeAttribute("aria-describedby"); }
        if (err) err.hidden = true;
      });
      success.hidden = true;
      form.hidden = false;
      if (state.isH) measure();
      form.elements.name.focus({ preventScroll: state.isH });
    });

    // Plan buttons preselect their plan and travel to the contact panel.
    $$(".plan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const select = fieldEl("service");
        select.value = btn.dataset.plan;
        touched.delete("service");
        validateField("service");
        goToPanel($("#contact"));
        announce(`${btn.dataset.plan} selected. Taking you to the contact form.`);
      });
    });
  }

  /* ==================== 16 · FLOATING ACTIONS & ODDS AND ENDS ==================== */

  const fabQuote = $("#fab-quote");
  const fabBack = $("#fab-back");

  function updateFabs() {
    const contactPanel = $("#contact");
    let onContact, pastHero;
    if (state.isH) {
      const p = state.panels.find((pp) => pp.el === contactPanel);
      onContact = p && state.x >= p.start - innerWidth * 0.4;
      pastHero = state.x > innerWidth * 0.5;
    } else {
      const r = contactPanel.getBoundingClientRect();
      onContact = r.top < innerHeight && r.bottom > 0;
      pastHero = scrollY > innerHeight * 0.5;
    }
    fabQuote.classList.toggle("hide", !!onContact);
    fabBack.hidden = !pastHero;
  }

  /* ==================== 17 · INIT ==================== */

  $("#year").textContent = new Date().getFullYear();

  setMode();
  measure();
  handleDeepLink();
  setupReveals();
  splitTitle();
  setupRotator();
  setupCounters();
  setupCursor();
  setupMagnetic();
  setupTilt();
  setupOrbit();
  setupForm();
  stars.start();
  readScroll();
  if (!state.isH) { applyTimelineV(); applyProgressV(); }
  updateFabs();
  render();
})();
