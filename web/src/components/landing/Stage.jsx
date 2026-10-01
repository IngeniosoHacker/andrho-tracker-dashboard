import { createRef, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Hero from '../sections/Hero.jsx'
import ScrambleLogo from '../ui/ScrambleLogo.jsx'
import LandingWindow from './LandingWindow.jsx'
import { MORPH_LENGTH, NAV_LINKS, STAGE_LENGTH, VIEWS } from '../../lib/landing.js'
import { easeInOutCubic, easeOutBack, lerp, mixColor, seg } from '../../lib/motion.js'

const HERO_WORDS = NAV_LINKS.filter((l) => l.fromHero)

// The pinned part of the landing: one sticky viewport that first shows the
// hero, then folds it into the navbar, then opens the one big window over
// the space wallpaper, whose views slide inside it (LandingWindow.jsx). The
// page scrolls past it into the Creators timeline once `t` reaches
// STAGE_LENGTH. See lib/landing.js for the timeline.
export default function Stage({ t, sky, stageRef, navRefs }) {
  const stickyRef = useRef(null)
  const titleRef = useRef(null)
  const [wordRefs] = useState(() => Object.fromEntries(HERO_WORDS.map((l) => [l.id, createRef()])))
  const [geo, setGeo] = useState(null)

  // Where each flying element starts (its placeholder in the hero, in
  // sticky-viewport coordinates) and lands (its twin in the navbar, in
  // viewport coordinates — the same thing while the stage is pinned).
  useLayoutEffect(() => {
    function measure() {
      const sticky = stickyRef.current
      const title = titleRef.current
      const wordmark = navRefs.wordmark.current
      const logo = navRefs.logo.current
      if (!sticky || !title || !wordmark || !logo) return
      const stickyTop = sticky.getBoundingClientRect().top
      const box = (el, offsetY = 0) => {
        const r = el.getBoundingClientRect()
        return { left: r.left, w: r.width, cx: r.left + r.width / 2, cy: r.top + r.height / 2 - offsetY }
      }
      const fontSize = (el) => parseFloat(getComputedStyle(el).fontSize)
      setGeo({
        vw: window.innerWidth,
        title: {
          from: box(title, stickyTop),
          to: box(wordmark),
          logoLeft: box(logo).left,
          scale: fontSize(wordmark) / fontSize(title),
        },
        words: HERO_WORDS.map((l) => {
          const source = wordRefs[l.id].current
          const target = navRefs.links[l.id].current
          return {
            ...l,
            from: box(source, stickyTop),
            to: box(target),
            fontSize: fontSize(source),
            scale: fontSize(target) / fontSize(source),
          }
        }),
      })
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [navRefs, wordRefs])

  const morph = t / MORPH_LENGTH
  const morphing = geo && morph > 0.001 && morph < 1

  return (
    <div
      ref={stageRef}
      id="top"
      className="relative z-10"
      style={{ height: `calc(${STAGE_LENGTH} * 100vh + 100svh)` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <Hero morph={morph} titleRef={titleRef} wordRefs={wordRefs} />

        {/* The desktop: the window over the wallpaper, below the taskbar. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 top-[116px] px-3 sm:bottom-5 sm:px-6 md:top-[84px]">
          <LandingWindow t={t} />
        </div>
      </div>

      {/* Nav targets: plain anchors at the scroll offset where each view is
          settled, so #relajate / #adapta / #nave work natively. */}
      {VIEWS.map((view) => (
        <span
          key={view.id}
          id={view.id}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `calc(${view.anchor} * 100vh)` }}
        />
      ))}

      {morphing && createPortal(<FlyingLayer morph={morph} sky={sky} geo={geo} />, document.body)}
    </div>
  )
}

// Copies of the hero title and bold words that travel into the navbar.
// Portaled to <body> and fixed above the header (z-50), so they're drawn on
// top of the forming bar instead of inside the stage's stacking context.
function FlyingLayer({ morph: t, sky, geo }) {
  const { title } = geo

  // Title: shrink while rising to the center of the bar, slide left until it
  // bumps the edge, then the logo pops in and nudges it into place.
  const toCenter = easeInOutCubic(seg(t, 0.1, 0.5))
  const toLeft = easeInOutCubic(seg(t, 0.5, 0.78))
  const settle = seg(t, 0.78, 0.92)
  const centerX = geo.vw / 2
  const bumpX = title.logoLeft + title.to.w / 2
  let x = lerp(title.from.cx, centerX, toCenter)
  if (toLeft > 0) x = lerp(centerX, bumpX, toLeft)
  if (settle > 0) x = lerp(bumpX, title.to.cx, easeOutBack(settle))
  const y = lerp(title.from.cy, title.to.cy, toCenter)
  // Interpolate scale in log space so the shrink reads as even.
  const scale = Math.exp(lerp(0, Math.log(title.scale), toCenter))
  const ink = mixColor('#0b1020', '#ffffff', sky)

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
      <span
        className="absolute left-0 top-0 whitespace-nowrap font-display text-6xl font-bold leading-none tracking-tight sm:text-8xl lg:text-9xl"
        style={{ color: ink, transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})` }}
      >
        <ScrambleLogo paused />
      </span>

      {geo.words.map((word, i) => {
        const p = easeInOutCubic(seg(t, 0.36 + i * 0.07, 0.84 + i * 0.07))
        const wx = lerp(word.from.cx, word.to.cx, p)
        // A gentle arc instead of a straight line.
        const wy = lerp(word.from.cy, word.to.cy, p) - Math.sin(Math.PI * p) * 36
        const ws = Math.exp(lerp(0, Math.log(word.scale), p))
        return (
          <span
            key={word.id}
            className="absolute left-0 top-0 whitespace-nowrap font-semibold leading-normal"
            style={{
              fontSize: `${word.fontSize}px`,
              color: mixColor('#0b1020', '#ffffff', sky),
              opacity: lerp(1, 0.7, p),
              transform: `translate(${wx}px, ${wy}px) translate(-50%, -50%) scale(${ws})`,
            }}
          >
            {word.label}
          </span>
        )
      })}
    </div>
  )
}
