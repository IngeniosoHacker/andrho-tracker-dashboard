import { useRef, useState, createRef } from 'react'
import LandingWindow from './components/landing/LandingWindow.jsx'
import SiteHeader from './components/landing/SiteHeader.jsx'
import Stage from './components/landing/Stage.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Creators from './components/sections/Creators.jsx'
import Juego from './components/sections/Juego.jsx'
import Footer from './components/sections/Footer.jsx'
import { CREATORS_LENGTH, MORPH_LENGTH, NAV_LINKS, STAGE_LENGTH } from './lib/landing.js'
import { easeInOutCubic, seg } from './lib/motion.js'
import useScrollProgress from './lib/useScrollProgress.js'

// `c` = viewport-heights scrolled into the Creators timeline (see
// lib/landing.js). The navbar highlights the window group that's on screen
// (reported by LandingWindow), then Creators, then the game.
function activeSection(group, c) {
  if (c >= CREATORS_LENGTH + 0.5) return 'juego'
  if (c > -0.5) return 'creators'
  return group
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
  const [group, setGroup] = useState(null)
  const t = useScrollProgress(stageRef, STAGE_LENGTH)
  const c = useScrollProgress(creatorsRef, CREATORS_LENGTH)
  const morph = t / MORPH_LENGTH
  const sky = easeInOutCubic(seg(morph, 0.2, 0.8))

  return (
    <div className="antialiased">
      <PixelStarfield mix={sky} />
      <SiteHeader morph={morph} sky={sky} activeId={activeSection(group, c)} refs={navRefs} />
      <main>
        <Stage t={t} sky={sky} stageRef={stageRef} navRefs={navRefs} />
        <LandingWindow onGroupChange={setGroup} />
        <Creators progress={c} sectionRef={creatorsRef} />
        {/* Leaving the "info" desktop: the blue wallpaper fades to black. */}
        <div aria-hidden="true" className="relative z-10 h-[30vh] bg-gradient-to-b from-transparent to-black" />
        <Juego />
      </main>
      <Footer />
    </div>
  )
}
