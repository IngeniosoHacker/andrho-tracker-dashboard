import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './motion.js'

// How quickly the rendered progress catches up with the real scroll position
// (ms time constant). Mouse wheels scroll in ~100px jumps; easing toward the
// target turns each jump into a glide instead of a visible step.
const SMOOTHING_MS = 110

// Progress through a pinned section: `ref` is a tall wrapper whose first
// child is the sticky viewport, `length` how many viewport-heights of scroll
// it spans. Returns viewport-heights scrolled into it (negative before it,
// > length after it), smoothed toward the real scroll position (see
// SMOOTHING_MS) unless the visitor prefers reduced motion.
export default function useScrollProgress(ref, length) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const smooth = !prefersReducedMotion()
    let raf = 0
    let last = 0
    let current = null
    function target() {
      const el = ref.current
      // Measured instead of assuming innerHeight: the wrapper is sized in
      // `vh`, which differs from innerHeight on mobile browsers.
      const unit = (el.offsetHeight - el.firstElementChild.offsetHeight) / length
      return (window.scrollY - el.offsetTop) / unit
    }
    function tick(now) {
      raf = 0
      if (!ref.current) return
      const goal = target()
      if (current === null || !smooth) {
        current = goal
      } else {
        const dt = Math.min(now - last, 64)
        current += (goal - current) * (1 - Math.exp(-dt / SMOOTHING_MS))
        if (Math.abs(goal - current) < 0.0005) current = goal
      }
      last = now
      setT(current)
      if (current !== goal) raf = requestAnimationFrame(tick)
    }
    const schedule = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    tick(performance.now())
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ref, length])
  return t
}
