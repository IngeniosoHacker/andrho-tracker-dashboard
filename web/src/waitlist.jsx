import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import SurveyArt from './components/waitlist/SurveyArt.jsx'
import QuestionControls from './components/waitlist/QuestionControls.jsx'
import { CARD, DeckNav, DeckStack, Verdict } from './components/waitlist/Deck.jsx'
import { AlertIcon } from './components/ui/icons.jsx'
import {
  INITIAL_ANSWERS,
  STEPS,
  SUGGESTED_MODULE_LABELS,
  activeSteps,
  buildSubmission,
  fetchRecommendation,
  joinWaitlist,
  resolveStep,
} from './lib/waitlist.js'
import { getDiscountTier, generateDiscountCode } from './lib/discountTiers.js'
import { submitRegistration } from './lib/gameStorage.js'
import { useDeck } from './lib/useDeck.js'

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

function DoneCard({ done, className }) {
  const { submission, code, modules } = done
  const firstName = submission.name.split(/\s+/)[0]
  return (
    <article aria-labelledby="done-title" className={`${CARD} ${className}`}>
      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[0.95fr_1.05fr] md:grid-rows-1">
        <div className="flex items-center justify-center bg-white/45 p-4 md:p-10">
          <SurveyArt scene="aboard" className="h-[16svh] w-auto md:h-auto md:max-h-[60svh] md:w-full" />
        </div>
        <div className="flex min-h-0 overflow-y-auto p-6 sm:p-10 lg:p-14">
          <div className="my-auto w-full">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Lista de espera · confirmado</p>
            <h1 id="done-title" tabIndex={-1} className="mt-3 text-4xl font-extrabold leading-[1] tracking-[-0.04em] outline-none sm:text-5xl lg:text-6xl">
              ¡Estás a bordo, <span className="text-[var(--window-teal)]">{firstName}</span>!
            </h1>
            <p className="mt-4 text-lg leading-snug">
              Te escribiremos a <strong>{submission.email}</strong> antes del despegue.
              {modules.length > 0 && ` Con lo que nos contaste, esta es la nave que armaríamos para ${submission.company}:`}
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {modules.map((m) => (
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
              <a href="/articulos/" className="btn-solid">
                Leer mientras despegamos
              </a>
              <a href="/" className="btn-outline">
                Volver al inicio
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
  const { verdict, transition, arrive, cardMotion, moving, showingMessage } = useDeck()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  // { key, data } — the API's plan match for the answers in `key`.
  const [recommendation, setRecommendation] = useState(null)

  const headingRef = useRef(null)
  const firstRender = useRef(true)

  const steps = activeSteps(answers)
  const index = Math.max(0, steps.findIndex((s) => s.id === stepId))
  const ctx = { recommendation: recommendation?.data ?? null }
  const step = resolveStep(steps[index], answers, ctx)
  const isLast = index === steps.length - 1
  const valid = step.valid(answers)
  const busy = moving || submitting

  // Ask the API for the matching plan when the plan question comes up (again
  // if the answers changed since). Without it the question still works, just
  // with no badge.
  const recommendationKey = step.id === 'planInterest' ? JSON.stringify({ ...answers, planInterest: '' }) : null
  useEffect(() => {
    if (!recommendationKey || recommendation?.key === recommendationKey) return
    let cancelled = false
    fetchRecommendation(answers)
      .then((data) => !cancelled && setRecommendation({ key: recommendationKey, data }))
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendationKey])

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

  async function submit() {
    setError('')
    setSubmitting(true)
    const submission = buildSubmission(answers)
    let modules = []
    try {
      const res = await joinWaitlist(submission)
      modules = (res?.recommendation?.suggestedModules ?? []).filter((m) => SUGGESTED_MODULE_LABELS[m])
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
    transition(1, () => setDone({ submission, code, modules }), { tone: 'good', text: 'Bienvenido a bordo.' })
  }

  function next() {
    if (busy || !valid) return
    if (isLast) return submit()
    const nextId = steps[index + 1].id
    transition(1, () => setStepId(nextId), step.verdict?.(answers, ctx))
  }

  function back() {
    if (busy || index === 0) return
    const prevId = steps[index - 1].id
    transition(-1, () => setStepId(prevId))
  }

  const title = step.title
  const progress = done ? 100 : Math.round((index / steps.length) * 100)

  return (
    <div className="fixed inset-0 overflow-hidden">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />

      <main className="absolute inset-0 px-3 pb-[96px] pt-[124px] sm:px-6 md:pt-[96px]">
        <div className="relative mx-auto h-full max-w-[83rem]">
          {/* The rest of the deck; gone while a message is up so it reads
              over open space. */}
          {!showingMessage && <DeckStack />}

          {!showingMessage &&
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

          {verdict && showingMessage && <Verdict verdict={verdict} onSkip={arrive} />}
          <p className="sr-only" aria-live="polite">
            {verdict?.text ?? ''}
          </p>
        </div>
      </main>

      {/* Back / continue, pinned to the bottom of the screen. */}
      {!done && (
        <DeckNav
          progress={progress}
          label={`${progress}% del abordaje`}
          onBack={back}
          backDisabled={index === 0 || busy}
          onNext={next}
          nextDisabled={!valid || busy}
          loading={submitting}
          nextLabel={isLast ? (submitting ? 'Abordando…' : 'Abordar la nave') : step.optional && !step.get(answers) ? 'Omitir' : 'Continuar'}
        />
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WaitlistPage />
  </StrictMode>,
)
