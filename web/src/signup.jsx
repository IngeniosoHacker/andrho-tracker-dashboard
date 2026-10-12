import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import SurveyArt from './components/waitlist/SurveyArt.jsx'
import QuestionControls from './components/waitlist/QuestionControls.jsx'
import { CARD, DeckNav, DeckStack, Verdict } from './components/waitlist/Deck.jsx'
import Field from './components/ui/form/Field.jsx'
import { TextInput, PasswordInput } from './components/ui/form/inputs.jsx'
import { AlertIcon, BuildingIcon, LockIcon, MailIcon, SpinnerIcon } from './components/ui/icons.jsx'
import { storeTokens, TOKEN_KEYS } from './lib/authApi.js'
import { resolveStep } from './lib/waitlist.js'
import { useDeck } from './lib/useDeck.js'
import {
  INITIAL_ANSWERS,
  JOB_LABELS,
  JOB_STATUS,
  analyzeAnswers,
  analyzeDescription,
  defaultModules,
  loadDraft,
  questionSteps,
  readLogo,
  register,
  saveDraft,
} from './lib/signup.js'
import { buildSubmission } from './lib/waitlist.js'

// signup.html — see lib/signup.js for the flow.

const API_URL = (import.meta.env.VITE_ANDRHO_API_URL || '').replace(/\/+$/, '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

// A big selectable option (setup path, brand choice).
function Choice({ selected, onClick, title, body, badge }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-colors ${
        selected ? 'border-[var(--window-teal)] bg-white shadow-[0_0_0_2px_var(--window-teal)]' : 'border-[var(--window-line)] bg-white/70 hover:bg-white'
      }`}
    >
      <span>
        <span className="flex flex-wrap items-center gap-2 text-lg font-bold">
          {title}
          {badge && <span className="rounded-full bg-[var(--window-teal)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">{badge}</span>}
        </span>
        <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">{body}</span>
      </span>
      <span
        aria-hidden="true"
        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-[var(--window-teal)] bg-[var(--window-teal)] text-white' : 'border-[var(--window-line)] bg-white'
        }`}
      >
        {selected && <Check />}
      </span>
    </button>
  )
}

// One of the three packages. Galáctico is dark, larger and labelled; the
// smaller ones list, crossed out, what stays behind.
function PackageCard({ pkg, selected, onSelect }) {
  const hero = pkg.recommended
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex h-full flex-col rounded-3xl border p-5 text-left transition-all sm:p-6 ${
        hero
          ? 'border-[var(--window-teal)] bg-[var(--color-ink)] text-white shadow-[0_30px_80px_-30px_rgba(0,230,184,0.55)] lg:-my-3 lg:py-9'
          : 'border-[var(--window-line)] bg-white/75 hover:bg-white'
      } ${selected ? 'ring-4 ring-[var(--window-teal)]/60' : ''}`}
    >
      {hero && (
        <span className="absolute -top-3 left-5 rounded-full bg-[var(--mint)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black">
          Recomendado
        </span>
      )}
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-display text-2xl font-bold tracking-tight">{pkg.name}</span>
        <span className={`font-mono text-[11px] uppercase tracking-wider ${hero ? 'text-[var(--mint)]' : 'text-[var(--color-muted)]'}`}>Gratis en beta</span>
      </span>
      <span className={`mt-1 text-sm ${hero ? 'text-white/70' : 'text-[var(--color-ink-soft)]'}`}>{pkg.tagline}</span>

      <span className="mt-4 space-y-1.5 text-sm">
        {pkg.core.map((c) => (
          <span key={c} className="flex items-start gap-2">
            <span className={`mt-0.5 ${hero ? 'text-[var(--mint)]' : 'text-[var(--window-teal)]'}`}>
              <Check />
            </span>
            {c}
          </span>
        ))}
      </span>

      <span className={`mt-4 border-t pt-3 font-mono text-[11px] uppercase tracking-wider ${hero ? 'border-white/15 text-white/60' : 'border-[var(--window-line)] text-[var(--color-muted)]'}`}>
        Para tu negocio · {pkg.modules.length} {pkg.modules.length === 1 ? 'módulo' : 'módulos'}
      </span>
      <span className="mt-2 flex flex-wrap gap-1.5">
        {pkg.modules.map((m) => (
          <span key={m.key} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${hero ? 'bg-white/10' : 'bg-[var(--window-teal)]/12 text-[var(--color-ink)]'}`}>
            {m.name}
          </span>
        ))}
        {pkg.missing.map((m) => (
          <span key={m.key} className="rounded-full bg-[var(--violet)]/8 px-2.5 py-1 text-xs text-[var(--violet-deep)] line-through decoration-1">
            {m.name}
          </span>
        ))}
      </span>
      <span className={`mt-auto pt-4 text-sm font-semibold ${hero ? 'text-[var(--mint)]' : pkg.missing.length ? 'text-[var(--violet-deep)]' : 'text-[var(--color-ink)]'}`}>
        {pkg.pitch}
      </span>
    </button>
  )
}

