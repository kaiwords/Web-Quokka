import { useEffect, useRef } from 'react'

const SENSITIVITY = 0.8

export default function BackgroundVideo({ src }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    let prevX = null
    let targetTime = 0
    let lastRequestedTime = 0
    let seeking = false

    // The video never autoplays, so without this, some browsers (Safari in
    // particular) leave the element unpainted — no frame at all — until
    // playback starts at least once. Priming with play()+pause() forces the
    // first frame to decode and paint, then freezes right there.
    function primeFirstFrame() {
      const playResult = video.play()
      if (playResult && typeof playResult.then === 'function') {
        playResult.then(() => video.pause()).catch(() => {})
      } else {
        video.pause()
      }
    }

    if (video.readyState >= 2) {
      primeFirstFrame()
    } else {
      video.addEventListener('loadeddata', primeFirstFrame, { once: true })
    }

    function performSeek() {
      if (!video.duration || Number.isNaN(video.duration)) return
      if (targetTime === lastRequestedTime) return
      seeking = true
      lastRequestedTime = targetTime
      video.currentTime = targetTime
    }

    function requestSeek(time) {
      targetTime = time
      if (!seeking) performSeek()
    }

    function handleSeeked() {
      seeking = false
      // Target moved again while the previous seek was in flight — catch up
      // instead of flooding the decoder with a seek per mousemove event.
      if (targetTime !== lastRequestedTime) performSeek()
    }

    function handleMouseMove(event) {
      if (prevX === null) {
        prevX = event.clientX
        return
      }
      const delta = event.clientX - prevX
      prevX = event.clientX
      if (!video.duration || Number.isNaN(video.duration)) return

      const offset = (delta / window.innerWidth) * SENSITIVITY * video.duration
      const next = Math.min(video.duration, Math.max(0, targetTime + offset))
      requestSeek(next)
    }

    video.addEventListener('seeked', handleSeeked)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      video.removeEventListener('loadeddata', primeFirstFrame)
      video.removeEventListener('seeked', handleSeeked)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full object-cover"
      style={{ objectPosition: '70% center' }}
    />
  )
}
