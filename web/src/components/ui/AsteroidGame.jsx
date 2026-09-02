import { useEffect, useRef, useState } from 'react'
import MagnetButton from './MagnetButton.jsx'
import Field from './form/Field.jsx'
import { TextInput, SelectField } from './form/inputs.jsx'
import { SECTORS, COMPANY_SIZES } from '../../lib/waitlist.js'
import { GAME_THEMES, rotationFrom } from '../../lib/gameThemes.js'
import { getDiscountTier, generateDiscountCode } from '../../lib/discountTiers.js'
import { submitGameSession, submitThemeSegments, submitRegistration, flushPendingSync } from '../../lib/gameStorage.js'

// Asteroids-lite mini-game, framed to the player purely as "destroy
// asteroids, win a discount" (see MissionGame.jsx for the section copy —
// keep it that way). Underneath, it's also a color-scheme experiment: a
// random starting theme is picked with no player input, then it rotates
// through the rest automatically and unannounced while they play, and
// per-theme performance is recorded for later ANOVA analysis
// (analysis/anova.py). The player only ever sees how many asteroids they
// destroyed — never the theme, the rotation, or the hidden scoring used for
// that analysis.
const CANVAS_W = 800
const CANVAS_H = 420
const ROTATION_MS = 15000 // how long each color theme gets during one session
const POINTS_PER_KILL = 10
const POINTS_PER_MISS = -5
const LINE_OFFSET = 90 // px above the ship; asteroids crossing this cost points but don't end the game

function createEngine(startingThemeId) {
  return {
    ship: { x: CANVAS_W / 2, y: CANVAS_H - 40, speed: 6 },
    bullets: [],
    rocks: [],
    keys: {},
    running: true,
    spawnTimer: 0,
    destroyedCount: 0,
    missedCount: 0,
    hiddenScore: 0,
    segments: [],
    segment: { theme: startingThemeId, order: 0, startedAt: performance.now(), destroyed: 0, missed: 0, score: 0 },
  }
}

