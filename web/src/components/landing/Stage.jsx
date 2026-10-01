import { createRef, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Hero from '../sections/Hero.jsx'
import Relajate from '../sections/Relajate.jsx'
import ComoFunciona from '../sections/ComoFunciona.jsx'
import IaConCriterio from '../sections/IaConCriterio.jsx'
import Adapta from '../sections/Adapta.jsx'
import TodoEnUnaCuenta from '../sections/TodoEnUnaCuenta.jsx'
import LaNave from '../sections/LaNave.jsx'
import ScrambleLogo from '../ui/ScrambleLogo.jsx'
import { BareScene, DesktopWindow } from './WindowFrame.jsx'
import { MORPH_LENGTH, NAV_LINKS, STAGE_LENGTH, WINDOWS } from '../../lib/landing.js'
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, mixColor, seg } from '../../lib/motion.js'

const HERO_WORDS = NAV_LINKS.filter((l) => l.fromHero)

const WINDOW_CONTENT = {
  relajate: Relajate,
  'como-funciona': ComoFunciona,
  'ia-con-criterio': IaConCriterio,
  adapta: Adapta,
  'todo-en-una-cuenta': TodoEnUnaCuenta,
  nave: LaNave,
}

// 0..1 visibility of a window at `t`, plus its "opening" progress for scale.
export function windowOpacity(win, t) {
  const opening = easeOutCubic(seg(t, win.fadeIn[0], win.fadeIn[1]))
  const closing = win.fadeOut ? seg(t, win.fadeOut[0], win.fadeOut[1]) : 0
  return { opacity: opening * (1 - closing), opening, closing }
}

// For windows that grow out of an element (`emergeFrom`, lib/landing.js):
// that element's box as clip insets [top, right, bottom, left] relative to
// the emerging window's frame. Measured from layout, so transforms don't
// matter (the source scene isn't transformed, and emerging frames aren't
// scaled).
function useEmergeInsets(frameRefs) {
  const [insets, setInsets] = useState({})
  useLayoutEffect(() => {
    function measure() {
      const next = {}
      for (const win of WINDOWS) {
        if (!win.emergeFrom) continue
        const frame = frameRefs[win.id].current
        const source = document.querySelector(`[data-emerge="${win.emergeFrom}"]`)
        if (!frame || !source) continue
        const f = frame.getBoundingClientRect()
        const s = source.getBoundingClientRect()
        next[win.id] = [s.top - f.top, f.right - s.right, f.bottom - s.bottom, s.left - f.left]
      }
      setInsets(next)
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [frameRefs])
  return insets
}

// The pinned part of the landing: one sticky viewport that first shows the
// hero, then folds it into the navbar, then opens the section windows one
// by one over the space wallpaper — some framed, some bare (filling the
// screen), one growing out of the bare scene before it. The page scrolls
// past it into the Creators timeline once `t` reaches STAGE_LENGTH. See
// lib/landing.js for the timeline.
export default function Stage({ t, sky, stageRef, navRefs }) {
  const stickyRef = useRef(null)
  const titleRef = useRef(null)
  const [wordRefs] = useState(() => Object.fromEntries(HERO_WORDS.map((l) => [l.id, createRef()])))
  const [geo, setGeo] = useState(null)
  const [frameRefs] = useState(() => Object.fromEntries(WINDOWS.map((w) => [w.id, createRef()])))
  const emergeInsets = useEmergeInsets(frameRefs)

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

        {/* Bare scenes fill the whole viewport, under the framed windows. */}
        {WINDOWS.filter((w) => w.bare).map((win) => {
          const Body = WINDOW_CONTENT[win.id]
          return (
            <BareScene key={win.id} labelledBy={`${win.id}-title`} opacity={windowOpacity(win, t).opacity}>
              <Body />
            </BareScene>
          )
        })}

        {/* The desktop: framed windows over the wallpaper, below the taskbar. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 top-[116px] px-3 sm:bottom-5 sm:px-6 md:top-[84px]">
          {WINDOWS.filter((w) => !w.bare).map((win) => {
            const { opacity, opening, closing } = windowOpacity(win, t)
            const Body = WINDOW_CONTENT[win.id]
            const emerge = win.emergeFrom ? easeInOutCubic(seg(t, win.fadeIn[0], win.fadeIn[1])) : null
            return (
              <DesktopWindow
                key={win.id}
                frameRef={frameRefs[win.id]}
                labelledBy={`${win.id}-title`}
                opacity={win.emergeFrom ? (emerge > 0 ? 1 - closing : 0) : opacity}
                scale={0.94 + 0.06 * opening - 0.02 * closing}
                emerge={emerge}
                from={emergeInsets[win.id]}
              >
                <Body />
              </DesktopWindow>
            )
          })}
        </div>
      </div>

      {/* Nav targets: plain anchors at the scroll offset where each window is
          fully open, so #relajate / #adapta / #nave work natively. */}
      {WINDOWS.map((win) => (
        <span
          key={win.id}
          id={win.id}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `calc(${win.anchor} * 100vh)` }}
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
