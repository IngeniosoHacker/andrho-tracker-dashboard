import { useRef, useState } from 'react'

// reactbits.dev "Magnet" + "StarBorder" button
// Attracts slightly toward the cursor when hovering, with an orbiting neon border
export default function MagnetButton({
  as: Tag = 'button',
  children,
  className = '',
  magnetStrength = 0.35,
  variant = 'primary', // 'primary' | 'secondary' | 'glass'
  ...props
}) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  function handleMouseMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = (e.clientX - centerX) * magnetStrength
    const distanceY = (e.clientY - centerY) * magnetStrength
    setPosition({ x: distanceX, y: distanceY })
  }

  function handleMouseLeave() {
    setPosition({ x: 0, y: 0 })
  }

  const baseStyles =
    'group relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-all duration-200'

  if (variant === 'secondary') {
    return (
      <Tag
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`${baseStyles} border border-[var(--c-line)] bg-[var(--c-panel)]/60 px-6 py-3.5 text-sm text-[var(--c-stardust)] backdrop-blur-md hover:border-[var(--c-comet)]/50 hover:text-[var(--c-comet)] hover:shadow-lg hover:shadow-[var(--c-comet)]/10 ${className}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Tag>
    )
  }

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${baseStyles} p-[1.5px] shadow-lg shadow-[var(--c-solar)]/15 hover:shadow-[var(--c-solar)]/30 ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      {...props}
    >
      {/* Orbiting Stardust Border */}
      <span
        className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite]"
        style={{
          background:
            'conic-gradient(from 90deg at 50% 50%, transparent 0%, var(--c-solar) 50%, var(--c-comet) 70%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      <span className="relative z-10 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--c-solar)] px-6 py-3 text-sm font-semibold text-[var(--c-void)] transition-colors group-hover:bg-[var(--c-solar-dim)]">
        {children}
      </span>
    </Tag>
  )
}
