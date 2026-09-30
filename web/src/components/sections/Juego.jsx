import { useEffect, useRef, useState } from 'react'
import MagnetButton from '../ui/MagnetButton.jsx'
import { GAME_THEMES, rotationFrom } from '../../lib/gameThemes.js'
import { getDiscountTier } from '../../lib/discountTiers.js'
import { submitGameSession, submitThemeSegments, flushPendingSync } from '../../lib/gameStorage.js'

// Full-bleed asteroids mini-game. After the windows, the page "leaves the
// info view": the whole section becomes the game's canvas — the same pixel
// sky as the hero, inverted to black — with the ship and asteroids drifting
// in the background. Pressing "Jugar" hands them to the player.
//
// Framed to the player purely as "destroy asteroids, win a discount".
// Underneath it's still the color-scheme experiment from the `andrho` repo:
// a random starting theme, rotated unannounced every ROTATION_MS of *active*
// play, with per-theme results sent as `game_session` / `game_theme_segment`
// tracker events (read by the dashboard's Minijuego tab and
// analysis/anova.py). The claim step moved to waitlist.html, which sends the
// matching `game_registration`.
const ROTATION_MS = 15000
const POINTS_PER_KILL = 10
const POINTS_PER_MISS = -5
const LINE_ABOVE_SHIP = 50 // logical px; asteroids crossing it cost points but don't end the game
const FRAME_MS = 1000 / 60 // speeds below are "per 60fps frame", scaled by real dt

const ATTRACT = { background: '#000000', star: '#ffffff', ship: '#ffffff', meteor: 'rgba(255,255,255,0.35)' }

// Pixel-art ship, pointing up. Each '#' is one cell.
const SHIP_SPRITE = [
  '.....#.....',
  '....###....',
  '....#.#....',
  '...#####...',
  '..##.#.##..',
  '.#########.',
  '##.#####.##',
  '#...###...#',
  '....#.#....',
]
const SHIP_CELL = 2.6

// A lumpy pixel outline for an asteroid of the given logical size, as a list
// of [dx, dy] cells around its center.
function rockCells(size, cell) {
  const radius = size * 0.8
  const n = Math.ceil((radius * 1.3) / cell)
  const bumps = [0, 1, 2].map(() => ({ f: 2 + Math.floor(Math.random() * 4), p: Math.random() * Math.PI * 2 }))
  const edge = (a) => radius * (0.85 + bumps.reduce((acc, b) => acc + Math.sin(a * b.f + b.p) * 0.07, 0))
  const inside = (i, j) => Math.hypot(i * cell, j * cell) <= edge(Math.atan2(j, i))
  const cells = []
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      if (!inside(i, j)) continue
      const onEdge = !inside(i + 1, j) || !inside(i - 1, j) || !inside(i, j + 1) || !inside(i, j - 1)
      const crater = !onEdge && Math.random() < 0.06
      if (onEdge || crater) cells.push([i * cell, j * cell])
    }
  }
  return cells
}

function makeRock(world, speedFactor = 1) {
  const size = 16 + Math.random() * 22
  return {
    x: size + Math.random() * (world.W - size * 2),
    y: -size,
    size,
    speed: (1.2 + Math.random() * 2.2) * speedFactor,
    cells: rockCells(size, 3),
    crossedLine: false,
  }
}

function createEngine(startingThemeId, world) {
  return {
    ship: { x: world.W / 2, speed: 6 },
    bullets: [],
    rocks: [],
    keys: {},
    running: true,
    spawnTimer: 0,
    destroyedCount: 0,
    missedCount: 0,
    hiddenScore: 0,
    segments: [],
    segment: { theme: startingThemeId, order: 0, activeMs: 0, destroyed: 0, missed: 0, score: 0 },
  }
}

