import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons.jsx'

// originkit.dev-style form primitives: minimal, high-contrast inputs that
// share one focus/border language. Used by the login/signup forms.
const baseControl =
  'w-full rounded-lg border border-[var(--c-line)] bg-[var(--c-nebula)] py-2.5 text-sm text-[var(--c-stardust)] placeholder:text-[var(--c-mist)] transition-colors focus-visible:outline-none focus:border-[var(--c-comet)]/60'

// `icon` is optional — plain inputs (no icon) render as before. Passing one
// renders it inline on the left, inside the same bordered control.
export function TextInput({ icon, className = '', ...props }) {
  if (!icon) {
    return <input {...props} className={`${baseControl} px-4 ${className}`} />
  }
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3.5 text-[var(--c-mist)]" aria-hidden="true">
        {icon}
      </span>
      <input {...props} className={`${baseControl} pl-10 pr-4 ${className}`} />
    </div>
  )
}

// Same as TextInput, plus a show/hide toggle (defaults to type="password").
export function PasswordInput({ icon, className = '', ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative flex items-center">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 text-[var(--c-mist)]" aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${baseControl} ${icon ? 'pl-10' : 'pl-4'} pr-11 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 text-[var(--c-mist)] transition-colors hover:text-[var(--c-stardust)]"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
