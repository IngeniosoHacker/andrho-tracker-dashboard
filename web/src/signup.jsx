import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import SurveyArt from './components/survey/SurveyArt.jsx'
import QuestionControls from './components/survey/QuestionControls.jsx'
import { CARD, DeckNav, DeckStack, Verdict } from './components/survey/Deck.jsx'
import Field from './components/ui/form/Field.jsx'
import { TextInput, PasswordInput } from './components/ui/form/inputs.jsx'
import { AlertIcon, BuildingIcon, LockIcon, MailIcon, SpinnerIcon } from './components/ui/icons.jsx'
import { storeTokens, TOKEN_KEYS } from './lib/authApi.js'
import { resolveStep } from './lib/survey.js'
import {
  DATA_ACCEPT,
  INITIAL_KIT,
  MAX_BRAND_IMAGES,
  MAX_DATA_FILES,
  MAX_PALETTE,
  checkData,
  checkImage,
  cleanPalette,
  describeData,
  fileSize,
  readPalette,
  uploadAsset,
} from './lib/kit.js'
import { useDeck } from './lib/useDeck.js'
import {
  INITIAL_ANSWERS,
  JOB_LABELS,
  JOB_STATUS,
  MIN_DESCRIPTION,
  applyDescription,
  defaultModules,
  describeBusiness,
  loadDraft,
  prefillAccount,
  prefillBrand,
  checkout,
  formatQ,
  normalizePlan,
  questionSteps,
  quotePlan,
  readLogo,
  saveDraft,
  suggestSetup,
} from './lib/signup.js'
import { buildSubmission } from './lib/survey.js'
import { generateDiscountCode, getDiscountTier } from './lib/discountTiers.js'
import { submitRegistration } from './lib/gameStorage.js'
import { markFormDone, recordVisit, trackerVisitorId } from './lib/visitor.js'

// signup.html — see lib/signup.js for the flow.

recordVisit()

// Coming from the landing's game (Juego.jsx) the URL carries the result:
// ?descuento=10&destruidos=23&partida=<game session id>. The percent is
// re-derived from the destroyed count so a hand-edited link can't claim a
// tier it didn't reach (andrho-api checks it again).
function readGameClaim() {
  const params = new URLSearchParams(window.location.search)
  const destroyed = Number.parseInt(params.get('destruidos'), 10)
  const sessionId = params.get('partida')
  if (!sessionId || !Number.isFinite(destroyed)) return null
  const tier = getDiscountTier(destroyed)
  if (tier.percent <= 0 || String(tier.percent) !== params.get('descuento')) return null
  return { sessionId, destroyed, percent: tier.percent }
}

const API_URL = (import.meta.env.VITE_ANDRHO_API_URL || '').replace(/\/+$/, '')

// The cards, in order. Both paths ask their questions, then the brand, and
// only then the suggestion (it needs all of it) and the boarding pass. The
// quick path skips the questions its paragraph already answered (`covered`).
// The custom (long) path asks for numbers instead of the size range (how
// many people, how many need AndRho) and, instead of the brand card, one
// card each for the logo, the colors and the data (lib/kit.js).
function buildFlow(path, answers, covered) {
  const steps = questionSteps(answers).filter((s) => path === 'personalizada' || !covered.includes(s.id))
  if (path === 'personalizada') {
    const questions = steps.flatMap((s) => (s.id === 'companySize' ? ['people', 'access'] : [`q:${s.id}`]))
    return ['choose', ...questions, 'logo', 'colors', 'data', 'packages', 'extras', 'account']
  }
  return ['choose', ...(path === 'rapida' ? ['quick'] : []), ...steps.map((s) => `q:${s.id}`), 'brand', 'packages', 'extras', 'account']
}

// The survey's size range for a head count (andrho-api brand.CompanySize).
const sizeOf = (n) => (n <= 1 ? 'solo' : n <= 10 ? '1-10' : n <= 50 ? '11-50' : n <= 200 ? '51-200' : '200+')

// What the brand card would have said, for the suggestion's prompt.
const brandChoice = (kit) => (kit.logo === 'tengo' ? 'tengo' : kit.logo === 'crear' ? 'ayuda' : kit.logo ? 'omitir' : '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

// A big selectable option (setup path, brand choice).
function Choice({ selected, onClick, title, body, badge, disabled }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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

// A whole number with − / + (people, users).
function NumberStepper({ label, value, onChange, max, onEnter }) {
  return (
    <div className="mt-7 flex items-center gap-3">
      <button type="button" className="btn-outline !h-14 !w-14 !px-0 text-2xl" onClick={() => onChange((value || 0) - 1)} disabled={(value || 0) <= 1} aria-label="Menos">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        aria-label={label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter()
          }
        }}
        placeholder="0"
        className="h-14 w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] text-center font-display text-3xl font-bold focus:border-[var(--blue)] focus-visible:outline-none"
      />
      <button type="button" className="btn-outline !h-14 !w-14 !px-0 text-2xl" onClick={() => onChange((value || 0) + 1)} disabled={(value || 0) >= max} aria-label="Más">
        +
      </button>
    </div>
  )
}

