import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Navbar from './components/sections/Navbar.jsx'
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
    <div className="min-h-screen bg-[var(--color-canvas)] px-6 pb-16 pt-32">
      <Navbar page="login" />
      <div className="mx-auto grid min-h-[calc(100vh-12rem)] max-w-5xl items-center gap-14 lg:grid-cols-2 lg:gap-10">
        {/* Brand panel — desktop only, form stays identical on mobile */}
        <div className="hidden lg:block">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--blue)]">Panel de datos</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-[var(--color-ink)] sm:text-5xl">
            Bienvenido de nuevo.
          </h1>
          <p className="mt-4 max-w-sm text-[var(--color-ink-soft)]">
            Entra a tu cuenta y revisa cómo se está comportando tu sitio ahora mismo.
          </p>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mint)]" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{h.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="relative w-full max-w-md justify-self-center lg:justify-self-end">
          <form onSubmit={handleSubmit} className="card-surface space-y-6 rounded-3xl p-6 sm:p-10">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)]">Iniciar sesión</h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">Entra a tu panel de datos de AndRho.</p>
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
              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/5 px-4 py-3 text-sm text-[var(--violet-deep)]">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>

            <p className="text-center text-sm text-[var(--color-muted)]">
              ¿No tienes cuenta?{' '}
              <a href="/signup.html" className="text-[var(--blue)] hover:underline">
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
