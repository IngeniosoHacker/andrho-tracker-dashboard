// originkit.dev-style stepper: numbered progress indicator for a multi-step
// form/wizard.
export default function Stepper({ steps, current }) {
  return (
    <ol className="mb-10 flex items-center">
      {steps.map((label, i) => {
        const isDone = i < current
        const isActive = i === current
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border font-mono text-sm font-semibold transition-colors ${
                  isDone
                    ? 'border-[var(--c-solar)] bg-[var(--c-solar)] text-[var(--c-void)]'
                    : isActive
                      ? 'border-[var(--c-comet)] text-[var(--c-comet)]'
                      : 'border-[var(--c-line)] text-[var(--c-mist)]'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                className={`hidden text-center font-mono text-[10px] uppercase tracking-wider sm:block ${
                  isActive ? 'text-[var(--c-stardust)]' : 'text-[var(--c-mist)]'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`mx-2 h-px flex-1 ${isDone ? 'bg-[var(--c-solar)]' : 'bg-[var(--c-line)]'}`}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
