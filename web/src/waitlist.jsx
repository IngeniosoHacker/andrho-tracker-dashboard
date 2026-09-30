import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SiteHeader from './components/landing/SiteHeader.jsx'
import WindowFrame from './components/landing/WindowFrame.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Field from './components/ui/form/Field.jsx'
import { TextInput, SelectField } from './components/ui/form/inputs.jsx'
import { BuildingIcon, MailIcon, AlertIcon, SpinnerIcon, CheckCircleIcon } from './components/ui/icons.jsx'
import { SECTORS, COMPANY_SIZES, joinWaitlist } from './lib/waitlist.js'
import { getDiscountTier, generateDiscountCode } from './lib/discountTiers.js'
import { submitRegistration } from './lib/gameStorage.js'

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

const INITIAL = { name: '', email: '', company: '', sector: '', companySize: '' }

function WaitlistPage() {
  const [claim] = useState(readGameClaim)
  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await joinWaitlist(form)
      let code = null
      if (claim) {
        code = generateDiscountCode(claim.percent)
        submitRegistration({
          session_id: claim.sessionId,
          email: form.email,
          commerce_type: form.sector,
          commerce_size: form.companySize,
          destroyed_count: claim.destroyed,
          discount_percent: claim.percent,
          discount_code: code,
        })
      }
      setDone({ code })
    } catch (err) {
      setError(err.message || 'No se pudo completar tu registro. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-3 pb-10 pt-[124px] sm:px-6 md:pt-[100px]">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />

      <main className="relative z-10 flex min-h-[calc(100svh-10rem)] items-center justify-center">
        <WindowFrame>
          <div className="grid gap-10 p-6 sm:p-10 md:grid-cols-[1fr_1.05fr] md:p-14">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
                Lista de espera
              </p>
              <h1 className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl">
                Que no te deje <span className="text-[var(--window-teal)]">la nave</span>
              </h1>
              <p className="mt-5 max-w-sm text-lg leading-snug">
                Deja tus datos y te avisamos en cuanto abramos las compuertas. Los primeros a bordo eligen asiento.
              </p>
              {claim && (
                <p className="mt-8 max-w-sm rounded-xl border border-[var(--window-teal)]/40 bg-white/60 px-4 py-3 text-sm">
                  Vienes del juego: al registrarte reservamos tu{' '}
                  <strong className="text-[var(--window-teal)]">{claim.percent}% de descuento por 1 año</strong>.
                </p>
              )}
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white/70 p-8 text-center">
                <CheckCircleIcon className="h-10 w-10 text-[var(--window-teal)]" />
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight">¡Estás a bordo!</h2>
                <p className="mt-2 text-[var(--color-ink-soft)]">
                  Te escribiremos a <strong>{form.email}</strong> antes del despegue.
                </p>
                {done.code && (
                  <>
                    <p className="mt-6 font-mono text-xl font-bold">{done.code}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Guarda este código para tu descuento.</p>
                  </>
                )}
                <a href="/" className="btn-outline mt-8">
                  Volver al inicio
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white/70 p-6 sm:p-8">
                <Field label="Nombre" required>
                  <TextInput required autoComplete="name" value={form.name} onChange={update('name')} placeholder="Ana López" />
                </Field>
                <Field label="Correo" required>
                  <TextInput
                    type="email"
                    required
                    autoComplete="email"
                    icon={<MailIcon />}
                    value={form.email}
                    onChange={update('email')}
                    placeholder="tucorreo@empresa.com"
                  />
                </Field>
                <Field label="Empresa" required>
                  <TextInput
                    required
                    autoComplete="organization"
                    icon={<BuildingIcon />}
                    value={form.company}
                    onChange={update('company')}
                    placeholder="Nova Textiles"
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Tipo de negocio" required>
                    <SelectField required options={SECTORS} value={form.sector} onChange={update('sector')} />
                  </Field>
                  <Field label="Tamaño" required>
                    <SelectField required options={COMPANY_SIZES} value={form.companySize} onChange={update('companySize')} />
                  </Field>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/5 px-4 py-3 text-sm text-[var(--violet-deep)]">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-solid w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
                  {loading ? 'Reservando tu lugar…' : 'Unirme a la lista de espera'}
                </button>
              </form>
            )}
          </div>
        </WindowFrame>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WaitlistPage />
  </StrictMode>,
)
