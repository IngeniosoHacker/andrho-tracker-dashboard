import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import BoardingIllustration from './components/ui/BoardingIllustration.jsx'
import SurveyArt from './components/waitlist/SurveyArt.jsx'
import QuestionControls from './components/waitlist/QuestionControls.jsx'
import { AlertIcon, SpinnerIcon } from './components/ui/icons.jsx'
import { INITIAL_ANSWERS, STEPS, SUGGESTED_MODULE_LABELS, activeSteps, buildSubmission, joinWaitlist } from './lib/waitlist.js'
import { getDiscountTier, generateDiscountCode } from './lib/discountTiers.js'
import { submitRegistration } from './lib/gameStorage.js'
import { prefersReducedMotion } from './lib/motion.js'

// Coming from the landing's game (Juego.jsx) the URL carries the result:
// ?descuento=10&destruidos=23&partida=<game session id>. The percent is
// re-derived from the destroyed count so a hand-edited link can't claim a
// tier it didn't reach.
function readGameClaim() {
  const params = new URLSearchParams(window.location.search)
  const destroyed = Number.parseInt(params.get('destruidos'), 10)
  const sessionId = params.get('partida')
  if (!sessionId || !Number.isFinite(destroyed)) return null
  const tier = getDiscountTier(destroyed)
  if (tier.percent <= 0 || String(tier.percent) !== params.get('descuento')) return null
  return { sessionId, destroyed, percent: tier.percent }
}

// Half-finished surveys survive a reload (this browser only).
const DRAFT_KEY = 'andrho_waitlist_draft'

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY))
    if (!draft?.answers) return null
    const answers = { ...INITIAL_ANSWERS, ...draft.answers }
    const known = activeSteps(answers).some((s) => s.id === draft.stepId)
    return { answers, stepId: known ? draft.stepId : STEPS[0].id }
  } catch {
    return null
  }
}

function saveDraft(value) {
  try {
    if (value) localStorage.setItem(DRAFT_KEY, JSON.stringify(value))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Storage blocked (private mode…): the survey just won't resume.
  }
}

const OUT_MS = 420
const MESSAGE_MS = 1700

// The big message between two cards (see `verdict` on each step).
function Verdict({ verdict, onSkip }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Continuar"
      className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center px-6"
    >
      <p
        key={verdict.key}
        className={`verdict verdict-${verdict.tone} max-w-5xl text-center font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-8xl`}
      >
        {verdict.text}
      </p>
    </button>
  )
}

const CARD =
  'absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]'

