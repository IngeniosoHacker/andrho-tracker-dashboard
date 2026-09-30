// Desktop-style window chrome (title bar + body) the landing sections open
// in, over the space wallpaper. Purely presentational: the stage decides
// when a window is shown (see DesktopWindow below / Stage.jsx).
export default function WindowFrame({ title, children, className = '', style }) {
  return (
    <article
      className={`flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] ${className}`}
      style={style}
    >
      <header className="flex h-10 shrink-0 items-center border-b border-[var(--window-line)] bg-[var(--window-bar)] px-4">
        <span className="flex w-14 gap-2" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#ff6b6b]/80" />
          <span className="h-3 w-3 rounded-full bg-[#ffc745]/80" />
          <span className="h-3 w-3 rounded-full bg-[var(--window-teal)]" />
        </span>
        <p className="flex-1 truncate text-center font-mono text-xs text-[var(--color-ink-soft)]">{title}</p>
        <span className="w-14" aria-hidden="true" />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </article>
  )
}

// A WindowFrame placed on the stage: centered in the desktop area, faded and
// slightly scaled by `progress` (0 = closed, 1 = open). Hidden windows are
// inert so keyboard/screen-reader users only ever reach the open one.
export function DesktopWindow({ title, opacity, scale, labelledBy, children }) {
  const open = opacity > 0.5
  return (
    <div
      role="region"
      aria-labelledby={labelledBy}
      inert={!open}
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, visibility: opacity < 0.001 ? 'hidden' : 'visible' }}
    >
      <WindowFrame title={title} style={{ transform: `scale(${scale})` }}>
        {children}
      </WindowFrame>
    </div>
  )
}
