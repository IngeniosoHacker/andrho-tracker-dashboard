// The panel the landing sections open in, over the space wallpaper — a
// frameless "window" (no title bar). Purely presentational: the stage decides
// when a window is shown (see DesktopWindow below / Stage.jsx).
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

// A WindowFrame placed on the stage: centered in the desktop area, faded and
// slightly scaled by `progress` (0 = closed, 1 = open). Hidden windows are
// inert so keyboard/screen-reader users only ever reach the open one.
export function DesktopWindow({ opacity, scale, labelledBy, children }) {
  const open = opacity > 0.5
  return (
    <div
      role="region"
      aria-labelledby={labelledBy}
      inert={!open}
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, visibility: opacity < 0.001 ? 'hidden' : 'visible' }}
    >
      {/* The desktop area is click-through (it overlaps the hero); only the
          open window itself takes pointer events. */}
      <WindowFrame className={open ? 'pointer-events-auto' : ''} style={{ transform: `scale(${scale})` }}>
        {children}
      </WindowFrame>
    </div>
  )
}