function DoneCard({ done, className }) {
  const { submission, code } = done
  const firstName = submission.name.split(/\s+/)[0]
  return (
    <article aria-labelledby="done-title" className={`${CARD} ${className}`}>
      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[0.95fr_1.05fr] md:grid-rows-1">
        <div className="flex items-center justify-center bg-white/45 p-4 md:p-10">
          <BoardingIllustration className="h-[16svh] w-auto md:h-auto md:max-h-[60svh] md:w-full" />
        </div>
        <div className="flex min-h-0 overflow-y-auto p-6 sm:p-10 lg:p-14">
          <div className="my-auto w-full">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Lista de espera · confirmado</p>
            <h1 id="done-title" tabIndex={-1} className="mt-3 text-4xl font-extrabold leading-[1] tracking-[-0.04em] outline-none sm:text-5xl lg:text-6xl">
              ¡Estás a bordo, <span className="text-[var(--window-teal)]">{firstName}</span>!
            </h1>
            <p className="mt-4 text-lg leading-snug">
              Te escribiremos a <strong>{submission.email}</strong> antes del despegue. Con lo que nos contaste, esta es la
              nave que armaríamos para {submission.company}:
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {submission.suggestedModules.map((m) => (
                <li key={m} className="flex items-start gap-2.5 rounded-xl bg-white/70 px-3.5 py-2.5 text-sm font-medium">
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--window-teal)] text-white">
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  </span>
                  {SUGGESTED_MODULE_LABELS[m]}
                </li>
              ))}
            </ul>
            {code && (
              <div className="mt-6 rounded-xl border border-[var(--window-teal)]/40 bg-white/70 px-4 py-3">
                <p className="font-mono text-xl font-bold">{code}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">Guarda este código: es tu descuento del juego.</p>
              </div>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/" className="btn-solid">
                Volver al inicio
              </a>
              <a href="/#juego" className="btn-outline">
                Jugar mientras despegamos
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function WaitlistPage() {
  const [claim] = useState(readGameClaim)
  const [draft] = useState(loadDraft)
  const [answers, setAnswers] = useState(draft?.answers ?? INITIAL_ANSWERS)
  const [stepId, setStepId] = useState(draft?.stepId ?? STEPS[0].id)
  // phase: 'in' (card arriving / shown) → 'out' (leaving) → 'message' → 'in'
  const [motion, setMotion] = useState({ phase: 'in', dir: 1 })
  const [verdict, setVerdict] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const timers = useRef([])
  const pending = useRef(null)
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  const steps = activeSteps(answers)
  const index = Math.max(0, steps.findIndex((s) => s.id === stepId))
  const step = steps[index]
  const isLast = index === steps.length - 1
  const valid = step.valid(answers)
  const busy = motion.phase === 'out' || motion.phase === 'message' || submitting

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!done) saveDraft({ answers, stepId })
  }, [answers, stepId, done])

  // Move focus to the new question so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
  }, [stepId, done])

  function later(ms, fn) {
    timers.current.push(setTimeout(fn, ms))
  }

  function arrive() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const next = pending.current
    pending.current = null
    if (!next) return
    setVerdict(null)
    next.apply()
    setMotion({ phase: 'in', dir: next.dir })
  }

  // Slide the current card out, show `message` (if any), slide the next in.
  function transition(dir, apply, message) {
    const reduced = prefersReducedMotion()
    pending.current = { dir, apply }
    setMotion({ phase: 'out', dir })
    later(reduced ? 0 : OUT_MS, () => {
      if (!message) return arrive()
      setVerdict({ ...message, key: Date.now() })
      setMotion({ phase: 'message', dir })
      later(MESSAGE_MS, arrive)
    })
  }

  async function submit() {
    setError('')
    setSubmitting(true)
    const submission = buildSubmission(answers)
    try {
      await joinWaitlist(submission)
    } catch (err) {
      setError(err.message || 'No se pudo completar tu registro. Intenta de nuevo.')
      setSubmitting(false)
      return
    }
    let code = null
    if (claim) {
      code = generateDiscountCode(claim.percent)
      submitRegistration({
        session_id: claim.sessionId,
        email: submission.email,
        commerce_type: submission.sectors.join(','),
        commerce_size: submission.companySize,
        destroyed_count: claim.destroyed,
        discount_percent: claim.percent,
        discount_code: code,
      })
    }
    saveDraft(null)
    setSubmitting(false)
    transition(1, () => setDone({ submission, code }), { tone: 'good', text: 'Bienvenido a bordo.' })
  }

  function next() {
    if (busy || !valid) return
    if (isLast) return submit()
    const nextId = steps[index + 1].id
    transition(1, () => setStepId(nextId), step.verdict?.(answers))
  }

  function back() {
    if (busy || index === 0) return
    const prevId = steps[index - 1].id
    transition(-1, () => setStepId(prevId))
  }

  const dirName = motion.dir > 0 ? 'next' : 'prev'
  const cardMotion = motion.phase === 'out' ? `card-out-${dirName}` : motion.phase === 'in' ? `card-in-${dirName}` : ''
  const title = typeof step.title === 'function' ? step.title(answers) : step.title
  const progress = done ? 100 : Math.round((index / steps.length) * 100)

  return (
    <div className="fixed inset-0 overflow-hidden">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />

      <main className="absolute inset-0 px-3 pb-[96px] pt-[124px] sm:px-6 md:pt-[96px]">
        <div className="relative mx-auto h-full max-w-[83rem]">
          {/* The rest of the deck, peeking out behind the current card;
              gone while a message is up so it reads over open space. */}
          {motion.phase !== 'message' && (
            <>
              <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rotate-[1.4deg] rounded-3xl border border-white/10 bg-[var(--window-bg)]/20" />
              <div aria-hidden="true" className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[0.6deg] rounded-3xl border border-white/10 bg-[var(--window-bg)]/40" />
            </>
          )}

          {motion.phase !== 'message' &&
            (done ? (
              <DoneCard key="done" done={done} className={cardMotion} />
            ) : (
              <article key={step.id} aria-labelledby="question-title" className={`${CARD} ${cardMotion}`}>
                <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[0.95fr_1.05fr] md:grid-rows-1">
                  <div className="flex items-center justify-center bg-white/45 p-4 md:p-10">
                    <SurveyArt scene={step.art} className="h-[16svh] w-auto md:h-auto md:max-h-[60svh] md:w-full" />
                  </div>
                  <div className="flex min-h-0 overflow-y-auto p-6 sm:p-10 lg:p-14">
                    <form
                      className="my-auto w-full"
                      noValidate
                      onSubmit={(e) => {
                        e.preventDefault()
                        next()
                      }}
                    >
                      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
                        {step.group} · {index + 1} de {steps.length}
                      </p>
                      {claim && (index === 0 || isLast) && (
                        <p className="mt-4 rounded-xl border border-[var(--window-teal)]/40 bg-white/60 px-4 py-3 text-sm">
                          Vienes del juego: al terminar reservamos tu{' '}
                          <strong className="text-[var(--window-teal)]">{claim.percent}% de descuento por 1 año</strong>.
                        </p>
                      )}
                      <h1
                        id="question-title"
                        ref={headingRef}
                        tabIndex={-1}
                        className="mt-3 text-3xl font-extrabold leading-[1.02] tracking-[-0.04em] outline-none sm:text-4xl lg:text-5xl"
                      >
                        {title}
                      </h1>
                      {step.hint && <p className="mt-3 text-[var(--color-ink-soft)]">{step.hint}</p>}
                      <div className="mt-7">
                        <QuestionControls step={step} answers={answers} setAnswers={setAnswers} onSubmitKey={next} labelledBy="question-title" />
                      </div>
                      {error && (
                        <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/5 px-4 py-3 text-sm text-[var(--violet-deep)]">
                          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </article>
            ))}

          {verdict && motion.phase === 'message' && <Verdict verdict={verdict} onSkip={arrive} />}
          <p className="sr-only" aria-live="polite">
            {verdict?.text ?? ''}
          </p>
        </div>
      </main>

      {/* Back / continue, pinned to the bottom of the screen. */}
      {!done && (
        <nav aria-label="Navegación del formulario" className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-6">
          <div className="mx-auto max-w-[83rem] overflow-hidden rounded-2xl border border-black/10 bg-white/92 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <div className="h-1 bg-[var(--window-line)]">
              <div className="h-full bg-[var(--window-teal)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
              <button type="button" onClick={back} disabled={index === 0 || busy} className="btn-outline !h-11 disabled:cursor-not-allowed disabled:opacity-35">
                Regresar
              </button>
              <p className="hidden font-mono text-xs uppercase tracking-widest text-[var(--color-muted)] sm:block">
                {progress}% del abordaje
              </p>
              <button
                type="button"
                onClick={next}
                disabled={!valid || busy}
                className="btn-solid !h-11 gap-2 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {submitting && <SpinnerIcon className="h-4 w-4 animate-spin" />}
                {isLast ? (submitting ? 'Abordando…' : 'Abordar la nave') : step.optional && !step.get(answers) ? 'Omitir' : 'Continuar'}
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WaitlistPage />
  </StrictMode>,
)
