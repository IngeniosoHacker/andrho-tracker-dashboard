import { SpinnerIcon } from '../ui/icons.jsx'

// Pieces of the full-screen card deck of signup.html (motion lives in lib/useDeck.js).

export const CARD =
  'absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]'

// The rest of the deck, peeking out behind the current card.
export function DeckStack() {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rotate-[1.4deg] rounded-3xl border border-white/10 bg-[var(--window-bg)]/20" />
      <div aria-hidden="true" className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[0.6deg] rounded-3xl border border-white/10 bg-[var(--window-bg)]/40" />
    </>
  )
}

// The big message between two cards.
export function Verdict({ verdict, onSkip }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Continuar"
      className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center px-6"
    >
      <p
        key={verdict.key}
        className={`verdict verdict-${verdict.tone} max-w-5xl text-center font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-8xl`}
      >
        {verdict.text}
      </p>
    </button>
  )
}

// Back / continue, pinned to the bottom of the screen, with the progress bar.
export function DeckNav({ progress, label, onBack, backDisabled, onNext, nextDisabled, nextLabel, loading }) {
  return (
    <nav aria-label="Navegación del formulario" className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-6">
      <div className="mx-auto max-w-[83rem] overflow-hidden rounded-2xl border border-black/10 bg-white/92 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="h-1 bg-[var(--window-line)]">
          <div className="h-full bg-[var(--window-teal)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <button type="button" onClick={onBack} disabled={backDisabled} className="btn-outline !h-11 disabled:cursor-not-allowed disabled:opacity-35">
            Regresar
          </button>
          <p className="hidden font-mono text-xs uppercase tracking-widest text-[var(--color-muted)] sm:block">{label}</p>
          <button type="button" onClick={onNext} disabled={nextDisabled} className="btn-solid !h-11 gap-2 disabled:cursor-not-allowed disabled:opacity-35">
            {loading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
            {nextLabel}
          </button>
        </div>
      </div>
    </nav>
  )
}
