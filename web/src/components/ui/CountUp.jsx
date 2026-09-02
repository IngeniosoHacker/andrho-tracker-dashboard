import { useEffect, useRef, useState } from 'react'

// reactbits.dev-style "CountUp": animates a number from 0 to `end` once it
// scrolls into view.
export default function CountUp({ end = 0, duration = 1200, suffix = '', className = '' }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          const start = performance.now()
          function step(now) {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  )
}