function SignupPage() {
  const [draft] = useState(loadDraft)
  const [path, setPath] = useState(draft?.path ?? '')
  const [screen, setScreen] = useState(draft?.screen ?? 'choose')
  const [answers, setAnswers] = useState({ ...INITIAL_ANSWERS, ...(draft?.answers ?? {}) })
  const [description, setDescription] = useState(draft?.description ?? '')
  const [analysis, setAnalysis] = useState(null) // { key, data, summary }
  const [plan, setPlan] = useState(draft?.plan ?? 'galactico')
  const [modules, setModules] = useState(draft?.modules ?? null)
  const [brand, setBrand] = useState(draft?.brand ?? { choice: '', essence: '' })
  const [logo, setLogo] = useState('')
  const [account, setAccount] = useState({ name: '', company: '', email: '', phone: '', ...(draft?.account ?? {}), password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const { verdict, transition, arrive, cardMotion, moving, showingMessage } = useDeck()
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  const qSteps = questionSteps(answers)
  const flow = ['choose', ...(path === 'personalizada' ? qSteps.map((s) => `q:${s.id}`) : ['quick']), 'packages', 'brand', 'account']
  const index = Math.max(0, flow.indexOf(screen))
  const step = screen.startsWith('q:') ? resolveStep(qSteps.find((s) => `q:${s.id}` === screen) ?? qSteps[0], answers, {}) : null
  const pkgs = analysis?.data?.packages ?? []
  const pkg = pkgs.find((p) => p.key === plan)
  const limit = pkg?.module_limit ?? -1
  const chosen = modules ?? (pkg ? defaultModules(pkg) : [])
  const needsWhatsApp = chosen.includes('whatsapp')

  useEffect(() => {
    if (!done) saveDraft({ path, screen, answers, description, plan, modules, brand: { choice: brand.choice, essence: brand.essence }, account: { ...account, password: '' } })
  }, [path, screen, answers, description, plan, modules, brand, account, done])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
  }, [screen, done])

  // A reload on the packages card (or later) needs the analysis again.
  useEffect(() => {
    if (!analysis && index >= flow.indexOf('packages') && path) runAnalysis().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const valid = (() => {
    if (screen === 'choose') return path !== ''
    if (step) return step.valid(answers)
    if (screen === 'packages') return !!pkg && chosen.length > 0
    if (screen === 'brand') return brand.choice !== 'tengo' || brand.essence.trim().length > 0 || !!logo
    if (screen === 'account')
      return (
        account.name.trim() &&
        account.company.trim() &&
        EMAIL_RE.test(account.email.trim()) &&
        account.password.length >= 8 &&
        (!needsWhatsApp || account.phone.replace(/\D/g, '').length >= 8)
      )
    return true
  })()

  async function runAnalysis() {
    const key = path === 'rapida' ? `d:${description.trim()}` : `a:${JSON.stringify(buildSubmission(answers))}`
    if (analysis?.key === key) return analysis
    const res =
      path === 'rapida'
        ? await analyzeDescription(description)
        : { analysis: await analyzeAnswers(answers), description: null }
    const next = { key, data: res.analysis, summary: res.description?.summary ?? '' }
    setAnalysis(next)
    // New analysis, new defaults for the package's modules.
    setModules(null)
    return next
  }

  function go(dir, target, message) {
    setError('')
    transition(dir, () => setScreen(target), message)
  }

  async function next() {
    if (moving || busy || !valid) return
    const target = flow[index + 1]
    if (screen === 'account') return submit()
    if (target === 'packages') {
      setBusy(true)
      try {
        await runAnalysis()
      } catch (err) {
        setError(err.message || 'No pudimos analizar tu negocio. Intenta de nuevo.')
        setBusy(false)
        return
      }
      setBusy(false)
      return go(1, target, { tone: 'neutral', text: 'Ya sabemos qué necesita tu negocio.' })
    }
    let message = step?.verdict?.(answers, {})
    if (screen === 'choose') message = { tone: 'neutral', text: path === 'rapida' ? 'Cuéntanos. Nosotros armamos la nave.' : 'Pieza por pieza, a tu medida.' }
    if (screen === 'packages')
      message = plan === 'galactico' ? { tone: 'good', text: 'Tus hijos te lo agradecerán.' } : { tone: 'warn', text: 'El dinosaurio también creyó que tenía tiempo.' }
    if (screen === 'brand' && brand.choice) message = { tone: 'good', text: brand.choice === 'ayuda' ? 'Te la diseñamos.' : 'Una marca clara vende sola.' }
    go(1, target, message)
  }

  function back() {
    if (moving || busy || index === 0) return
    go(-1, flow[index - 1])
  }

  function pickPlan(key) {
    setPlan(key)
    setModules(null)
  }

  function toggleModule(key) {
    const list = chosen.includes(key) ? chosen.filter((k) => k !== key) : limit >= 0 && chosen.length >= limit ? chosen : [...chosen, key]
    setModules(list)
  }

  async function onLogo(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      setLogo(await readLogo(file))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const res = await register({
        email: account.email.trim(),
        password: account.password,
        company_name: account.company.trim(),
        display_name: account.name.trim(),
        setup: path,
        plan,
        modules: chosen,
        answers: path === 'personalizada' ? buildSubmission(answers) : null,
        description: path === 'rapida' ? description.trim() : '',
        phone: account.phone.trim(),
        brand: brand.choice === 'omitir' ? {} : { essence: brand.essence.trim(), help: brand.choice === 'ayuda', logo: brand.choice === 'tengo' ? logo : '' },
      })
      storeTokens(res)
      saveDraft(null)
      setBusy(false)
      transition(1, () => setDone(res), { tone: 'good', text: 'Bienvenido a bordo.' })
    } catch (err) {
      setBusy(false)
      setError(err.status === 409 ? 'Ya existe una cuenta con ese correo.' : err.message || 'No pudimos crear tu cuenta.')
    }
  }

  const progress = done ? 100 : Math.round((index / flow.length) * 100)
  const wide = screen === 'packages' && !done

  return (
    <div className="fixed inset-0 overflow-hidden">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="absolute inset-0 px-3 pb-[96px] pt-[124px] sm:px-6 md:pt-[96px]">
        <div className="relative mx-auto h-full max-w-[83rem]">
          {!showingMessage && <DeckStack />}
          {!showingMessage &&
            (done ? (
              <DoneCard done={done} name={account.name} className={cardMotion} />
            ) : (
              <article key={screen} aria-labelledby="signup-title" className={`${CARD} ${cardMotion}`}>
                <div className={`grid min-h-0 flex-1 ${wide ? '' : 'grid-rows-[auto_1fr] md:grid-cols-[0.95fr_1.05fr] md:grid-rows-1'}`}>
                  {!wide && (
                    <div className="flex items-center justify-center bg-white/45 p-4 md:p-10">
                      <SurveyArt scene={art(screen, step)} className="h-[16svh] w-auto md:h-auto md:max-h-[60svh] md:w-full" />
                    </div>
                  )}
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
                        {group(screen, step)} · {index + 1} de {flow.length}
                      </p>
                      <Body
                        screen={screen}
                        step={step}
                        headingRef={headingRef}
                        state={{ path, setPath, answers, setAnswers, description, setDescription, analysis, pkgs, plan, pickPlan, chosen, limit, toggleModule, brand, setBrand, logo, setLogo, onLogo, account, setAccount, needsWhatsApp }}
                        onSubmitKey={next}
                      />
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
      {!done && (
        <DeckNav
          progress={progress}
          label={`${progress}% de tu nave`}
          onBack={back}
          backDisabled={index === 0 || moving || busy}
          onNext={next}
          nextDisabled={!valid || moving || busy}
          loading={busy}
          nextLabel={
            screen === 'account'
              ? busy
                ? 'Creando tu cuenta…'
                : 'Despegar'
              : screen === 'brand' && !brand.choice
                ? 'Omitir'
                : busy
                  ? 'Analizando…'
                  : step?.optional && !step.get(answers)
                    ? 'Omitir'
                    : 'Continuar'
          }
        />
      )}
    </div>
  )
}

function art(screen, step) {
  if (step) return step.art
  return { choose: 'scan', quick: 'paper', brand: 'beacon', account: 'boarding' }[screen] ?? 'orbit'
}

function group(screen, step) {
  if (step) return step.group
  return { choose: 'Crear cuenta', quick: 'Tu negocio', packages: 'Tu paquete', brand: 'Tu marca', account: 'Abordaje' }[screen] ?? ''
}

const H1 = 'mt-3 text-3xl font-extrabold leading-[1.02] tracking-[-0.04em] outline-none sm:text-4xl lg:text-5xl'
const TEXTAREA =
  'min-h-36 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-faint)] focus:border-[var(--blue)] focus-visible:outline-none'

function Body({ screen, step, headingRef, state: s, onSubmitKey }) {
  const title = (text) => (
    <h1 id="signup-title" ref={headingRef} tabIndex={-1} className={H1}>
      {text}
    </h1>
  )

  if (step)
    return (
      <>
        {title(step.title)}
        {step.hint && <p className="mt-3 text-[var(--color-ink-soft)]">{step.hint}</p>}
        <div className="mt-7">
          <QuestionControls step={step} answers={s.answers} setAnswers={s.setAnswers} onSubmitKey={onSubmitKey} labelledBy="signup-title" />
        </div>
      </>
    )

  if (screen === 'choose')
    return (
      <>
        {title('¿Cómo quieres armar tu AndRho?')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Por ahora todo es gratis. Puedes cambiar cualquier cosa después.</p>
        <div role="radiogroup" aria-labelledby="signup-title" className="mt-7 grid gap-3">
          <Choice
            selected={s.path === 'rapida'}
            onClick={() => s.setPath('rapida')}
            title="Configuración rápida"
            body="Cuéntanos de tu negocio en un párrafo y AndRho elige los módulos por ti."
          />
          <Choice
            selected={s.path === 'personalizada'}
            onClick={() => s.setPath('personalizada')}
            title="Personalizada"
            badge="más precisa"
            body="Unas preguntas sobre tu operación y tú decides cada módulo."
          />
        </div>
      </>
    )

  if (screen === 'quick')
    return (
      <>
        {title('Cuéntanos de tu negocio')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Qué vendes, cómo lo vendes, con qué te organizas hoy y qué te quita el sueño. Si prefieres, déjalo en blanco.</p>
        <textarea
          aria-labelledby="signup-title"
          className={`${TEXTAREA} mt-7`}
          value={s.description}
          maxLength={2000}
          onChange={(e) => s.setDescription(e.target.value)}
          placeholder="Ej.: Tengo un restaurante con 8 empleados. Llevo todo en Excel, vendemos por WhatsApp e Instagram y se me vencen los ingredientes."
        />
        <p className="mt-2 text-right font-mono text-xs text-[var(--color-muted)]">{s.description.length}/2000</p>
      </>
    )

  if (screen === 'packages') {
    const best = s.analysis?.data
    return (
      <>
        {title('Tu nave, en tres tamaños')}
        <p className="mt-3 max-w-3xl text-[var(--color-ink-soft)]">
          {s.analysis?.summary ? `${s.analysis.summary} ` : ''}
          {best?.reasons?.length ? `Por lo que nos contaste: ${best.reasons.join(' ')}` : 'Elige con cuánto despega tu negocio.'}
        </p>
        <div role="radiogroup" aria-label="Paquetes" className="mt-7 grid gap-4 lg:grid-cols-3 lg:items-stretch">
          {s.pkgs.map((p) => (
            <PackageCard key={p.key} pkg={p} selected={s.plan === p.key} onSelect={() => s.pickPlan(p.key)} />
          ))}
        </div>
        {s.pkgs.length > 0 && (
          <fieldset className="mt-8">
            <legend className="font-display text-xl font-bold">Los módulos de tu paquete</legend>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Quita lo que no quieras{s.limit >= 0 ? ` (hasta ${s.limit} en este paquete)` : ''}. {s.chosen.length} elegidos.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(best?.needs ?? []).map((m) => {
                const on = s.chosen.includes(m.key)
                const full = !on && s.limit >= 0 && s.chosen.length >= s.limit
                return (
                  <button
                    type="button"
                    key={m.key}
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => s.toggleModule(m.key)}
                    className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      on ? 'border-[var(--window-teal)] bg-white' : 'border-[var(--window-line)] bg-white/60 hover:bg-white'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                        on ? 'border-[var(--window-teal)] bg-[var(--window-teal)] text-white' : 'border-[var(--window-line)]'
                      }`}
                    >
                      {on && <Check />}
                    </span>
                    <span>
                      <span className="block font-semibold">{m.name}</span>
                      <span className="text-[var(--color-muted)]">{full ? 'Disponible en un paquete mayor.' : m.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </>
    )
  }

  if (screen === 'brand') {
    const setChoice = (choice) => s.setBrand({ ...s.brand, choice })
    return (
      <>
        {title('Cuéntanos de tu marca')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Con esto, los Creators que hagan tu sitio y tus redes arrancan sabiendo quién eres.</p>
        <div role="radiogroup" aria-labelledby="signup-title" className="mt-6 grid gap-3">
          <Choice selected={s.brand.choice === 'tengo'} onClick={() => setChoice('tengo')} title="Ya tengo marca" body="Cuéntanos su esencia y sube tu logo." />
          <Choice
            selected={s.brand.choice === 'ayuda'}
            onClick={() => setChoice('ayuda')}
            title="No tengo, pero la quiero"
            body="AndRho te propone una a partir de lo que nos contaste."
          />
          <Choice selected={s.brand.choice === 'omitir'} onClick={() => setChoice('omitir')} title="Por ahora no" body="Lo vemos después." />
        </div>
        {(s.brand.choice === 'tengo' || s.brand.choice === 'ayuda') && (
          <div className="mt-6 space-y-4">
            <Field label={s.brand.choice === 'tengo' ? 'La esencia de tu marca' : 'Lo que te gustaría transmitir (opcional)'}>
              <textarea
                className={TEXTAREA}
                rows={3}
                maxLength={1000}
                value={s.brand.essence}
                onChange={(e) => s.setBrand({ ...s.brand, essence: e.target.value })}
                placeholder="Ej.: Pan de la abuela, cálido y de barrio. Colores tierra, nada de lujo."
              />
            </Field>
            {s.brand.choice === 'tengo' && (
              <div className="flex flex-wrap items-center gap-4">
                {s.logo && <img src={s.logo} alt="Tu logo" className="h-16 w-16 rounded-xl border border-[var(--window-line)] bg-white object-contain p-1" />}
                <label className="btn-outline !h-11 cursor-pointer">
                  {s.logo ? 'Cambiar logo' : 'Subir logo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={s.onLogo} />
                </label>
                {s.logo && (
                  <button type="button" className="text-sm font-semibold text-[var(--violet-deep)] hover:underline" onClick={() => s.setLogo('')}>
                    Quitar
                  </button>
                )}
                <span className="text-xs text-[var(--color-muted)]">PNG, JPG o WebP, hasta 1 MB.</span>
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  if (screen === 'account') {
    const set = (k) => (e) => s.setAccount({ ...s.account, [k]: e.target.value })
    return (
      <>
        {title('Tu pase de abordaje')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Con esto entras a tu panel. Nada de spam.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Tu nombre" required>
            <TextInput autoComplete="name" value={s.account.name} onChange={set('name')} placeholder="Ana López" maxLength={120} />
          </Field>
          <Field label="Empresa" required>
            <TextInput autoComplete="organization" icon={<BuildingIcon />} value={s.account.company} onChange={set('company')} placeholder="Panadería Doña Ana" maxLength={120} />
          </Field>
          <Field label="Correo" required>
            <TextInput type="email" autoComplete="email" icon={<MailIcon />} value={s.account.email} onChange={set('email')} placeholder="tucorreo@empresa.com" maxLength={200} />
          </Field>
          <Field label="Contraseña" required hint="Mínimo 8 caracteres.">
            <PasswordInput autoComplete="new-password" icon={<LockIcon />} value={s.account.password} onChange={set('password')} placeholder="••••••••" />
          </Field>
          <Field label="WhatsApp del negocio" required={s.needsWhatsApp} hint={s.needsWhatsApp ? 'Lo conectamos a AndRho.' : 'Opcional.'}>
            <TextInput type="tel" autoComplete="tel" value={s.account.phone} onChange={set('phone')} placeholder="+502 5555 5555" maxLength={40} />
          </Field>
        </div>
      </>
    )
  }
  return null
}

// The last card: welcome, and what AndRho is setting up (polls the jobs).
function DoneCard({ done, name, className }) {
  const [jobs, setJobs] = useState(done.provisioning ?? [])
  useEffect(() => {
    let n = 0
    const id = setInterval(async () => {
      if (++n > 10) return clearInterval(id)
      try {
        const res = await fetch(`${API_URL}/account/provisioning`, { headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEYS.access)}` } })
        if (res.ok) setJobs((await res.json()).jobs)
      } catch {
        // keep the last statuses
      }
    }, 3000)
    return () => clearInterval(id)
  }, [])
  const first = (name || '').trim().split(/\s+/)[0]
  return (
    <article aria-labelledby="done-title" className={`${CARD} ${className}`}>
      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[0.95fr_1.05fr] md:grid-rows-1">
        <div className="flex items-center justify-center bg-white/45 p-4 md:p-10">
          <SurveyArt scene="aboard" className="h-[16svh] w-auto md:h-auto md:max-h-[60svh] md:w-full" />
        </div>
        <div className="flex min-h-0 overflow-y-auto p-6 sm:p-10 lg:p-14">
          <div className="my-auto w-full">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Cuenta creada · {done.account.site_id}</p>
            <h1 id="done-title" tabIndex={-1} className="mt-3 text-4xl font-extrabold leading-[1] tracking-[-0.04em] outline-none sm:text-5xl lg:text-6xl">
              ¡Bienvenido a bordo{first ? ', ' : ''}
              <span className="text-[var(--window-teal)]">{first}</span>!
            </h1>
            <p className="mt-4 text-lg leading-snug">Tu panel ya está listo. Esto es lo que AndRho está preparando para {done.account.company_name}:</p>
            {jobs.length > 0 ? (
              <ul className="mt-6 grid gap-2">
                {jobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm">
                    <span>
                      <span className="block font-semibold">{JOB_LABELS[j.kind] ?? j.kind}</span>
                      <span className="text-[var(--color-muted)]">{j.detail}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-wider">
                      {['pendiente', 'en_proceso'].includes(j.status) && <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />}
                      {JOB_STATUS[j.status] ?? j.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[var(--color-muted)]">Tus módulos no necesitan instalar nada: entra y empieza.</p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/dashboard/" className="btn-solid">
                Ir a mi panel
              </a>
              <a href="/articulos/" className="btn-outline">
                Leer mientras despegamos
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SignupPage />
  </StrictMode>,
)
