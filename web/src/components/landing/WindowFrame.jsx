import { lerp, seg } from '../../lib/motion.js'

// The panel the landing sections open in, over the space wallpaper — a
// frameless "window" (no title bar). Purely presentational: the stage decides
// when a window is shown (see DesktopWindow below / Stage.jsx).
export default function WindowFrame({ children, className = '', style, frameRef, contentStyle }) {
  return (
    <article
      ref={frameRef}
      className={`flex max-h-full w-full max-w-[83rem] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] ${className}`}
      style={style}
    >
      <div className="min-h-0 flex-1 overflow-y-auto" style={contentStyle}>
        {children}
      </div>
    </article>
  )
}

// A WindowFrame placed on the stage: centered in the desktop area, faded and
// slightly scaled by `progress` (0 = closed, 1 = open). Hidden windows are
// inert so keyboard/screen-reader users only ever reach the open one.
//
// With `emerge` (0 → 1) + `from` (the source element's box, as clip insets
// relative to this frame) the window doesn't fade in: it's clipped to the
// source element and grows out of it, its content fading in once it's big
// enough to read.
export function DesktopWindow({ opacity, scale, labelledBy, emerge = null, from = null, frameRef, children }) {
  const open = opacity > 0.5
  const growing = emerge !== null && from && emerge < 1
  const clip = growing
    ? `inset(${from.map((v) => `${lerp(v, 0, emerge)}px`).join(' ')} round ${lerp(16, 24, emerge)}px)`
    : undefined
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
      <WindowFrame
        frameRef={frameRef}
        className={open ? 'pointer-events-auto' : ''}
        style={{ transform: emerge !== null ? undefined : `scale(${scale})`, clipPath: clip, WebkitClipPath: clip }}
        contentStyle={growing ? { opacity: seg(emerge, 0.45, 1) } : undefined}
      >
        {children}
      </WindowFrame>
    </div>
  )
}

// A frameless window: its content fills the whole stage viewport (under the
// navbar), straight on the space wallpaper.
export function BareScene({ opacity, labelledBy, children }) {
  const open = opacity > 0.5
  return (
    <div
      role="region"
      aria-labelledby={labelledBy}
      inert={!open}
      className={`absolute inset-0 overflow-y-auto pt-[116px] text-white md:pt-[84px] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{ opacity, visibility: opacity < 0.001 ? 'hidden' : 'visible' }}
    >
      {children}
    </div>
  )
}
