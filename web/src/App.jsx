import { useEffect, useRef, useState, createRef } from 'react'
import SiteHeader from './components/landing/SiteHeader.jsx'
import Stage, { windowOpacity } from './components/landing/Stage.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Juego from './components/sections/Juego.jsx'
import Footer from './components/sections/Footer.jsx'
import { MORPH_LENGTH, NAV_LINKS, STAGE_LENGTH, WINDOWS } from './lib/landing.js'
import { easeInOutCubic, prefersReducedMotion, seg } from './lib/motion.js'

// How quickly the rendered progress catches up with the real scroll position
// (ms time constant). Mouse wheels scroll in ~100px jumps; easing toward the
// target turns each jump into a glide instead of a visible step.
const SMOOTHING_MS = 110

// `t` = viewport-heights scrolled into the stage (see lib/landing.js). The
// whole landing — hero → navbar morph, sky color, which window is open — is
// derived from it. The returned value is smoothed toward the real scroll
// position (see SMOOTHING_MS) unless the visitor prefers reduced motion.
function useStageProgress(stageRef) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const smooth = !prefersReducedMotion()
    let raf = 0
    let last = 0
    let current = null
    function target() {
      const stage = stageRef.current
      // Measured instead of assuming innerHeight: the stage is sized in
      // `vh`, which differs from innerHeight on mobile browsers.
      const unit = (stage.offsetHeight - stage.firstElementChild.offsetHeight) / STAGE_LENGTH
      return (window.scrollY - stage.offsetTop) / unit
    }
    function tick(now) {
      raf = 0
      if (!stageRef.current) return
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
  }, [stageRef])
  return t
}

function activeSection(t) {
  if (t >= STAGE_LENGTH + 0.5) return 'juego'
  let best = null
  let bestOpacity = 0.5
  for (const win of WINDOWS) {
    const { opacity } = windowOpacity(win, t)
    if (opacity > bestOpacity) {
      best = win.nav ?? win.id
      bestOpacity = opacity
    }
  }
  return best
}

// AndRho — official marketing landing page.
export default function App() {
  const stageRef = useRef(null)
  const [navRefs] = useState(() => ({
    logo: createRef(),
    wordmark: createRef(),
    links: Object.fromEntries(NAV_LINKS.map((l) => [l.id, createRef()])),
  }))
  const t = useStageProgress(stageRef)
  const morph = t / MORPH_LENGTH
  const sky = easeInOutCubic(seg(morph, 0.2, 0.8))

  return (
    <div className="antialiased">
      <PixelStarfield mix={sky} />
      <SiteHeader morph={morph} sky={sky} activeId={activeSection(t)} refs={navRefs} />
      <main>
        <Stage t={t} sky={sky} stageRef={stageRef} navRefs={navRefs} />
        {/* Leaving the "info" desktop: the blue wallpaper fades to black. */}
        <div aria-hidden="true" className="relative z-10 h-[30vh] bg-gradient-to-b from-transparent to-black" />
        <Juego />
      </main>
      <Footer />
    </div>
  )
}
