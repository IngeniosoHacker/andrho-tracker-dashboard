// originkit.dev-style form primitives: minimal, high-contrast inputs that
// share one focus/border language. Only TextInput is used today (login/signup
// forms) — the richer survey controls (chip multi-select, radio cards, rating
// scale, select) were removed along with the pre-launch waitlist survey and
// asteroid mini-game; bring them back from git history if a future form needs
// them.
const baseControl =
  'w-full rounded-lg border border-[var(--c-line)] bg-[var(--c-nebula)] px-4 py-2.5 text-sm text-[var(--c-stardust)] placeholder:text-[var(--c-mist)] transition-colors focus-visible:outline-none focus:border-[var(--c-comet)]/60'

export function TextInput(props) {
  return <input {...props} className={`${baseControl} ${props.className || ''}`} />
}
