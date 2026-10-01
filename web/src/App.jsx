import { useRef, useState, createRef } from 'react'
import SiteHeader from './components/landing/SiteHeader.jsx'
import Stage, { windowOpacity } from './components/landing/Stage.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Creators from './components/sections/Creators.jsx'
import Juego from './components/sections/Juego.jsx'
import Footer from './components/sections/Footer.jsx'
import { CREATORS_LENGTH, MORPH_LENGTH, NAV_LINKS, STAGE_LENGTH, WINDOWS } from './lib/landing.js'
import { easeInOutCubic, seg } from './lib/motion.js'
import useScrollProgress from './lib/useScrollProgress.js'

// `t` = viewport-heights scrolled into the stage, `c` = into the Creators
// timeline (see lib/landing.js). The navbar highlights the open window's
// link, then Creators, then the game.
function activeSection(t, c) {
  if (c >= CREATORS_LENGTH + 0.5) return 'juego'
  if (c > -0.5) return 'creators'
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
  const creatorsRef = useRef(null)
  const [navRefs] = useState(() => ({
    logo: createRef(),
    wordmark: createRef(),
    links: Object.fromEntries(NAV_LINKS.map((l) => [l.id, createRef()])),
  }))
  const t = useScrollProgress(stageRef, STAGE_LENGTH)
  const c = useScrollProgress(creatorsRef, CREATORS_LENGTH)
  const morph = t / MORPH_LENGTH
  const sky = easeInOutCubic(seg(morph, 0.2, 0.8))

  return (
    <div className="antialiased">
      <PixelStarfield mix={sky} />
      <SiteHeader morph={morph} sky={sky} activeId={activeSection(t, c)} refs={navRefs} />
      <main>
        <Stage t={t} sky={sky} stageRef={stageRef} navRefs={navRefs} />
        <Creators progress={c} sectionRef={creatorsRef} />
        {/* Leaving the "info" desktop: the blue wallpaper fades to black. */}
        <div aria-hidden="true" className="relative z-10 h-[30vh] bg-gradient-to-b from-transparent to-black" />
        <Juego />
      </main>
      <Footer />
    </div>
  )
}
