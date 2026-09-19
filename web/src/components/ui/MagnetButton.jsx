import { useRef, useState } from 'react'

// reactbits.dev "Magnet" button, restyled: keeps the subtle cursor-follow
// attraction but drops the spinning neon border for a calmer, confident CTA.
export default function MagnetButton({
  as: Tag = 'button',
  children,
  className = '',
  magnetStrength = 0.25,
  variant = 'primary', // 'primary' | 'secondary'
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
    setPosition({
      x: (e.clientX - centerX) * magnetStrength,
      y: (e.clientY - centerY) * magnetStrength,
    })
  }

  function handleMouseLeave() {
    setPosition({ x: 0, y: 0 })
  }

  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-colors duration-200'

  const variantStyles =
    variant === 'secondary'
      ? 'border border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--mint)] hover:bg-[var(--color-canvas-soft)]'
      : 'bg-[var(--mint)] text-[var(--color-ink)] shadow-[0_10px_28px_-12px_rgba(0,230,184,0.55)] hover:bg-[var(--cyan-soft)]'

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${baseStyles} ${variantStyles} ${className}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      {...props}
    >
      {children}
    </Tag>
  )
}
