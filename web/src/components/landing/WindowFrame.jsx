// A "window" panel over the space wallpaper (no title bar), as used by
// waitlist.html and the closing window of the Creators timeline.
//
// `plain` drops the frame (background, border, shadow) and keeps only the
// layout — the landing's sections, which sit on the stage's glass backdrop;
// `.glass-scope` (index.css) recolors their content for the dark glass.
export default function WindowFrame({ children, className = '', style, contentStyle, plain = false }) {
  const frame = plain
    ? 'glass-scope bg-transparent'
    : 'rounded-3xl border border-white/15 bg-[var(--window-bg)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]'
  return (
    <article
      className={`flex max-h-full w-full max-w-[83rem] flex-col overflow-hidden text-[var(--color-ink)] ${frame} ${className}`}
      style={style}
    >
      <div className="min-h-0 flex-1 overflow-y-auto" style={contentStyle}>
        {children}
      </div>
    </article>
  )
}

// A section placed on the stage: centered in the desktop area, faded and
// slightly scaled. It's a `plain` WindowFrame — no frame, just its content
// on the stage's glass backdrop — unless `framed`. Hidden sections are inert
// so keyboard and screen-reader users only ever reach the open one.
export function DesktopWindow({ opacity, scale, labelledBy, framed = false, children }) {
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
          open section itself takes pointer events. */}
      <WindowFrame plain={!framed} className={open ? 'pointer-events-auto' : ''} style={{ transform: `scale(${scale})` }}>
        {children}
      </WindowFrame>
    </div>
  )
}

// A bare section: its content fills the whole stage viewport (under the
// navbar), on the glass backdrop.
export function BareScene({ opacity, labelledBy, children }) {
  const open = opacity > 0.5
  return (
    <div
      role="region"
      aria-labelledby={labelledBy}
      inert={!open}
      className={`absolute inset-0 overflow-y-auto pt-[116px] md:pt-[84px] text-white ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{ opacity, visibility: opacity < 0.001 ? 'hidden' : 'visible' }}
    >
      {children}
    </div>
  )
}
