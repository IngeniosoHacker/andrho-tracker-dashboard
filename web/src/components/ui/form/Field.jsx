// originkit.dev-style form field: consistent label + helper + error slot
// wrapped around any input control.
export default function Field({ label, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-baseline gap-1.5 font-mono text-xs uppercase tracking-widest text-[var(--c-mist)]">
        {label}
        {required && <span className="text-[var(--c-plasma)]">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-[var(--c-mist)]">{hint}</span>}
    </label>
  )
}