export default function Juego() {
  const [phase, setPhase] = useState('start') // start | playing | over
  const [theme, setTheme] = useState(null) // null = attract mode (black)
  const [destroyed, setDestroyed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState(null)

  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const phaseRef = useRef('start')
  const visibleRef = useRef(0)
  const pausedRef = useRef(false)
  const worldRef = useRef(null)
  const engineRef = useRef(null)
  const themeOrderRef = useRef(GAME_THEMES)
  const activeThemeRef = useRef(null)
  const sessionIdRef = useRef(null)
  const sessionStartedAtRef = useRef(null)

  useEffect(() => {
    flushPendingSync()
  }, [])

  function finalizeSegment(engine) {
    const seg = engine.segment
    engine.segments.push({
      session_id: sessionIdRef.current,
      theme: seg.theme,
      segment_order: seg.order,
      duration_ms: Math.round(seg.activeMs),
      destroyed: seg.destroyed,
      missed: seg.missed,
      segment_score: seg.score,
    })
  }

  async function persistResults(engine, reason) {
    // Awaited in order: theme segments reference the session row.
    await submitGameSession({
      id: sessionIdRef.current,
      started_at: sessionStartedAtRef.current,
      ended_at: new Date().toISOString(),
      starting_theme: themeOrderRef.current[0].id,
      destroyed_count: engine.destroyedCount,
      missed_count: engine.missedCount,
      hidden_score: engine.hiddenScore,
      ended_reason: reason,
    })
    await submitThemeSegments(engine.segments)
  }

  function endGame(reason) {
    const engine = engineRef.current
    if (!engine?.running) return
    engine.running = false
    finalizeSegment(engine)
    phaseRef.current = 'over'
    activeThemeRef.current = null
    const tier = getDiscountTier(engine.destroyedCount)
    setResult({ destroyedCount: engine.destroyedCount, percent: tier.percent, sessionId: sessionIdRef.current })
    setTheme(null)
    setPhase('over')
    setPaused(false)
    persistResults(engine, reason)
  }

  function startGame() {
    const order = rotationFrom(Math.floor(Math.random() * GAME_THEMES.length))
    themeOrderRef.current = order
    activeThemeRef.current = order[0]
    sessionIdRef.current = crypto.randomUUID()
    sessionStartedAtRef.current = new Date().toISOString()
    engineRef.current = createEngine(order[0].id, worldRef.current)
    phaseRef.current = 'playing'
    setTheme(order[0])
    setDestroyed(0)
    setResult(null)
    setPhase('playing')
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // One long-lived loop: attract mode (ship + asteroids drifting in the
  // background) until "Jugar", then the real game. Keeps running across
  // phases; skips work while the section is off-screen.
  useEffect(() => {
    const canvas = canvasRef.current
    const section = sectionRef.current
    const ctx = canvas.getContext('2d')
    const world = { W: 800, H: 420, k: 1, dpr: 1, cssW: 0, cssH: 0, stars: [], drift: [], driftTimer: 0 }
    worldRef.current = world
    let raf = 0
    let last = performance.now()

    function resize() {
      world.dpr = Math.min(window.devicePixelRatio || 1, 2)
      world.cssW = canvas.clientWidth
      world.cssH = canvas.clientHeight
      canvas.width = Math.round(world.cssW * world.dpr)
      canvas.height = Math.round(world.cssH * world.dpr)
      // Fixed logical width keeps the gameplay the same on any screen; the
      // play field just gets taller or shorter.
      world.W = world.cssW < 700 ? 420 : 800
      world.k = world.cssW / world.W
      world.H = world.cssH / world.k
      world.shipY = world.H - (world.cssW < 640 ? 130 : 70) / world.k
      world.stars = Array.from({ length: Math.round((world.cssW * world.cssH) / 7000) }, () => ({
        x: Math.random() * world.cssW,
        y: Math.random() * world.cssH,
        big: Math.random() < 0.2,
        phase: Math.random() * Math.PI * 2,
      }))
      const engine = engineRef.current
      if (engine) engine.ship.x = Math.max(18, Math.min(world.W - 18, engine.ship.x))
    }

    function rotateTheme(engine) {
      finalizeSegment(engine)
      const order = themeOrderRef.current
      const index = order.findIndex((th) => th.id === engine.segment.theme)
      const next = order[(index + 1) % order.length]
      activeThemeRef.current = next
      engine.segment = { theme: next.id, order: engine.segments.length, activeMs: 0, destroyed: 0, missed: 0, score: 0 }
      setTheme(next)
    }

    function update(engine, f, dt) {
      const ship = engine.ship
      const { keys } = engine
      if (keys.arrowleft || keys.a) ship.x -= ship.speed * f
      if (keys.arrowright || keys.d) ship.x += ship.speed * f
      ship.x = Math.max(18, Math.min(world.W - 18, ship.x))

      engine.bullets.forEach((b) => (b.y -= 8 * f))
      engine.bullets = engine.bullets.filter((b) => b.y > -10)

      // Same asteroid density per logical width on any screen.
      engine.spawnTimer += f
      if (engine.spawnTimer > (40 * 800) / world.W) {
        engine.rocks.push(makeRock(world))
        engine.spawnTimer = 0
      }
      engine.rocks.forEach((r) => (r.y += r.speed * f))

      const lineY = world.shipY - LINE_ABOVE_SHIP
      engine.rocks.forEach((r) => {
        if (!r.crossedLine && r.y >= lineY) {
          r.crossedLine = true
          engine.missedCount++
          engine.hiddenScore += POINTS_PER_MISS
          engine.segment.missed++
          engine.segment.score += POINTS_PER_MISS
        }
      })

      for (let i = engine.rocks.length - 1; i >= 0; i--) {
        const r = engine.rocks[i]
        for (let j = engine.bullets.length - 1; j >= 0; j--) {
          const b = engine.bullets[j]
          if (Math.hypot(b.x - r.x, b.y - r.y) < r.size * 0.6) {
            engine.rocks.splice(i, 1)
            engine.bullets.splice(j, 1)
            engine.destroyedCount++
            engine.hiddenScore += POINTS_PER_KILL
            engine.segment.destroyed++
            engine.segment.score += POINTS_PER_KILL
            setDestroyed(engine.destroyedCount)
            break
          }
        }
      }

      // Rock vs ship — the only thing that ends the game.
      for (const r of engine.rocks) {
        if (r.y > 0 && Math.hypot(r.x - ship.x, r.y - world.shipY) < r.size * 0.6 + 10) {
          endGame('collision')
          return
        }
      }
      engine.rocks = engine.rocks.filter((r) => r.y < world.H + 40)

      // Theme exposure is counted in active (unpaused) play time only, so
      // per-theme destroy rates stay comparable for the ANOVA.
      engine.segment.activeMs += dt
      if (engine.segment.activeMs >= ROTATION_MS) rotateTheme(engine)
    }

    function updateAttract(f) {
      world.driftTimer += f
      if (world.driftTimer > (90 * 800) / world.W) {
        world.drift.push(makeRock(world, 0.35))
        world.driftTimer = 0
      }
      world.drift.forEach((r) => (r.y += r.speed * f))
      world.drift = world.drift.filter((r) => r.y < world.H + 40)
    }

    function drawShip(x, y, color) {
      ctx.fillStyle = color
      const ox = x - (SHIP_SPRITE[0].length * SHIP_CELL) / 2
      const oy = y - (SHIP_SPRITE.length * SHIP_CELL) / 2
      SHIP_SPRITE.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          if (row[i] === '#') ctx.fillRect(ox + i * SHIP_CELL, oy + j * SHIP_CELL, SHIP_CELL, SHIP_CELL)
        }
      })
    }

    function drawRock(r, color) {
      ctx.fillStyle = color
      for (const [dx, dy] of r.cells) ctx.fillRect(r.x + dx - 1.5, r.y + dy - 1.5, 3, 3)
    }

    function draw(now) {
      const playing = phaseRef.current === 'playing'
      const th = playing ? activeThemeRef.current : null
      const colors = th
        ? { background: th.background, star: th.text, ship: th.ship, meteor: th.meteor }
        : ATTRACT

      // Background + pixel stars, in CSS pixels.
      ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0)
      ctx.globalAlpha = 1
      ctx.fillStyle = colors.background
      ctx.fillRect(0, 0, world.cssW, world.cssH)
      ctx.fillStyle = colors.star
      for (const s of world.stars) {
        ctx.globalAlpha = Math.round((0.35 + 0.3 * Math.sin(now / 900 + s.phase)) * 4) / 4
        const size = s.big ? 4 : 2
        ctx.fillRect(Math.round(s.x / 2) * 2, Math.round(s.y / 2) * 2, size, size)
      }
      ctx.globalAlpha = 1

      // Game objects, in logical units.
      ctx.setTransform(world.dpr * world.k, 0, 0, world.dpr * world.k, 0, 0)
      if (playing) {
        const engine = engineRef.current
        ctx.save()
        ctx.strokeStyle = th.line
        ctx.lineWidth = 2
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.moveTo(0, world.shipY - LINE_ABOVE_SHIP)
        ctx.lineTo(world.W, world.shipY - LINE_ABOVE_SHIP)
        ctx.stroke()
        ctx.restore()
        engine.rocks.forEach((r) => drawRock(r, colors.meteor))
        ctx.fillStyle = th.bullet
        engine.bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 8, 4, 8))
        drawShip(engine.ship.x, world.shipY, colors.ship)
      } else {
        world.drift.forEach((r) => drawRock(r, colors.meteor))
        const idleX = world.W / 2 + Math.sin(now / 1800) * world.W * 0.2
        drawShip(idleX, world.shipY + Math.sin(now / 500) * 3, colors.ship)
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(now - last, 50)
      last = now
      if (visibleRef.current <= 0.02) return
      const f = dt / FRAME_MS
      if (phaseRef.current === 'playing') {
        // Pause while the game isn't the main thing on screen.
        const shouldPause = visibleRef.current < 0.6 || document.hidden
        if (shouldPause !== pausedRef.current) {
          pausedRef.current = shouldPause
          setPaused(shouldPause)
        }
        if (!shouldPause) update(engineRef.current, f, dt)
      } else {
        updateAttract(f)
      }
      draw(now)
    }

    function onKeyDown(e) {
      if (phaseRef.current !== 'playing' || pausedRef.current) return
      const key = e.key.toLowerCase()
      if (key === ' ' || key === 'arrowleft' || key === 'arrowright') e.preventDefault()
      engineRef.current.keys[key] = true
      if (key === ' ') {
        const engine = engineRef.current
        engine.bullets.push({ x: engine.ship.x, y: world.shipY - 14 })
      }
    }
    function onKeyUp(e) {
      if (engineRef.current) engineRef.current.keys[e.key.toLowerCase()] = false
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.intersectionRatio
      },
      { threshold: [0, 0.02, 0.25, 0.5, 0.6, 0.75, 1] },
    )
    observer.observe(section)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the loop reads everything through refs
  }, [])

  const hold = (key, down) => () => {
    if (engineRef.current) engineRef.current.keys[key] = down
  }
  const shoot = () => {
    const engine = engineRef.current
    if (engine?.running && !pausedRef.current) engine.bullets.push({ x: engine.ship.x, y: worldRef.current.shipY - 14 })
  }
  const text = theme?.text ?? '#ffffff'

  return (
    <section
      id="juego"
      ref={sectionRef}
      aria-labelledby="juego-title"
      className="relative z-10 h-[100svh] overflow-hidden bg-black"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

      {phase === 'start' && (
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-16 text-center text-white">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Modo desvío de emergencia</p>
            <h2 id="juego-title" className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Gana descuentos jugando.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Defiende la nave de un enjambre de asteroides. Destruye suficientes y desbloquea un descuento por 1 año
              para cuando despeguemos.
            </p>
            <div className="mt-10">
              <MagnetButton onClick={startGame}>Jugar</MagnetButton>
            </div>
            <p className="mt-6 font-mono text-xs text-white/40">Flechas o A/D para moverte, espacio para disparar.</p>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <h2 id="juego-title" className="sr-only">
            Minijuego de asteroides
          </h2>
          <p
            className="absolute left-4 top-[128px] font-mono text-sm sm:left-8 md:top-[100px]"
            style={{ color: text }}
            aria-live="polite"
          >
            Asteroides destruidos: <span style={{ color: theme?.ship }} className="font-semibold">{destroyed}</span>
          </p>
          {paused && (
            <p className="absolute inset-x-0 top-1/2 text-center font-mono text-sm uppercase tracking-[0.3em]" style={{ color: text }}>
              En pausa
            </p>
          )}
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3 sm:hidden">
            {[
              { label: '◀', aria: 'Mover a la izquierda', key: 'arrowleft' },
              { label: '●', aria: 'Disparar' },
              { label: '▶', aria: 'Mover a la derecha', key: 'arrowright' },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                aria-label={btn.aria}
                onPointerDown={btn.key ? hold(btn.key, true) : undefined}
                onPointerUp={btn.key ? hold(btn.key, false) : undefined}
                onPointerLeave={btn.key ? hold(btn.key, false) : undefined}
                onClick={btn.key ? undefined : shoot}
                style={{ borderColor: btn.key ? theme?.border : theme?.ship, color: btn.key ? text : theme?.ship }}
                className="h-14 w-16 rounded-lg border bg-black/10 font-mono backdrop-blur-sm"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'over' && result && (
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-16 text-center text-white">
          <div className="max-w-md">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#ff6b8b]">Colisión detectada</p>
            <h2 id="juego-title" className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Asteroides destruidos: {result.destroyedCount}
            </h2>
            <p className="mt-3 text-white/70">
              {result.percent > 0
                ? `Alcanzaste un ${result.percent}% de descuento por 1 año.`
                : 'Sigue practicando para desbloquear un descuento.'}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {result.percent > 0 ? (
                <MagnetButton
                  as="a"
                  href={`/waitlist.html?descuento=${result.percent}&destruidos=${result.destroyedCount}&partida=${result.sessionId}`}
                >
                  Reclamar mi {result.percent}% →
                </MagnetButton>
              ) : (
                <MagnetButton as="a" href="/waitlist.html">
                  Unirme a la lista de espera
                </MagnetButton>
              )}
              <MagnetButton variant="secondary" onClick={startGame} className="text-white! hover:bg-white/10!">
                Jugar de nuevo
              </MagnetButton>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
