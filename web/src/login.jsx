import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ParticleField from './components/ui/ParticleField.jsx'
import Field from './components/ui/form/Field.jsx'
import { TextInput, PasswordInput } from './components/ui/form/inputs.jsx'
import { MailIcon, LockIcon, AlertIcon, SpinnerIcon } from './components/ui/icons.jsx'
import { apiPost, storeTokens } from './lib/authApi.js'

const HIGHLIGHTS = [
  {
    title: 'Todo en un lugar',
    body: 'Sesiones, tráfico, geografía y visibilidad ante IA de tu sitio.',
  },
  {
    title: 'En tiempo real',
    body: 'Cada visita aparece en tu panel apenas ocurre.',
  },
]

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiPost('/auth/login', { email, password })
      storeTokens(data)
      window.location.href = '/dashboard/'
    } catch (err) {
      setError(err.status === 401 ? 'Credenciales inválidas.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-starfield px-6 py-16">
      <ParticleField density={50} />
      <div className="absolute inset-0 grid-overlay opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="glow-orb -top-24 right-[8%] h-[28rem] w-[28rem] bg-[var(--c-comet)]/10" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-5xl items-center gap-14 lg:grid-cols-2 lg:gap-10">
        {/* Brand panel — desktop only, form stays identical on mobile */}
        <div className="hidden lg:block">
          <a href="/" className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--c-solar)]" />
            &ρ AndRho
          </a>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-[var(--c-comet)]">Panel de datos</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Bienvenido de nuevo.
          </h1>
          <p className="mt-4 max-w-sm text-[var(--c-mist)]">
            Entra a tu cuenta y revisa cómo se está comportando tu sitio ahora mismo.
          </p>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-comet)]" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[var(--c-stardust)]">{h.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--c-mist)]">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="relative w-full max-w-md justify-self-center lg:justify-self-end">
          <a href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-bold tracking-tight lg:hidden">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--c-solar)]" />
            &ρ AndRho
          </a>

          <form onSubmit={handleSubmit} className="glass-panel space-y-6 rounded-3xl p-6 shadow-2xl shadow-black/30 sm:p-10">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold tracking-tight">Iniciar sesión</h1>
              <p className="mt-2 text-sm text-[var(--c-mist)]">Entra a tu panel de datos de AndRho.</p>
            </div>

            <Field label="Correo" required>
              <TextInput
                type="email"
                required
                autoComplete="email"
                icon={<MailIcon />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@empresa.com"
              />
            </Field>

            <Field label="Contraseña" required>
              <PasswordInput
                required
                autoComplete="current-password"
                icon={<LockIcon />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--c-plasma)]/30 bg-[var(--c-plasma)]/10 px-4 py-3 text-sm text-[var(--c-plasma)]">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-solar flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>

            <p className="text-center text-sm text-[var(--c-mist)]">
              ¿No tienes cuenta?{' '}
              <a href="/signup.html" className="text-[var(--c-comet)] hover:underline">
                Crea una
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoginPage />
  </StrictMode>,
)
