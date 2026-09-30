import { useEffect, useRef, useState, createRef } from 'react'
import SiteHeader from './components/landing/SiteHeader.jsx'
import Stage, { windowOpacity } from './components/landing/Stage.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Juego from './components/sections/Juego.jsx'
import Footer from './components/sections/Footer.jsx'
import { NAV_LINKS, STAGE_LENGTH, WINDOWS } from './lib/landing.js'
import { easeInOutCubic, seg } from './lib/motion.js'

// `t` = viewport-heights scrolled into the stage (see lib/landing.js). The
// whole landing — hero → navbar morph, sky color, which window is open — is
// derived from it.
function useStageProgress(stageRef) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf = 0
    function read() {
      raf = 0
      const stage = stageRef.current
      if (!stage) return
      // Measured instead of assuming innerHeight: the stage is sized in
      // `vh`, which differs from innerHeight on mobile browsers.
      const unit = (stage.offsetHeight - stage.firstElementChild.offsetHeight) / STAGE_LENGTH
      setT((window.scrollY - stage.offsetTop) / unit)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
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
      best = win.id
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
  const sky = easeInOutCubic(seg(t, 0.2, 0.8))

  return (
    <div className="antialiased">
      <PixelStarfield mix={sky} />
      <SiteHeader t={t} sky={sky} activeId={activeSection(t)} refs={navRefs} />
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
