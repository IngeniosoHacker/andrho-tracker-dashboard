import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ParticleField from './components/ui/ParticleField.jsx'
import Field from './components/ui/form/Field.jsx'
import { PasswordInput } from './components/ui/form/inputs.jsx'
import { LockIcon, AlertIcon, SpinnerIcon } from './components/ui/icons.jsx'
import { apiPost, storeTokens } from './lib/authApi.js'

function AcceptInvitePage() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiPost('/auth/accept-invite', { token, password })
      storeTokens(data)
      window.location.href = '/dashboard/'
    } catch (err) {
      setError(err.status === 401 ? 'Este enlace de invitación ya no es válido o expiró.' : err.message)
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

        <div className="glass-panel space-y-6 rounded-3xl p-6 shadow-2xl shadow-black/30 sm:p-10">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">Unite al equipo</h1>
            <p className="mt-2 text-sm text-[var(--c-mist)]">Elegí una contraseña para activar tu cuenta.</p>
          </div>

          {!token ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-[var(--c-plasma)]/30 bg-[var(--c-plasma)]/10 px-4 py-3 text-sm text-[var(--c-plasma)]">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Este enlace no tiene un código de invitación válido. Pedile a quien te invitó que te comparta el enlace completo.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Field label="Nueva contraseña" required hint="Mínimo 8 caracteres.">
                <PasswordInput
                  required
                  minLength={8}
                  autoComplete="new-password"
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
                {loading ? 'Activando…' : 'Activar cuenta'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[var(--c-mist)]">
            ¿Ya activaste tu cuenta?{' '}
            <a href="/login.html" className="text-[var(--c-comet)] hover:underline">
              Iniciá sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AcceptInvitePage />
  </StrictMode>,
)
