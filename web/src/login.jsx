import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ParticleField from './components/ui/ParticleField.jsx'
import Field from './components/ui/form/Field.jsx'
import { TextInput } from './components/ui/form/inputs.jsx'
import { apiPost, storeTokens } from './lib/authApi.js'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-starfield px-6 py-16">
      <ParticleField density={50} />
      <div className="absolute inset-0 grid-overlay opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

      <div className="relative w-full max-w-md">
        <a href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-bold tracking-tight">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@empresa.com"
            />
          </Field>

          <Field label="Contraseña" required>
            <TextInput
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <p className="text-sm text-[var(--c-plasma)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-solar w-full rounded-full px-6 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
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
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoginPage />
  </StrictMode>,
)
