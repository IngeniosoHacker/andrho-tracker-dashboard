import { useRef } from 'react'

// reactbits.dev "SpotlightCard" component
// Features a dynamic radial spotlight and edge illumination that follows cursor movement
export default function SpotlightCard({
  className = '',
  spotlightColor = 'rgba(110, 231, 255, 0.15)',
  borderColor = 'rgba(110, 231, 255, 0.35)',
  children,
}) {
  const ref = useRef(null)

  function handleMouseMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty('--mouse-x', `${x}px`)
    el.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--c-line)] bg-gradient-to-b from-[var(--c-panel)]/80 to-[var(--c-panel)]/40 backdrop-blur-xl transition-all duration-300 hover:border-transparent ${className}`}
      style={{
        '--mouse-x': '-1000px',
        '--mouse-y': '-1000px',
      }}
    >
      {/* Border Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(450px circle at var(--mouse-x) var(--mouse-y), ${borderColor}, transparent 60%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
        aria-hidden="true"
      />

      {/* Surface Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), ${spotlightColor}, transparent 65%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