export default function AsteroidGame() {
  const [phase, setPhase] = useState('start') // start | playing | game-over
  const [activeTheme, setActiveTheme] = useState(GAME_THEMES[0])
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [finalStats, setFinalStats] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', commerceType: '', commerceSize: '' })
  const [claim, setClaim] = useState(null)

  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const themeOrderRef = useRef(GAME_THEMES)
  const activeThemeRef = useRef(GAME_THEMES[0])
  const sessionIdRef = useRef(null)
  const sessionStartedAtRef = useRef(null)
  const rafRef = useRef(null)
  const rotationTimerRef = useRef(null)
  const shootRef = useRef(() => {})

  // Retry anything left over from a previous visit where Supabase wasn't reachable.
  useEffect(() => {
    flushPendingSync()
  }, [])

  function finalizeSegment(engine, endedAt) {
    const seg = engine.segment
    engine.segments.push({
      session_id: sessionIdRef.current,
      theme: seg.theme,
      segment_order: seg.order,
      duration_ms: Math.max(0, Math.round(endedAt - seg.startedAt)),
      destroyed: seg.destroyed,
      missed: seg.missed,
      segment_score: seg.score,
    })
  }

  async function persistResults(engine, reason) {
    // Awaited in order: theme_segments has a foreign key on game_sessions.id,
    // so the session row must land first or the segment insert fails and
    // falls back to the local retry queue for no reason.
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
    if (!engine || !engine.running) return
    engine.running = false
    finalizeSegment(engine, performance.now())

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (rotationTimerRef.current) clearInterval(rotationTimerRef.current)

    setFinalStats({ destroyedCount: engine.destroyedCount, missedCount: engine.missedCount })
    setPhase('game-over')
    persistResults(engine, reason)
  }

  function startGame() {
    const order = rotationFrom(Math.floor(Math.random() * GAME_THEMES.length))
    themeOrderRef.current = order
    activeThemeRef.current = order[0]
    sessionIdRef.current = crypto.randomUUID()
    sessionStartedAtRef.current = new Date().toISOString()
    engineRef.current = createEngine(order[0].id)

    setActiveTheme(order[0])
    setDestroyedCount(0)
    setFinalStats(null)
    setShowForm(false)
    setClaim(null)
    setForm({ email: '', commerceType: '', commerceSize: '' })
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const engine = engineRef.current

    function spawnRock() {
      const size = 16 + Math.random() * 22
      engine.rocks.push({
        x: Math.random() * (CANVAS_W - size),
        y: -size,
        size,
        speed: 1.2 + Math.random() * 2.2,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.05,
        crossedLine: false,
      })
    }

    function update() {
      if (!engine.running) return
      const ship = engine.ship
      if (engine.keys.ArrowLeft || engine.keys.a) ship.x -= ship.speed
      if (engine.keys.ArrowRight || engine.keys.d) ship.x += ship.speed
      ship.x = Math.max(18, Math.min(CANVAS_W - 18, ship.x))

      engine.bullets.forEach((b) => (b.y -= 8))
      engine.bullets = engine.bullets.filter((b) => b.y > -10)

      engine.spawnTimer++
      if (engine.spawnTimer > 40) {
        spawnRock()
        engine.spawnTimer = 0
      }

      engine.rocks.forEach((r) => {
        r.y += r.speed
        r.rot += r.spin
      })

      // Asteroids that slip past the defensive line cost points but keep falling.
      const lineY = CANVAS_H - LINE_OFFSET
      engine.rocks.forEach((r) => {
        if (!r.crossedLine && r.y >= lineY) {
          r.crossedLine = true
          engine.missedCount++
          engine.hiddenScore += POINTS_PER_MISS
          engine.segment.missed++
          engine.segment.score += POINTS_PER_MISS
        }
      })

      // Bullet vs rock.
      for (let i = engine.rocks.length - 1; i >= 0; i--) {
        const r = engine.rocks[i]
        for (let j = engine.bullets.length - 1; j >= 0; j--) {
          const b = engine.bullets[j]
          const dx = b.x - r.x
          const dy = b.y - r.y
          if (Math.sqrt(dx * dx + dy * dy) < r.size * 0.6) {
            engine.rocks.splice(i, 1)
            engine.bullets.splice(j, 1)
            engine.destroyedCount++
            engine.hiddenScore += POINTS_PER_KILL
            engine.segment.destroyed++
            engine.segment.score += POINTS_PER_KILL
            setDestroyedCount(engine.destroyedCount)
            break
          }
        }
      }

      // Rock vs ship — this is the only thing that ends the game.
      for (const r of engine.rocks) {
        const dx = r.x - ship.x
        const dy = r.y - ship.y
        if (Math.sqrt(dx * dx + dy * dy) < r.size * 0.6 + 10 && r.y > 0) {
          endGame('collision')
          return
        }
      }

      engine.rocks = engine.rocks.filter((r) => r.y < CANVAS_H + 40)
    }

    function draw() {
      const theme = activeThemeRef.current

      ctx.fillStyle = theme.background
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      const lineY = CANVAS_H - LINE_OFFSET
      ctx.save()
      ctx.strokeStyle = theme.line
      ctx.lineWidth = 2
      ctx.setLineDash([8, 8])
      ctx.beginPath()
      ctx.moveTo(0, lineY)
      ctx.lineTo(CANVAS_W, lineY)
      ctx.stroke()
      ctx.restore()

      const ship = engine.ship
      ctx.save()
      ctx.translate(ship.x, ship.y)
      ctx.beginPath()
      ctx.moveTo(0, -14)
      ctx.lineTo(12, 12)
      ctx.lineTo(-12, 12)
      ctx.closePath()
      ctx.fillStyle = theme.ship
      ctx.fill()
      ctx.restore()

      ctx.fillStyle = theme.bullet
      engine.bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 8, 4, 8))

      engine.rocks.forEach((r) => {
        ctx.save()
        ctx.translate(r.x, r.y)
        ctx.rotate(r.rot)
        ctx.strokeStyle = theme.meteor
        ctx.lineWidth = 2
        ctx.beginPath()
        const sides = 6
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2
          const rad = r.size * (0.8 + Math.random() * 0.05)
          const x = Math.cos(a) * rad
          const y = Math.sin(a) * rad
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      })
    }

    function loop() {
      update()
      if (!engineRef.current?.running) return
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    draw()
    rafRef.current = requestAnimationFrame(loop)

    shootRef.current = function shoot() {
      if (!engine.running) return
      engine.bullets.push({ x: engine.ship.x, y: engine.ship.y - 14 })
    }

    function handleKeyDown(e) {
      engine.keys[e.key] = true
      if (e.key === ' ') {
        e.preventDefault()
        shootRef.current()
      }
    }
    function handleKeyUp(e) {
      engine.keys[e.key] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Rotate through every theme on a fixed timer so exposure time per theme
    // is comparable across sessions — that's what makes the recorded
    // destroy-rate per theme usable for ANOVA later.
    rotationTimerRef.current = setInterval(() => {
      const current = engineRef.current
      if (!current?.running) return
      finalizeSegment(current, performance.now())
      const order = themeOrderRef.current
      const currentIndex = order.findIndex((t) => t.id === current.segment.theme)
      const nextTheme = order[(currentIndex + 1) % order.length]
      activeThemeRef.current = nextTheme
      current.segment = {
        theme: nextTheme.id,
        order: current.segments.length,
        startedAt: performance.now(),
        destroyed: 0,
        missed: 0,
        score: 0,
      }
      setActiveTheme(nextTheme)
    }, ROTATION_MS)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [phase])

  function handleClaim(e) {
    e.preventDefault()
    const tier = getDiscountTier(finalStats.destroyedCount)
    const code = generateDiscountCode(tier.percent)
    submitRegistration({
      session_id: sessionIdRef.current,
      email: form.email,
      commerce_type: form.commerceType,
      commerce_size: form.commerceSize,
      destroyed_count: finalStats.destroyedCount,
      discount_percent: tier.percent,
      discount_code: code,
    })
    setClaim({ percent: tier.percent, code })
  }

  const tier = finalStats ? getDiscountTier(finalStats.destroyedCount) : null

  return (
    <div className="mt-16">
      {phase === 'start' && (
        <div className="mx-auto max-w-md text-center">
          <MagnetButton onClick={startGame}>Jugar</MagnetButton>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ background: activeTheme.panel, borderColor: activeTheme.border }} className="mx-auto max-w-3xl rounded-2xl border p-4 sm:p-6">
          <div className="mb-4 font-mono text-sm" style={{ color: activeTheme.text }}>
            <span>
              Asteroides destruidos: <span style={{ color: activeTheme.ship }} className="font-semibold">{destroyedCount}</span>
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ border: `1px solid ${activeTheme.border}` }}
            className="w-full rounded-lg"
          />

          <p className="mt-3 text-center text-xs" style={{ color: activeTheme.mist }}>
            Flechas o A/D para moverte, espacio para disparar. En móvil, usa los botones.
          </p>

          <div className="mt-4 flex justify-center gap-3 sm:hidden">
            <button
              onPointerDown={() => engineRef.current && (engineRef.current.keys.ArrowLeft = true)}
              onPointerUp={() => engineRef.current && (engineRef.current.keys.ArrowLeft = false)}
              onPointerLeave={() => engineRef.current && (engineRef.current.keys.ArrowLeft = false)}
              style={{ borderColor: activeTheme.border, color: activeTheme.text }}
              className="h-12 w-16 rounded-lg border font-mono"
            >
              ◀
            </button>
            <button
              onClick={() => shootRef.current()}
              style={{ borderColor: activeTheme.ship, color: activeTheme.ship }}
              className="h-12 w-16 rounded-lg border font-mono"
            >
              ●
            </button>
            <button
              onPointerDown={() => engineRef.current && (engineRef.current.keys.ArrowRight = true)}
              onPointerUp={() => engineRef.current && (engineRef.current.keys.ArrowRight = false)}
              onPointerLeave={() => engineRef.current && (engineRef.current.keys.ArrowRight = false)}
              style={{ borderColor: activeTheme.border, color: activeTheme.text }}
              className="h-12 w-16 rounded-lg border font-mono"
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {phase === 'game-over' && finalStats && (
        <div className="mx-auto max-w-md text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--c-plasma)]">Colisión detectada</p>
          <h3 className="mt-4 font-display text-3xl font-bold tracking-tight">Asteroides destruidos: {finalStats.destroyedCount}</h3>
          <p className="mt-3 text-[var(--c-mist)]">
            {tier.percent > 0
              ? `Alcanzaste un ${tier.percent}% de descuento por 1 año.`
              : 'Sigue practicando para desbloquear un descuento.'}
          </p>

          {!claim && !showForm && (
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {tier.percent > 0 && <MagnetButton onClick={() => setShowForm(true)}>Reclama tu descuento</MagnetButton>}
              <MagnetButton variant="secondary" onClick={() => setPhase('start')}>
                Jugar de nuevo
              </MagnetButton>
            </div>
          )}

          {showForm && !claim && (
            <form onSubmit={handleClaim} className="glass-panel mt-8 space-y-4 rounded-2xl p-6 text-left">
              <Field label="Correo" required hint="Aquí te avisaremos cuando puedas usar el descuento.">
                <TextInput
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="tucorreo@empresa.com"
                />
              </Field>
              <Field label="Tipo de comercio" required>
                <SelectField
                  options={SECTORS}
                  required
                  value={form.commerceType}
                  onChange={(e) => setForm((f) => ({ ...f, commerceType: e.target.value }))}
                />
              </Field>
              <Field label="Tamaño de tu negocio" required>
                <SelectField
                  options={COMPANY_SIZES}
                  required
                  value={form.commerceSize}
                  onChange={(e) => setForm((f) => ({ ...f, commerceSize: e.target.value }))}
                />
              </Field>
              <button type="submit" className="btn-solar w-full rounded-full px-6 py-3 font-semibold transition-colors">
                Confirmar descuento
              </button>
            </form>
          )}

          {claim && (
            <div className="glass-panel mt-8 rounded-2xl p-6">
              <p className="font-display text-2xl font-bold text-[var(--c-solar)]">{claim.code}</p>
              <p className="mt-2 text-sm text-[var(--c-mist)]">
                Guarda este código — tu {claim.percent}% de descuento queda reservado por 1 año a nombre de{' '}
                <span className="text-[var(--c-stardust)]">{form.email}</span>.
              </p>
              <button
                type="button"
                onClick={() => setPhase('start')}
                className="mt-6 font-mono text-xs uppercase tracking-widest text-[var(--c-mist)] transition-colors hover:text-[var(--c-stardust)]"
              >
                Jugar de nuevo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
