// originkit.dev-style form primitives: minimal, high-contrast inputs that
// share one focus/border language across the whole survey.
const baseControl =
  'w-full rounded-lg border border-[var(--c-line)] bg-[var(--c-nebula)] px-4 py-2.5 text-sm text-[var(--c-stardust)] placeholder:text-[var(--c-mist)] transition-colors focus-visible:outline-none focus:border-[var(--c-comet)]/60'

export function TextInput(props) {
  return <input {...props} className={`${baseControl} ${props.className || ''}`} />
}

export function TextareaField(props) {
  return <textarea rows={3} {...props} className={`${baseControl} resize-none ${props.className || ''}`} />
}

export function SelectField({ options, className = '', ...props }) {
  return (
    <select {...props} className={`${baseControl} ${className}`}>
      <option value="" disabled>
        Selecciona una opción
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// Chip-style multi-select, common in originkit.dev form kits.
export function ChipMultiSelect({ options, value = [], onChange }) {
  function toggle(optValue) {
    onChange(value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value)
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => toggle(opt.value)}
            aria-pressed={active}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-[var(--c-solar)] bg-[var(--c-solar)]/15 text-[var(--c-solar)]'
                : 'border-[var(--c-line)] text-[var(--c-mist)] hover:border-[var(--c-comet)]/50 hover:text-[var(--c-stardust)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// Card-style single-select radio group.
export function RadioCards({ options, value, onChange, columns = 2 }) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              active
                ? 'border-[var(--c-comet)] bg-[var(--c-comet)]/10 text-[var(--c-stardust)]'
                : 'border-[var(--c-line)] text-[var(--c-mist)] hover:border-[var(--c-comet)]/40'
            }`}
          >
            {opt.label}
            {opt.description && <span className="mt-1 block text-xs font-normal text-[var(--c-mist)]">{opt.description}</span>}
          </button>
        )
      })}
    </div>
  )
}

// 1-5 satisfaction/rating scale.
export function RatingScale({ value, onChange, max = 5, labels }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={`h-11 w-11 rounded-full border font-mono text-sm font-semibold transition-colors ${
            value === n
              ? 'border-[var(--c-solar)] bg-[var(--c-solar)] text-[var(--c-void)]'
              : 'border-[var(--c-line)] text-[var(--c-mist)] hover:border-[var(--c-solar)]/50 hover:text-[var(--c-stardust)]'
          }`}
        >
          {n}
        </button>
      ))}
      {labels && (
        <div className="ml-3 flex justify-between text-xs text-[var(--c-mist)]">
          <span>{labels[0]}</span>
        </div>
      )}
    </div>
  )
}
