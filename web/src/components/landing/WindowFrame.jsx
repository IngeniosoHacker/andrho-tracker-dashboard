// A frameless "window" panel over the space wallpaper, as used by
// waitlist.html. The landing's own window (tabs, sliding views) is
// LandingWindow.jsx, which shares this look.
export default function WindowFrame({ children, className = '', style }) {
  return (
    <article
      className={`flex max-h-full w-full max-w-[83rem] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] ${className}`}
      style={style}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </article>
  )
}
