import { useEffect, useRef } from 'react'

// reactbits.dev-style scroll parallax: drifts children vertically at a
// fraction of scroll speed for a subtle sense of depth.
export default function ParallaxLayer({ children, speed = 0.15, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId = null
    function update() {
      const rect = el.getBoundingClientRect()
      const offset = (rect.top - window.innerHeight / 2) * speed
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`
      rafId = null
    }
    function onScroll() {
      if (rafId == null) rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [speed])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
