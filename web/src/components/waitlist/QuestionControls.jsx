import Field from '../ui/form/Field.jsx'
import { TextInput } from '../ui/form/inputs.jsx'
import { BuildingIcon, GlobeIcon, MailIcon } from '../ui/icons.jsx'
import { toggleOption } from '../../lib/waitlist.js'

// The answer controls of one waitlist step (see STEPS in lib/waitlist.js),
// by `step.kind`. `value` = step.get(answers); `onChange(value)` stores it.

function OptionButton({ option, selected, onClick, role, disabled }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'radio' ? selected : undefined}
      aria-pressed={role === 'radio' ? undefined : selected}
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        selected
          ? 'border-[var(--window-teal)] bg-white shadow-[0_0_0_2px_var(--window-teal)]'
          : 'border-[var(--window-line)] bg-white/70 hover:border-[var(--color-ink-soft)] hover:bg-white'
      }`}
    >
      <span>
        <span className="flex items-center gap-2 font-semibold leading-tight">
          {option.label}
          {option.badge && (
            <span className="rounded-full bg-[var(--window-teal)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
              {option.badge}
            </span>
          )}
        </span>
        {option.description && <span className="mt-0.5 block text-sm text-[var(--color-muted)]">{option.description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${role === 'radio' ? 'rounded-full' : 'rounded-md'} ${
          selected ? 'border-[var(--window-teal)] bg-[var(--window-teal)] text-white' : 'border-[var(--window-line)] bg-white'
        }`}
      >
        {selected && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        )}
      </span>
    </button>
  )
}

function grid(options) {
  return options.length > 4 ? 'grid gap-2.5 sm:grid-cols-2' : 'grid gap-2.5'
}

function Single({ step, value, onChange, labelledBy }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={grid(step.options)}>
      {step.options.map((o) => (
        <OptionButton key={o.value} role="radio" option={o} selected={value === o.value} onClick={() => onChange(o.value)} />
      ))}
    </div>
  )
}

function Multi({ step, value, onChange, labelledBy }) {
  const full = step.max && value.length >= step.max
  return (
    <div>
      <div role="group" aria-labelledby={labelledBy} className={grid(step.options)}>
        {step.options.map((o) => {
          const selected = value.includes(o.value)
          return (
            <OptionButton
              key={o.value}
              option={o}
              selected={selected}
              disabled={full && !selected}
              onClick={() => onChange(toggleOption(value, o, step.options, step.max))}
            />
          )
        })}
      </div>
      {step.max && (
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]" aria-live="polite">
          {value.length} de {step.max} elegidas
        </p>
      )}
    </div>
  )
}

function Rating({ step, value, onChange, labelledBy }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-5 gap-2">
      {step.options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-4 transition-colors ${
              selected
                ? 'border-[var(--window-teal)] bg-white shadow-[0_0_0_2px_var(--window-teal)]'
                : 'border-[var(--window-line)] bg-white/70 hover:bg-white'
            }`}
          >
            <span className="font-display text-3xl font-bold">{o.value}</span>
            <span className="text-center text-xs leading-tight text-[var(--color-muted)]">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const textareaClass =
  'min-h-36 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-faint)] focus:border-[var(--blue)] focus-visible:outline-none'

function Note({ children }) {
  if (!children) return null
  return (
    <p className="mt-4 rounded-xl border border-[var(--window-teal)]/40 bg-white/70 px-4 py-3 text-sm" aria-live="polite">
      {children}
    </p>
  )
}

export default function QuestionControls({ step, answers, setAnswers, onSubmitKey, labelledBy }) {
  const value = step.get ? step.get(answers) : null
  const onChange = (v) => setAnswers((a) => step.set(a, v))
  const set = (name) => (e) => setAnswers((a) => ({ ...a, [name]: e.target.value }))
  // Enter in a one-line input moves on, like the Continuar button.
  const enter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmitKey()
    }
  }

  switch (step.kind) {
    case 'single':
      return (
        <>
          <Single step={step} value={value} onChange={onChange} labelledBy={labelledBy} />
          <Note>{step.note?.(answers)}</Note>
        </>
      )
    case 'multi':
      return (
        <>
          <Multi step={step} value={value} onChange={onChange} labelledBy={labelledBy} />
          <Note>{step.note?.(answers)}</Note>
        </>
      )
    case 'rating':
      return <Rating step={step} value={value} onChange={onChange} labelledBy={labelledBy} />
    case 'text':
      return (
        <TextInput
          aria-labelledby={labelledBy}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={enter}
          placeholder={step.placeholder}
          maxLength={300}
          className="!py-3.5 !text-base"
        />
      )
    case 'textarea':
      return (
        <textarea
          aria-labelledby={labelledBy}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={step.placeholder}
          maxLength={2000}
          className={textareaClass}
        />
      )
    case 'website':
      return (
        <>
          <Single step={step} value={value} onChange={onChange} labelledBy={labelledBy} />
          {value === 'si' && (
            <div className="mt-5">
              <Field label="¿Cuál es? (opcional)">
                <TextInput
                  type="url"
                  icon={<GlobeIcon />}
                  value={answers.websiteUrl}
                  onChange={set('websiteUrl')}
                  onKeyDown={enter}
                  placeholder="https://tunegocio.com"
                  maxLength={300}
                />
              </Field>
              <Note>Te daremos instrucciones para instalar el plugin de seguimiento de AndRho en tu sitio.</Note>
            </div>
          )}
          {value === 'no' && <Note>Nosotros la hacemos, con el seguimiento de AndRho ya incluido.</Note>}
        </>
      )
    case 'contact':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" required>
            <TextInput required autoComplete="name" value={answers.name} onChange={set('name')} onKeyDown={enter} placeholder="Ana López" maxLength={120} />
          </Field>
          <Field label="Empresa" required>
            <TextInput
              required
              autoComplete="organization"
              icon={<BuildingIcon />}
              value={answers.company}
              onChange={set('company')}
              onKeyDown={enter}
              placeholder="Nova Textiles"
              maxLength={120}
            />
          </Field>
          <Field label="Correo" required>
            <TextInput
              type="email"
              required
              autoComplete="email"
              icon={<MailIcon />}
              value={answers.email}
              onChange={set('email')}
              onKeyDown={enter}
              placeholder="tucorreo@empresa.com"
              maxLength={200}
            />
          </Field>
          <Field label="WhatsApp" hint="Opcional. Solo para avisarte del despegue.">
            <TextInput type="tel" autoComplete="tel" value={answers.phone} onChange={set('phone')} onKeyDown={enter} placeholder="+502 5555 5555" maxLength={40} />
          </Field>
        </div>
      )
    default:
      return null
  }
}
