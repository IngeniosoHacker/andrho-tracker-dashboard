import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons.jsx'

// originkit.dev-style form primitives: minimal, high-contrast inputs that
// share one focus/border language. Used by the login/signup forms.
const baseControl =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-faint)] transition-colors focus-visible:outline-none focus:border-[var(--blue)]'

// `icon` is optional — plain inputs (no icon) render as before. Passing one
// renders it inline on the left, inside the same bordered control.
export function TextInput({ icon, className = '', ...props }) {
  if (!icon) {
    return <input {...props} className={`${baseControl} px-4 ${className}`} />
  }
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3.5 text-[var(--color-faint)]" aria-hidden="true">
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
        <span className="pointer-events-none absolute left-3.5 text-[var(--color-faint)]" aria-hidden="true">
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
        className="absolute right-3 text-[var(--color-faint)] transition-colors hover:text-[var(--color-ink)]"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

// Native <select> in the same control style. `options` = [{ value, label }].
export function SelectField({ options, placeholder = 'Elige…', className = '', ...props }) {
  return (
    <select {...props} className={`${baseControl} appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat px-4 pr-10 ${className}`} style={{ backgroundImage: SELECT_CHEVRON }}>
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%2364748b' stroke-width='1.5'/%3E%3C/svg%3E\")"