// The brand's colors: read from the images or the logo, then the person
// keeps, changes, removes or adds them.
function PaletteEditor({ kit, setKit, busy, source }) {
  const set = (palette) => setKit((k) => ({ ...k, palette: cleanPalette(palette) }))
  return (
    <fieldset className="mt-6">
      <legend className="font-display text-lg font-bold">Tu paleta</legend>
      <p className="text-sm text-[var(--color-muted)]">
        {busy
          ? 'Leyendo tus colores…'
          : kit.palette.length
            ? `${source === 'logo' ? 'Sacada de tu logo' : 'Sacada de tus imágenes'}. Toca un color para cambiarlo.`
            : source === 'tengo'
              ? 'Sube imágenes o agrega tus colores a mano.'
              : 'Agrega tus colores.'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3" aria-busy={busy}>
        {busy && <SpinnerIcon className="h-5 w-5 animate-spin" />}
        {!busy &&
          kit.palette.map((c, i) => (
            <span key={i} className="relative">
              <label className="block h-14 w-14 cursor-pointer overflow-hidden rounded-xl border border-[var(--window-line)] shadow-sm" style={{ background: c }}>
                <span className="sr-only">Color {i + 1}</span>
                <input
                  type="color"
                  value={c}
                  className="h-0 w-0 opacity-0"
                  onChange={(e) => set(kit.palette.map((x, j) => (j === i ? e.target.value : x)))}
                />
              </label>
              <span className="mt-1 block text-center font-mono text-[10px] uppercase text-[var(--color-muted)]">{c}</span>
              <button
                type="button"
                onClick={() => set(kit.palette.filter((_, j) => j !== i))}
                aria-label={`Quitar ${c}`}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm text-white"
              >
                ×
              </button>
            </span>
          ))}
        {!busy && kit.palette.length < MAX_PALETTE && (
          <button
            type="button"
            onClick={() => set([...kit.palette, ['#00c49a', '#1f2a44', '#f4b942', '#e4572e', '#7a5cff', '#f2efe9', '#2e8b57', '#111111'].find((c) => !kit.palette.includes(c))])}
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-[var(--window-line)] text-2xl text-[var(--color-muted)] hover:bg-white"
          >
            +<span className="sr-only">Agregar color</span>
          </button>
        )}
      </div>
    </fieldset>
  )
}

// One package per plan. Galaxy is dark and labelled; the smaller ones
// list, crossed out, what stays behind. The price is the catalog's.
function PackageCard({ pkg, selected, onSelect }) {
  const hero = pkg.recommended
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex h-full flex-col rounded-3xl border p-5 text-left transition-all ${
        hero
          ? 'border-[var(--window-teal)] bg-[var(--color-ink)] text-white shadow-[0_30px_80px_-30px_rgba(0,230,184,0.55)] xl:-my-3 xl:py-8'
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
        <span className={`font-mono text-[11px] uppercase tracking-wider ${hero ? 'text-[var(--mint)]' : 'text-[var(--color-muted)]'}`}>{pkg.label}</span>
      </span>
      <span className="mt-1 font-display text-xl font-bold">
        {formatQ(pkg.price)}
        <span className={`text-sm font-normal ${hero ? 'text-white/60' : 'text-[var(--color-muted)]'}`}>/mes</span>
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
  const [claim] = useState(readGameClaim)
  const [path, setPath] = useState(draft?.path ?? '')
  const [screen, setScreen] = useState(draft?.screen ?? 'choose')
  const [answers, setAnswers] = useState({ ...INITIAL_ANSWERS, ...(draft?.answers ?? {}) })
  const [description, setDescription] = useState(draft?.description ?? '')
  const [analysis, setAnalysis] = useState(null) // { key, data, summary }
  // What the quick setup's paragraph gave: { key, covered, summary, prefilled }.
  const [extracted, setExtracted] = useState(draft?.extracted ?? null)
  const [plan, setPlan] = useState(normalizePlan(draft?.plan) ?? 'galaxy')
  const [modules, setModules] = useState(draft?.modules ?? null)
  // Add-ons of the next plan picked on "Te puede interesar": { featureId: qty }.
  const [addons, setAddons] = useState(draft?.addons ?? {})
  // POST /plans/quote for the plan and add-ons: { key, data }.
  const [offer, setOffer] = useState(null)
  const [brand, setBrand] = useState(draft?.brand ?? { choice: '', essence: '' })
  const [logo, setLogo] = useState('')
  // The long path's kit; files live only in memory until the account exists.
  // A restored draft has no files, so "ya tengo" logo/data is asked again.
  const [kit, setKit] = useState(() => {
    const k = { ...INITIAL_KIT, ...(draft?.kit ?? {}) }
    return { ...k, logo: k.logo === 'tengo' ? '' : k.logo, data: k.data === 'tengo' ? '' : k.data, palette: cleanPalette(k.palette) }
  })
  const [brandImages, setBrandImages] = useState([]) // [{ id, file, url }]
  const [dataFiles, setDataFiles] = useState([]) // [{ id, file }]
  const [paletteBusy, setPaletteBusy] = useState(false)
  const [uploading, setUploading] = useState('')
  const [account, setAccount] = useState({ name: '', company: '', email: '', phone: '', ...(draft?.account ?? {}), password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const { verdict, transition, arrive, cardMotion, moving, showingMessage } = useDeck()
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  const qSteps = questionSteps(answers)
  const flow = buildFlow(path, answers, extracted?.covered ?? [])
  const index = Math.max(0, flow.indexOf(screen))
  const step = screen.startsWith('q:') ? resolveStep(qSteps.find((s) => `q:${s.id}` === screen) ?? qSteps[0], answers, {}) : null
  const pkgs = analysis?.data?.packages ?? []
  const pkg = pkgs.find((p) => p.key === plan)
  const limit = pkg?.module_limit ?? -1
  const chosen = modules ?? (pkg ? defaultModules(pkg) : [])
  const needsWhatsApp = chosen.includes('whatsapp')

  useEffect(() => {
    if (!done) saveDraft({ path, screen, answers, description, extracted, plan, modules, addons, kit, brand: { choice: brand.choice, essence: brand.essence }, account: { ...account, password: '' } })
  }, [path, screen, answers, description, extracted, plan, modules, addons, kit, brand, account, done])

  // "Te puede interesar": what the plan includes, what the next one adds
  // (most needed first) and the price of the add-ons, recomputed by
  // andrho-api whenever the plan or the add-ons change.
  const needs = (analysis?.data?.needs ?? []).map((m) => m.key)
  const offerKey = JSON.stringify([plan, addons, needs])
  useEffect(() => {
    if (screen !== 'extras' || offer?.key === offerKey) return
    let live = true
    quotePlan(plan, addons, needs)
      .then((data) => live && setOffer({ key: offerKey, data }))
      .catch((err) => {
        if (!live) return
        // A stale selection (e.g. from an old draft): start the add-ons over.
        if (err.status === 400 && Object.keys(addons).length) setAddons({})
        else setError(err.message || 'No pudimos calcular tu plan.')
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, offerKey])

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
    if (screen === 'extras') return offer?.key === offerKey
    if (screen === 'brand') return brand.choice !== 'tengo' || brand.essence.trim().length > 0 || !!logo
    if (screen === 'people') return answers.teamSize >= 1
    if (screen === 'access') return answers.accessUsers >= 1 && answers.accessUsers <= answers.teamSize
    if (screen === 'logo') return kit.logo !== '' && (kit.logo !== 'tengo' || !!logo)
    if (screen === 'colors') return kit.colors !== '' && (!['tengo', 'logo'].includes(kit.colors) || (kit.palette.length > 0 && !paletteBusy))
    if (screen === 'data') return kit.data !== '' && (kit.data !== 'tengo' || dataFiles.length > 0)
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

  const text = path === 'rapida' ? description : ''

  // The brand as the suggestion reads it (the long path has no brand card).
  const brandForAnalysis = path === 'personalizada' ? { choice: brandChoice(kit), essence: brand.essence } : brand

  async function runAnalysis() {
    const key = JSON.stringify([buildSubmission(answers), text.trim(), brandForAnalysis.choice, brandForAnalysis.essence.trim()])
    if (analysis?.key === key) return analysis
    const data = await suggestSetup(answers, text, brandForAnalysis)
    const next = { key, data, summary: data.summary ?? '' }
    setAnalysis(next)
    // New analysis, new defaults for the package's modules.
    setModules(null)
    return next
  }

  function go(dir, target, message) {
    setError('')
    transition(dir, () => setScreen(target), message)
  }

  // The quick setup's paragraph: read it once per text, fold what it says
  // into the answers, the brand and the boarding pass, and jump to the
  // first question it didn't answer.
  async function readDescription() {
    const key = description.trim()
    let covered = extracted?.covered ?? []
    let merged = answers
    let summary = extracted?.summary ?? ''
    if (extracted?.key !== key) {
      covered = []
      summary = ''
      if (key.length >= MIN_DESCRIPTION) {
        const d = await describeBusiness(key)
        ;({ answers: merged, covered } = applyDescription(answers, d))
        summary = d.summary ?? ''
        const filled = prefillAccount(account, d.contact)
        setAnswers(merged)
        setAccount(filled)
        setBrand(prefillBrand(brand, d.brand))
        setExtracted({ key, covered, summary, prefilled: ['name', 'company', 'email', 'phone'].filter((k) => filled[k] !== account[k]) })
      } else setExtracted({ key, covered, summary: '', prefilled: [] })
    }
    const nextFlow = buildFlow(path, merged, covered)
    const left = nextFlow.filter((c) => c.startsWith('q:')).length
    const message = left
      ? `${summary ? `${summary} ` : ''}${left === 1 ? 'Solo falta una pregunta.' : `Solo faltan ${left} preguntas.`}`
      : summary || 'Entendimos tu negocio.'
    go(1, nextFlow[nextFlow.indexOf('quick') + 1], { tone: 'neutral', text: message })
  }

  async function next() {
    if (moving || busy || !valid) return
    const target = flow[index + 1]
    if (screen === 'account') return submit()
    if (screen === 'quick') {
      setBusy(true)
      try {
        await readDescription()
      } catch (err) {
        setError(err.message || 'No pudimos leer tu descripción. Intenta de nuevo.')
      }
      setBusy(false)
      return
    }
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
    if (screen === 'packages' && plan !== 'galaxy') message = { tone: 'neutral', text: 'Mira lo que te puede interesar.' }
    if (screen === 'extras')
      message = plan === 'galaxy' ? { tone: 'good', text: 'Tus hijos te lo agradecerán.' } : { tone: 'warn', text: 'El dinosaurio también creyó que tenía tiempo.' }
    if (screen === 'brand' && brand.choice) message = { tone: 'good', text: brand.choice === 'ayuda' ? 'Te la diseñamos.' : 'Una marca clara vende sola.' }
    if (screen === 'people') message = peopleVerdict(answers.teamSize)
    if (screen === 'access')
      message =
        answers.accessUsers === 1
          ? { tone: 'neutral', text: 'Tú al mando. Lo demás lo hace AndRho.' }
          : { tone: 'good', text: `${answers.accessUsers} llaves para la misma nave.` }
    if (screen === 'logo') message = { tone: 'good', text: { tengo: 'Una marca clara vende sola.', crear: 'Te lo diseñamos.', despues: 'Te lo recordamos en tu panel.' }[kit.logo] }
    if (screen === 'colors')
      message = { tone: 'good', text: { tengo: 'Tus colores, en todo lo que hagamos.', logo: 'Tus colores, en todo lo que hagamos.', crear: 'Te los proponemos.', despues: 'Cuando quieras, desde tu panel.' }[kit.colors] }
    if (screen === 'data')
      message =
        kit.data === 'tengo'
          ? { tone: 'good', text: 'Tus datos no se pierden: se mudan contigo.' }
          : { tone: 'neutral', text: kit.data === 'cero' ? 'Empezamos limpio.' : 'Cuando quieras, desde tu panel.' }
    go(1, target, message)
  }

  function back() {
    if (moving || busy || index === 0) return
    go(-1, flow[index - 1])
  }

  function pickPlan(key) {
    if (key === plan) return
    setPlan(key)
    setModules(null)
    setAddons({})
  }

  // An add-on on or off (qty 1), or its quantity (0 = off).
  function setAddon(featureId, qty) {
    setAddons((a) => {
      const next = { ...a }
      if (qty > 0) next[featureId] = qty
      else delete next[featureId]
      return next
    })
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

  // The colors of some images (or the logo), as the starting palette.
  async function paletteFrom(sources) {
    if (!sources.length) return setKit((k) => ({ ...k, palette: [] }))
    setPaletteBusy(true)
    try {
      const palette = await readPalette(sources)
      setKit((k) => ({ ...k, palette }))
      setError(palette.length ? '' : 'No encontramos colores en esas imágenes. Agrégalos a mano.')
    } catch (err) {
      setError(err.message || 'No pudimos leer los colores.')
    }
    setPaletteBusy(false)
  }

  function pickColors(choice) {
    setKit((k) => ({ ...k, colors: choice, palette: choice === k.colors ? k.palette : [] }))
    if (choice === 'logo' && logo) paletteFrom([logo])
    if (choice === 'tengo' && brandImages.length) paletteFrom(brandImages.map((i) => i.file))
  }

  function addBrandImages(e) {
    const files = [...e.target.files]
    e.target.value = ''
    const bad = files.map(checkImage).find(Boolean)
    if (bad) return setError(bad)
    const next = [...brandImages, ...files.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))].slice(0, MAX_BRAND_IMAGES)
    setBrandImages(next)
    paletteFrom(next.map((i) => i.file))
  }

  function removeBrandImage(id) {
    const gone = brandImages.find((i) => i.id === id)
    if (gone) URL.revokeObjectURL(gone.url)
    const next = brandImages.filter((i) => i.id !== id)
    setBrandImages(next)
    paletteFrom(next.map((i) => i.file))
  }

  function addDataFiles(e) {
    const files = [...e.target.files]
    e.target.value = ''
    const bad = files.map(checkData).find(Boolean)
    if (bad) return setError(bad)
    setError('')
    setDataFiles((list) => [...list, ...files.map((file) => ({ id: crypto.randomUUID(), file }))].slice(0, MAX_DATA_FILES))
  }

  // How many people: the range the analysis reads goes with it.
  function setTeam(n) {
    const team = Math.max(0, Math.min(100000, Math.floor(Number(n) || 0)))
    setAnswers((a) => ({ ...a, teamSize: team, companySize: team ? sizeOf(team) : '', accessUsers: Math.min(a.accessUsers || 0, team) || a.accessUsers }))
  }
  const setAccess = (n) => setAnswers((a) => ({ ...a, accessUsers: Math.max(0, Math.min(a.teamSize || 1, Math.floor(Number(n) || 0))) }))

  // The images of the brand and the data, once the account exists. A file
  // that fails doesn't undo the account: the last card says so, and the
  // panel takes it later.
  async function uploadKit() {
    const queue = [
      ...(kit.colors === 'tengo' ? brandImages.map((i) => ['brand_image', i.file]) : []),
      ...(kit.data === 'tengo' ? dataFiles.map((d) => ['data', d.file]) : []),
    ]
    const out = []
    for (const [i, [kind, file]] of queue.entries()) {
      setUploading(`Subiendo tus archivos (${i + 1} de ${queue.length})…`)
      try {
        out.push({ name: file.name, kind, asset: await uploadAsset(kind, file) })
      } catch (err) {
        out.push({ name: file.name, kind, error: err.message })
      }
    }
    setUploading('')
    return out
  }

  async function submit() {
    setBusy(true)
    setError('')
    const long = path === 'personalizada'
    const discount = claim && { percent: claim.percent, destroyed: claim.destroyed, session_id: claim.sessionId, code: generateDiscountCode(claim.percent) }
    try {
      const res = await checkout({
        plan,
        addons,
        email: account.email.trim(),
        password: account.password,
        company_name: account.company.trim(),
        display_name: account.name.trim(),
        setup: path,
        modules: chosen,
        answers: buildSubmission(answers),
        description: path === 'rapida' ? description.trim() : '',
        phone: account.phone.trim(),
        brand: long
          ? { essence: brand.essence.trim(), help: kit.logo === 'crear', logo: kit.logo === 'tengo' ? logo : '' }
          : brand.choice === 'omitir'
            ? {}
            : { essence: brand.essence.trim(), help: brand.choice === 'ayuda', logo: brand.choice === 'tengo' ? logo : '' },
        kit: long ? { logo: kit.logo, colors: kit.colors, data: kit.data, palette: ['tengo', 'logo'].includes(kit.colors) ? kit.palette : [] } : undefined,
        discount,
        visitor_id: trackerVisitorId(),
      })
      storeTokens(res)
      if (long) res.uploads = await uploadKit()
      saveDraft(null)
      markFormDone('register')
      if (res.discount?.percent) {
        submitRegistration({
          session_id: claim.sessionId,
          email: account.email.trim(),
          commerce_type: (answers.sectors ?? []).join(','),
          commerce_size: answers.companySize ?? '',
          destroyed_count: claim.destroyed,
          discount_percent: res.discount.percent,
          discount_code: res.discount.code,
        })
      }
      setBusy(false)
      transition(1, () => setDone(res), { tone: 'good', text: 'Bienvenido a bordo.' })
    } catch (err) {
      setBusy(false)
      setError(err.status === 409 ? 'Ya existe una cuenta con ese correo.' : err.message || 'No pudimos crear tu cuenta.')
    }
  }

  const progress = done ? 100 : Math.round((index / flow.length) * 100)
  const wide = (screen === 'packages' || screen === 'extras') && !done

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
                      {claim && screen === 'choose' && (
                        <p className="mt-4 rounded-xl border border-[var(--window-teal)]/40 bg-white/70 px-4 py-3 text-sm">
                          Tu <strong className="text-[var(--window-teal)]">{claim.percent}% de descuento por 1 año</strong> del juego queda
                          guardado en tu cuenta.
                        </p>
                      )}
                      <Body
                        screen={screen}
                        step={step}
                        headingRef={headingRef}
                        state={{ path, setPath, answers, setAnswers, description, setDescription, analysis, pkgs, plan, pickPlan, chosen, limit, toggleModule, brand, setBrand, logo, setLogo, onLogo, account, setAccount, needsWhatsApp, prefilled: extracted?.prefilled ?? [], offer: offer?.key === offerKey ? offer.data : offer?.data, loadingOffer: offer?.key !== offerKey, addons, setAddon, next, kit, setKit, pickColors, paletteBusy, brandImages, addBrandImages, removeBrandImage, dataFiles, setDataFiles, addDataFiles, setTeam, setAccess }}
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
                ? uploading || 'Creando tu cuenta…'
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
  return { choose: 'scan', quick: 'paper', brand: 'beacon', logo: 'beacon', colors: 'target', data: 'paper', people: 'crew', access: 'crew', account: 'boarding' }[screen] ?? 'orbit'
}

function group(screen, step) {
  if (step) return step.group
  return (
    {
      choose: 'Tu cuenta',
      quick: 'Tu negocio',
      people: 'Tu negocio',
      access: 'Tu negocio',
      packages: 'Tu paquete',
      extras: 'Tu paquete',
      brand: 'Tu marca',
      logo: 'Tu marca',
      colors: 'Tu marca',
      data: 'Tus datos',
      account: 'Abordaje',
    }[screen] ?? ''
  )
}

function peopleVerdict(n) {
  if (n <= 10) return { tone: 'good', text: 'Los grandes también empezaron pequeños.' }
  if (n <= 50) return { tone: 'good', text: 'Creciste. Ahora tu negocio necesita ver más lejos.' }
  return { tone: 'warn', text: 'A esta escala, decidir a ciegas sale caro.' }
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
        <p className="mt-3 text-[var(--color-ink-soft)]">Hoy no te cobramos nada. Puedes cambiar cualquier cosa después.</p>
        <div role="radiogroup" aria-labelledby="signup-title" className="mt-7 grid gap-3">
          <Choice
            selected={s.path === 'rapida'}
            onClick={() => s.setPath('rapida')}
            title="Configuración rápida"
            body="Cuéntanos de tu negocio en un párrafo. AndRho lo lee y solo te pregunta lo que falte."
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
        <p className="mt-3 text-[var(--color-ink-soft)]">
          Quién eres, cómo se llama tu negocio, qué vendes y cómo, con qué te organizas hoy y qué te quita el sueño. Mientras más nos cuentes, menos
          preguntas te hacemos. Si prefieres, déjalo en blanco y te preguntamos todo.
        </p>
        <textarea
          aria-labelledby="signup-title"
          className={`${TEXTAREA} mt-7`}
          value={s.description}
          maxLength={2000}
          onChange={(e) => s.setDescription(e.target.value)}
          placeholder="Ej.: Soy Ana López y tengo Pan de Ana, una panadería con 8 empleados. Llevo todo en Excel, vendemos en el local, por WhatsApp e Instagram, y se me vencen los ingredientes. Mi WhatsApp es +502 5555 5555."
        />
        <p className="mt-2 text-right font-mono text-xs text-[var(--color-muted)]">{s.description.length}/2000</p>
      </>
    )

  if (screen === 'packages') {
    const best = s.analysis?.data
    return (
      <>
        {title('Tu nave, en cinco tamaños')}
        <p className="mt-3 max-w-3xl text-[var(--color-ink-soft)]">
          {s.analysis?.summary ? `${s.analysis.summary} ` : ''}
          {best?.reasons?.length ? `Por lo que nos contaste: ${best.reasons.join(' ')}` : 'Elige con cuánto despega tu negocio.'}
        </p>
        <div role="radiogroup" aria-label="Paquetes" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:items-stretch">
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
                      <span className="text-[var(--color-muted)]">
                        {full ? 'Disponible en un paquete mayor.' : (best?.module_reasons?.[m.key] ?? m.description)}
                      </span>
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

  if (screen === 'extras') return <Extras s={s} title={title} />

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

  if (screen === 'people')
    return (
      <>
        {title('¿Cuántas personas son en tu negocio?')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Contándote a ti. Con esto sabemos el tamaño de tu operación.</p>
        <NumberStepper label="Personas" value={s.answers.teamSize} onChange={s.setTeam} max={100000} onEnter={onSubmitKey} />
      </>
    )

  if (screen === 'access')
    return (
      <>
        {title('¿Cuántas necesitan entrar a AndRho?')}
        <p className="mt-3 text-[var(--color-ink-soft)]">
          Tú y quienes vayan a usar el panel: ventas, inventario, cuentas. Cada uno con su propio usuario. Son {s.answers.teamSize}{' '}
          {s.answers.teamSize === 1 ? 'persona' : 'personas'} en total.
        </p>
        <NumberStepper label="Usuarios" value={s.answers.accessUsers} onChange={s.setAccess} max={s.answers.teamSize || 1} onEnter={onSubmitKey} />
        {s.answers.teamSize > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, Math.ceil(s.answers.teamSize / 2), s.answers.teamSize]
              .filter((n, i, all) => all.indexOf(n) === i)
              .map((n) => (
                <button key={n} type="button" className="btn-outline !h-9 !px-4 text-sm" onClick={() => s.setAccess(n)}>
                  {n === 1 ? 'Solo yo' : n === s.answers.teamSize ? 'Todos' : `${n} personas`}
                </button>
              ))}
          </div>
        )}
      </>
    )

  if (screen === 'logo') {
    const pick = (logo) => s.setKit({ ...s.kit, logo })
    return (
      <>
        {title('¿Ya tienes logo?')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Va en tu sitio, tus redes y tu panel. Los Creators arrancan con él.</p>
        <div role="radiogroup" aria-labelledby="signup-title" className="mt-6 grid gap-3">
          <Choice selected={s.kit.logo === 'tengo'} onClick={() => pick('tengo')} title="Sí, ya tengo" body="Súbelo y lo usamos en todo." />
          <Choice selected={s.kit.logo === 'crear'} onClick={() => pick('crear')} title="No, créenmelo" body="Un Creator de AndRho te lo diseña a partir de lo que nos contaste." />
          <Choice selected={s.kit.logo === 'despues'} onClick={() => pick('despues')} title="Lo subo después" body="Te queda pendiente en tu panel." />
        </div>
        {s.kit.logo === 'tengo' && (
          <div className="mt-5 flex flex-wrap items-center gap-4">
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
        {(s.kit.logo === 'tengo' || s.kit.logo === 'crear') && (
          <div className="mt-5">
            <Field label={s.kit.logo === 'tengo' ? 'La esencia de tu marca (opcional)' : 'Lo que te gustaría transmitir (opcional)'}>
              <textarea
                className={TEXTAREA}
                rows={3}
                maxLength={1000}
                value={s.brand.essence}
                onChange={(e) => s.setBrand({ ...s.brand, essence: e.target.value })}
                placeholder="Ej.: Pan de la abuela, cálido y de barrio. Nada de lujo."
              />
            </Field>
          </div>
        )}
      </>
    )
  }

  if (screen === 'colors') {
    const showPalette = s.kit.colors === 'tengo' || s.kit.colors === 'logo'
    return (
      <>
        {title('¿Ya tienes tus colores?')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Los usamos en tu sitio, tus publicaciones y tus documentos.</p>
        <div role="radiogroup" aria-labelledby="signup-title" className="mt-6 grid gap-3 sm:grid-cols-2">
          <Choice selected={s.kit.colors === 'tengo'} onClick={() => s.pickColors('tengo')} title="Sí, ya los tengo" body="Sube fotos de tu marca (local, empaques, tarjetas, redes) y sacamos sus colores." />
          {s.logo ? (
            <Choice selected={s.kit.colors === 'logo'} onClick={() => s.pickColors('logo')} title="Sácalos de mi logo" body="Generamos tu paleta a partir del logo que subiste." />
          ) : (
            <Choice selected={false} onClick={() => {}} title="Sácalos de mi logo" body="Sube primero tu logo (en la tarjeta anterior) para usar esta opción." disabled />
          )}
          <Choice selected={s.kit.colors === 'crear'} onClick={() => s.pickColors('crear')} title="No, créenmelos" body="Un Creator te propone una paleta que vaya con tu marca." />
          <Choice selected={s.kit.colors === 'despues'} onClick={() => s.pickColors('despues')} title="Los subo después" body="Te queda pendiente en tu panel." />
        </div>
        {s.kit.colors === 'tengo' && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-3">
              {s.brandImages.map((img) => (
                <span key={img.id} className="relative">
                  <img src={img.url} alt={img.file.name} className="h-16 w-16 rounded-xl border border-[var(--window-line)] bg-white object-cover" />
                  <button
                    type="button"
                    onClick={() => s.removeBrandImage(img.id)}
                    aria-label={`Quitar ${img.file.name}`}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              {s.brandImages.length < MAX_BRAND_IMAGES && (
                <label className="btn-outline !h-11 cursor-pointer">
                  {s.brandImages.length ? 'Agregar imágenes' : 'Subir imágenes'}
                  <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={s.addBrandImages} />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">Hasta {MAX_BRAND_IMAGES} imágenes de 5 MB. También puedes poner tus colores a mano abajo.</p>
          </div>
        )}
        {showPalette && <PaletteEditor kit={s.kit} setKit={s.setKit} busy={s.paletteBusy} source={s.kit.colors} />}
      </>
    )
  }

  if (screen === 'data') {
    const pick = (data) => s.setKit({ ...s.kit, data })
    return (
      <>
        {title('¿Ya tienes datos de tu negocio?')}
        <p className="mt-3 text-[var(--color-ink-soft)]">Productos, clientes, proveedores, ventas: lo que lleves hoy en Excel, otro sistema o un respaldo.</p>
        <div role="radiogroup" aria-labelledby="signup-title" className="mt-6 grid gap-3">
          <Choice selected={s.kit.data === 'tengo'} onClick={() => pick('tengo')} title="Sí, ya tengo" body="Súbelos como estén. AndRho los acomoda en tu ERP." />
          <Choice selected={s.kit.data === 'cero'} onClick={() => pick('cero')} title="No, empezamos de cero" body="Tu ERP arranca limpio." />
          <Choice selected={s.kit.data === 'despues'} onClick={() => pick('despues')} title="Los subo después" body="Te queda pendiente en tu panel." />
        </div>
        {s.kit.data === 'tengo' && (
          <div className="mt-5">
            {s.dataFiles.length > 0 && (
              <ul className="mb-3 grid gap-2">
                {s.dataFiles.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--window-line)] bg-white/80 px-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-semibold">{d.file.name}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs text-[var(--color-muted)]">{fileSize(d.file.size)}</span>
                      <button
                        type="button"
                        className="text-sm font-semibold text-[var(--violet-deep)] hover:underline"
                        onClick={() => s.setDataFiles((list) => list.filter((x) => x.id !== d.id))}
                        aria-label={`Quitar ${d.file.name}`}
                      >
                        Quitar
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {s.dataFiles.length < MAX_DATA_FILES && (
              <label className="btn-outline !h-11 cursor-pointer">
                {s.dataFiles.length ? 'Agregar archivos' : 'Subir archivos'}
                <input type="file" multiple accept={DATA_ACCEPT} className="sr-only" onChange={s.addDataFiles} />
              </label>
            )}
            <p className="mt-3 rounded-xl border border-[var(--window-teal)]/40 bg-white/70 px-4 py-3 text-sm">
              Excel, CSV, JSON o respaldo SQL, hasta 15 MB cada uno. Productos, clientes y proveedores se cargan solos a tu ERP; lo demás lo acomoda un
              Creator.
            </p>
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
        <p className="mt-3 text-[var(--color-ink-soft)]">
          {s.prefilled.length ? 'Lo llenamos con lo que nos contaste: revísalo y elige tu contraseña.' : 'Con esto entras a tu panel. Nada de spam.'}
        </p>
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

// "Te puede interesar" (after picking a plan): what the plan includes, the
// next plan's features as add-ons (locked until picked), the two ways to
// unlock them and the monthly total. Every number comes from POST
// /plans/quote; "Continuar" is the deck's button.
function Extras({ s, title }) {
  const o = s.offer
  if (!o) {
    return (
      <>
        {title('Tu paquete')}
        <p className="mt-6 flex items-center gap-2 text-[var(--color-muted)]">
          <SpinnerIcon className="h-4 w-4 animate-spin" /> Calculando tu plan…
        </p>
      </>
    )
  }
  const { plan, next_plan: next, features, quote } = o
  const picked = quote.addons.length > 0
  const hasSite = plan.capabilities.website || !!s.addons.sitio_web_basico
  return (
    <>
      {title(`${plan.name}: lo que incluye`)}
      <p className="mt-3 max-w-3xl text-[var(--color-ink-soft)]">
        {plan.tagline} Hoy no te cobramos: tu cuenta se crea y el pago se activa más adelante.
      </p>

      <div className={`mt-6 grid gap-6 ${s.loadingOffer ? 'opacity-70' : ''} lg:grid-cols-[1fr_1.2fr]`}>
        <section aria-labelledby="incluye" className="rounded-2xl border border-[var(--window-line)] bg-white/75 p-5">
          <h2 id="incluye" className="font-display text-lg font-bold">
            Incluido en {plan.name} · {formatQ(plan.price)}/mes
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {plan.includes.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--window-teal)]">
                  <Check />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${hasSite ? 'border-[var(--window-teal)]/50 bg-[var(--window-teal)]/8' : 'border-dashed border-[var(--window-line)]'}`}>
            <p className="font-semibold">Tu sitio web</p>
            <p className="text-[var(--color-muted)]">
              {hasSite
                ? 'Incluido: tu sitio en tunegocio.web.andrho.com, hecho por Creators y listo para Google.'
                : 'Te guardamos tu dirección tunegocio.web.andrho.com. Se construye con Despegue o con el complemento Sitio web básico.'}
            </p>
          </div>
        </section>

        <section aria-labelledby="interesar">
          {next ? (
            <>
              <h2 id="interesar" className="font-display text-lg font-bold">
                Te puede interesar
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Lo que suma {next.name}. Agrégalo suelto o desbloquea todo con el plan.</p>
              <ul className="mt-3 grid gap-2">
                {features.map((f) => {
                  const qty = s.addons[f.featureId] ?? 0
                  const on = qty > 0
                  const max = f.addon?.max_qty ?? 1
                  const missing = f.requires.filter((r) => !r.met)
                  return (
                    <li
                      key={f.featureId}
                      className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
                        on ? 'border-[var(--window-teal)] bg-white' : 'border-[var(--window-line)] bg-white/45 text-[var(--color-ink-soft)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-[var(--window-teal)]"
                        checked={on}
                        disabled={!f.selectable}
                        onChange={() => s.setAddon(f.featureId, on ? 0 : 1)}
                        aria-label={`${f.label}, +${formatQ(f.addon?.price)}${f.addon?.per_unit ? ' c/u' : ''} al mes`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {!on && <LockIcon className="h-3.5 w-3.5 opacity-60" />}
                          {f.label}
                          {f.needed && (
                            <span className="rounded-full bg-[var(--mint)]/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-black">Lo pediste</span>
                          )}
                        </span>
                        <span className="block text-[var(--color-muted)]">{f.detail}</span>
                        {missing.length > 0 && <span className="mt-1 block text-[var(--violet-deep)]">Necesitas antes: {missing.map((r) => r.label).join(', ')}.</span>}
                        {on && f.addon?.per_unit && (
                          <span className="mt-2 flex items-center gap-2">
                            <button type="button" className="btn-outline !h-8 !px-3" onClick={() => s.setAddon(f.featureId, qty - 1)} aria-label={`Menos ${f.label}`}>
                              −
                            </button>
                            <span className="w-6 text-center font-mono">{qty}</span>
                            <button
                              type="button"
                              className="btn-outline !h-8 !px-3 disabled:opacity-35"
                              disabled={qty >= max}
                              onClick={() => s.setAddon(f.featureId, qty + 1)}
                              aria-label={`Más ${f.label}`}
                            >
                              +
                            </button>
                            <span className="text-xs text-[var(--color-muted)]">hasta {max}</span>
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-sm font-semibold">
                        +{formatQ(f.addon?.price)}
                        {f.addon?.per_unit ? ' c/u' : ''}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button type="button" className="btn-solid" onClick={() => s.pickPlan(next.id)}>
                  Desbloquear con {next.name} — {formatQ(next.price)}/mes
                </button>
                {picked && (
                  <button type="button" className="btn-outline" onClick={s.next}>
                    Desbloquear por +{formatQ(quote.addonsTotal)}
                  </button>
                )}
              </div>
              {picked && quote.upgradeIsCheaper && (
                <p role="status" className="mt-2 text-sm font-semibold text-[var(--violet-deep)]">
                  Por {formatQ(quote.nextPlanPrice - quote.basePrice)} más tienes todo {next.name}.
                </p>
              )}
            </>
          ) : (
            <p className="rounded-2xl border border-[var(--window-teal)]/40 bg-white/70 p-5">
              <span className="block font-display text-lg font-bold">Tienes todo AndRho.</span>
              <span className="text-sm text-[var(--color-muted)]">Galaxy no deja nada en tierra.</span>
            </p>
          )}
        </section>
      </div>

      <UsersNote s={s} plan={plan} features={features} />

      <section aria-label="Resumen" className="mt-6 rounded-2xl border border-[var(--window-line)] bg-white/95 p-4 text-sm">
        <dl className="grid gap-1">
          <div className="flex justify-between gap-4">
            <dt>Plan {plan.name}</dt>
            <dd className="font-mono">{formatQ(quote.basePrice)}</dd>
          </div>
          {quote.addons.map((a) => (
            <div key={a.featureId} className="flex justify-between gap-4 text-[var(--color-ink-soft)]">
              <dt>
                {a.label}
                {a.qty > 1 ? ` × ${a.qty}` : ''}
              </dt>
              <dd className="font-mono">+{formatQ(a.price)}</dd>
            </div>
          ))}
          <div className="mt-1 flex justify-between gap-4 border-t border-[var(--window-line)] pt-2 text-base font-bold">
            <dt>Total mensual</dt>
            <dd className="font-mono">{formatQ(quote.total)}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}

// How many people need AndRho (long signup) against the users the plan
// gives, with the extra users as the quick fix.
function UsersNote({ s, plan, features }) {
  const need = s.answers?.accessUsers || 0
  const included = plan.capabilities?.users
  if (!need || included === undefined || included < 0) return null
  const extra = s.addons.usuario_extra ?? 0
  const have = included + extra
  if (need <= included)
    return (
      <p className="mt-5 text-sm text-[var(--color-muted)]">
        {plan.name} incluye {included} {included === 1 ? 'usuario' : 'usuarios'}: alcanza para las {need} {need === 1 ? 'persona' : 'personas'} que necesitan AndRho.
      </p>
    )
  const addon = features.find((f) => f.featureId === 'usuario_extra')
  const missing = need - have
  const canAdd = addon?.selectable && missing > 0 ? Math.min(missing + extra, addon.addon?.max_qty ?? 1) : 0
  return (
    <div role="status" className="mt-5 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/5 px-4 py-3 text-sm">
      <p>
        Dijiste que {need} personas necesitan AndRho y {plan.name} incluye {included}
        {extra ? ` (+${extra} extra)` : ''}.{' '}
        {missing <= 0 ? 'Con los usuarios extra ya alcanza.' : `Te faltan ${missing}.`}
      </p>
      {canAdd > extra && (
        <button type="button" className="btn-outline mt-2 !h-9 !px-4" onClick={() => s.setAddon('usuario_extra', canAdd)}>
          Agregar {canAdd - extra} {canAdd - extra === 1 ? 'usuario extra' : 'usuarios extra'}
        </button>
      )}
      {missing > 0 && canAdd - extra < missing && <p className="mt-1 text-[var(--color-muted)]">Para más, mira el plan siguiente.</p>}
    </div>
  )
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
            {done.checkout?.quote && (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                Tu plan: {formatQ(done.checkout.quote.total)} al mes.
                {done.checkout.payment_skipped ? ' Hoy no te cobramos; te avisamos antes de activar el pago.' : ''}
              </p>
            )}
            {done.uploads?.length > 0 && (
              <div className="mt-6">
                <p className="font-semibold">Tus archivos</p>
                <ul className="mt-2 grid gap-2">
                  {done.uploads.map((u, i) => (
                    <li key={i} className="rounded-xl bg-white/70 px-4 py-3 text-sm">
                      <span className="block font-semibold">{u.name}</span>
                      <span className={u.error ? 'text-[var(--violet-deep)]' : 'text-[var(--color-muted)]'}>
                        {u.error
                          ? `${u.error} Súbelo de nuevo desde Configuración en tu panel.`
                          : u.kind === 'data'
                            ? describeData(u.asset)
                            : 'Recibida: sus colores van a tu paleta.'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {done.site?.status === 'offered' && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Te guardamos {done.site.host} para tu sitio web. Se construye cuando tu plan lo incluya.
              </p>
            )}
            {done.discount?.code && (
              <div className="mt-6 rounded-xl border border-[var(--window-teal)]/40 bg-white/70 px-4 py-3">
                <p className="font-mono text-xl font-bold">{done.discount.code}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">Tu {done.discount.percent}% del juego, guardado en tu cuenta.</p>
              </div>
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
