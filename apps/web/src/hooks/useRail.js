import { useEffect } from 'react'
import {
  clamp,
  cursorState,
  dragState,
  lerp,
  prefersReducedMotion,
  starField,
  wideEnoughQuery,
} from '../lib/horizon'

/**
 * The pinned horizontal rail.
 *
 * Vertical scroll is remapped onto a sideways track: the rail gets a tall
 * height, `.rail-sticky` pins to the viewport and `.rail-track` slides left with
 * eased momentum. Decorative layers skew by the leftover velocity, giant words
 * parallax against their panel, and the process line fills as it crosses.
 *
 * Small screens, short windows and reduced motion never enter the mode — the
 * same markup reads as an ordinary vertical page (see `html:not(.is-h)` in the
 * stylesheet).
 *
 * @param {object}   refs.railRef     wrapper that owns the scroll height
 * @param {object}   refs.stickyRef   the pinned viewport
 * @param {object}   refs.trackRef    the sideways track
 * @param {object}   refs.fillRef     chapter progress bar fill
 * @param {Function} refs.onChrome    called only when header/chapter/FAB state changes
 */
export default function useRail({ railRef, stickyRef, trackRef, fillRef, onChrome }) {
  useEffect(() => {
    const rail = railRef.current
    const sticky = stickyRef.current
    const track = trackRef.current
    if (!rail || !sticky || !track) return undefined

    const root = document.documentElement
    const reduceMotion = prefersReducedMotion()
    const wideQuery = wideEnoughQuery()

    const panels = Array.from(track.querySelectorAll('.panel'))
    const chapters = panels.filter((p) => p.hasAttribute('data-chapter'))
    panels.forEach((p) => {
      if (p.id) p.setAttribute('tabindex', '-1')
    })

    const H = { on: false, x: 0, target: 0, max: 0, top: 0, prevX: 0, running: false }
    const geo = { panels: [], parallax: [], timeline: null }
    const timeline = track.querySelector('.timeline')
    const steps = timeline ? Array.from(timeline.querySelectorAll('.step')) : []

    let lastChapter = -1
    let lastSolid = null
    let lastAway = null
    let lastFill = -1
    let menuIsOpen = false

    /* ---------- measurement ---------- */

    // Position of el along the track, independent of the current translate
    const leftInTrack = (el) =>
      el.getBoundingClientRect().left - track.getBoundingClientRect().left

    function measure() {
      if (H.on) {
        H.max = Math.max(0, track.scrollWidth - window.innerWidth)
        rail.style.height = `${H.max + window.innerHeight}px`
        H.top = rail.getBoundingClientRect().top + window.scrollY
      } else {
        rail.style.height = ''
        track.style.transform = ''
        H.max = 0
      }
      geo.panels = panels.map((p) => ({ el: p, left: p.offsetLeft, width: p.offsetWidth }))
      geo.parallax = Array.from(track.querySelectorAll('[data-parallax]')).map((el) => {
        const p = el.closest('.panel')
        return {
          el,
          speed: parseFloat(el.getAttribute('data-parallax')) || 0,
          left: p ? p.offsetLeft : 0,
          width: p ? p.offsetWidth : 0,
        }
      })
      if (timeline) {
        const tl = leftInTrack(timeline)
        geo.timeline = {
          left: tl,
          width: timeline.offsetWidth,
          steps: steps.map((s) => s.offsetLeft / Math.max(1, timeline.offsetWidth)),
        }
      }
      if (!H.on) {
        track.querySelectorAll('[data-parallax]').forEach((el) => {
          el.style.translate = ''
        })
      }
      readScroll()
      H.x = H.target
      render(true)
    }

    function readScroll() {
      H.target = H.on ? clamp(window.scrollY - H.top, 0, H.max) : window.scrollY
    }

    function kick() {
      if (!H.running) {
        H.running = true
        requestAnimationFrame(tick)
      }
    }

    function tick() {
      const ease = reduceMotion || !H.on ? 1 : 0.1
      H.x = lerp(H.x, H.target, ease)
      if (Math.abs(H.target - H.x) < 0.05) H.x = H.target
      render(false)
      if (H.x !== H.target) requestAnimationFrame(tick)
      else {
        H.running = false
        track.style.setProperty('--vel', 0)
      }
    }

    function onScroll() {
      readScroll()
      kick()
    }

    /* ---------- per-frame render ---------- */

    function render(force) {
      const x = H.x
      const dx = x - H.prevX
      H.prevX = x
      starField.push(H.on ? dx : 0, H.on ? 0 : dx)

      if (H.on) {
        track.style.transform = `translate3d(${(-x).toFixed(2)}px,0,0)`
        track.style.setProperty('--vel', clamp((H.target - x) / 600, -1, 1).toFixed(3))
        if (fillRef.current) {
          fillRef.current.style.transform = `scaleX(${chapterProgress(x).toFixed(4)})`
        }

        // Parallax: offset by the panel's distance from the viewport centre
        const vw = window.innerWidth
        geo.parallax.forEach((p) => {
          const d = clamp(p.left + p.width / 2 - (x + vw / 2), -vw * 0.6, vw * 0.6)
          p.el.style.translate = `${(d * p.speed).toFixed(1)}px 0`
        })

        // Process line fills as it crosses the viewport
        if (geo.timeline) {
          const t = geo.timeline
          setTimeline(clamp((x + vw * 0.8 - t.left) / t.width, 0, 1))
        }
      } else if (timeline && !timeline.hasAttribute('data-swipe')) {
        // A swipe deck marks the timeline as its own and fills it from how far
        // the steps have been swiped, which reads better than page scroll there.
        const r = timeline.getBoundingClientRect()
        setTimeline(clamp((window.innerHeight * 0.7 - r.top) / r.height, 0, 1))
      }

      updateChrome(x, force)
    }

    // 0..1 along the chapter dots: reaches dot i when chapter i hits the left edge
    function chapterProgress(x) {
      const pos = chapters.map((c) => Math.min(c.offsetLeft, H.max))
      for (let i = 0; i < pos.length - 1; i++) {
        if (x < pos[i + 1]) {
          return (
            (i + clamp((x - pos[i]) / Math.max(1, pos[i + 1] - pos[i]), 0, 1)) / (pos.length - 1)
          )
        }
      }
      return 1
    }

    function setTimeline(f) {
      // The value alone is not enough to skip on: a swipe deck that owned the line
      // clears it when it lets go, and that cleanup can land after the rail has
      // already written the same number. Missing inline value means rewrite.
      if (!timeline) return
      if (Math.abs(f - lastFill) < 0.001 && timeline.style.getPropertyValue('--fill')) return
      lastFill = f
      timeline.style.setProperty('--fill', f.toFixed(3))
      if (H.on && geo.timeline) {
        geo.timeline.steps.forEach((at, i) => {
          steps[i].classList.toggle('is-lit', f >= at - 0.001 && f > 0)
        })
      } else {
        steps.forEach((s, i) => s.classList.toggle('is-lit', f >= i / steps.length && f > 0))
      }
    }

    function updateChrome(x, force) {
      const solid = x > 20
      const away = x > window.innerWidth * 0.6

      // Current chapter = last chapter panel whose start is before the probe line
      let cIdx = 0
      if (H.on) {
        const probe = x + window.innerWidth * 0.35
        chapters.forEach((c, i) => {
          if (Math.min(c.offsetLeft, H.max) <= probe) cIdx = i
        })
      } else {
        const probe = window.innerHeight * 0.5
        chapters.forEach((c, i) => {
          if (c.getBoundingClientRect().top <= probe) cIdx = i
        })
      }

      if (cIdx !== lastChapter || solid !== lastSolid || away !== lastAway || force) {
        lastChapter = cIdx
        lastSolid = solid
        lastAway = away
        onChrome({ index: cIdx, solid, away, horizontal: H.on })
      }
    }

    /* ---------- navigation ---------- */

    function currentPanelIndex() {
      const x = H.on ? H.target : window.scrollY
      let idx = 0
      geo.panels.forEach((p, i) => {
        const start = H.on ? p.left : p.el.offsetTop + H.top
        if (start <= x + 10) idx = i
      })
      return idx
    }

    function goTo(el, opts = {}) {
      const panel = el.closest('.panel') || el
      if (H.on) {
        const left =
          el === panel ? panel.offsetLeft : leftInTrack(el) - window.innerWidth * 0.15
        window.scrollTo(0, H.top + clamp(left, 0, H.max))
        if (opts.instant) {
          readScroll()
          H.x = H.target
          render(true)
        }
      } else {
        el.scrollIntoView({
          behavior: reduceMotion || opts.instant ? 'auto' : 'smooth',
          block: 'start',
        })
      }
      if (opts.focus !== false && panel.id) panel.focus({ preventScroll: true })
    }

    const onAnchorClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute('href').slice(1)
      const target = id && document.getElementById(id)
      if (!target || !track.contains(target)) return
      e.preventDefault()
      goTo(target)
      if (history.replaceState) history.replaceState(null, '', `#${id}`)
    }

    // Trackpad sideways swipes move the journey too
    const onWheel = (e) => {
      if (!H.on || menuIsOpen) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        window.scrollBy(0, e.deltaX)
      }
    }

    // Left / right arrows jump a panel at a time
    const onKeyDown = (e) => {
      if (!H.on || menuIsOpen || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.target.closest('input, textarea, select, [contenteditable]')) return
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const i = currentPanelIndex() + (e.key === 'ArrowRight' ? 1 : -1)
      if (panels[i]) goTo(panels[i], { focus: false })
    }

    // Keyboard focus landing off-screen brings its panel into view
    const onFocusIn = (e) => {
      if (!H.on || !track.contains(e.target) || e.target.classList.contains('panel')) return
      sticky.scrollLeft = 0
      const left = leftInTrack(e.target)
      const w = e.target.offsetWidth
      if (left < H.target + 20 || left + w > H.target + window.innerWidth - 20) {
        window.scrollTo(0, H.top + clamp(left - window.innerWidth * 0.3, 0, H.max))
      }
    }

    /* ---------- drag to scroll ---------- */

    const drag = { down: false, startX: 0, startY: 0, lastX: 0, lastT: 0, v: 0, fling: 0 }
    const NO_DRAG = 'a, button, input, select, textarea, label, [data-no-drag]'

    const onPointerDown = (e) => {
      if (!H.on || e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest(NO_DRAG)) return
      cancelAnimationFrame(drag.fling)
      drag.down = true
      dragState.moved = false
      drag.startX = e.clientX
      drag.lastX = e.clientX
      drag.startY = window.scrollY
      drag.lastT = performance.now()
      drag.v = 0
    }
    const onDragMove = (e) => {
      if (!drag.down) return
      const dx = e.clientX - drag.startX
      if (!dragState.moved && Math.abs(dx) > 6) {
        dragState.moved = true
        root.classList.add('is-dragging')
        cursorState.setDrag(true)
        const sel = window.getSelection && window.getSelection()
        if (sel) sel.removeAllRanges()
      }
      if (!dragState.moved) return
      const now = performance.now()
      drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT)
      drag.lastX = e.clientX
      drag.lastT = now
      window.scrollTo(0, drag.startY - dx * 1.4)
    }
    const onDragUp = () => {
      if (!drag.down) return
      drag.down = false
      root.classList.remove('is-dragging')
      cursorState.setDrag(false)
      if (!dragState.moved) return
      // Fling: keep coasting with the release speed
      let v = -drag.v * 22
      ;(function coast() {
        v *= 0.92
        if (Math.abs(v) < 0.5) return
        window.scrollBy(0, v)
        drag.fling = requestAnimationFrame(coast)
      })()
    }
    // Swallow the click that ends a drag
    const onStickyClickCapture = (e) => {
      if (dragState.moved) {
        e.stopPropagation()
        e.preventDefault()
        dragState.moved = false
      }
    }

    /* ---------- mode & boot ---------- */

    function setMode() {
      const want = wideQuery.matches && !reduceMotion
      if (want === H.on && geo.panels.length) {
        measure()
        return
      }
      const keep = geo.panels.length ? panels[currentPanelIndex()] : null
      // Whoever owned the process line before the switch may have cleared it,
      // so the next fill has to be written even if the number has not moved.
      lastFill = -1
      H.on = want
      root.classList.toggle('is-h', want)
      measure()
      if (keep) goTo(keep, { instant: true, focus: false })
    }

    const onMenuToggle = (e) => {
      menuIsOpen = !!e.detail
    }

    setMode()
    if (wideQuery.addEventListener) wideQuery.addEventListener('change', setMode)
    else wideQuery.addListener(setMode)

    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(measure, 150)
    }

    let roQueued = false
    const ro =
      'ResizeObserver' in window
        ? new ResizeObserver(() => {
            if (roQueued) return
            roQueued = true
            requestAnimationFrame(() => {
              roQueued = false
              measure()
            })
          })
        : null
    if (ro) ro.observe(track)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('click', onAnchorClick)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    sticky.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragUp)
    sticky.addEventListener('click', onStickyClickCapture, true)
    window.addEventListener('horizon:menu', onMenuToggle)

    // Deep link (e.g. /#pricing) lands on its panel without a whoosh
    if (window.location.hash) {
      const deep = document.getElementById(window.location.hash.slice(1))
      if (deep && track.contains(deep)) {
        requestAnimationFrame(() => goTo(deep, { instant: true, focus: false }))
      }
    }

    return () => {
      if (wideQuery.removeEventListener) wideQuery.removeEventListener('change', setMode)
      else wideQuery.removeListener(setMode)
      clearTimeout(resizeTimer)
      cancelAnimationFrame(drag.fling)
      if (ro) ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('wheel', onWheel)
      document.removeEventListener('click', onAnchorClick)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      sticky.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onDragMove)
      window.removeEventListener('pointerup', onDragUp)
      sticky.removeEventListener('click', onStickyClickCapture, true)
      window.removeEventListener('horizon:menu', onMenuToggle)
      root.classList.remove('is-h', 'is-dragging')
      rail.style.height = ''
      track.style.transform = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
